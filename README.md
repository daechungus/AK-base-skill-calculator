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

### Option A: Vercel (easiest)

1. Push your repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Vercel auto-detects Next.js — no config needed
5. Click **Deploy**

Your site will be live at `https://<project-name>.vercel.app`. Every push to `main` triggers a new deploy automatically.

### Option B: GitHub Pages

1. Install the `gh-pages` package:

```bash
npm install --save-dev gh-pages
```

2. Add a `basePath` to `next.config.ts` matching your repo name:

```ts
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/AK-base-skill-calculator",
};
```

3. Add a deploy script to `package.json`:

```json
{
  "scripts": {
    "deploy": "next build && touch out/.nojekyll && gh-pages -d out -t true"
  }
}
```

4. Push your repo to GitHub, then run:

```bash
npm run deploy
```

5. In your repo's GitHub Settings → Pages, set the source to the `gh-pages` branch

Your site will be live at `https://<username>.github.io/AK-base-skill-calculator/`.

### Option C: Any Static Host (Netlify, Cloudflare Pages, etc.)

1. Build the static export:

```bash
npm run build
```

2. The `out/` directory contains the full static site. Upload it to any static hosting provider:
   - **Netlify**: drag and drop the `out/` folder at [app.netlify.com/drop](https://app.netlify.com/drop)
   - **Cloudflare Pages**: connect your GitHub repo, set build command to `npm run build` and output directory to `out`
   - **Any web server**: copy the `out/` folder to your server's document root


### Current issues

I have two minor "Senior Engineer" refinements before we build:

Solver Order: In Step 3, we must solve the Control Center first, not last.

Reasoning: Operators like Amiya or Swire in the Control Center provide global buffs (e.g., +7% Trading Orders) that affect the value of operators in other rooms. If we fill Trading Posts first, we might miss these multipliers.

Data Normalization: In Step 2, the character_table.json uses IDs like char_102_texas, but the user sees "Texas". The Python script must build a robust ID -> Name map to ensure the UI looks human-readable.

Better solver — replace the greedy algorithm with constraint-based optimization (e.g., linear programming via GLPK.js) to find truly optimal layouts
Persist state — save roster + preferences to localStorage so users don't re-upload every visit
PWA support — add a service worker so it works offline
i18n — support CN/JP/KR operator names since the game data repo has all locales
Deploy — push to GitHub, enable GitHub Pages or connect to Vercel for one-click hosting

Conditional/scaling skill support — skills like Jaye, Eunectes, and Rosmontis don't have flat efficiency values. Add a type: "conditional" field and special-case them in the solver
Morale tracking — each operator drains morale at different rates. Add morale/hour data and show estimated shift duration per room
Expand meta combos — the hardcoded list in constants.ts is small. Add more from community guides (Passenger+Weedy+Eunectes, Purestream+Windy, etc.)
Dorm/Command/Workshop assignments — the solver currently only handles Trading/Factory/Power. Extend it to assign dorm recovery and command center buffs

The error means the JSON file you are uploading uses Krooster's internal names (like `evolvePhase`) instead of the simplified names our app expects (like `elite`).

This usually happens if you used Krooster's **"Export" button** (Method 2) instead of the **Console Script** (Method 1).

We can fix this in code so the app accepts **both** formats automatically.

### **The Fix: Create a Flexible Importer**

Create a new file `src/lib/roster_utils.ts`. This script will "clean" any data you throw at it before the app tries to use it.

```typescript
// src/lib/roster_utils.ts

export interface Operator {
  id: string;
  name: string;
  elite: number;
  level: number;
  potential: number;
  module: boolean;
}

// Validation & Normalization Function
export function parseRoster(json: any[]): Operator[] {
  if (!Array.isArray(json)) {
    throw new Error("Invalid format: Root must be an array.");
  }

  return json
    .filter((op) => op.name) // Remove empty entries
    .map((op) => {
      // 1. Handle "Elite" (Krooster calls it 'evolvePhase', we want 'elite')
      const elite = op.elite ?? op.evolvePhase ?? 0;

      // 2. Handle "Potential" (Krooster calls it 'potentialRank')
      const potential = op.potential ?? op.potentialRank ?? 0;

      // 3. Handle IDs (If missing, we can try to guess or generate one)
      const id = op.id || op.charId || `char_${op.name.toLowerCase().replace(/\s/g, '_')}`;

      return {
        id: id,
        name: op.name,
        elite: Number(elite),
        level: Number(op.level || 1),
        potential: Number(potential),
        module: Boolean(op.module || false),
      };
    });
}

```

### **How to use it in your UI**

In your upload component (e.g., `src/app/page.tsx`), wrap the uploaded data with this function before setting the state.

```typescript
import { parseRoster } from '@/lib/roster_utils';

// ... inside your file upload handler ...
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const rawData = JSON.parse(event.target?.result as string);
      
      // ✅ FIX: Run it through our parser first!
      const cleanData = parseRoster(rawData); 
      
      setRoster(cleanData); // Now safe to use
      setError(null);
    } catch (err) {
      setError("Invalid JSON format. Please use a valid Krooster export.");
    }
  };
  reader.readAsText(file);
};

```

### **Why this is better**

Now your user can use **ANY** source:

1. **The Console Script** (Clean format) → Works.
2. **Krooster Official Export** (Messy format) → Works.
3. **Penguin Stats Export** → Works.

Try updating your upload handler with this logic and upload the file again. It should accept the file immediately.


### Issues

Krooster export
Special skills
base skills first
