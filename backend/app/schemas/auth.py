from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, constr, field_validator
from app.enums.auth_provider import AuthProvider

# bcrypt only uses the first 72 bytes of a password.
MAX_PASSWORD_BYTES = 72


class AuthRegistrationRequest(BaseModel):
    full_name: constr(strip_whitespace=True, min_length=2, max_length=100) = Field(alias="fullname")
    email: EmailStr
    password: constr(min_length=8)
    provider : AuthProvider
    model_config = {"populate_by_name": True}

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        if len(value.encode("utf-8")) > MAX_PASSWORD_BYTES:
            raise ValueError(f"Le mot de passe doit faire au plus {MAX_PASSWORD_BYTES} octets.")
        return value


class AuthRegistrationRequestGoogle(BaseModel) : 
    credentials : str

class AuthRegistrationResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

