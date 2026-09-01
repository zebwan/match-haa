# MATCH-AAA — content notes (folder still ~/Desktop/lepak)

Concept clone of the Ocha Framer template (ocha.framer.website, template by Ambie), rebuilt
from scratch as plain HTML/CSS/JS and rebranded as a fictional Malaysian matcha bar. Brand renamed LEPAK -> MATCH-AAA on user request (Sep 1); email hello@match-aaa.cafe.
Teardown spec: https://claude.ai/code/artifact/a014d4d7-7d01-4900-ad70-8ce721e9f965

## Brand (ALL FICTIONAL — confirm/replace before any real use)
- Name: MATCH-AAA — matcha bar in a Chinatown KL shophouse
- Address: 27 Jalan Sultan, 50000 Kuala Lumpur  (made up — TODO confirm)
- Email: hello@match-aaa.cafe  (domain not registered — TODO)
- Clock: live Asia/Kuala_Lumpur time
- Socials: generic platform links only
- Prices: RM 12–17 drinks, RM 89–99 merch (invented)
- All people (team + reviewers) are stock-photo faces with invented names.

## Stack
- Static HTML/CSS/JS. Vendored: js/lenis.min.js (Lenis 1.1.9), js/three.min.js (three.js r160).
- js/main.js — Lenis (duration .8), split-text (mask-rise + char-pop), IO reveals, nav
  direction-watcher (4px deadzone), KL clock, custom cursor, marquees (drag + scroll boost),
  SVG textPath snakes, specials arc conveyor, merch slide stage, FAQ accordion, hero parallax.
- js/hero.js — WebGL 1 liquid-wipe slideshow (noise-displaced bottom-up wipe, easeOutQuart,
  wipe 2.2s / autoplay 5.5s post-intro, blur(28px) backdrop intro, proximity hover on fine
  pointers, click select, progress bar in active thumb; phone = 5 images).
- js/whisk.js — procedural three.js chasen (clay material), scroll-spring rotation,
  hidden ≤809px.
- Breakpoints: ≥1440 / 810–1439 / ≤809. Sticky stages kept on ALL breakpoints.
- prefers-reduced-motion: all theatrics disabled, content shown.

## Known gotchas
- position:sticky dies inside overflow:hidden — .specials/.merch use overflow:visible with
  an inner .arc-clip layer for bleed clipping. Don't re-add overflow:hidden to those panels.
- Browser-pane screenshots go stale on this page when the pane is hidden (WebGL+Lenis);
  verify with headless Chrome + CDP (wheel input + frame pumping) instead.
- Serve from the scratchpad copy (launch.json entry "lepak", port 9622) — Desktop paths
  404 under TCC. Resync with:
  rsync -a --delete ~/Desktop/lepak/ <scratchpad>/lepak-serve/

## Images
- All photos: Unsplash (fetched via search, non-premium only). Curated for Malaysian/SEA
  feel: KL/kopitiam cafes, Malaysian flags cafe, durian stall with RM signage, green vintage
  Merc with Malaysian plate, hijab-wearing team members, Petaling Street, Cameron Highlands.
- Candidate pool + category reports live in the session scratchpad (lepak-candidates/) —
  ephemeral; re-source if needed.
- Drink cutouts: rembg (u2net, alpha matting) from single-glass shots.
- Tee mockups: Pillow composites (Anton/Shrikhand prints on blank-tee stock) then rembg
  cutouts. favicon.png Pillow-generated.
- For a REAL client: replace all photography (Unsplash is fine for mockups; real brand
  needs its own shoot) and license check the design direction (Ocha is a paid template —
  remix in Framer is the licensed path if shipping that exact design).

## Page inventory
- index.html (13-section one-pager, ~16,300px desktop)
- articles/index.html + 4 article pages
- legal/terms.html + legal/privacy.html

## Revision round (Sep 1, later)
- Specials arc: items sized by height (310/250/175px), viewport-centred (rect.top compensated), drag+momentum stacked on scroll sweep.
- Menu: hovering a row swaps the side photo (menu-1..8.jpg), reverts on leave.
- Reviews: whisk scale 1.12 (was 1.55), lifted; section padding-bottom 16vh.
- Merch: rebuilt as linear tee slider (scroll sweep + drag, wrap-around, centre scale), old 4-trigger swap removed.
- Articles: card thumbs full-width (240px tall), image zooms slightly on hover.
- Phone: nav sizes shrunk to prevent wrapping; hero render + autoplay gated to visibility; hero parallax off on touch.
- Known non-issue: headless-Chrome captures sometimes raster side tees dark (stale layer under load); real browsers render fine — if ever seen live, first suspect the img drop-shadow filter.

## Gallery round (Sep 1, afternoon)
- "Designed by MYSense" credit removed from all footers.
- New section before FAQ: THE LATTE ART LINE — SVG train track (new path: two hills + full
  rollercoaster loop, railway-tie dashes) with 8 latte-art photo "cars" (gal-1..8.jpg,
  pink frames, tangent rotation) riding it: idle 2%/s + scroll-velocity boost, IO-gated.
- gal images: Unsplash latte-art set (10 cropped squares in assets/img, 8 in use).
