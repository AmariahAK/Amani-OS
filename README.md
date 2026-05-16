# Amani OS — Chama Dispute Arbitrator

Amani OS is a React web UI that helps **Amani Investment Chama** treasurers mediate member disputes using an LLM with RAG over bylaws, mock M-Pesa records, and contribution data. It supports **English, Kiswahili, and Sheng**.

Built on [@mariozechner/pi-agent-core](https://github.com/badlogic/pi-mono) and [@mariozechner/pi-ai](https://github.com/badlogic/pi-mono) (patterns from pi-web-ui), with a custom React interface and Amani brand colors.

## Features

- **Dispute arbitration** — cites bylaws (Article 7 workflow), M-Pesa Paybill 247247 mock data, member register
- **Multilingual** — responds in the user's language
- **Markdown + artifacts** — tables and Recharts charts with Excel/PDF/PNG export
- **Tools** — `search_bylaws`, `query_transactions`, `get_member_register`, `read_document`, `web_search`, `get_current_datetime`, `count_tokens`, `compress_context`
- **Token budget** — warns at 75% context, forces compression at 90%
- **Chat sessions** — localStorage persistence, history sidebar (rename/delete), last 7 exchanges in view
- **Streaming** — stop button, thinking blocks, copy/edit prompts
- **Settings** — API keys (browser-only), provider/model picker, CORS proxy

## Color palette

| Token | Hex | Use |
|-------|-----|-----|
| Deep Green | `#2D5016` | Navbar, headers |
| Terracotta | `#C1440E` | Dispute cards, rulings |
| Warm Amber | `#E8A838` | Bylaw clause badges |
| Sage | `#7A9E5F` | Resolved states |
| Cream | `#F5EDD8` | Background |

## Setup

```bash
npm install
npm run ingest   # optional: refresh bylaws chunks from PDF
npm run dev
```

Open the app, click **Settings**, and add an API key for your chosen provider (e.g. **Google Gemini** recommended for Kiswahili/Sheng).

### Supported providers (browser)

OpenAI, Anthropic, Google (Gemini), xAI (Grok), Groq, OpenRouter, Mistral. **Amazon Bedrock** requires a server runtime and is not available in-browser.

### Security note

API keys are stored in **localStorage** in your browser only. Do not use on shared machines for production secrets.

## Mock data

Transaction and member data in `src/data/` is **synthetic/demo** data aligned with [docs/amani_chama_bylaws.pdf](docs/amani_chama_bylaws.pdf). It is not live M-Pesa integration.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run ingest` | Regenerate `bylaws_chunks.json` from PDF (requires `pdftotext`) |

## Architecture

```
React UI → pi-agent-core Agent → pi-ai (multi-provider) → LLM
                ↓
         Tools + localStorage sessions + skills/*.md
```

## Skills

Agent behavior is guided by markdown skills in [`skills/`](skills/): identity, arbitration workflow, visualization, and per-tool guides.

## Future

- [A2UI](https://a2ui.org) structured UI protocol (optional; markdown is primary today)
- Vertex AI / server-side RAG
- Real M-Pesa API

## License

MIT
