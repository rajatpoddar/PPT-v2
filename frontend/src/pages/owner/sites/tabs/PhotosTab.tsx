import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Upload, X, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { sitesApi, uploadApi } from "../../../../services/api";
import { formatRelativeTime } from "../../../../utils/formatters";
import type { SitePhoto } from "../../../../types";

interface PhotosTabProps {
  siteId: number;
}

const PHOTO_TYPES = [
  { value: "", label: "All" },
  { value: "morning", label: "Morning" },
  { value: "work_in_progress", label: "In Progress" },
  { value: "evening", label: "Evening" },
  { value: "completed_section", label: "Completed" },
  { value: "issue", label: "Issue" },
];

export function PhotosTab({ siteId }: PhotosTabProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoType, setPhotoType] = useState("");
  const [caption, setCaption] = useState("");
  const [lightboxPhoto, setLightboxPhoto] = useState<SitePhoto | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  const { data: photos = [], isLoading } = useQuery<SitePhoto[]>({
    queryKey: ["site-photos", siteId, photoType],
    queryFn: () =>
      sitesApi.photos(siteId, { photo_type: photoType || undefined }).then((r) => r.data),
  });

  // Count today's photos
  const today = new Date().toISOString().split("T")[0];
  const todayPhotos = photos.filter((p) => p.created_at.startsWith(today)).length;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress if > 1MB
    setUploadProgress(true);
    try {
      await uploadApi.photo(siteId, file, caption || undefined, photoType || undefined);
      queryClient.invalidateQueries({ queryKey: ["site-photos", siteId] });
      toast.success("Photo uploaded!");
      setCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploadProgress(false);
    }
  };

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  return (
    <div className="space-y-4">
      {/* Upload Warning */}
      {todayPhotos < 3 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            Only {todayPhotos} photo{todayPhotos !== 1 ? "s" : ""} uploaded today. Upload at least 3 (morning, work, evening).
          </p>
        </div>
      )}

      {/* Upload Controls */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <select
            value={photoType}
            onChange={(e) => setPhotoType(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 bg-white"
          >
            {PHOTO_TYPES.slice(1).map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (optional)"
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
          />
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadProgress}
            className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {uploadProgress ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            {uploadProgress ? "Uploading..." : "Take Photo"}
          </button>
          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.removeAttribute("capture");
                fileInputRef.current.click();
                setTimeout(() => fileInputRef.current?.setAttribute("capture", "environment"), 100);
              }
            }}
            disabled={uploadProgress}
            className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            <Upload className="w-4 h-4" />
            Gallery
          </button>
        </div>
        <p className="text-xs text-slate-400 text-center">
          {todayPhotos} photo{todayPhotos !== 1 ? "s" : ""} uploaded today
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PHOTO_TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setPhotoType(value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              photoType === value
                ? "bg-orange-500 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-orange-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Photo Grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          No photos yet. Upload the first one!
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setLightboxPhoto(photo)}
              className="aspect-square rounded-lg overflow-hidden bg-slate-100 hover:opacity-90 transition-opacity"
            >
              <img
                src={`${BASE_URL}${photo.photo_url}`}
                alt={photo.caption || "Site photo"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f1f5f9'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%2394a3b8' font-size='12'%3EPhoto%3C/text%3E%3C/svg%3E";
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20"
            onClick={() => setLightboxPhoto(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={`${BASE_URL}${lightboxPhoto.photo_url}`}
              alt={lightboxPhoto.caption || ""}
              className="w-full rounded-xl"
            />
            {lightboxPhoto.caption && (
              <p className="text-white text-sm mt-2 text-center">{lightboxPhoto.caption}</p>
            )}
            <p className="text-slate-400 text-xs mt-1 text-center">
              {formatRelativeTime(lightboxPhoto.created_at)}
              {lightboxPhoto.photo_type && ` · ${lightboxPhoto.photo_type.replace("_", " ")}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
