import os
import instructor
from openai import AsyncOpenAI
from datetime import date
from schemas import ParentEvent, ExtractResponse

SYSTEM_PROMPT = """
You are a calendar assistant for parents. Extract structured event information
from the text provided. Rules:
- If multiple events exist, extract only the most prominent one.
- If a date is relative ("next Friday"), resolve it to an absolute date.
  Today is {today}.
- If you cannot determine a required field with confidence, set confidence < 0.7.
- Never invent details not present in the text.
- For action_items, extract every concrete thing a parent must do, bring, or pay.
  Examples: buying tickets, bringing a specific item, paying a fee, signing a form.
  Set cost_estimate_gbp if a price in GBP is explicitly mentioned for that item.
- For description, write one sentence summarising what the event is and what makes it
  notable — theme, activities, or purpose. Do not just repeat the event name.
""".strip()

_client = None
_provider = None


def _get_client():
    global _client, _provider
    if _client is not None:
        return _client, _provider

    _provider = os.getenv("LLM_PROVIDER", "ollama")

    if _provider == "ollama":
        _client = instructor.from_openai(
            AsyncOpenAI(base_url="http://localhost:11434/v1", api_key="ollama"),
            mode=instructor.Mode.TOOLS,
        )
    elif _provider == "groq":
        _client = instructor.from_openai(
            AsyncOpenAI(base_url="https://api.groq.com/openai/v1", api_key=os.getenv("GROQ_API_KEY")),
            mode=instructor.Mode.TOOLS,
        )
    else:
        _client = instructor.from_openai(AsyncOpenAI(), mode=instructor.Mode.JSON)

    return _client, _provider


def _models() -> tuple[str, str]:
    """Return (fast_model, smart_model) for the current provider."""
    _, provider = _get_client()
    if provider == "ollama":
        return "llama3.1:8b", "llama3.1:8b"
    if provider == "groq":
        return "llama-3.3-70b-versatile", "llama-3.3-70b-versatile"
    return "gpt-4o-mini", "gpt-4o"


async def extract_event(raw_text: str) -> ExtractResponse:
    today = date.today().isoformat()
    fast_model, smart_model = _models()
    client, _ = _get_client()

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT.format(today=today)},
        {"role": "user",   "content": raw_text},
    ]

    model = fast_model
    response, completion = await client.chat.completions.create_with_completion(
        model=model,
        response_model=ParentEvent,
        max_retries=2,
        messages=messages,
    )

    if response.confidence < 0.7 and fast_model != smart_model:
        model = smart_model
        response, completion = await client.chat.completions.create_with_completion(
            model=model,
            response_model=ParentEvent,
            max_retries=2,
            messages=messages,
            )

    return ExtractResponse(
        event=response,
        model_used=model,
        tokens_used=completion.usage.total_tokens,
    )
