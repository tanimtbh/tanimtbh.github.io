"""Example projects for the "Example prompts" pages of the website.

Every file in generate/examples/ is one small project, written the way an AI
agent would write it. Running the file makes the pictures, and the code shown
on the website is cut out of the same file, so the two always match.

    ex = Example(__file__)

    # [snippet: bracket.py]
    #> from build123d import *
    #> from ocp_vscode import show
    with BuildPart() as bracket:
        Box(40, 20, 5)
        step_1 = copy.copy(bracket.part)  # [hide]
    show(bracket)
    # [/snippet]

    ex.state("1 Plate").solid(step_1)
    ex.save()

Inside a snippet:

    #> some code      is shown on the website but not run here
    code  # [hide]    is run here but not shown on the website

A file may hold several snippets. Each becomes one file on the website.
Two snippets may be versions of the same file: "# [snippet: assembly.py #2]"
is shown as assembly.py. Example(..., files=[...]) picks which snippets to
show, by the full name as written, for a project that makes two examples.
"""

from __future__ import annotations

import json
import re
import textwrap

from common import OUT, Scene, State

_BLOCK = re.compile(r"^[ \t]*# \[snippet: ([^\]\n]+)\]\n(.*?)\n[ \t]*# \[/snippet\]", re.S | re.M)


def show(*objects, **options) -> None:
    """Stands in for ocp_vscode.show(), so building the site needs no viewer."""


class Step(State):
    """One picture of an example. Its shapes are meshed a little coarser than
    a glossary picture, because an example has more of them."""

    per_turn = 40

    def solid(self, shape, role: str = "base", fine: bool | None = None, **options) -> "Step":
        if fine is None and role not in ("steel", "brass"):
            fine = (0.1, 0.32)
        return super().solid(shape, role=role, fine=fine, **options)


class Example(Scene):
    def __init__(self, file: str, view=(1.0, -1.35, 0.85), name: str | None = None, files: list[str] | None = None):
        super().__init__(file, view)
        self.id = "ex-" + (name or self.id)
        self.wanted = files

    def state(self, label: str) -> Step:
        step = Step(label)
        self.states.append(step)
        return step

    def _files(self) -> list[dict]:
        source = self.path.read_text(encoding="utf-8")
        files = []
        for name, body in _BLOCK.findall(source):
            name = name.strip()
            if self.wanted is not None and name not in self.wanted:
                continue
            lines = []
            for line in textwrap.dedent(body).split("\n"):
                if line.rstrip().endswith("# [hide]"):
                    continue
                lines.append(re.sub(r"^(\s*)#> ?", r"\1", line))
            code = re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()
            files.append({"name": name.split("#")[0].strip(), "code": code})
        return files

    def save(self, thumb: int | None = None) -> None:
        data = {
            "id": self.id,
            "files": self._files(),
            "view": list(self.view),
            "thumb": len(self.states) - 1 if thumb is None else thumb,
            "states": [state.to_json() for state in self.states],
        }
        OUT.mkdir(parents=True, exist_ok=True)
        target = OUT / f"{self.id}.json"
        target.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
        print(f"  {self.id:<22} {len(self.states)} states  {target.stat().st_size / 1024:6.1f} kB")
