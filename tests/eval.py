"""
Model evaluation script.

Runs a set of test inputs through multiple model/provider/mode configurations
and prints a side-by-side comparison report.

Usage (from repo root):
    python -m tests.eval
    python -m tests.eval --configs groq_tools openai_tools
    python -m tests.eval --cases 0 2
    python -m tests.eval --save
"""

import asyncio
import os
import sys
import time
import argparse
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Optional

import instructor
from openai import AsyncOpenAI
from tabulate import tabulate
from dotenv import load_dotenv

load_dotenv("backend/.env")

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from backend.schemas import ParentEvent
from backend.services.extraction import SYSTEM_PROMPT


# ---------------------------------------------------------------------------
# Test inputs
# ---------------------------------------------------------------------------

@dataclass
class TestCase:
    label: str
    text: str

TEST_CASES = [
    TestCase(
        label="bake_sale",
        text=(
            "Reminder from school: Bake Sale this Friday 24th May at 3pm in the "
            "school hall. Please bring £2 in a labelled envelope."
        ),
    ),
    TestCase(
        label="stanley_may_day",
        text=(
            "## Event Overview\n"
            "* Event Name: Stanley's May Day\n"
            "* Theme: Stay & Play, Relax and Enjoy the Outdoors\n"
            "* Date: Saturday, 16 May\n"
            "* Time: 2:00 PM – 5:00 PM\n\n"
            "## Activities and Refreshments\n"
            "* Food & Drink: Stanley Bar & Snacks, Ice Cream Truck, and Cake Sale\n"
            "* Entertainment: Live DJ and Auction\n"
            "* Games: Creative Station, Treasure Hunt, and Tug of War\n\n"
            "## Ticket Information\n"
            "* Individual: £3 per person\n"
            "* Family: £10 for a family of four"
        ),
    ),
    TestCase(
        label="football_whatsapp",
        text=(
            "Hi all! Just a reminder that the under-9s football tournament is next "
            "Saturday 10th May, kick off 9am at Riverside Park. Kids need shin pads "
            "and boots. Entry is £5 per child, pay on the day. Should be done by "
            "12:30. Let me know if you can't make it — Sarah"
        ),
    ),
]


# ---------------------------------------------------------------------------
# Model configs
# ---------------------------------------------------------------------------

@dataclass
class ModelConfig:
    label: str
    provider: str
    model: str
    mode: instructor.Mode
    base_url: Optional[str] = None
    api_key_env: Optional[str] = None

    def api_key(self) -> Optional[str]:
        if self.api_key_env:
            return os.getenv(self.api_key_env)
        return None


MODEL_CONFIGS: dict[str, ModelConfig] = {
    "groq_tools": ModelConfig(
        label="Groq 70b / TOOLS",
        provider="groq",
        model="llama-3.3-70b-versatile",
        mode=instructor.Mode.TOOLS,
        base_url="https://api.groq.com/openai/v1",
        api_key_env="GROQ_API_KEY",
    ),
    "groq_json": ModelConfig(
        label="Groq 70b / JSON",
        provider="groq",
        model="llama-3.3-70b-versatile",
        mode=instructor.Mode.JSON,
        base_url="https://api.groq.com/openai/v1",
        api_key_env="GROQ_API_KEY",
    ),
    "groq_8b_tools": ModelConfig(
        label="Groq 8b / TOOLS",
        provider="groq",
        model="llama-3.1-8b-instant",
        mode=instructor.Mode.TOOLS,
        base_url="https://api.groq.com/openai/v1",
        api_key_env="GROQ_API_KEY",
    ),
    "openai_tools": ModelConfig(
        label="OpenAI 4o-mini / TOOLS",
        provider="openai",
        model="gpt-4o-mini",
        mode=instructor.Mode.TOOLS,
        api_key_env="OPENAI_API_KEY",
    ),
    "openai_json": ModelConfig(
        label="OpenAI 4o-mini / JSON",
        provider="openai",
        model="gpt-4o-mini",
        mode=instructor.Mode.JSON,
        api_key_env="OPENAI_API_KEY",
    ),
}


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

