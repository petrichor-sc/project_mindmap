# Project Atlas

An immersive, static multi-project workspace with Three.js 0.180.0 and GSAP 3.13.0. This update adds a connected universe overview, portals between projects, and the Interreg olfactory workshop project. The interface uses pale glass panels, glossy 3D forms, lime navigation accents, moving connection pulses, and animated camera navigation.

## Run it

Extract this folder. In a terminal in the extracted folder:

    python -m http.server 8000

On Windows, use `py -m http.server 8000` if needed. Visit http://localhost:8000. JavaScript modules require HTTP, so do not double-click index.html. No backend, API key, npm installation, or build step is needed for the web app.

## Host on GitHub Pages

1. Create a repository. A public repository works with GitHub Free.
2. Upload the contents of this folder to its root, including index.html, app.js, map.js, data.js, style.css, film.html, and .nojekyll.
3. In Settings → Pages, choose Deploy from a branch → main → /(root) → Save.
4. Open the Pages URL shown by GitHub. Relative paths support repository subpaths.

Official guide: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Connected universes

The overview starts with:

- Olfactory VR thesis
- IP11 Multisensory Mixed Reality Learning Station
- IP12 Industry 5.0
- Interreg Intercultural Olfactory Workshops

Click a universe or its card to enter it. The overview shows curved links between connected projects. The small bridge labels can be clicked to follow a representative link. The bridge cards below show every individual connection, both endpoints, its direction, and whether it is proposed or confirmed.

Inside a project, lime portal nodes connect to specific entries in other projects. Select an entry to see its bridges in the detail panel. Click Open or a portal to travel to the destination entry. Return to source restores the originating entry. You can follow a bridge in either direction; reverse travel is explicitly labelled.

Use Connect two universes from the overview, or + beside Bridges in the detail panel. Select source universe and entry, destination universe and entry, relationship, and proposed/confirmed status. Both entries retain their own notes. Edit and delete work from each bridge card. Multiple links between the same project pair are supported; the overview aggregates their count.

The initial cross-project links are PROPOSED connections to explore, not confirmed hardware deployments, research findings, agreements, or funding commitments. They relate the thesis prototype to IP11 scent delivery, Interreg's learning/formulation activities to IP11, olfaction background to the thesis, and supervision methods between IP11 and IP12.

## Editing and notes

- Create another universe using a general, research, or supervision structure.
- Add or edit topics, papers, tasks/work packages, and decisions/milestones.
- Choose the branch and internal connections in the entry editor.
- Add a verified DOI or source URL and record findings or next steps. No PDF extraction or automatic literature analysis is included.
- Notes save in this browser. Export contains all projects, notes, internal connections, and cross-project bridges.
- Delete entry also removes its internal connections and associated bridges, after confirmation. Bridge deletion preserves the entries.
- Search and branch filters affect the current project. All entries are available in the keyboard-accessible sidebar. On small screens, map labels are reduced to the selected entry and portals to keep the map legible; use the sidebar for all entry names.

## Existing workspaces

The same browser-storage key as the previous version is retained. A version 2 workspace is upgraded to version 3 while keeping its projects, entries, and notes. The Interreg project and applicable proposed starter bridges are added if their referenced entries exist. Reopening an upgraded workspace does not duplicate those links.

Import accepts the current workspace and earlier version 2 exports. A version 1 single-project atlas can be imported into an open project. Workspace replacement requires confirmation. When replacing a single project, bridges referring to removed entries are dropped so no broken endpoints remain.

Browser-local edits DO NOT sync across devices or write back to GitHub. Export regularly. To change what every visitor starts with, edit the seeds in data.js and upload that file. Existing browser workspaces continue using their own data.

## Motion and fallback

Drag to orbit and scroll/pinch to zoom. Recenter restores the complete map. Expand provides a larger map; the entry-browser toggle hides the sidebar. Guided tour plays a 24-second camera journey. Motion controls ambient ring movement and connection pulses. Reduced-motion preferences disable ambient animation and shorten navigation transitions.

Three.js and GSAP use pinned CDN URLs; fonts use Google Fonts with a system-font fallback. If WebGL or Three.js cannot load, an interactive SVG map still shows the projects, entries, and links. If GSAP cannot load, editing and navigation remain usable without camera animation or a tour.

## HyperFrames composition starter

film.html is a separate 1920×1080, 24-second composition. Its `data-composition-id="thesis-tour"` matches `window.__timelines['thesis-tour']`, a paused, seekable GSAP timeline. It always uses starter thesis data, skips local browser storage, and disables ambient animation. Camera state is determined by timeline time. It requires WebGL for 3D rendering.

The HyperFrames CLI is optional and is not bundled. The composition follows the documented HTML/GSAP contract, but an MP4 render has not been performed here. Use Node.js 22+, FFmpeg, and the current CLI; consult its help for selecting film.html as the composition entry. Do not render the interactive index.html.

Framework: https://github.com/heygen-com/hyperframes
Quickstart: https://hyperframes.heygen.com/quickstart

## Validation

JavaScript syntax, DOM references, workspace upgrades, note preservation, cross-project endpoint validation, forward and reverse portal travel, return navigation, bridge creation/editing/deletion, entry/project creation, browser-local persistence, and unsafe import rejection passed automated checks. The fallback map and interface logic were exercised in a lightweight DOM harness. This does not verify actual browser visuals. Browser visual QA and HyperFrames video rendering were unavailable in the creation environment.

## Scope

This app supports internal and cross-project entry links. Real-time collaboration, cloud synchronization, PDF/BibTeX import, project renaming/deletion, and automated research summaries are not implemented.
