from datetime import datetime

from pydantic import BaseModel

from app.enums.user_role import UserRole


class UserAdminOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: UserRole
    created_at: datetime

    model_config = {"from_attributes": True}


class RoleUpdate(BaseModel):
    role: UserRole
