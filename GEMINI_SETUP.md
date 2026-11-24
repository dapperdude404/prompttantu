# Optional Gemini SDK workflow — PromptTantu

The web UI itself never calls a model and never asks for credentials. This optional local Python command-line runner supports Gemini API usage when explicitly requested.

## 1. Search and render completely offline

```bash
python tools/prompt_cli.py search "photo realistic" --limit 10
python tools/prompt_cli.py show P50001
python tools/prompt_cli.py render P50001 --var SOURCE_IMAGE="portrait A" --var TARGET_IMAGE="group scene B" --var EDIT_REQUEST="Put me next to the left subject"
```

## 2. Optional Gemini integration

```bash
python -m pip install -U google-genai
```

Set your key as a *local environment variable* (`GEMINI_API_KEY`); do not paste it in source code or add it to Git.

Choose a currently supported Gemini model from Google's official docs; model names, image support, billing and available quotas change. For example, replace `YOUR_VALID_MODEL_ID` below:

```bash
python tools/gemini_runner.py P150050 --model YOUR_VALID_MODEL_ID --var AGENT_A_TASK="extract sources" --var AGENT_B_TASK="write notes"
# Above is a DRY RUN: prints the prompt only.

python tools/gemini_runner.py P150050 --model YOUR_VALID_MODEL_ID --var AGENT_A_TASK="extract sources" --var AGENT_B_TASK="write notes" --send
# --send makes a billable/quotable API request, only with your explicit approval.
```

To attach a local image using an image-capable model:

```bash
python tools/gemini_runner.py P50001 --model YOUR_VALID_IMAGE_MODEL_ID --vars-json example-vars.json --image portrait.jpg --image scene.jpg --image-output --send
```

- Placeholders must be resolved before sending.
- Local images are read only after `--send` is explicitly selected.
- Output files are created under `gemini_outputs/` (this folder is excluded from Git).
- Never upload images you don't have permission to share.
- Generated photo composites should not be presented as authentic documentary evidence.
- If a response cannot be fulfilled by the selected model, the runner reports an error rather than pretending the action completed.