CHECKS = ["title", "event_type", "start_time", "end_time", "location", "description", "action_items", "confidence"]


@dataclass
class EvalResult:
    config_label: str
    case_label: str
    title: str = ""
    event_type: str = ""
    start_time: str = ""
    end_time: str = ""
    location: str = ""
    description: str = ""
    action_items: int = 0
    action_costs: str = ""
    confidence: float = 0.0
    tokens: int = 0
    elapsed: float = 0.0
    error: str = ""

    def checks(self) -> dict[str, bool]:
        return {
            "title":        bool(self.title and self.title != "—"),
            "event_type":   bool(self.event_type and self.event_type != "—"),
            "start_time":   bool(self.start_time and self.start_time != "—"),
            "end_time":     bool(self.end_time and self.end_time != "—"),
            "location":     bool(self.location and self.location != "—"),
            "description":  bool(self.description and self.description != "—"),
            "action_items": self.action_items > 0,
            "confidence":   self.confidence >= 0.7,
        }


def _make_client(cfg: ModelConfig) -> instructor.Instructor:
    kwargs = {}
    if cfg.base_url:
        kwargs["base_url"] = cfg.base_url
    if cfg.api_key():
        kwargs["api_key"] = cfg.api_key()
    return instructor.from_openai(AsyncOpenAI(**kwargs), mode=cfg.mode)


async def run_single(cfg: ModelConfig, case: TestCase) -> EvalResult:
    result = EvalResult(config_label=cfg.label, case_label=case.label)
    client = _make_client(cfg)
    today = date.today().isoformat()
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT.format(today=today)},
        {"role": "user", "content": case.text},
    ]
    t0 = time.perf_counter()
    try:
        response, completion = await client.chat.completions.create_with_completion(
            model=cfg.model,
            response_model=ParentEvent,
            max_retries=2,
            messages=messages,
        )
        result.elapsed = time.perf_counter() - t0
        result.title = response.title
        result.event_type = response.event_type.value
        result.start_time = response.start_time.strftime("%d %b %H:%M") if response.start_time else "—"
        result.end_time = response.end_time.strftime("%H:%M") if response.end_time else "—"
        result.location = (response.location or "—")[:25]
        result.description = (response.description or "—")[:40]
        result.action_items = len(response.action_items)
        result.action_costs = ", ".join(
            f"£{a.cost_estimate_gbp}" for a in response.action_items if a.cost_estimate_gbp
        )
        result.confidence = response.confidence
        result.tokens = completion.usage.total_tokens
    except Exception as e:
        result.elapsed = time.perf_counter() - t0
        result.error = str(e)[:60]
    return result


async def run_eval(config_keys: list[str], case_indices: list[int]) -> list[EvalResult]:
    configs = [MODEL_CONFIGS[k] for k in config_keys]
    cases = [TEST_CASES[i] for i in case_indices]
    tasks = [run_single(cfg, case) for cfg in configs for case in cases]
    return await asyncio.gather(*tasks)


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

def _check_mark(v: bool) -> str:
    return "✓" if v else "✗"


def print_report(results: list[EvalResult], case_indices: list[int]) -> None:
    cases = [TEST_CASES[i] for i in case_indices]
    for case in cases:
        rows = [r for r in results if r.case_label == case.label]
        print(f"\n{'─' * 80}")
        print(f"  TEST: {case.label}")
        print(f"{'─' * 80}")

        # Values table
        table = []
        for r in rows:
            if r.error:
                table.append([r.config_label, "ERROR", r.error, "", "", "", "", "", "", f"{r.elapsed:.2f}s"])
            else:
                table.append([
                    r.config_label,
                    r.event_type,
                    r.title[:30],
                    r.start_time,
                    r.end_time,
                    r.location,
                    r.description[:35],
                    f"{r.action_items} ({r.action_costs or '—'})",
                    f"{r.confidence:.0%}",
                    r.tokens,
                    f"{r.elapsed:.2f}s",
                ])
        print(tabulate(
            table,
            headers=["Config", "event_type", "title", "start", "end", "location", "description", "action_items", "conf", "tokens", "time"],
            tablefmt="rounded_outline",
        ))

        # Checks table
        check_table = []
        for r in rows:
            if r.error:
                check_table.append([r.config_label] + ["✗"] * len(CHECKS))
            else:
                c = r.checks()
                check_table.append([r.config_label] + [_check_mark(c[k]) for k in CHECKS])
        print(tabulate(
            check_table,
            headers=["Config"] + CHECKS,
            tablefmt="rounded_outline",
        ))


