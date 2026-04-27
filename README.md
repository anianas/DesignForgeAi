# DesignForge — Next.js port

Same logic, same flow as `../frontend` + `../backend` — folded into a single Next.js 15 (App Router) app.

## Stack

- **Framework:** Next.js 15 (App Router)
- **API:** route handlers in `app/api/**/route.js`
- **Auth:** JWT, bcrypt
- **AI:** Anthropic SDK (Claude Sonnet 4.6 for concepts, Claude Haiku 4.5 for code)
- **Live preview:** in-bundle Babel + cross-frame module registry → real iframe with parent's React
- **Design systems available in preview & ZIP:** Material UI, Ant Design, Chakra, Mantine, Carbon
- **State store:** in-memory (resets on restart) — same as the Express version

## Setup

```bash
cd next-app
cp .env.local.example .env.local
# Edit .env.local — set ANTHROPIC_API_KEY and JWT_SECRET
npm install
npm run dev
```

Open http://localhost:3000.

Demo login: `demo@designforge.ai` / `password123`

## Layout

```
next-app/
├── app/
│   ├── layout.jsx              Root layout, providers
│   ├── globals.css
│   ├── page.jsx                Landing
│   ├── auth/page.jsx           Login / signup
│   ├── dashboard/page.jsx      Project grid
│   ├── new/page.jsx            Wizard (project type → idea)
│   ├── generate/[id]/page.jsx  Concept-generation progress
│   ├── project/[id]/page.jsx   Concept brief + UI mock + Code (advanced)
│   └── api/
│       ├── auth/{login,signup,me}/route.js
│       ├── project/route.js              GET list, POST create
│       ├── project/create/route.js       POST (alias)
│       ├── project/generate/route.js     POST → kicks off concept gen
│       ├── project/visualize/route.js    POST → kicks off UI gen from concept
│       ├── project/[id]/route.js         GET single, DELETE soft
│       └── download/[id]/route.js        GET ZIP of runnable Vite scaffold
├── components/
│   ├── AuthContext.jsx
│   ├── ToastContext.jsx
│   ├── Providers.jsx
│   ├── Navbar.jsx
│   ├── Modal.jsx
│   ├── ConceptBrief.jsx
│   ├── LivePreview.jsx
│   ├── transformCode.js        Babel plugin: rewrites imports to __DF_M
│   └── moduleRegistry.js       Lazy-loads each DS lib + style host config
└── lib/
    ├── api.js                  Browser-side fetch wrapper (relative URLs)
    ├── auth.js                 JWT helpers + Next.js Response shortcuts
    ├── store.js                In-memory Maps + seeded demo user
    ├── aiService.js            Concept + code generation, validation, retry
    ├── generationService.js    Two-stage pipeline + step animations
    └── zip.js                  Vite scaffold ZIP via archiver
```

## Differences from the Express version

| | Express + CRA | Next.js |
|---|---|---|
| API base URL | `http://localhost:4000` | same-origin (relative `/api/...`) |
| CORS | required | not needed |
| Rate limiter | express-rate-limit | none (add via Next middleware if needed) |
| Auth | Express middleware | `lib/auth.js#requireUser(req)` per route handler |
| ZIP stream | Express response | Web `ReadableStream` wrapping archiver |
| Routing | react-router-dom | App Router file system |

The AI logic, concept brief shape, generation step animations, retry-on-parse-failure, design system style hosts, and live preview architecture are byte-identical between the two.
