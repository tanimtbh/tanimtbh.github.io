"""Rebuild the model files for the website.

    python generate/build.py                    # every term and every example
    python generate/build.py fillet box_lid     # only the named terms or examples

It also rewrites cad-terms.md, the text version of the glossary for AI agents.
"""

import runpy
import sys
import traceback
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))


def main() -> int:
    wanted = {name.replace("-", "_") for name in sys.argv[1:]}
    files = sorted((HERE / "terms").glob("*.py")) + sorted((HERE / "examples").glob("*.py"))
    if wanted:
        files = [f for f in files if f.stem in wanted]
    failed = []
    print(f"Building {len(files)} file(s)")
    for file in files:
        try:
            runpy.run_path(str(file), run_name="__main__")
        except Exception:
            failed.append(file.stem)
            print(f"  {file.stem}: FAILED")
            traceback.print_exc()
    if failed:
        print(f"\n{len(failed)} failed: {', '.join(failed)}")
        return 1

    # the text version of the glossary, for AI agents, uses the fresh snippets
    from glossary import write_glossary

    target = write_glossary()
    print(f"Wrote {target.name}  {target.stat().st_size / 1024:.1f} kB")
    print("Done")
    return 0


if __name__ == "__main__":
    sys.exit(main())
