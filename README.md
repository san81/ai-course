# AI for Graduate Students — 8-Week Course

Course website with weekly interactive slide decks, released week by week.

**Live site:** https://san81.github.io/ai-course/

## Structure

```
index.html                  Landing page (knowledge meter + week cards)
assets/course.css           Shared styling for all decks (analogy boxes, quizzes, easter eggs)
assets/reveal/dist/         Vendored reveal.js (slides framework + plugins + themes)
weeks/weekN/index.html      One self-contained deck per week
exercises/                  Weekly exercise handouts (core + stretch tiers)
COURSE_PROJECT_INSTRUCTIONS.md   Recurring instructions for course material preparation
```

## Weekly release workflow

1. Build/refine `weeks/weekN/index.html` locally.
2. On release day: bump `RELEASED_WEEKS` in `index.html` (one line at the top of the script).
3. Commit and push — GitHub Pages publishes automatically.

## Session structure (every deck)

Recap of last week → Easter egg question → Deep dive (with real-world analogies) → Exercise (core + stretch) → Motivational quote.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```
