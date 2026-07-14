from enum import Enum

class AuthProvider(str, Enum):
    local = "local"
    google =  "google"