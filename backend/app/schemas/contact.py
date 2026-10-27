from pydantic import BaseModel, EmailStr, Field


class ContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Sender full name")
    email: EmailStr = Field(..., description="Sender email address")
    phone: str = Field(default="", max_length=30, description="Sender phone number (optional)")
    message: str = Field(..., min_length=1, max_length=5000, description="Contact message")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Jean Dupont",
                "email": "jean@exemple.com",
                "phone": "+33 6 00 00 00 00",
                "message": "Bonjour, je souhaite vous contacter.",
            }
        }
