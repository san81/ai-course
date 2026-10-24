"""
Mr. Chenna Reddy, the hostel's MCP ("Master of Control Panels"), as a real MCP server.

He can't fix pipes. He CAN look things up in the plumbing manual, shut or open the
coloured levers at the valve junction, and check whether a bathroom is still leaking.

Run it:
  python chenna_reddy_mcp.py           # stdio: an AI app (or our notebook) starts it itself
  python chenna_reddy_mcp.py --http    # http://localhost:8000/mcp  (for n8n or other apps)

Settings (environment variables), so you can change the world and watch the agent adapt:
  MANUAL_CSV     path to the manual (default: valve-manual.csv next to this file)
  LEAK_AT        where the leak is: C-2 (C-block 2nd floor, default), C-1, B-1, A-3 ...
  STUCK_LEVERS   comma-separated levers that won't turn, e.g. "orange"
"""
import csv, math, os, re, sys
from collections import Counter
from mcp.server.fastmcp import FastMCP

HERE = os.path.dirname(os.path.abspath(__file__))
MANUAL_CSV = os.environ.get("MANUAL_CSV", os.path.join(HERE, "valve-manual.csv"))
LEAK_AT = os.environ.get("LEAK_AT", "C-2").upper()
STUCK = {s.strip().lower() for s in os.environ.get("STUCK_LEVERS", "").split(",") if s.strip()}

# Which bathrooms each lever feeds. "C-2" = C-block, 2nd floor.
LEVERS = {
    "red":    {"covers": "EVERY block + kitchen + RO drinking water", "areas": "*"},
    "blue":   {"covers": "A-block, all floors", "areas": "A-"},
    "green":  {"covers": "B-block, all floors", "areas": "B-"},
    "yellow": {"covers": "C-block, all floors (incl. laundry)", "areas": "C-"},
    "orange": {"covers": "C-block 2nd-floor bathrooms only", "areas": "C-2"},
    "white":  {"covers": "RO drinking-water plant only", "areas": "RO"},
}
NEVER = {"black": "the fire hydrant line must always stay open",
         "grey": "that's the kitchen LPG gas wheel, not a water valve"}
shut = set()   # levers currently shut (fresh every time the server starts)

with open(MANUAL_CSV, newline="", encoding="utf-8") as f:
    PAGES = list(csv.DictReader(f))

# --- a tiny BM25 keyword search: "look in the index, then the right page" (Week 6) ---
def _words(t): return re.findall(r"[a-z0-9]+", t.lower())
_DOCS = [_words(p["section"] + " " + p["text"]) for p in PAGES]
_DF = Counter(w for d in _DOCS for w in set(d))
_AVG = sum(map(len, _DOCS)) / len(_DOCS)
def _bm25(query, k1=1.5, b=0.75):
    q, n = _words(query), len(_DOCS)
    scores = []
    for d in _DOCS:
        c, s = Counter(d), 0.0
        for w in q:
            if c[w]:
                idf = math.log((n - _DF[w] + 0.5) / (_DF[w] + 0.5) + 1)
                s += idf * c[w] * (k1 + 1) / (c[w] + k1 * (1 - b + b * len(d) / _AVG))
        scores.append(s)
    return scores

mcp = FastMCP(
    "Mr. Chenna Reddy",
    instructions=("I'm Mr. Chenna Reddy, the hostel's Master of Control Panels. I don't know how to "
                  "fix or replace pipes; call a plumber for that. I can look things up in the plumbing "
                  "manual, use a wrench to shut or open the coloured levers at the valve junction, and "
                  "check whether a bathroom is still leaking."),
)

@mcp.tool()
def look_up_manual(question: str, how_many: int = 3) -> str:
    """Search the hostel plumbing manual (300 pages) and return the most relevant pages.
    Use it to find out which coloured lever controls which area before shutting anything."""
    scores = _bm25(question)
    best = sorted(range(len(PAGES)), key=lambda i: -scores[i])[:max(1, min(how_many, 6))]
    hits = [f"p.{PAGES[i]['page']} ({PAGES[i]['section']}): {PAGES[i]['text']}" for i in best if scores[i] > 0]
    return "\n".join(hits) if hits else "Nothing in the manual matches that. Try other words."

@mcp.tool()
def shut_lever(colour: str, warden_approved: bool = False) -> str:
    """Shut one coloured lever at the valve junction (quarter turn with the wrench).
    colour: red, blue, green, yellow, orange or white.
    The RED lever stops water to the whole hostel; it needs warden_approved=true."""
    c = colour.strip().lower()
    if c in NEVER:
        return f"❌ I won't touch {c}: {NEVER[c]}."
    if c not in LEVERS:
        return f"❌ There's no {c} lever. Levers: {', '.join(LEVERS)}."
    if c == "red" and not warden_approved:
        return ("⚠️ Not yet. RED shuts water to EVERY block, the kitchen and drinking water. "
                "Ask the warden first, then call me again with warden_approved=true.")
    if c in STUCK:
        return f"🔧 The {c} lever is jammed. Even with the 24 mm wrench it won't turn. Pick another lever."
    shut.add(c)
    return f"✅ {c.upper()} lever shut. Water is now off for: {LEVERS[c]['covers']}."

@mcp.tool()
def open_lever(colour: str) -> str:
    """Open a lever again (after the repair)."""
    c = colour.strip().lower()
    if c not in shut:
        return f"The {c} lever is already open."
    shut.discard(c)
    return f"✅ {c.upper()} lever open. Water is back for: {LEVERS[c]['covers']}."

@mcp.tool()
def check_leak(block: str, floor: int) -> str:
    """Go and look: is the bathroom at this block and floor still leaking?"""
    area = f"{block.strip().upper()[:1]}-{floor}"
    if area != LEAK_AT:
        return f"👀 {block.upper()}-block floor {floor}: dry, no leak here."
    stopped = [c for c in shut if LEVERS[c]["areas"] == "*" or area.startswith(LEVERS[c]["areas"])]
    if stopped:
        return f"👀 {area}: the water has stopped (the {', '.join(stopped)} lever is shut). The floor is wet but nothing is dripping."
    return f"👀 {area}: STILL LEAKING. Water is spraying from the pipe joint under the sink."

if __name__ == "__main__":
    if "--http" in sys.argv:
        mcp.settings.host = "0.0.0.0"
        mcp.settings.port = int(os.environ.get("PORT", "8000"))
        mcp.run(transport="streamable-http")      # → http://localhost:8000/mcp
    else:
        mcp.run()                                 # stdio
