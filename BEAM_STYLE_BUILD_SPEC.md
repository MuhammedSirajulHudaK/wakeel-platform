# Dify → Beam-style Portal — Build Spec

Chat-first reframing of Dify. Every Beam screen below is mapped to the **Dify backend**
so the developer knows what already exists vs. what is net-new. Grouped by area, ordered
for building.

## Constraints & ground rules
- **Running stack uses prebuilt images (`langgenius/dify-*:1.15.0`), not this source tree.**
  Any backend change requires building custom images (`docker/docker-compose.yaml` →
  `build:` context) or running the API from source. Frontend can be a **separate Next.js
  app** that calls Dify's console API (fastest path, no image rebuild).
- Dify console API base: `http://localhost/console/api`. Auth = cookie (`access_token`) +
  `X-CSRF-Token` header. Model keys live per-workspace in DB (already configured: OpenAI).
- The chat-to-build engine **already exists**: `POST /console/api/workflow-generate`
  (create) and the same with `current_graph` (refine). This is the core of every
  "describe it → it builds" screen.

## Backend status legend
- ✅ **Reuse** — Dify endpoint/feature exists; wire the UI to it.
- 🔧 **Extend** — Dify has a near-fit; needs new fields/endpoint on top.
- 🆕 **New** — no Dify equivalent; build backend (model + routes + service).

---

## Phase 0 — Auth & onboarding
| ✓ | Screen | Route | Backend |
|---|--------|-------|---------|
| [ ] | Login (email + Google) | `/signin` | ✅ `POST /login` (base64 pw), Google OAuth `/oauth/login/google`, `GET /oauth/callback` |
| [ ] | Onboarding: Welcome | `/onboarding/welcome` | 🆕 UI-only; gate on `GET /account/profile` |
| [ ] | Onboarding: Profile (avatar, name) | `/onboarding/profile` | ✅ `POST /account/name`, `POST /account/avatar` |
| [ ] | Workspace — Join tab (invites) | `/onboarding/workspace/join` | ✅ `GET /workspaces` + invite-accept `/activate` |
| [ ] | Workspace — Create tab (name, logo-from-domain) | `/onboarding/workspace/create` | 🔧 `POST /workspaces` exists; **logo-fetch-from-domain is New** |
| [ ] | Onboarding: Invite members | `/onboarding/invite` | ✅ `POST /workspaces/current/members/invite-email` |
| [ ] | "You're good to go" (6-step guide) | `/onboarding/done` | 🆕 UI-only checklist |

---

## Phase 1 — App shell
| ✓ | Screen | Route | Backend |
|---|--------|-------|---------|
| [ ] | Left sidebar nav + collapsible rail | shell layout | 🆕 UI-only |
| [ ] | Workspace switcher | shell (top) | ✅ `GET /workspaces`, `POST /workspaces/switch` |
| [ ] | Global search (cmd-K) | overlay | 🔧 `GET /apps` (filter client-side); **unified search index is Extend** |
| [ ] | User menu / profile | shell (bottom) | ✅ `GET /account/profile`, `POST /account/*`, `/logout` |
| [ ] | Chat & support launcher | shell | 🆕 UI-only (link out) |
| [ ] | **Right-side copilot panel** (history + new chat) | drawer, all pages | 🔧 **core piece** — wraps `POST /workflow-generate` (+refine); **conversation persistence is New** (see §Copilot backend) |

---

## Phase 2 — Home / Assistant (chat-first landing)  ⭐ the headline change
| ✓ | Screen | Route | Backend |
|---|--------|-------|---------|
| [ ] | Home "What do you want to work on?" composer | `/` (root, replaces app-list dashboard) | 🔧 chat composer → routes to build flows |
| [ ] | Build-agents mode toggle | `/` | ✅ selects target `mode` for generator/app-create |
| [ ] | Quick actions | `/` | 🆕 UI shortcuts → existing endpoints |
| [ ] | Recommended | `/` | ✅ `GET /explore/apps` (template recommendations) |

> **Design note:** root `/` currently renders the apps grid. Chat-first means `/` becomes
> the Assistant composer; the apps grid moves to `/apps`. Backend unchanged — pure routing/IA.

---

## Phase 3 — Agents
| ✓ | Screen | Route | Backend |
|---|--------|-------|---------|
| [ ] | "Your agents" list + empty state | `/agents` | ✅ `GET /apps?mode=agent-chat` |
| [ ] | New agent — from scratch | `/agents/new` | ✅ `POST /apps` (mode `agent-chat`) |
| [ ] | New agent — from template | `/agents/new?from=template` | ✅ `GET /explore/apps` → `POST /apps/import` |
| [ ] | New agent — **describe to AI** | `/agents/new?from=ai` | 🔧 `POST /workflow-generate` (chatflow) — **agent-mode generation is Extend** (generator targets workflow/advanced-chat, not the `agent-chat` tool loop) |
| [ ] | Agent config/detail (instructions, skills, tools, knowledge, triggers) | `/agents/[id]` | ✅ `POST /apps/{id}/model-config` (pre_prompt, `agent_mode.tools`, dataset bindings); triggers → §Triggers |

---

## Phase 4 — Workflows (chat-to-build primary)  ⭐
| ✓ | Screen | Route | Backend |
|---|--------|-------|---------|
| [ ] | Workflow builder — **chat/typing primary**, canvas as preview | `/workflows/[id]` | ✅ `POST /workflow-generate` (create) + `current_graph` (refine) → `POST /apps/{id}/workflows/draft` |
| [ ] | Run / preview | `/workflows/[id]/run` | ✅ `POST /apps/{id}/workflows/draft/run` (SSE node events) |
| [ ] | Publish | action | ✅ `POST /apps/{id}/workflows/publish` |
| [ ] | Plan-first streaming (show plan, then build) | builder | 🔧 `/workflow-generate/stream` exists in **source (main)**, not in 1.15.0 image → rebuild to unlock |

