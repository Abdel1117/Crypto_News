from pydantic import BaseModel, EmailStr, Field


class ContactRequest(BaseModel):
    name: str = Field(..., min_length=1, description="Sender full name")
    email: EmailStr = Field(..., description="Sender email address")
    phone: str = Field(default="", description="Sender phone number (optional)")
    message: str = Field(..., min_length=1, description="Contact message")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Jean Dupont",
                "email": "jean@exemple.com",
                "phone": "+33 6 00 00 00 00",
                "message": "Bonjour, je souhaite vous contacter.",
            }
        }
