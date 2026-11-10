"""Gives an account a role, from the command line: the way to make the first admin.

    python -m app.scripts.set_role someone@example.com admin
    docker compose exec backend python -m app.scripts.set_role someone@example.com admin

The API applies it at once; the person sees the new menus after reloading the page.
"""

import argparse
import asyncio
import sys

from app.db.session import async_session
from app.enums.user_role import UserRole
from app.repositories.users.user_sql_repo import SQLUserRepository


async def set_role(email: str, role: UserRole, session_factory=async_session) -> bool:
    """True if the account exists (and now has `role`)."""
    async with session_factory() as session:
        users = SQLUserRepository(session)
        user = await users.get_by_email(email.strip().lower())
        if user is None:
            return False
        user.role = role
        await users.update(user)
        return True


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Change the role of an account.")
    parser.add_argument("email")
    parser.add_argument("role", choices=[r.value for r in UserRole])
    args = parser.parse_args(argv)

    if not asyncio.run(set_role(args.email, UserRole(args.role))):
        print(f"Aucun compte pour {args.email}.", file=sys.stderr)
        return 1
    print(f"{args.email} est maintenant {args.role}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
