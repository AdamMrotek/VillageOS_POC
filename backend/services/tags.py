"""
Controlled tag vocabulary — single source of truth for both provider tagging
and query constraint extraction. Both sides must use exactly these labels.
"""

TAG_VOCABULARY: dict[str, list[str]] = {
    "setting":    ["outdoor", "indoor"],
    "noise":      ["quiet", "moderate", "loud"],
    "age_group":  ["baby", "toddler", "preschool", "primary", "secondary"],
    "activity":   ["creative", "physical", "educational", "competitive", "social"],
    "occasion":   ["birthday-party", "regular-class", "holiday-camp"],
    "price":      ["free", "budget", "mid-range", "premium"],
    "vibe":       ["relaxed", "structured", "adventurous", "nature", "social"],
}


def vocab_prompt_block() -> str:
    lines = []
    for category, values in TAG_VOCABULARY.items():
        lines.append(f"  {category}: {', '.join(values)}")
    return "\n".join(lines)
