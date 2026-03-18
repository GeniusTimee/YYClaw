# OpenClaw Skill

YYClaw ships with an OpenClaw Skill that lets any OpenClaw agent use YYClaw as its AI provider. Install once, and all agents, sub-agents, and OpenAI-compatible tools route through your YYClaw account automatically.

---

## What is an OpenClaw Skill?

OpenClaw Skills are plugin modules that extend agent capabilities. The YYClaw skill configures OpenClaw to use YYClaw as an AI model provider — no per-app configuration needed.

---

## Installation

### Option A: ClawHub (Recommended)

```bash
clawhub install yyclaw
```

This downloads the skill and places it in `~/.openclaw/workspace/skills/yyclaw/`.

### Option B: Manual

Copy the `skill/` directory from the YYClaw repo:

```bash
cp -r /path/to/yyclaw/skill ~/.openclaw/workspace/skills/yyclaw
```

### Verify Installation

```bash
ls ~/.openclaw/workspace/skills/yyclaw/SKILL.md
```

---

## Configuration

After installing the skill, configure your API key and base URL.

### Option A: Environment Variables

```bash
# Add to ~/.bashrc, ~/.zshrc, or ~/.profile
export YYCLAW_API_KEY="sk-yy-YOUR_API_KEY"
export YYCLAW_BASE_URL="https://crypto.yyclaw.cc/v1"
```

### Option B: OpenClaw config.yaml

```yaml
# ~/.openclaw/config.yaml
providers:
  yyclaw:
    url: https://crypto.yyclaw.cc/v1
    key: sk-yy-YOUR_API_KEY
    models:
      - gemini-2.5-flash
      - gemini-3-flash
      - gemini-3-flash-agent
      - gemini-3-flash-preview
      - gemini-2.5-pro
      - gemini-3.1-pro-high
      - gemini-3-pro-preview
      - gemini-3-pro-preview-thinking
      - claude-haiku-4.5
      - claude-haiku-4.5-thinking
      - claude-sonnet-4
      - claude-sonnet-4-6
      - claude-sonnet-4-thinking
      - claude-sonnet-4.5
      - claude-sonnet-4.5-thinking
      - claude-opus-4.6
      - claude-opus-4-6-thinking
      - gemini-3.1-flash-image
      - gemini-3.1-pro-high

default_model: yyclaw/gemini-3-flash
```

### Option C: Per-Agent Override

In any agent's config, set the model to a YYClaw model:

```yaml
model: yyclaw/claude-sonnet-4-6
```

---

## What Gets Routed

Once configured, these all automatically use YYClaw:

| Application | How It Works |
|-------------|-------------|
| OpenClaw main agent | Uses `default_model` from config |
| OpenClaw sub-agents | Inherit provider config from parent |
| Codex CLI | Via `OPENAI_BASE_URL` env var |
| Claude Code | Via provider config |
| Cursor / Continue | Custom API endpoint setting |
| Python scripts | OpenAI SDK `base_url` parameter |
| Node.js apps | OpenAI SDK `baseURL` parameter |
| Any OpenAI client | Drop-in compatible |

---

## Skill Commands

The skill responds to natural language commands through OpenClaw:

### Check Balance

> "check my yyclaw balance"

Calls `GET /api/billing/balance` and returns your current on-chain allowance.

### List Models

> "list yyclaw models"

Calls `GET /v1/models` and shows available models with pricing.

### Call a Model

> "use yyclaw to call gemini-3-flash with: What is the capital of France?"

Calls `POST /v1/chat/completions` with the specified model and prompt.

### View Usage

> "show my yyclaw usage"

Calls `GET /api/billing/logs` and shows recent API call history.

---

## Skill File Structure

```
skill/
└── SKILL.md    # Skill definition file
```

The `SKILL.md` contains:
- Skill metadata (name, description)
- Configuration instructions
- Usage patterns and triggers
- Model alias table
- Error code reference
- Agent instructions for automatic routing

---

## Publishing to ClawHub

If you've customized the skill and want to publish it:

```bash
cd skill
clawhub publish
```

Follow the prompts to set version, description, and publish to [clawhub.com](https://clawhub.com).

---

## Troubleshooting

### "YYCLAW_API_KEY not set"

Set the environment variable or add it to config.yaml:

```bash
export YYCLAW_API_KEY="sk-yy-YOUR_KEY"
```

### "402 Insufficient balance"

Your on-chain token allowance is depleted. Approve more tokens:

1. Go to `https://crypto.yyclaw.cc/dashboard`
2. Select chain and token
3. Approve additional amount

### "Model not found"

The model name might not be in YYClaw's registry. Check available models:

```bash
curl https://crypto.yyclaw.cc/v1/models
```

### Agent not using YYClaw

Verify the provider is configured:

```bash
grep -A5 "yyclaw" ~/.openclaw/config.yaml
```

Make sure `default_model` points to a `yyclaw/` prefixed model.
