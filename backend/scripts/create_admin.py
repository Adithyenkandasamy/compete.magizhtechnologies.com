"""Create or promote an admin (SUPER_ADMIN) user.

Usage (from the backend directory):

  python -m scripts.create_admin
  python -m scripts.create_admin --email admin@example.com --password 'S3curePass'

Defaults to ADMIN_EMAIL/ADMIN_PASSWORD env vars, falling back to
admin@magizh.com and a randomly generated password.
"""

import argparse
import asyncio
import os
import secrets

from sqlalchemy import select

from app.core.database import async_session_maker
from app.core.enums import UserRole
from app.core.security import get_password_hash
from app.models.user import User


def _generate_password() -> str:
    return secrets.token_urlsafe(12)


async def run(email: str, password: str, role: str) -> None:
    role_enum = UserRole[role.upper()]
    async with async_session_maker() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalars().first()

        if user is None:
            user = User(
                email=email,
                name="Administrator",
                password_hash=get_password_hash(password),
                role=role_enum,
                is_active=True,
                is_verified=True,
                college=None,
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            print(f"[create_admin] Created user '{email}' with role {role_enum.value}")
        else:
            old_role = user.role.value if user.role else None
            user.role = role_enum
            user.password_hash = get_password_hash(password)
            user.is_active = True
            await session.commit()
            print(
                f"[create_admin] Promoted existing user '{email}' "
                f"({old_role} -> {role_enum.value}) and reset password"
            )

        print(f"[create_admin] email:    {email}")
        print(f"[create_admin] password: {password}")
        print(f"[create_admin] role:     {role_enum.value}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Create/promote a Supabase admin user")
    parser.add_argument("--email", default=os.getenv("ADMIN_EMAIL", "admin@magizh.com"))
    parser.add_argument("--password", default=os.getenv("ADMIN_PASSWORD"))
    parser.add_argument("--role", default=os.getenv("ADMIN_ROLE", "SUPER_ADMIN"))
    args = parser.parse_args()

    if not args.password:
        args.password = _generate_password()
        print("[create_admin] No password supplied; generated:", args.password)

    asyncio.run(run(args.email, args.password, args.role))


if __name__ == "__main__":
    main()
