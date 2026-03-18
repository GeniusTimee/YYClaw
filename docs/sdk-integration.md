# SDK Integration

YYClaw is 100% OpenAI-compatible. Any SDK, tool, or framework that supports a custom `base_url` works out of the box.

**Base URL:** `https://your-domain.com/v1`
**Auth:** `Authorization: Bearer sk-yy-YOUR_API_KEY`

---

## Python (OpenAI SDK)

```bash
pip install openai
```

### Basic Usage

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-yy-YOUR_API_KEY",
    base_url="https://crypto.yyclaw.cc/v1"
)

response = client.chat.completions.create(
    model="gemini-3-flash",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain quantum computing"}
    ],
    temperature=0.7,
    max_tokens=1024
)

print(response.choices[0].message.content)
```

### Streaming

```python
stream = client.chat.completions.create(
    model="claude-sonnet-4-6",
    messages=[{"role": "user", "content": "Write a short story"}],
    stream=True
)

for chunk in stream:
    content = chunk.choices[0].delta.content
    if content:
        print(content, end="", flush=True)
```

### Async

```python
import asyncio
from openai import AsyncOpenAI

client = AsyncOpenAI(
    api_key="sk-yy-YOUR_API_KEY",
    base_url="https://crypto.yyclaw.cc/v1"
)

async def main():
    response = await client.chat.completions.create(
        model="gemini-3-flash",
        messages=[{"role": "user", "content": "Hello!"}]
    )
    print(response.choices[0].message.content)

asyncio.run(main())
```

### List Models

```python
models = client.models.list()
for m in models.data:
    print(f"{m.id}: ${m.price_per_call}/call")
```

---

## Node.js / TypeScript

```bash
npm install openai
```

### Basic Usage

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'sk-yy-YOUR_API_KEY',
  baseURL: 'https://crypto.yyclaw.cc/v1'
});

const response = await client.chat.completions.create({
  model: 'claude-sonnet-4-6',
  messages: [{ role: 'user', content: 'Hello!' }]
});

console.log(response.choices[0].message.content);
```

### Streaming

```javascript
const stream = await client.chat.completions.create({
  model: 'gemini-3-flash',
  messages: [{ role: 'user', content: 'Tell me a joke' }],
  stream: true
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) process.stdout.write(content);
}
```

### TypeScript Types

```typescript
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources';

const client = new OpenAI({
  apiKey: 'sk-yy-YOUR_API_KEY',
  baseURL: 'https://crypto.yyclaw.cc/v1'
});

const messages: ChatCompletionMessageParam[] = [
  { role: 'system', content: 'You are a coding assistant.' },
  { role: 'user', content: 'Write a fibonacci function in Rust' }
];

const response = await client.chat.completions.create({
  model: 'claude-opus-4.6',
  messages
});
```

---

## cURL

### Non-Streaming

```bash
curl https://crypto.yyclaw.cc/v1/chat/completions \
  -H "Authorization: Bearer sk-yy-YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-3-flash",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Streaming

```bash
curl https://crypto.yyclaw.cc/v1/chat/completions \
  -H "Authorization: Bearer sk-yy-YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -N \
  -d '{
    "model": "gemini-3-flash",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

### List Models

```bash
curl https://crypto.yyclaw.cc/v1/models
```

---

## LangChain

```bash
pip install langchain-openai
```

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="gemini-3-flash",
    api_key="sk-yy-YOUR_API_KEY",
    base_url="https://crypto.yyclaw.cc/v1",
    temperature=0.7
)

# Simple invoke
response = llm.invoke("What is the meaning of life?")
print(response.content)

# With message history
from langchain_core.messages import HumanMessage, SystemMessage

messages = [
    SystemMessage(content="You are a crypto expert."),
    HumanMessage(content="Explain DeFi in simple terms.")
]
response = llm.invoke(messages)
print(response.content)

# Streaming
for chunk in llm.stream("Tell me about Bitcoin"):
    print(chunk.content, end="", flush=True)
```

---

## LlamaIndex

```bash
pip install llama-index-llms-openai
```

```python
from llama_index.llms.openai import OpenAI

llm = OpenAI(
    model="claude-sonnet-4-6",
    api_key="sk-yy-YOUR_API_KEY",
    api_base="https://crypto.yyclaw.cc/v1",
    temperature=0.5
)

response = llm.complete("Summarize the history of Ethereum")
print(response.text)

# Chat
from llama_index.core.llms import ChatMessage

messages = [
    ChatMessage(role="system", content="You are a helpful assistant."),
    ChatMessage(role="user", content="What is a smart contract?")
]
response = llm.chat(messages)
print(response.message.content)
```

---

## Vercel AI SDK

```bash
npm install ai @ai-sdk/openai
```

```typescript
import { generateText, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const yyclaw = createOpenAI({
  apiKey: 'sk-yy-YOUR_API_KEY',
  baseURL: 'https://crypto.yyclaw.cc/v1'
});

// Non-streaming
const { text } = await generateText({
  model: yyclaw('gemini-3-flash'),
  prompt: 'Explain WebAssembly'
});

// Streaming
const result = await streamText({
  model: yyclaw('claude-sonnet-4-6'),
  prompt: 'Write a React component'
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

---

## Litellm

```bash
pip install litellm
```

```python
import litellm

response = litellm.completion(
    model="openai/gemini-3-flash",
    messages=[{"role": "user", "content": "Hello!"}],
    api_key="sk-yy-YOUR_API_KEY",
    api_base="https://crypto.yyclaw.cc/v1"
)
print(response.choices[0].message.content)
```

---

## Environment Variable Override

Set these globally and every OpenAI-compatible tool on your system uses YYClaw:

```bash
# Add to ~/.bashrc, ~/.zshrc, or ~/.profile
export OPENAI_API_KEY="sk-yy-YOUR_API_KEY"
export OPENAI_BASE_URL="https://crypto.yyclaw.cc/v1"
```

This works with:

| Tool | Notes |
|------|-------|
| `openai` CLI | `openai api chat.completions.create ...` |
| Codex CLI | `codex --model gemini-3-flash` |
| Aider | `aider --model gemini-3-flash` |
| Continue (VS Code) | Set in extension settings |
| Cursor | Custom API endpoint in settings |
| `llm` CLI | `llm -m gemini-3-flash "hello"` |
| Any OpenAI SDK app | Reads `OPENAI_API_KEY` + `OPENAI_BASE_URL` automatically |

---

## Error Handling

All SDKs handle YYClaw errors through standard OpenAI error types:

### Python

```python
from openai import APIError, AuthenticationError

try:
    response = client.chat.completions.create(
        model="gemini-3-flash",
        messages=[{"role": "user", "content": "Hello"}]
    )
except AuthenticationError:
    print("Invalid API key")
except APIError as e:
    if e.status_code == 402:
        print("Insufficient balance — approve more tokens")
    elif e.status_code == 404:
        print("Model not found")
    else:
        print(f"API error: {e}")
```

### Node.js

```javascript
import OpenAI from 'openai';

try {
  const response = await client.chat.completions.create({
    model: 'gemini-3-flash',
    messages: [{ role: 'user', content: 'Hello' }]
  });
} catch (error) {
  if (error instanceof OpenAI.AuthenticationError) {
    console.error('Invalid API key');
  } else if (error.status === 402) {
    console.error('Insufficient balance — approve more tokens');
  } else if (error.status === 404) {
    console.error('Model not found');
  } else {
    console.error('API error:', error.message);
  }
}
```
