# PromptTantu — Weave better prompts ✦

**A responsive, local-first, installable prompt-library web app containing 100,050 reusable prompts.** Built for creators, students, researchers, developers, and workflow designers.

![Project status](https://img.shields.io/badge/status-MVP-green) ![Library](https://img.shields.io/badge/prompts-100%2C050-56d9bc) ![Stack](https://img.shields.io/badge/stack-HTML%20%2B%20CSS%20%2B%20JS-blue)

**Owner:** dapperdude404  
**Product name:** PromptTantu (working name; not trademark-cleared)  
**Meaning:** *Tantu* means a thread; your prompts and AI workflows are woven into a discoverable library.

## What you get

- **100,000 prompts** imported from the prior ZIP, sequentially numbered **P50001–P150000**.
- **50 new weekly prompts**, numbered **P150001–P150050**, with six category-specific groups.
- **20 main categories**, including realistic photo compositing, Gemini workflows, research, IEEE writing, software engineering, marketing, and productivity.
- Live search by prompt ID, purpose, title, topic, and slash-command mode; sort and filter options.
- Dedicated **prompt workbench** with editable text, automatic `[[VARIABLE]]` form generation, and copy actions.
- Browser-local **favorites**, **custom prompts**, and JSON/JSONL import/export.
- **Workflow Studio:** 8 copy-ready cross-tool workflow recipes for Gemini, ChatGPT, NotebookLM, and product development.
- Installable **PWA** with offline support after first load. Data-category shards are cached after browsing them.
- Responsive mobile UI, accessible navigation, dark/light modes, and zero external runtime dependencies.

## Run locally

Python 3 (any modern version):

```bash
cd PromptTantu
python -m http.server 8000
```

Open **http://localhost:8000/** in Chrome, Edge, Safari, or Firefox. The app requires `DecompressionStream('gzip')` support, available in modern browsers.

> Do not double-click `index.html` from the file manager: browser `file://` security rules prevent reliable loading of the data files. Use the local web server or GitHub Pages.

## Deploy to GitHub Pages

1. Create a new, preferably public repository named **`prompttantu`** in the `dapperdude404` account (GitHub may require you to sign in).
2. Upload **the contents of this folder** into the repository root, not the ZIP itself.
3. In repository Settings → Pages, select **Deploy from a branch**, `main`, `/ (root)`; save.
4. After GitHub completes deployment, your expected URL is `https://dapperdude404.github.io/prompttantu/` (only valid after successful publication).

For terminal users:

```bash
git init
git branch -M main
git add .
git commit -m "feat: release PromptTantu prompt workspace"
git remote add origin https://github.com/dapperdude404/prompttantu.git
git push -u origin main
```

`git push` requires GitHub authentication and an existing repository; neither occurs automatically from this ZIP. See `PUBLISH_TO_GITHUB.md` for details.

## Extend the library

- To import a future batch, export it as JSON or JSONL containing `id`, `title`, `template`, `modes`, `purpose`, and `example`. Use **Import** in the app. This is stored in *this browser*, not written to GitHub.
- To ship new prompts as part of the built-in catalog, update the source dataset or publish a new weekly JSON file, adjust the app load logic, and run `tests/test_integrity.py`.
- To regenerate the sharded data from the original archive: `python scripts/build_data.py /path/to/Response_Mode_100000_Prompts_Gemini_Workflow.zip`.

## Data architecture

- `data/meta.json` — category metadata and schema.
- `data/catalog.json.gz` — compressed, searchable metadata index for 100,000 baseline prompts.
- `data/categories/01.json.gz` ... `20.json.gz` — compressed full prompt bodies, 5,000 per shard. Loaded on demand.
- `data/weekly-150001.json` — 50 latest prompts.
- `assets/app.js` — app logic, local persistence and workflow studio.
- `sw.js` — PWA offline caching of UI and visited category files.

Source data is a **systematically generated variation library**. The 100,000 prompts are not 100,000 individually authored concepts. Verify suitability before using prompts for consequential decisions.

## Privacy and limitations

- No analytics, login, remote AI calls, or API key requirements.
- Data saved in localStorage is not synced between devices or accounts. Back up custom prompts with **Export collection**.
- This app creates and manages *prompt text*. It does not directly generate images, call Gemini, send emails, or publish to GitHub.
- AI workflow links open the external provider; any execution there is governed by that provider's policies and pricing.
- Prompt IDs imported locally must be unique; duplicate IDs are skipped.
- For professional or academic use, cite external sources and verify factual claims. Disclose synthetic composites if used as factual/documentary evidence.

## Test

```bash
python -m unittest discover -s tests -v
node --check assets/app.js
```

## Suggested roadmap

- v1.1: IndexedDB for very large personal collections; typed variables and saved prompt drafts.
- v1.2: GitHub sync through OAuth and backend relay (never expose tokens in client code).
- v1.3: Gemini SDK workflows through a secure backend or user-controlled local runner.
- v2.0: Multi-device sync, granular access permissions, and prompt quality evaluations.

## License

MIT, see `LICENSE`. Source and generated prompt data are provided for personal and commercial use under this license; third-party model services and uploaded content remain governed by their own rights and terms.

## Optional Gemini SDK runner

The browser's Workflow Studio is copy-and-paste only. For optional real Gemini execution using your **own** Gemini API key in a local environment (never in the browser UI), see [`GEMINI_SETUP.md`](GEMINI_SETUP.md). The runner is dry-run by default and only calls the API when `--send` is present.
