from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from database import get_db
from models.user import User
from models.equipment import Equipment, EquipmentAllocation, EquipmentStatus
from schemas.equipment import (EquipmentCreate, EquipmentUpdate, EquipmentResponse,
                                EquipmentAllocationCreate, EquipmentReturnCreate, EquipmentAllocationResponse)
from middleware.auth_middleware import get_current_user
from middleware.role_middleware import require_owner

router = APIRouter(prefix="/api/v1/equipment", tags=["equipment"])


@router.get("", response_model=List[EquipmentResponse])
def list_equipment(
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    return db.query(Equipment).filter(Equipment.owner_id == current_user.id).all()


@router.post("", response_model=EquipmentResponse)
def create_equipment(
    data: EquipmentCreate,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    equipment = Equipment(**data.model_dump(), owner_id=current_user.id)
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    return equipment


@router.put("/{equipment_id}", response_model=EquipmentResponse)
def update_equipment(
    equipment_id: int,
    data: EquipmentUpdate,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id,
        Equipment.owner_id == current_user.id
    ).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(equipment, field, value)
    db.commit()
    db.refresh(equipment)
    return equipment


@router.post("/{equipment_id}/allocate", response_model=EquipmentAllocationResponse)
def allocate_equipment(
    equipment_id: int,
    data: EquipmentAllocationCreate,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id,
        Equipment.owner_id == current_user.id
    ).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    # Check available quantity
    allocated = sum(
        a.quantity_allocated for a in
        db.query(EquipmentAllocation).filter(
            EquipmentAllocation.equipment_id == equipment_id,
            EquipmentAllocation.returned_date == None
        ).all()
    )
    available = equipment.total_quantity - allocated
    if data.quantity_allocated > available:
        raise HTTPException(status_code=400, detail=f"Only {available} units available")

    allocation = EquipmentAllocation(
        equipment_id=equipment_id,
        **data.model_dump()
    )
    db.add(allocation)
    equipment.current_status = EquipmentStatus.on_site
    db.commit()
    db.refresh(allocation)
    return allocation


@router.post("/{equipment_id}/return/{allocation_id}")
def return_equipment(
    equipment_id: int,
    allocation_id: int,
    data: EquipmentReturnCreate,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    allocation = db.query(EquipmentAllocation).filter(
        EquipmentAllocation.id == allocation_id,
        EquipmentAllocation.equipment_id == equipment_id
    ).first()
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")

    allocation.returned_date = data.returned_date
    allocation.condition_on_return = data.condition_on_return
    if data.notes:
        allocation.notes = data.notes

    # Check if all units returned
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    still_out = db.query(EquipmentAllocation).filter(
        EquipmentAllocation.equipment_id == equipment_id,
        EquipmentAllocation.returned_date == None
    ).count()
    if still_out == 0:
        equipment.current_status = EquipmentStatus.in_store

    db.commit()
    return {"message": "Equipment returned successfully"}


@router.get("/status-board")
def get_status_board(
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    equipment_list = db.query(Equipment).filter(Equipment.owner_id == current_user.id).all()
    board = []

    for eq in equipment_list:
        active_allocations = db.query(EquipmentAllocation).filter(
            EquipmentAllocation.equipment_id == eq.id,
            EquipmentAllocation.returned_date == None
        ).all()

        allocated_qty = sum(a.quantity_allocated for a in active_allocations)
        available_qty = eq.total_quantity - allocated_qty

        sites_info = []
        for alloc in active_allocations:
            from models.site import Site
            site = db.query(Site).filter(Site.id == alloc.site_id).first()
            sites_info.append({
                "allocation_id": alloc.id,
                "site_id": alloc.site_id,
                "site_name": site.name if site else "Unknown",
                "quantity": alloc.quantity_allocated,
                "since": alloc.allocated_date.isoformat()
            })

        board.append({
            "id": eq.id,
            "name": eq.name,
            "category": eq.category,
            "total_quantity": eq.total_quantity,
            "allocated_quantity": allocated_qty,
            "available_quantity": available_qty,
            "status": eq.current_status,
            "sites": sites_info
        })

    return board
