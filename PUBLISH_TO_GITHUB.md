# Publish PromptTantu to GitHub (dapperdude404)

## Why this ZIP is not already a repository

The connected GitHub integration supports reading existing repositories and editing files, but it does **not** currently expose a `Create repository` action. It would be inappropriate to overwrite unrelated repositories without choosing a destination. The package is ready to upload as a standalone project.

## Recommended repository name

- **PromptTantu** (app brand)
- **`prompttantu`** (GitHub slug)
- Expected repository after creation: `https://github.com/dapperdude404/prompttantu`
- Expected GitHub Pages site after enabling Pages: `https://dapperdude404.github.io/prompttantu/`

The exact name was checked with public-web and GitHub repository search on 24 November 2026 and no obvious exact match was found. This is **not** a legal trademark or domain availability guarantee.

## Browser upload route

1. Open [GitHub new repository](https://github.com/new) while signed in to **dapperdude404**.
2. Set repository name to **prompttantu**, set public (if you want public Pages), and create it without a README to avoid initial conflicts.
3. Extract the PromptTantu ZIP locally. Drag the **contents of the PromptTantu folder**, including the `data` directory, onto the repository's **Add file → Upload files** page. GitHub's website may impose limits for large file selections, so using Git on desktop is more reliable.
4. Commit the upload.
5. Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save.
6. Wait for GitHub's deployment workflow and confirm the site actually loads the 100,050-prompt catalog. The predicted site link will not work until deployment completes.

## Terminal route

From the extracted `PromptTantu` folder (requires Git installed):

```bash
git init
git branch -M main
git add .
git commit -m "Initial PromptTantu release: 100050 prompts"
git remote add origin https://github.com/dapperdude404/prompttantu.git
git push -u origin main
```

After you create the empty repository, you can send the new repo URL in chat to request connector-assisted editing, release checks, and GitHub Pages setup guidance. Do not paste personal access tokens in chat.
