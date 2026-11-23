"""Write cad-terms.md: the whole glossary as one text file for an AI agent.

It is made from data/terms.json and the code snippets in data/models, so it
always says the same thing as the website. build.py runs this at the end.

    python generate/glossary.py
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "cad-terms.md"


def _code(term_id: str) -> str:
    model = ROOT / "data" / "models" / f"{term_id}.json"
    if not model.exists():
        return ""
    return json.loads(model.read_text(encoding="utf-8")).get("code", "")


def _table(table: dict) -> list[str]:
    lines = [f"{table['caption']}:", "", "| " + " | ".join(table["columns"]) + " |",
             "|" + "---|" * len(table["columns"])]
    lines += ["| " + " | ".join(row) + " |" for row in table["rows"]]
    if table.get("note"):
        lines += ["", table["note"]]
    return lines


def write_glossary() -> Path:
    data = json.loads((ROOT / "data" / "terms.json").read_text(encoding="utf-8"))
    terms = data["terms"]
    names = {term["id"]: term["name"] for term in terms}

    out = [
        "# CAD terms for build123d and 3D printing",
        "",
        "A shared vocabulary between a person and an AI agent that writes build123d code "
        "for 3D-printed parts. When the person uses one of these terms, it has the meaning given here.",
        "",
        "## Working rules",
        "",
        *[f"- {rule}" for rule in data.get("agentRules", [])],
        "",
        "## build123d notes to remember",
        "",
        *[f"- **{term['name']}:** {term['codeNote']}" for term in terms if term.get("codeNote")],
    ]

    for category in data["categories"]:
        out += ["", f"## {category['name']}", "", category["blurb"]]
        for term in (t for t in terms if t["category"] == category["id"]):
            out += ["", f"### {term['name']}", ""]
            if term.get("aka"):
                out += [f"Also called: {', '.join(term['aka'])}.", ""]
            out.append(term["definition"])
            code = _code(term["id"])
            if code:
                out += ["", "```python", code, "```"]
            if term.get("codeNote"):
                out += ["", f"Code note: {term['codeNote']}"]
            if term.get("table"):
                out += ["", *_table(term["table"])]
            if term.get("printTip"):
                out += ["", f"Printing: {term['printTip']}"]
            if term.get("note"):
                out += ["", f"Good to know: {term['note']}"]
            for other in term.get("confusedWith", []):
                name = names.get(other.get("id"), other.get("name"))
                out += ["", f"Not the same as {name}: {other['diff']}"]

    OUT.write_text("\n".join(out) + "\n", encoding="utf-8", newline="\n")
    return OUT


if __name__ == "__main__":
    target = write_glossary()
    print(f"Wrote {target.name}  {target.stat().st_size / 1024:.1f} kB")
