# Montessori on Wheels · Impact Dashboard 2021–2026

**Live:** https://onkeysagain.github.io/mow-impact-2026-dashboard/

An interactive impact dashboard for [Montessori on Wheels](https://www.montessorionwheels.org) (MoW), a Denver nonprofit that brings Montessori education to Black, Brown and low-income families in their own neighborhoods, using a mobile classroom on a bus.

The page is built around one idea, **“The MoW Route”**. Visitors ride the bus through MoW’s impact: headline numbers that count up, a winding road with the five program stops (the bus drives along as you scroll or click), a hand-drawn chart of children reached per program year, community tiles, a Colorado → New Mexico road-trip timeline, and the mission that drives the work.

## Data source

- **MoW Impact Report, as of September 2026.** This is the source of every number on the page.
- Children reached is shown as **1,129**, the total of the six program-year counts (90 + 210 + 260 + 300 + 139 + 130), at the dashboard owner’s direction.
- The qualitative content (the families’ question “When is the bus coming back?”, the core values, Rungano, the move from exploration to sustainable growth, and the 2028 pilot goal) comes from the MoW Strategic Roadmap. The “How change happens” strip summarizes the School Programs logic model. The page uses no statistics from either document.

## Tech

- Static site: `index.html`, `styles.css`, `app.js`, `assets/`. No framework, no build step, no chart library.
- The charts and the route are hand-written SVG, drawn in vanilla JS. Animations are driven by IntersectionObserver and scroll position.
- Brand palette: Sunshine Yellow `#F0B323`, Coral Red `#E2665C`, Sky Blue `#9BCBEB`, Lavender `#C1A7E2`, ink `#1A1A1A` and paper `#FFFBF2`.
- Type: Gaegu (display) and Nunito (body). Both are self-hosted Latin subsets (SIL Open Font License) with `font-display: swap`.
- Accessibility: semantic landmarks, one `<h1>`, keyboard-operable stops and bars, a screen-reader data table behind the chart, visible focus states, and `prefers-reduced-motion` support (final values, static bus).
- Print stylesheet: **Download summary** (`window.print()`) produces a two-page A4 summary.
- Open Graph and Twitter preview image (`assets/og-image.png`, 1200×630).
- Page weight is about 210 KB.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

GitHub Pages serves the site from the repository root.

---

Dashboard designed & built by Mbongeni Moyo.
