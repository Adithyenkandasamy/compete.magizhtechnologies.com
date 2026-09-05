"""
Seed script: creates an admin account (if not exists) and
inserts two dummy hackathon events into the database.

Run with:
    uv run python scripts/seed_hackathons.py
"""
import asyncio
from datetime import datetime, timezone, timedelta

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database.session import AsyncSessionLocal
from app.models.enums import (
    AccountStatus,
    EventMode,
    EventStatus,
    EventType,
    UserRole,
)
from app.models.event import Event
from app.models.user import Profile, User
from app.core.security import get_password_hash


ADMIN_EMAIL = "admin@magizhtechnologies.com"
ADMIN_PASSWORD = "Admin@1234"
ADMIN_FULL_NAME = "Magizh Admin"


async def get_or_create_admin(session) -> User:
    stmt = (
        select(User)
        .where(User.email == ADMIN_EMAIL)
        .options(selectinload(User.profile))
    )
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if user:
        print(f"[✓] Admin already exists: {user.email}")
        return user

    # Create admin
    user = User(
        email=ADMIN_EMAIL,
        password_hash=get_password_hash(ADMIN_PASSWORD),
        role=UserRole.ADMIN,
        status=AccountStatus.ACTIVE,
    )
    session.add(user)
    await session.flush()

    profile = Profile(user_id=user.id, full_name=ADMIN_FULL_NAME)
    session.add(profile)
    await session.flush()

    print(f"[+] Admin created: {user.email} / {ADMIN_PASSWORD}")
    return user


HACKATHONS = [
    {
        "title": "HackFusion 2026",
        "slug": "hackfusion-2026",
        "description": (
            "HackFusion 2026 is Magizh Technologies' flagship 36-hour hackathon. "
            "Build innovative solutions in AI, Web3, IoT, or sustainability. "
            "Open to all engineering students. Prizes worth ₹1,00,000 up for grabs!"
        ),
        "event_type": EventType.HACKATHON,
        "mode": EventMode.ONLINE,
        "status": EventStatus.PUBLISHED,
        "location": "Online – Gather.town",
        "start_date": datetime(2026, 10, 15, 9, 0, tzinfo=timezone.utc),
        "end_date": datetime(2026, 10, 16, 21, 0, tzinfo=timezone.utc),
        "registration_deadline": datetime(2026, 10, 10, 23, 59, tzinfo=timezone.utc),
        "max_participants": 200,
        "team_size_min": 2,
        "team_size_max": 4,
        "prize_pool": 100000.0,
        "rules": (
            "1. Teams of 2–4 members only.\n"
            "2. All code must be written during the event window.\n"
            "3. Use of pre-trained AI models is allowed.\n"
            "4. Submission must include a working demo + GitHub link.\n"
            "5. Plagiarism results in immediate disqualification."
        ),
        "banner_url": "https://placehold.co/1200x400/6366f1/ffffff?text=HackFusion+2026",
    },
    {
        "title": "InnoSprint: Sustainability Hack",
        "slug": "innosprint-sustainability-2026",
        "description": (
            "InnoSprint challenges you to build tech-driven solutions for climate change, "
            "renewable energy, and sustainable development. A 24-hour sprint with mentorship "
            "from industry experts. Open to all disciplines."
        ),
        "event_type": EventType.HACKATHON,
        "mode": EventMode.HYBRID,
        "status": EventStatus.PUBLISHED,
        "location": "Magizh Campus + Online",
        "start_date": datetime(2026, 11, 8, 10, 0, tzinfo=timezone.utc),
        "end_date": datetime(2026, 11, 9, 10, 0, tzinfo=timezone.utc),
        "registration_deadline": datetime(2026, 11, 3, 23, 59, tzinfo=timezone.utc),
        "max_participants": 150,
        "team_size_min": 1,
        "team_size_max": 3,
        "prize_pool": 50000.0,
        "rules": (
            "1. Solo or teams up to 3 members.\n"
            "2. Projects must have a clear sustainability angle.\n"
            "3. Open source libraries are permitted.\n"
            "4. Final demo must be 5 minutes or less.\n"
            "5. Judges' decisions are final."
        ),
        "banner_url": "https://placehold.co/1200x400/10b981/ffffff?text=InnoSprint+Sustainability",
    },
]


async def get_or_create_event(session, data: dict) -> Event:
    stmt = select(Event).where(Event.slug == data["slug"])
    result = await session.execute(stmt)
    event = result.scalar_one_or_none()

    if event:
        print(f"[✓] Event already exists: {event.title}")
        return event

    event = Event(**data)
    session.add(event)
    await session.flush()
    print(f"[+] Event created: {event.title}  (id={event.id})")
    return event


async def main():
    async with AsyncSessionLocal() as session:
        async with session.begin():
            await get_or_create_admin(session)
            for hackathon in HACKATHONS:
                await get_or_create_event(session, hackathon)

    print("\n✅  Seed complete!")
    print(f"\nAdmin login → {ADMIN_EMAIL} / {ADMIN_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(main())
