#!/usr/bin/env python3
"""
lookup_brand_color.py — Look up a school's official primary brand color via
web search.

Fallback for scripts/detect-school-color.js's Case B: a brand-new school
with no logo image yet to extract a dominant color from programmatically.
One cheap text-only call — no vision, no PDF — asking Claude to find the
school's published brand/athletics color.

Usage:
    python scripts/lookup_brand_color.py "Full School Name"

Prints a single JSON line to stdout: {"hex": "#rrggbb", "source": "<url>"}

Requirements:
    pip install -r requirements-cds.txt
    ANTHROPIC_API_KEY must be set in .env or the environment
"""

import json
import sys

try:
    import anthropic
except ImportError:
    sys.exit("Missing dependency: pip install anthropic")

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv optional; key can be set directly in environment

MODEL = "claude-sonnet-5"

PROMPT_TEMPLATE = (
    "Look up {school}'s official primary brand/school color — the main color "
    "from its athletics or brand guidelines, not just any color that happens "
    "to appear on its homepage. Respond with ONLY a single raw JSON object, "
    "no markdown fences, no commentary before or after: "
    '{{"hex": "#rrggbb", "source": "<url where you found it>"}}'
)


def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        text = text[text.index("\n") + 1:] if "\n" in text else text
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError(f"No JSON object found in response: {text!r}")
    return json.loads(text[start:end + 1])


def lookup(school_name: str) -> dict:
    client = anthropic.Anthropic()
    message = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        tools=[{"type": "web_search_20260209", "name": "web_search", "max_uses": 3}],
        messages=[{"role": "user", "content": PROMPT_TEMPLATE.format(school=school_name)}],
    )
    for block in message.content:
        if block.type == "text" and block.text.strip():
            return _extract_json(block.text)
    raise ValueError("No text content block in response")


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    result = lookup(sys.argv[1])
    if not isinstance(result.get("hex"), str) or not result["hex"].startswith("#"):
        sys.exit(f"Response missing a valid hex color: {result!r}")
    print(json.dumps(result))


if __name__ == "__main__":
    main()
