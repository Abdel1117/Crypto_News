from enum import Enum


class UserRole(str, Enum):
    """What an account may do beyond reading: editors and admins run the blog,
    admins also assign roles."""

    user = "user"
    editor = "editor"
    admin = "admin"


# Roles allowed to write, edit and delete blog articles and to delete any comment.
EDITORIAL_ROLES = (UserRole.editor, UserRole.admin)
