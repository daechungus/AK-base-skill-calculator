# AK Base Calculator

Arknights RIIC Base Skill Combo Calculator. Import your operator roster, and the app computes the optimal base layout (2-5-2 or 2-4-3) using a greedy solver, then recommends which operators to promote for the best ROI.

Runs entirely client-side — no backend, no database.

## Project Structure

```
scripts/
  krooster_extract.js   # Browser console snippet to export roster from Krooster
  build_skills_db.py    # Downloads game data and generates the skills database
public/db/
  base_skills.json      # Pre-processed skills DB (374 operators, 801 skills)
src/
  lib/
    types.ts            # TypeScript interfaces
    constants.ts        # Layout configs, meta combos, promotion costs
    solver.ts           # Greedy base layout optimizer
    roi.ts              # Upgrade ROI calculator
  components/           # RosterUpload, BaseGrid, ProductionSummary, UpgradeTable
  app/
    page.tsx            # Home — roster upload
    dashboard/page.tsx  # Dashboard — results view
```

## Prerequisites

- Node.js 18+
- Python 3.10+ (only needed to regenerate the skills database)

## Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:3000, click "Use Demo Roster" to test immediately.

## Regenerating the Skills Database

The pre-built `public/db/base_skills.json` is committed to the repo. To update it with the latest game data:

```bash
python scripts/build_skills_db.py
```

This downloads `character_table.json` and `building_data.json` from [Kengxxiao/ArknightsGameData_YoStar](https://github.com/Kengxxiao/ArknightsGameData_YoStar) and produces a clean JSON file. Downloaded files are cached in `scripts/.cache/` — delete that folder to force a re-download.

## Exporting Your Roster from Krooster

1. Go to [krooster.com](https://www.krooster.com/) and log in
2. Open Chrome DevTools (F12) → Console tab
3. Paste the contents of `scripts/krooster_extract.js` and press Enter
4. A `roster.json` file downloads automatically
5. Upload it on the app's home page

## Deploy

The app is configured for static export (`output: 'export'` in `next.config.ts`), so it can be hosted anywhere that serves static files.

### Current issues

Users can use from any current source
Krooster
Console 
Penguin Stats
