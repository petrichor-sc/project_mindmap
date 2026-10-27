# Project Mind Map · Constellation Edition

A standalone, interactive Three.js knowledge universe. **Version 2.0.0 / build 20261027-01.**

This edition upgrades the original bright, nearly flat-looking map into a much more spatial, dark-sky constellation. The existing project content, entry IDs, local-storage key, JSON import/export format, and internal/external bridges are unchanged.

### What changed

- A deep-space stage with layered stars, colour glows, reflective 3D orbs, and gently rotating orbital rings.
- Radial three-dimensional branch constellations with varied node depth instead of rigid flat columns.
- Fine illuminated connections; proposed links remain dashed. Animated signals travel along the paths.
- Small labels adjacent to each node, not giant opaque cards over the spheres; glowing hover and selected states.
- Clickable branch headings filter the current project, and **✦ Wander** jumps to an unexpected project or entry.
- Orbit/pan/pinch or wheel zoom remains enabled, along with Recenter, Expand, search, edit, import, export and the Guided Tour.
- Reworked sidebars and responsive layout; built-in SVG fallback when WebGL is unavailable.

**Quick start:** unzip, open a terminal in the extracted `project_mindmap-main` folder, run `python3 serve.py` (or `py serve.py` on Windows), then visit `http://localhost:8000`. Do not open `index.html` directly with a `file://` URL.

**Keyboard tip:** press **F** outside a text field to expand or restore the map. To return to all projects, click **All universes**. Toggle Motion to disable the ambient animation. People using reduced-motion settings do not get the ambient animation by default.

**Data safety:** browser-local edits persist using the same storage key as the supplied ZIP. Export a JSON backup before changing hosts, browsers, ports or replacing another deployment. Changes to code alone should not overwrite stored projects. No accounts, API keys or external databases are required.

**Testing note:** JavaScript source syntax, required UI IDs, package integrity and local HTTP asset delivery were checked. End-to-end browser visual QA could not be completed in the packaging environment due to a managed Chromium URL-blocking policy. The former project's testing notes below refer to its earlier release, not to fresh visual verification of this edition.

---

## Run it

Extract the newest folder. Stop your previous Python server with Ctrl+C in its terminal.

On Windows, double-click Start-Project-Mind-Map.bat, or run:

    py serve.py

On Linux/macOS, run `python3 serve.py`. Visit http://localhost:8000/. The launcher always serves the folder containing serve.py and prints its path and build number. It disables browser caching for all local app files. No backend, API key, npm installation, or build step is needed for the web app.

If port 8000 is busy, stop the old server; this preserves the address used for your browser notes. Alternatively, `py serve.py --port 8001` uses a separate address. Export/import your workspace when moving to another port or host.

Do not double-click index.html. JavaScript modules require HTTP.

## Host on GitHub Pages

1. Create a repository. A public repository works with GitHub Free.
2. Upload the contents of this folder to its root, including index.html, app.js, map.js, data.js, style.css, film.html, version.json, the entire vendor/ folder, and .nojekyll. Upload all files from this release together to avoid mixing versions.
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

Three.js, OrbitControls, and GSAP are bundled in vendor/ and loaded from your own site. Fonts use Google Fonts with a system-font fallback; fonts do not affect the 3D controls. If WebGL or the local graphics files cannot load, an interactive SVG map still shows the projects, entries, and links. The instructions now explicitly say 2D mode. The Graphics button shows the startup error and build number. If GSAP cannot load, editing and navigation remain usable without camera animation or a tour.

## HyperFrames composition starter

film.html is a separate 1920×1080, 24-second composition. Its `data-composition-id="thesis-tour"` matches `window.__timelines['thesis-tour']`, a paused, seekable GSAP timeline. It always uses starter thesis data, skips local browser storage, and disables ambient animation. Camera state is determined by timeline time. It requires WebGL for 3D rendering.

The HyperFrames CLI is optional and is not bundled. The composition follows the documented HTML/GSAP contract, but an MP4 render has not been performed here. Use Node.js 22+, FFmpeg, and the current CLI; consult its help for selecting film.html as the composition entry. Do not render the interactive index.html.

Framework: https://github.com/heygen-com/hyperframes
Quickstart: https://hyperframes.heygen.com/quickstart

## Validation

JavaScript syntax, DOM references, workspace upgrades, note preservation, cross-project endpoint validation, forward and reverse portal travel, return navigation, bridge creation/editing/deletion, entry/project creation, browser-local persistence, and unsafe import rejection passed automated checks. The previous startup-order failure was reproduced, and the corrected startup passed tests with the actual bundled Three.js and OrbitControls: pointer drag changes the camera, wheel input changes its distance, and controls remain enabled after focus and project switching. WebGL drawing was replaced with a renderer stub in these tests. Cache-control response headers, local file paths, and the complete dependency package were also checked. Browser visual QA and HyperFrames video rendering remain unverified.

## Scope

This app supports internal and cross-project entry links. Real-time collaboration, cloud synchronization, PDF/BibTeX import, project renaming/deletion, and automated research summaries are not implemented.


## Release 1.1.0 / build 20261013-02

- Renamed the app to Project Mind Map.
- Fixed a startup-order bug: resize/render ran against the initial fallback nodes before they had 3D positions. That triggered an exception and incorrectly kept the app in 2D mode.
- Bundled graphics and animation libraries locally. The vendor folder must be uploaded with the app.
- Added a Graphics diagnostics button, mode-aware instructions, a visible build label, and versioned app asset URLs.
- Added the cache-disabled Python launcher, anchored to this release's folder.
- Retained the existing browser-storage key so the name change preserves notes and projects on the same origin.

## An earlier local version still appears

1. In the old Python terminal, press Ctrl+C.
2. Extract the new package into a fresh folder.
3. Run the new folder's Start-Project-Mind-Map.bat or `py serve.py`.
4. Open the printed URL and hard refresh with Ctrl+Shift+R on Windows/Linux (Command+Shift+R on macOS).
5. Check the footer for build 20261027-01. If it is absent, you are still seeing older files.

If only your project content looks familiar while the interface/build is current, that is your saved workspace. Updating the app deliberately preserves it. Export before clearing site storage; a hard reload alone does not delete notes.
