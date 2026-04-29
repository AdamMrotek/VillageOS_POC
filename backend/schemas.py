from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class EventType(str, Enum):
    school     = "school"
    sport      = "sport"
    birthday   = "birthday"
    fundraiser = "fundraiser"
    meeting    = "meeting"
    deadline   = "deadline"
    other      = "other"


class ActionItem(BaseModel):
    description: str
    cost_estimate_gbp: Optional[float] = None


class ParentEvent(BaseModel):
    title: str              = Field(..., description="Short title, max 60 chars")
    event_type: EventType
    start_time: datetime    = Field(..., description="ISO 8601. Infer year from context; default to next occurrence if ambiguous")
    end_time: Optional[datetime] = None
    is_all_day: bool        = False
    location: Optional[str] = None
    description: Optional[str] = Field(None, description="One sentence summary, max 120 chars")
    action_items: list[ActionItem] = []
    confidence: float       = Field(..., ge=0.0, le=1.0, description="Your confidence in the extraction, 0 to 1")


class ExtractRequest(BaseModel):
    raw_text: str = Field(..., min_length=10, max_length=8000)


class ExtractResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    event: ParentEvent
    model_used: str
    tokens_used: int