---

## Phase 5 — Skills (≈ Dify Tools/Plugins)
| ✓ | Screen | Route | Backend |
|---|--------|-------|---------|
| [ ] | Skills list (Active/All), System skill cards | `/skills` | ✅ `GET /workspaces/current/tools/builtin` + `/api` + plugins |
| [ ] | "Try in chat" | action | 🔧 route into copilot with tool preselected |
| [ ] | New skill | `/skills/new` | ✅ custom API tool: `POST /workspaces/current/tool-provider/api/add` (OpenAPI import) |
| [ ] | Skill detail / editor | `/skills/[id]` | ✅ tool-provider get/update endpoints |

---

## Phase 6 — Integrations (≈ Plugins + Model Providers + Data sources)
| ✓ | Screen | Route | Backend |
|---|--------|-------|---------|
| [ ] | Connections tab | `/integrations` | ✅ installed plugins `GET /workspaces/current/plugin/list`, model-providers, data-source bindings |
| [ ] | Available tab (categories, search) | `/integrations/available` | ✅ marketplace `GET /plugin/marketplace/*` (verified live) |
| [ ] | Add a connection (OAuth) | modal/flow | 🔧 model-provider creds ✅; **generic OAuth connection flow is Extend** |
| [ ] | Create custom integration | `/integrations/custom` | ✅ custom API tool (OpenAPI) / 🔧 plugin scaffold |

---

## Phase 7 — Knowledge / Add data
| ✓ | Screen | Route | Backend |
|---|--------|-------|---------|
| [ ] | Knowledge list | `/knowledge` | ✅ `GET /datasets` |
| [ ] | Add data (files, URLs ingestion) | `/knowledge/new` | ✅ `POST /datasets`, `/datasets/{id}/documents` (file + URL + notion), indexing pipeline |

---

## Phase 8 — Projects  (net-new grouping)
| ✓ | Screen | Route | Backend |
|---|--------|-------|---------|
| [ ] | Projects list + New + empty state | `/projects` | 🆕 no Dify equivalent — build `project` model (or map to app **tags** as MVP) |
| [ ] | Project detail (chat + files + notes) | `/projects/[id]` | 🆕 project→apps/datasets membership; notes = New |

---

## Phase 9 — Tasks, Triggers, Inbox  (the autonomous layer — mostly new)
| ✓ | Screen | Route | Backend |
|---|--------|-------|---------|
| [ ] | Tasks list (Status/Agent/Date filters, list⇄board) | `/tasks` | 🆕 **task/run-schedule model** — Dify runs are synchronous/API-triggered; no task queue UI |
| [ ] | Create-task modal (agent, prompt/workflow, schedule/trigger) | modal | 🆕 ties agent/workflow + §Triggers |
| [ ] | Task detail / run view (steps, live logs, output) | `/tasks/[id]` | 🔧 logs ✅ (`GET /apps/{id}/workflow-runs/{run}` + node SSE); **task wrapper is New** |
| [ ] | Approve/Reject in run | in run view | 🔧 Dify has **workflow pause/resume** (`pause_state_persist_layer`) → build human-in-loop approval on top |
| [ ] | Tests view (Tests tab, cases, pass/fail) | `/tests` | 🔧 Dify annotations/eval exist partially → **test-case runner is Extend/New** |
| [ ] | Triggers (schedule / webhook / event) | `/triggers` | 🔧 webhook = published service API ✅; **scheduler (cron) + event triggers are New** |
| [ ] | Inbox (approvals / agent questions) | `/inbox` | 🆕 depends on pause/resume + notifications |

---

## Phase 10 — Cross-cutting
| ✓ | Screen | Route | Backend |
|---|--------|-------|---------|
| [ ] | Agent templates gallery (category, search, cards) | `/templates` | ✅ `GET /explore/apps` + import |
| [ ] | Views (saved filters) | `/views` | 🆕 saved-filter model (small) |
| [ ] | Workspace settings / members / roles | `/settings/members` | ✅ members CRUD + roles (owner/admin/editor/normal) |
| [ ] | Notifications | drawer | 🆕 notification model + feed |

---

## Copilot backend (the one net-new service worth calling out)
The right-side panel + chat-first landing need **conversation persistence** that Dify's
stateless generator doesn't provide. Minimal new backend:
- `builder_conversation` (id, tenant, user, target_app_id?, mode) + `builder_message`
  (role, content, generated_graph_snapshot).
- `POST /builder/conversations` / `POST /builder/conversations/{id}/messages` →
  internally calls `workflow-generate` with the running `current_graph`, stores the
  turn, returns plan + graph. Everything else reuses existing app/workflow endpoints.

## Net-new backend summary (what's actually new work)
1. **Builder conversation store** (copilot history) — small, high-leverage.
2. **Projects** grouping (or ship as tags for MVP).
3. **Tasks + Scheduler/Triggers** (cron + event) — biggest new subsystem.
4. **Inbox / Approvals** on top of workflow pause-resume.
5. **Tests/eval** runner.
6. **Notifications**, **Views**, domain-logo fetch.
Everything else = reuse or thin extend of existing Dify console APIs.

## Suggested build order
0→1→2 (get chat-first shell + landing live against real Dify) →
4 (chat-to-build workflow, backend already there) →
3 (agents) → 5,6,7 (skills/integrations/knowledge = mostly reuse) →
8 (projects) → 9 (tasks/triggers/inbox = the heavy new layer) → 10 (polish).
