"""
Provider search evaluation script.

Runs the 3 Phase-2 test queries through the RAG pipeline and checks that
relevant providers are returned and the synthesis is coherent.

Usage (from repo root):
    python -m tests.eval_search
    python -m tests.eval_search --cases 0 2
    python -m tests.eval_search --save
"""

import asyncio
import os
import sys
import time
import argparse
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from tabulate import tabulate

load_dotenv("backend/.env")

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from backend.services.provider_search import search_providers


# ---------------------------------------------------------------------------
# Test cases
# ---------------------------------------------------------------------------

@dataclass
class SearchTestCase:
    label: str
    query: str
    city: str
    limit: int
    # Any of these substrings appearing in a result name counts as a match.
    expected_any: list[str]


TEST_CASES: list[SearchTestCase] = [
    SearchTestCase(
        label="quiet_birthday_4yo",
        query="birthday venue for a 4-year-old that isn't too loud",
        city="Kingston",
        limit=3,
        expected_any=["Clay Room", "Richmond Park"],
    ),
    SearchTestCase(
        label="toddler_football",
        query="football coaching for my toddler",
        city="Kingston",
        limit=3,
        expected_any=["Little Kickers"],
    ),
    SearchTestCase(
        label="outdoor_birthday",
        query="outdoor birthday party ideas in Kingston",
        city="Kingston",
        limit=3,
        expected_any=["Hobbledown", "Richmond Park"],
    ),
]

CHECKS = ["has_results", "top_score", "expected_match", "synthesis_ok"]


# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------

@dataclass
class SearchEvalResult:
    case_label: str
    top_results: list[str] = field(default_factory=list)   # "Name (0.87)"
    top_score: float = 0.0
    expected_matched: str = "—"                             # which expected keyword matched
    synthesis_preview: str = ""
    synthesis_len: int = 0
    tokens: int = 0
    elapsed: float = 0.0
    error: str = ""

    def checks(self) -> dict[str, bool]:
        return {
            "has_results":    len(self.top_results) > 0,
            "top_score":      self.top_score >= 0.25,
            "expected_match": self.expected_matched != "—",
            "synthesis_ok":   self.synthesis_len >= 50,
        }


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

async def run_single(case: SearchTestCase) -> SearchEvalResult:
    result = SearchEvalResult(case_label=case.label)
    t0 = time.perf_counter()
    try:
        response = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: search_providers(case.query, case.city, case.limit),
        )
        result.elapsed = time.perf_counter() - t0

        result.top_results = [
            f"{r.provider.name} ({r.relevance_score:.2f})"
            for r in response.results
        ]
        if response.results:
            result.top_score = response.results[0].relevance_score

        names = [r.provider.name for r in response.results]
        for keyword in case.expected_any:
            if any(keyword.lower() in n.lower() for n in names):
                result.expected_matched = keyword
                break

        result.synthesis_preview = response.synthesis[:80]
        result.synthesis_len = len(response.synthesis)
        result.tokens = response.tokens_used

    except Exception as e:
        result.elapsed = time.perf_counter() - t0
        result.error = str(e)[:80]

    return result


async def run_eval(case_indices: list[int]) -> list[SearchEvalResult]:
    cases = [TEST_CASES[i] for i in case_indices]
    return await asyncio.gather(*[run_single(c) for c in cases])


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

def _check_mark(v: bool) -> str:
    return "✓" if v else "✗"


def print_report(results: list[SearchEvalResult], case_indices: list[int]) -> None:
    cases = [TEST_CASES[i] for i in case_indices]
    for case in cases:
        rows_for_case = [r for r in results if r.case_label == case.label]
        print(f"\n{'─' * 80}")
        print(f"  QUERY: {case.query}")
        print(f"  Expected: {' | '.join(case.expected_any)}")
        print(f"{'─' * 80}")

        for r in rows_for_case:
            if r.error:
                print(f"  ERROR: {r.error}")
                continue

            # Results table
            result_table = [[i + 1, name] for i, name in enumerate(r.top_results)]
            print(tabulate(result_table, headers=["#", "Provider (score)"], tablefmt="rounded_outline"))

            # Summary row
            summary = [[
                r.expected_matched,
                r.synthesis_preview[:60] + ("…" if r.synthesis_len > 60 else ""),
                r.tokens,
                f"{r.elapsed:.2f}s",
            ]]
            print(tabulate(summary, headers=["matched", "synthesis", "tokens", "time"], tablefmt="rounded_outline"))

            # Checks
            c = r.checks()
            check_table = [[_check_mark(c[k]) for k in CHECKS]]
            print(tabulate(check_table, headers=CHECKS, tablefmt="rounded_outline"))


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


def save_report(results: list[SearchEvalResult], case_indices: list[int], note: str = "") -> Path:
    cases = [TEST_CASES[i] for i in case_indices]
    output_path = Path(__file__).parent / "EVAL_SEARCH_RESULTS.md"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

    # Write header only on first run (file doesn't exist yet)
    is_new = not output_path.exists()

    lines: list[str] = []
    if is_new:
        lines += ["# VillageOS — Provider Search Eval Results", ""]

    lines += [
        "---",
        "",
        f"## Run: {timestamp}",
        "",
        f"**Pipeline:** ChromaDB (text-embedding-3-small) + gpt-4o-mini synthesis  ",
        f"**Cases:** {', '.join(c.label for c in cases)}  ",
    ]

    if note:
        lines += ["", f"> {note}", ""]

    for case in cases:
        row = next((r for r in results if r.case_label == case.label), None)
        if row is None:
            continue

        lines.append(f"\n### {case.label}\n")
        lines.append(f"**Query:** {case.query}  ")
        lines.append(f"**Expected any of:** {', '.join(case.expected_any)}\n")

        if row.error:
            lines.append(f"**ERROR:** {row.error}\n")
            continue

        headers = ["#", "Provider (score)"]
        table_rows = [[i + 1, name] for i, name in enumerate(row.top_results)]
        lines.append(_md_table(headers, table_rows))
        lines.append("")

        lines.append(f"**Synthesis:** {row.synthesis_preview}{'…' if row.synthesis_len > 80 else ''}  ")
        lines.append(f"**Tokens:** {row.tokens} · **Time:** {row.elapsed:.2f}s  ")
        lines.append(f"**Expected match:** {row.expected_matched}\n")

        c = row.checks()
        check_row = [["✓" if c[k] else "✗" for k in CHECKS]]
        lines.append(_md_table(CHECKS, check_row))
        lines.append("")

    with output_path.open("a") as f:
        f.write("\n".join(lines) + "\n")

    return output_path


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="VillageOS provider search eval")
    parser.add_argument(
        "--cases", nargs="+", type=int, default=list(range(len(TEST_CASES))),
        help="Which test case indices to run (0-based)",
    )
    parser.add_argument(
        "--save", action="store_true",
        help="Append results to tests/EVAL_SEARCH_RESULTS.md",
    )
    parser.add_argument(
        "--note", type=str, default="",
        help="Optional comment to attach to this run (issue description, fix applied, etc.)",
    )
    args = parser.parse_args()

    print(f"\nRunning {len(args.cases)} search queries...\n")

    results = asyncio.run(run_eval(args.cases))
    print_report(results, args.cases)

    if args.save:
        path = save_report(results, args.cases, note=args.note)
        print(f"\nAppended → {path}\n")
    else:
        print()


if __name__ == "__main__":
    main()
