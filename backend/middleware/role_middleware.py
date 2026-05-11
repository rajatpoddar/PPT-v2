from fastapi import Depends, HTTPException, status
from models.user import User, UserRole
from middleware.auth_middleware import get_current_user


def require_owner(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner access required"
        )
    return current_user


def require_owner_or_incharge(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in [UserRole.owner, UserRole.site_incharge]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner or Site In-charge access required"
        )
    return current_user


def require_investor(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.investor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Investor access required"
        )
    return current_user
