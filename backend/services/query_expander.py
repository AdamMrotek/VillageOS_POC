"""
Expands a raw parent query into an atmospheric description (for HyDE embedding)
and extracts hard tag constraints (for post-filter).
"""

import json
from dataclasses import dataclass, field
from openai import OpenAI
from services.tags import TAG_VOCABULARY, vocab_prompt_block

_client = OpenAI()
_MODEL = "gpt-4o-mini"

_SYSTEM_PROMPT = f"""A parent is searching for children's activities or birthday venues in Kingston, UK.

Do two things:

1. Expand their query into a vivid 2–3 sentence description of the ideal place they're imagining.
   Use the same atmospheric, sensory language that venue vibe descriptions use.
   Think: what does the space feel and sound like? What's the pace and mood?

2. Extract HARD constraints as tags — only include a category if the query explicitly rules out alternatives.
   Use this vocabulary:
{vocab_prompt_block()}

Return JSON:
{{
  "expanded": "...",
  "required_tags": {{
    "setting": ["outdoor"],
    "noise": ["quiet"]
  }}
}}

Be conservative with required_tags — when in doubt, omit the category.
"quiet" or "not too loud" → noise: ["quiet"]
"not super loud" → noise: ["quiet", "moderate"]
"outdoor" or "outside" → setting: ["outdoor"]
"toddler" or "baby" → age_group: ["baby", "toddler"]
If the query doesn't clearly constrain a category, leave it out.
"""


@dataclass
class ExpandedQuery:
    expanded: str
    required_tags: dict[str, list[str]] = field(default_factory=dict)


def expand_query(query: str) -> ExpandedQuery:
    response = _client.chat.completions.create(
        model=_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": query},
        ],
        response_format={"type": "json_object"},
        max_tokens=250,
        temperature=0.3,
    )

    data = json.loads(response.choices[0].message.content)
    usage = response.usage
    req_tags = data.get("required_tags", {})
    print(f"[query expand] required_tags={req_tags} tokens={usage.total_tokens}")

    # Normalise required_tags to lists
    raw = data.get("required_tags", {})
    required: dict[str, list[str]] = {}
    for category, values in raw.items():
        if category not in TAG_VOCABULARY:
            continue
        if isinstance(values, str):
            values = [values]
        valid = [v for v in values if v in TAG_VOCABULARY[category]]
        if valid:
            required[category] = valid

    return ExpandedQuery(
        expanded=data.get("expanded", query),
        required_tags=required,
    )
