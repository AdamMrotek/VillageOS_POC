from fastapi import APIRouter, Query
from datetime import datetime, timezone
from typing import Optional
from schemas import StoredEvent, EventType, ActionItem

router = APIRouter(prefix="/api/v1", tags=["events"])

_tz = timezone.utc

SEED_EVENTS: list[StoredEvent] = [
    StoredEvent(
        id="evt-001",
        title="Sports Day",
        event_type=EventType.sport,
        start_time=datetime(2026, 5, 15, 9, 0, tzinfo=_tz),
        end_time=datetime(2026, 5, 15, 15, 0, tzinfo=_tz),
        is_all_day=False,
        location="St George's School Field, Kingston",
        description="Annual sports day for all year groups.",
        action_items=[
            ActionItem(description="Pack a labelled packed lunch"),
            ActionItem(description="Bring sunscreen and a hat"),
            ActionItem(description="Wear house colours (red)"),
        ],
        confidence=0.95,
    ),
    StoredEvent(
        id="evt-002",
        title="Bake Sale",
        event_type=EventType.fundraiser,
        start_time=datetime(2026, 5, 9, 9, 0, tzinfo=_tz),
        end_time=datetime(2026, 5, 9, 11, 0, tzinfo=_tz),
        is_all_day=False,
        location="School Hall",
        description="Year 4 fundraiser bake sale in the school hall.",
        action_items=[
            ActionItem(description="Bake 12 cookies or a cake", cost_estimate_gbp=5.0),
            ActionItem(description="Label baked goods with allergen info"),
            ActionItem(description="Bring £2 spending money", cost_estimate_gbp=2.0),
        ],
        confidence=0.92,
    ),
    StoredEvent(
        id="evt-003",
        title="Emma's Birthday Party",
        event_type=EventType.birthday,
        start_time=datetime(2026, 5, 20, 14, 0, tzinfo=_tz),
        end_time=datetime(2026, 5, 20, 17, 0, tzinfo=_tz),
        is_all_day=False,
        location="Little Dipper Soft Play, Kingston",
        description="Emma turns 6 — soft play party.",
        action_items=[
            ActionItem(description="RSVP to Sarah by 14 May"),
            ActionItem(description="Buy a gift (≤£15)", cost_estimate_gbp=15.0),
        ],
        confidence=0.98,
    ),
    StoredEvent(
        id="evt-004",
        title="Parent-Teacher Evening",
        event_type=EventType.meeting,
        start_time=datetime(2026, 5, 22, 15, 30, tzinfo=_tz),
        end_time=datetime(2026, 5, 22, 19, 0, tzinfo=_tz),
        is_all_day=False,
        location="Classroom 4B, St George's School",
        description="Spring term parent-teacher appointments.",
        action_items=[
            ActionItem(description="Book a 10-min slot via the school portal"),
            ActionItem(description="Prepare questions about reading progress"),
        ],
        confidence=0.93,
    ),
    StoredEvent(
        id="evt-005",
        title="School Trip Deposit Due",
        event_type=EventType.deadline,
        start_time=datetime(2026, 5, 7, 9, 0, tzinfo=_tz),
        is_all_day=False,
        description="Deposit for Year 4 residential trip to Sayers Croft.",
        action_items=[
            ActionItem(description="Pay £25 deposit via ParentPay", cost_estimate_gbp=25.0),
            ActionItem(description="Return signed consent form to office"),
        ],
        confidence=0.97,
    ),
    StoredEvent(
        id="evt-006",
        title="Football Practice",
        event_type=EventType.sport,
        start_time=datetime(2026, 5, 7, 16, 0, tzinfo=_tz),
        end_time=datetime(2026, 5, 7, 17, 0, tzinfo=_tz),
        is_all_day=False,
        location="Kingston Recreation Ground",
        description="Weekly Thursday football practice.",
        action_items=[
            ActionItem(description="Bring shin pads and water bottle"),
        ],
        confidence=0.99,
    ),
    StoredEvent(
        id="evt-007",
        title="Football Practice",
        event_type=EventType.sport,
        start_time=datetime(2026, 5, 14, 16, 0, tzinfo=_tz),
        end_time=datetime(2026, 5, 14, 17, 0, tzinfo=_tz),
        is_all_day=False,
        location="Kingston Recreation Ground",
        description="Weekly Thursday football practice.",
        action_items=[
            ActionItem(description="Bring shin pads and water bottle"),
        ],
        confidence=0.99,
    ),
    StoredEvent(
        id="evt-008",
        title="Football Practice",
        event_type=EventType.sport,
        start_time=datetime(2026, 5, 21, 16, 0, tzinfo=_tz),
        end_time=datetime(2026, 5, 21, 17, 0, tzinfo=_tz),
        is_all_day=False,
        location="Kingston Recreation Ground",
        description="Weekly Thursday football practice.",
        action_items=[
            ActionItem(description="Bring shin pads and water bottle"),
        ],
        confidence=0.99,
    ),
    StoredEvent(
        id="evt-009",
        title="Football Practice",
        event_type=EventType.sport,
        start_time=datetime(2026, 5, 28, 16, 0, tzinfo=_tz),
        end_time=datetime(2026, 5, 28, 17, 0, tzinfo=_tz),
        is_all_day=False,
        location="Kingston Recreation Ground",
        description="Weekly Thursday football practice.",
        action_items=[
            ActionItem(description="Bring shin pads and water bottle"),
        ],
        confidence=0.99,
    ),
    StoredEvent(
        id="evt-010",
        title="Year 3 Assembly",
        event_type=EventType.school,
        start_time=datetime(2026, 5, 13, 9, 0, tzinfo=_tz),
        end_time=datetime(2026, 5, 13, 9, 30, tzinfo=_tz),
        is_all_day=False,
        location="School Hall",
        description="Year 3 end-of-term sharing assembly.",
        action_items=[
            ActionItem(description="Arrive by 8:45am to get a seat"),
        ],
        confidence=0.91,
    ),
    StoredEvent(
        id="evt-011",
        title="Swimming Lesson",
        event_type=EventType.sport,
        start_time=datetime(2026, 5, 8, 15, 30, tzinfo=_tz),
        end_time=datetime(2026, 5, 8, 16, 15, tzinfo=_tz),
        is_all_day=False,
        location="Kingston Pools",
        description="Weekly Friday swimming lesson.",
        action_items=[
            ActionItem(description="Pack towel, goggles, and swim cap"),
        ],
        confidence=0.99,
    ),
    StoredEvent(
        id="evt-012",
        title="Swimming Lesson",
        event_type=EventType.sport,
        start_time=datetime(2026, 5, 15, 15, 30, tzinfo=_tz),
        end_time=datetime(2026, 5, 15, 16, 15, tzinfo=_tz),
        is_all_day=False,
        location="Kingston Pools",
        description="Weekly Friday swimming lesson.",
        action_items=[
            ActionItem(description="Pack towel, goggles, and swim cap"),
        ],
        confidence=0.99,
    ),
    StoredEvent(
        id="evt-013",
        title="RSVP Deadline — Summer Fete",
        event_type=EventType.deadline,
        start_time=datetime(2026, 5, 5, 9, 0, tzinfo=_tz),
        is_all_day=False,
        description="Last day to RSVP for volunteering at the summer fete.",
        action_items=[
            ActionItem(description="Email fete.coordinator@stgeorges.sch.uk"),
        ],
        confidence=0.88,
    ),
    StoredEvent(
        id="evt-014",
        title="Half-Term Starts",
        event_type=EventType.school,
        start_time=datetime(2026, 5, 25, 0, 0, tzinfo=_tz),
        is_all_day=True,
        description="School closed for May half-term. Back 2 June.",
        action_items=[],
        confidence=0.99,
    ),
    StoredEvent(
        id="evt-015",
        title="Fundraiser Sponsored Walk",
        event_type=EventType.fundraiser,
        start_time=datetime(2026, 5, 28, 10, 0, tzinfo=_tz),
        end_time=datetime(2026, 5, 28, 12, 0, tzinfo=_tz),
        is_all_day=False,
        location="Bushy Park, Kingston",
        description="Whole-school sponsored walk around Bushy Park.",
        action_items=[
            ActionItem(description="Return sponsor form by 26 May"),
            ActionItem(description="Wear trainers and bring a rain jacket"),
            ActionItem(description="Collect sponsorship money after the walk"),
        ],
        confidence=0.94,
    ),
]


@router.get("/events", response_model=list[StoredEvent])
async def get_events(
    from_date: Optional[str] = Query(None, description="ISO 8601 start (inclusive)"),
    to_date: Optional[str] = Query(None, description="ISO 8601 end (inclusive)"),
) -> list[StoredEvent]:
    events = SEED_EVENTS

    if from_date:
        cutoff = datetime.fromisoformat(from_date)
        if cutoff.tzinfo is None:
            cutoff = cutoff.replace(tzinfo=_tz)
        events = [e for e in events if e.start_time >= cutoff]

    if to_date:
        cutoff = datetime.fromisoformat(to_date)
        if cutoff.tzinfo is None:
            cutoff = cutoff.replace(tzinfo=_tz)
        events = [e for e in events if e.start_time <= cutoff]

    return sorted(events, key=lambda e: e.start_time)