# ---------------------------------------------------------------------------
# Markdown writer
# ---------------------------------------------------------------------------

def _md_table(headers: list[str], rows: list[list]) -> str:
    col_widths = [len(h) for h in headers]
    for row in rows:
        for i, cell in enumerate(row):
            col_widths[i] = max(col_widths[i], len(str(cell)))

    def fmt_row(cells):
        return "| " + " | ".join(str(c).ljust(col_widths[i]) for i, c in enumerate(cells)) + " |"

    sep = "| " + " | ".join("-" * w for w in col_widths) + " |"
    return "\n".join([fmt_row(headers), sep] + [fmt_row(r) for r in rows])


def save_report(results: list[EvalResult], case_indices: list[int], config_keys: list[str]) -> Path:
    cases = [TEST_CASES[i] for i in case_indices]
    output_path = Path(__file__).parent / "EVAL_RESULTS.md"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

    lines = [
        "# VillageOS — Model Eval Results",
        f"\n**Run:** {timestamp}  ",
        f"**Configs:** {', '.join(config_keys)}  ",
        f"**Cases:** {', '.join(c.label for c in cases)}  ",
        "",
    ]

    for case in cases:
        rows = [r for r in results if r.case_label == case.label]
        lines.append(f"\n## {case.label}\n")
        preview = case.text[:120].replace("\n", " ")
        lines.append(f"```\n{preview}{'...' if len(case.text) > 120 else ''}\n```\n")

        headers = ["Config", "event_type", "title", "start", "end", "location", "description", "action_items", "conf", "tokens", "time"]
        table_rows = []
        for r in rows:
            if r.error:
                table_rows.append([r.config_label, "ERROR", r.error[:40], "—", "—", "—", "—", "—", "—", "—", f"{r.elapsed:.2f}s"])
            else:
                table_rows.append([
                    r.config_label,
                    r.event_type,
                    r.title[:40],
                    r.start_time,
                    r.end_time,
                    r.location,
                    r.description[:40],
                    f"{r.action_items} ({r.action_costs or '—'})",
                    f"{r.confidence:.0%}",
                    r.tokens,
                    f"{r.elapsed:.2f}s",
                ])
        lines.append(_md_table(headers, table_rows))
        lines.append("")

        # Checks table
        check_headers = ["Config"] + CHECKS
        check_rows = []
        for r in rows:
            if r.error:
                check_rows.append([r.config_label] + ["✗"] * len(CHECKS))
            else:
                c = r.checks()
                check_rows.append([r.config_label] + [("✓" if c[k] else "✗") for k in CHECKS])
        lines.append(_md_table(check_headers, check_rows))
        lines.append("")

    output_path.write_text("\n".join(lines))
    return output_path


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="VillageOS model eval")
    parser.add_argument(
        "--configs", nargs="+", default=list(MODEL_CONFIGS.keys()),
        choices=list(MODEL_CONFIGS.keys()),
        help="Which model configs to run",
    )
    parser.add_argument(
        "--cases", nargs="+", type=int, default=list(range(len(TEST_CASES))),
        help="Which test case indices to run (0-based)",
    )
    parser.add_argument(
        "--save", action="store_true",
        help="Write results to tests/EVAL_RESULTS.md",
    )
    args = parser.parse_args()

    print(f"\nRunning {len(args.configs)} configs × {len(args.cases)} cases "
          f"= {len(args.configs) * len(args.cases)} calls...\n")

    results = asyncio.run(run_eval(args.configs, args.cases))
    print_report(results, args.cases)

    if args.save:
        path = save_report(results, args.cases, args.configs)
        print(f"\nSaved → {path}\n")
    else:
        print()


if __name__ == "__main__":
    main()
