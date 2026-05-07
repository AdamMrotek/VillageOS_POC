"""
Generates an atmospheric vibe description and assigns controlled taxonomy tags
for a provider. Called once at seed time per provider.
"""

import json
from dataclasses import dataclass
from openai import OpenAI
from schemas import Provider
from services.tags import TAG_VOCABULARY, vocab_prompt_block

_client = OpenAI()
_MODEL = "gpt-4o-mini"

_SYSTEM_PROMPT = f"""You are helping build a parent-friendly venue discovery app for Kingston, UK.

Given a provider's factual details, do two things:

1. Write a vivid 2–3 sentence "vibe description" that captures what it actually feels like to be there.
   - Use sensory and emotional language: space, noise, pace, mood, atmosphere
   - Write from a parent's perspective — what will they and their child experience?
   - Do NOT repeat factual data like exact prices, addresses, or age numbers

2. Assign tags from this controlled vocabulary (assign all values that clearly apply per category):
{vocab_prompt_block()}

Return JSON with this exact shape:
{{
  "vibe_description": "...",
  "tags": {{
    "setting": ["outdoor"],
    "noise": ["quiet"],
    "age_group": ["toddler", "preschool"],
    "activity": ["creative"],
    "occasion": ["birthday-party"],
    "price": ["mid-range"],
    "vibe": ["relaxed", "nature"]
  }}
}}

Only include tag categories where at least one value clearly applies. Omit the rest.
"""


@dataclass
class ProviderVibe:
    vibe_description: str
    tags: dict[str, list[str]]


def generate_vibe(provider: Provider) -> ProviderVibe:
    facts = (
        f"Name: {provider.name}\n"
        f"Category: {provider.category}\n"
        f"Description: {provider.description}\n"
        f"Tags: {', '.join(provider.tags)}\n"
        f"Noise level: {provider.noise_level or 'unknown'}\n"
        f"Price: {provider.price_indicator or 'unknown'}\n"
        f"Age range: {provider.age_range_min}–{provider.age_range_max}\n"
    )

    response = _client.chat.completions.create(
        model=_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": facts},
        ],
        response_format={"type": "json_object"},
        max_tokens=400,
        temperature=0.4,
    )

    data = json.loads(response.choices[0].message.content)
    usage = response.usage
    print(f"    [vibe] tokens={usage.total_tokens}")

    # Normalise tags: ensure all values are lists and within vocabulary
    raw_tags = data.get("tags", {})
    clean_tags: dict[str, list[str]] = {}
    for category, allowed in TAG_VOCABULARY.items():
        values = raw_tags.get(category, [])
        if isinstance(values, str):
            values = [values]
        valid = [v for v in values if v in allowed]
        if valid:
            clean_tags[category] = valid

    return ProviderVibe(
        vibe_description=data.get("vibe_description", ""),
        tags=clean_tags,
    )
