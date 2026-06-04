from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, constr


class AuthRegistrationRequest(BaseModel):
    full_name: constr(strip_whitespace=True, min_length=2) = Field(alias="fullname")
    email: EmailStr
    password: constr(min_length=8)

    model_config = {"populate_by_name": True}


class AuthRegistrationResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
