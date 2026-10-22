# Montessori on Wheels · Impact Dashboard 2021–2026

**Live:** https://onkeysagain.github.io/mow-impact-2026-dashboard/

An interactive impact dashboard for [Montessori on Wheels](https://www.montessorionwheels.org) (MoW), a Denver nonprofit that brings Montessori education to Black, Brown and low-income families in their own neighborhoods, using a mobile classroom on a bus.

The report is delivered as **three linked dashboards** in an app-style layout. A glass sidebar holds navigation, and a soft field of the brand colours sits behind frosted-glass cards:

1. **Overview.** An illustrated Denver street where the MoW bus drives itself between the five program stops and shows each stop's reach. Click a stop to pull the bus over. Below it sit the four headline numbers, the chart of children reached per program year, the five stops, community stats, and the quote that drives the work.
2. **Reach & growth.** A winding route through the five program stops, with the bus following your scroll. Next to it, a larger yearly chart where you can choose a year to bring into focus, plus the families' question “When is the bus coming back?”.
3. **Community & journey.** Community stats, the Colorado → New Mexico road trip with milestones, the mission, MoW's values (Rungano), the “How change happens” logic-model strip, and a call to action.

A “Next stop” button at the bottom of each dashboard sends a tiny bus along the road and moves you to the next dashboard.

## Data source

- **MoW Impact Report, as of September 2026.** This is the source of every number on the page.
- Children reached is shown as **1,129**, the total of the six program-year counts (90 + 210 + 260 + 300 + 139 + 130), at the dashboard owner’s direction.
- The qualitative content (the families’ question “When is the bus coming back?”, the core values, Rungano, the move from exploration to sustainable growth, and the 2028 pilot goal) comes from the MoW Strategic Roadmap. The “How change happens” strip summarizes the School Programs logic model. The page uses no statistics from either document.

## Tech

- Static site: `index.html`, `styles.css`, `app.js`, `assets/`. No framework, no build step, no chart library.
- The charts and the route are hand-written SVG, drawn in vanilla JS. Animations are driven by IntersectionObserver and scroll position.
- Brand palette: Sunshine Yellow `#F0B323`, Coral Red `#E2665C`, Sky Blue `#9BCBEB`, Lavender `#C1A7E2`, ink `#1A1A1A` and paper `#FFFBF2`.
- Type: Plus Jakarta Sans for the interface and numbers. Gaegu, the hand-lettered face that echoes the logo, is kept for the headline and quotes. Both are self-hosted Latin subsets (SIL Open Font License) with `font-display: swap`.
- Accessibility: semantic landmarks, one `<h1>`, keyboard-operable stops and bars, a screen-reader data table behind the chart, visible focus states, and `prefers-reduced-motion` support (final values, static bus).
- Print stylesheet: **Download summary** (`window.print()`) prints the Overview and Community & journey dashboards as a two-page landscape A4 summary.
- Open Graph and Twitter preview image (`assets/og-image.png`, 1200×630).
- Glassmorphism uses `backdrop-filter`. All motion respects `prefers-reduced-motion`.
- Page weight is about 165 KB.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

GitHub Pages serves the site from the repository root.

---

