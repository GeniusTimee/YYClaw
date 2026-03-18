# YYClaw Skill

## Overview
YYClaw is a pay-per-call AI gateway supporting Claude and Gemini models. This skill routes LLM calls through your YYClaw account using an API key.

## Configuration
Set these in your environment or openclaw config:
- `YYCLAW_API_KEY`: Your YYClaw API key (sk-yy-...)
- `YYCLAW_BASE_URL`: Gateway URL (default: https://crypto.yyclaw.cc/v1)

## Usage

### Check Balance
Ask: "check my yyclaw balance"
→ Fetches balance from /api/billing/balance

### List Models
Ask: "list yyclaw models"
→ Fetches available models from /v1/models

### Call a Model
Ask: "use yyclaw to call gemini-3-flash-fixed with: <your prompt>"
→ POST /v1/chat/completions with your API key

### View Usage
Ask: "show my yyclaw usage"
→ Fetches call logs from /api/billing/logs

## Integration (OpenAI SDK)

Any OpenAI-compatible client works:

```python
from openai import OpenAI
client = OpenAI(
    api_key="sk-yy-YOUR_KEY",
    base_url="https://crypto.yyclaw.cc/v1"
)
```

```javascript
import OpenAI from 'openai';
const client = new OpenAI({
  apiKey: 'sk-yy-YOUR_KEY',
  baseURL: 'https://crypto.yyclaw.cc/v1'
});
```

## Model Aliases
| Alias | Model |
|-------|-------|
| flash | gemini-3-flash-fixed |
| pro | gemini-3-pro-preview-fixed |
| sonnet | claude-sonnet-4-6-fixed |
| haiku | claude-haiku-4.5-fixed |
| opus | claude-opus-4.6-fixed |

## Error Codes
- 402: Insufficient balance — top up at https://crypto.yyclaw.cc/dashboard.html
- 404: Model not found or disabled
- 503: Model upstream not configured (contact admin)

## Instructions for Agent

When user asks to use YYClaw or mentions a yyclaw model:
1. Read YYCLAW_API_KEY from environment or ask user
2. Set base_url to YYCLAW_BASE_URL (default https://crypto.yyclaw.cc/v1)
3. Make OpenAI-compatible API call with the key
4. If 402 error, inform user to top up balance at the dashboard
5. If user asks for balance, call GET /api/billing/balance with JWT token

To get JWT token from API key, use the wallet login flow or ask user to provide their JWT from the dashboard.
