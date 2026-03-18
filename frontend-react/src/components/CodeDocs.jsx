import { useState } from 'react'

const card = {
  background: '#181A20', border: '1px solid #2B3139', borderRadius: 12, padding: 24,
}

const codeBlock = {
  background: '#0B0E11', border: '1px solid #2B3139', borderRadius: 8,
  padding: '16px 20px', fontFamily: "'JetBrains Mono', 'SF Mono', monospace", fontSize: 13,
  color: '#EAECEF', overflowX: 'auto', lineHeight: 1.8, whiteSpace: 'pre',
}

const tabStyle = (active) => ({
  padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  background: 'none', border: 'none',
  color: active ? '#F0B90B' : '#848E9C',
  borderBottom: active ? '2px solid #F0B90B' : '2px solid transparent',
  transition: 'color 0.15s',
})

const sectionTitle = {
  fontSize: 15, fontWeight: 700, color: '#EAECEF', marginBottom: 12, marginTop: 28,
  display: 'flex', alignItems: 'center', gap: 8,
}

export default function CodeDocs({ apiKey }) {
  const key = apiKey || 'sk-yy-YOUR_API_KEY'
  const [tab, setTab] = useState('openclaw')

  return (
    <div style={card}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#EAECEF', marginBottom: 4 }}>Integration Guide</h3>
      <p style={{ fontSize: 13, color: '#848E9C', marginBottom: 20 }}>Multiple ways to connect — pick what fits your stack</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #2B3139', marginBottom: 20 }}>
        {[
          { id: 'openclaw', label: '⚡ OpenClaw Skill' },
          { id: 'python', label: 'Python' },
          { id: 'node', label: 'Node.js' },
          { id: 'curl', label: 'cURL' },
          { id: 'env', label: 'ENV Override' },
        ].map(t => (
          <button key={t.id} style={tabStyle(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* OpenClaw Skill */}
      {tab === 'openclaw' && (
        <div>
          <div style={{ padding: '14px 18px', background: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.15)', borderRadius: 8, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F0B90B', marginBottom: 6 }}>🔥 Recommended: One-click for all your AI agents</div>
            <div style={{ fontSize: 13, color: '#848E9C', lineHeight: 1.6 }}>
              Install the YYClaw skill and every OpenClaw agent, coding assistant, and OpenAI-compatible app automatically routes through your account. No per-app configuration needed.
            </div>
          </div>

          <div style={sectionTitle}>1. Install the Skill</div>
          <pre style={codeBlock}>{`clawhub install yyclaw`}</pre>

          <div style={sectionTitle}>2. Set your API key</div>
          <pre style={codeBlock}>{`# Add to ~/.openclaw/config.yaml or set env var
export YYCLAW_API_KEY="${key}"
export YYCLAW_BASE_URL="https://crypto.yyclaw.cc/v1"`}</pre>

          <div style={sectionTitle}>3. Done — everything routes through YYClaw</div>
          <pre style={codeBlock}>{`# OpenClaw itself uses YYClaw as the provider
# All sub-agents inherit the config
# Any app using OPENAI_BASE_URL picks it up automatically

# Verify it works:
curl https://crypto.yyclaw.cc/v1/models \\
  -H "Authorization: Bearer ${key}"`}</pre>

          <div style={{ ...sectionTitle, marginTop: 24 }}>What gets routed?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
            {[
              ['OpenClaw agents', 'Main + sub-agents'],
              ['Codex CLI', 'Via OPENAI_BASE_URL'],
              ['Claude Code', 'Via provider config'],
              ['Cursor / Continue', 'Custom API endpoint'],
              ['Python scripts', 'OpenAI SDK base_url'],
              ['Any OpenAI client', 'Drop-in compatible'],
            ].map(([app, how]) => (
              <div key={app} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0B0E11', borderRadius: 6, fontSize: 12 }}>
                <span style={{ color: '#EAECEF', fontWeight: 600 }}>{app}</span>
                <span style={{ color: '#848E9C' }}>{how}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Python */}
      {tab === 'python' && (
        <div>
          <pre style={codeBlock}>{`from openai import OpenAI

client = OpenAI(
    api_key="${key}",
    base_url="https://crypto.yyclaw.cc/v1"
)

response = client.chat.completions.create(
    model="gemini-3-flash",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`}</pre>
        </div>
      )}

      {/* Node.js */}
      {tab === 'node' && (
        <div>
          <pre style={codeBlock}>{`import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: '${key}',
  baseURL: 'https://crypto.yyclaw.cc/v1'
});

const res = await client.chat.completions.create({
  model: 'claude-sonnet-4-6',
  messages: [{ role: 'user', content: 'Hello!' }]
});
console.log(res.choices[0].message.content);`}</pre>
        </div>
      )}

      {/* cURL */}
      {tab === 'curl' && (
        <div>
          <pre style={codeBlock}>{`curl https://crypto.yyclaw.cc/v1/chat/completions \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gemini-3-flash",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}</pre>
        </div>
      )}

      {/* ENV Override */}
      {tab === 'env' && (
        <div>
          <div style={{ padding: '14px 18px', background: 'rgba(14,203,129,0.06)', border: '1px solid rgba(14,203,129,0.15)', borderRadius: 8, marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: '#0ECB81', lineHeight: 1.6 }}>
              Set these environment variables and any OpenAI-compatible tool will automatically use YYClaw as the backend.
            </div>
          </div>

          <pre style={codeBlock}>{`# Add to ~/.bashrc, ~/.zshrc, or .env
export OPENAI_API_KEY="${key}"
export OPENAI_BASE_URL="https://crypto.yyclaw.cc/v1"

# Now these all work through YYClaw:
# - python -c "import openai; ..."
# - npx openai chat "hello"
# - codex --model gemini-3-flash
# - Any tool reading OPENAI_API_KEY + OPENAI_BASE_URL`}</pre>

          <div style={sectionTitle}>OpenClaw config.yaml</div>
          <pre style={codeBlock}>{`# ~/.openclaw/config.yaml
providers:
  yyclaw:
    url: https://crypto.yyclaw.cc/v1
    key: ${key}
    models:
      - gemini-3-flash
      - claude-sonnet-4-6
      - claude-opus-4.6

default_model: yyclaw/gemini-3-flash`}</pre>
        </div>
      )}

      {/* Model aliases note */}
      <div style={{ marginTop: 24, padding: '12px 16px', background: '#0B0E11', borderRadius: 8, fontSize: 12, color: '#848E9C', lineHeight: 1.7 }}>
        💡 Model names are OpenAI-compatible. Use <span style={{ color: '#F0B90B', fontFamily: 'monospace' }}>gemini-3-flash</span> instead of <span style={{ color: '#5E6673', fontFamily: 'monospace' }}>gemini-3-flash-fixed</span> — we handle the mapping internally.
      </div>
    </div>
  )
}
