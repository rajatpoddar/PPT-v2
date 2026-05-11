from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from config import settings
from database import engine, Base

# Import all models to ensure they're registered
import models

# Create tables
Base.metadata.create_all(bind=engine)

# Create upload directories
Path(settings.UPLOAD_DIR).mkdir(exist_ok=True)
for folder in ["site_photos", "receipts", "labour_photos"]:
    (Path(settings.UPLOAD_DIR) / folder).mkdir(exist_ok=True)

app = FastAPI(
    title="PPT Builders API",
    description="Construction subcontractor management system",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Register routers
from routers import auth, dashboard, labours, sites, attendance, payments, expenses, equipment, investors, reports, upload

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(labours.router)
app.include_router(sites.router)
app.include_router(attendance.router)
app.include_router(payments.router)
app.include_router(expenses.router)
app.include_router(equipment.router)
app.include_router(investors.router)
app.include_router(reports.router)
app.include_router(upload.router)


@app.get("/")
def root():
    return {"message": "PPT Builders API", "version": "1.0.0", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
