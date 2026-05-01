import json
from openai import OpenAI
from pydantic import BaseModel
from typing import Optional

_client = OpenAI()
_MODEL = "gpt-4o-mini"

_PROMPT = """\
Extract hard search constraints from a parent's query about local providers.

Return a JSON object with these optional fields (omit any field that is not clearly stated):
- noise_max: "quiet" if they want quiet/calm/peaceful/not loud, "moderate" if moderate noise is acceptable
- setting: "outdoor" if they want outdoor/outside/open-air, "indoor" if they want indoor/inside
- age: integer age of the child if a specific age is mentioned (e.g. "4-year-old" → 4, "toddler" → 2)

Only include a field if the query explicitly constrains it. When in doubt, omit the field.

Examples:
"birthday venue for a 4-year-old that isn't too loud" → {"noise_max": "quiet", "age": 4}
"outdoor birthday party ideas in Kingston"             → {"setting": "outdoor"}
"football coaching for my toddler"                    → {"age": 2}
"quiet indoor pottery class"                          → {"noise_max": "quiet", "setting": "indoor"}
"birthday party for kids"                             → {}
"""


class QueryConstraints(BaseModel):
    noise_max: Optional[str] = None  # "quiet" | "moderate"
    setting: Optional[str] = None    # "outdoor" | "indoor"
    age: Optional[int] = None        # child age


def extract_constraints(query: str) -> QueryConstraints:
    response = _client.chat.completions.create(
        model=_MODEL,
        messages=[
            {"role": "system", "content": _PROMPT},
            {"role": "user", "content": query},
        ],
        response_format={"type": "json_object"},
        max_tokens=60,
        temperature=0,
    )
    data = json.loads(response.choices[0].message.content)
    usage = response.usage
    print(
        f"[constraints] {data} | "
        f"model={_MODEL} tokens={usage.total_tokens}"
    )
    return QueryConstraints(**{k: v for k, v in data.items() if k in QueryConstraints.model_fields})
