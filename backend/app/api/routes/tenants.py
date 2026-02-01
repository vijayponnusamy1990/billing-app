from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.owner import Owner
from app.schemas.owner import Owner as OwnerSchema

router = APIRouter(prefix="/tenant", tags=["tenant"])

@router.get("/resolve", response_model=OwnerSchema)
def resolve_tenant(domain: str = Query(..., alias="domain"), db: Session = Depends(get_db)):
    """
    Resolve tenant by domain (or localhost for dev).
    """
    owner = db.query(Owner).filter(Owner.domain == domain).first()
    if not owner:
        # Fallback for localhost development if strict domain match fails
        if 'localhost' in domain or '127.0.0.1' in domain:
             owner = db.query(Owner).filter(Owner.domain == 'localhost').first()
             
    if not owner:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    return owner
