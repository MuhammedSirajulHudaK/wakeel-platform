# Wakeel وكيل — Agentic AI Platform for Government

Chat-first platform where any employee builds, tests, and deploys AI agents in
plain English or Arabic. Built on [Dify](https://github.com/langgenius/dify)
(the LLM/agent engine) and a bundled [n8n](https://n8n.io) connector engine,
with a custom Wakeel experience + governance layer — benchmarked against Beam AI.

> **Journey:** Build → Edit → Feedback (test + self-heal) → Deploy → Marketplace → Community

## Feature set (Beam-benchmarked)

Per agent:
- **Flow** — Dify Studio orchestration canvas, chat-to-build design proposals
- **Triggers** — manual, schedule, webhook/API, and Microsoft 365 (via bundled automations)
- **Automation Modes** — per-step Copilot (human approves) / Autopilot (auto)
- **Records / Views** — native searchable data table of the agent's registry
- **Evaluate** — test datasets, LLM-judged pass/fail scoring, one-click prompt optimise
- **Memory** — reference documents (RAG); **Governance** — auto-generated guardrails
- **Config** — Variable Fill (insertable variables) + Structured Outputs (field schema)

Workspace:
- **Inbox** — human-in-the-loop approval queue
- **Tasks** — run history with step logs, Retry/Rerun, 👍/👎 output rating
- **Analytics** — completion / evaluation / approval / feedback scores, runtimes (7/30/90d)
- **Integrations** (400+ connectors) · **Automations** (embedded n8n) · **Agent templates**
- Arabic / English (full RTL), Getting-Started / Core Concepts help

---

## Run it on a Mac (≈10 minutes)

### 1. Prerequisites
- **Docker Desktop** — https://www.docker.com/products/docker-desktop/ (must be running)
- **Python 3** — already on macOS (`python3 --version`)
- An **OpenAI API key** — https://platform.openai.com/api-keys

> The Dify backend runs from **prebuilt Docker images** — you do **not** need to build anything from source.

### 2. Clone
```bash
git clone https://github.com/MuhammedSirajulHudaK/wakeel-platform.git
cd wakeel-platform
```

### 3. Add your OpenAI key
Open `docker/.env`, find this line and paste your real key:
```
OPENAI_API_KEY=sk-proj-REPLACE_WITH_YOUR_OPENAI_KEY
```
(This is the only required edit.)

### 4. Start the backend (Dify + databases)
```bash
cd docker
docker compose up -d
```
First run pulls ~12 container images — give it a few minutes. Check they're healthy:
```bash
docker compose ps
```

### 5. First-time setup (create the admin account)
Open **http://localhost/install** in your browser and create an account, e.g.:
- Email: `admin@wakeel.local`
- Password: `Wakeel@12345`

> If you use different credentials, update `DIFY_EMAIL` / `DIFY_PASSWORD` when starting
> the Wakeel server (step 6), or edit the defaults in `wakeel/server.py`.

### 6. Configure the OpenAI provider (one-time, in the UI)
In the Dify console (http://localhost) → **Settings → Model Provider → OpenAI** →
install it and paste the same key. (Wakeel's Settings ⚙️ can also do this later.)

### 7. Start Wakeel
```bash
cd ..              # back to repo root
DIFY_EMAIL=admin@wakeel.local DIFY_PASSWORD=Wakeel@12345 python3 wakeel/server.py
```
(or just `./wakeel/start.sh` if you used the default credentials in the file)

### 8. Open Wakeel 🎉
**http://localhost/** → you'll land on the Wakeel login. Sign in with the account
from step 5.

---

## What's in here

| Path | What it is |
|---|---|
| `wakeel/` | The Wakeel platform — server + UI (Build/Edit/Feedback/Deploy/Marketplace/Community) |
| `innogent/` | Earlier prototype + the Dify-page rebrand & in-Studio build assistant |
| `docker/` | Dify stack: `docker-compose.yaml`, nginx config (Wakeel routing + rebrand), `.env` |
| `wakeel/docs/` | Pitch deck + license compliance brief (PDF) |
| `api/`, `web/`, … | The Dify source (reference only — the stack runs on prebuilt images) |

## Handy commands (from `docker/`)
```bash
docker compose ps              # status
docker compose logs -f api     # backend logs
docker compose down            # stop  (add -v to also wipe all data)
```

## Notes
- **The OpenAI key is redacted** in `docker/.env` — paste your own (step 3). Never commit a real key.
- Wakeel sessions are in-memory; if you restart `wakeel/server.py`, sign in again.
- Everything runs on `http://localhost/` behind one nginx gateway — no port juggling.

## License
Built on Dify (modified Apache 2.0). See `LICENSE` and
`wakeel/docs/Wakeel-License-Compliance-Brief.pdf` for what's permitted commercially.
