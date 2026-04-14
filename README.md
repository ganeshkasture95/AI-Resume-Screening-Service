# HireLens

**HireLens** is an AI-powered resume screening service. Upload a PDF resume and a job description; the API returns immediately with an evaluation ID while a background worker scores the candidate using Google Gemini, persists results in MongoDB, and exposes status and scores over a simple REST API.

| Resource | Link |
|----------|------|
| **Source code** | [github.com/ganeshkasture95/AI-Resume-Screening-Service](https://github.com/ganeshkasture95/AI-Resume-Screening-Service) |
| **Docker images** | [hub.docker.com/r/ganeshkasture95/hirelens](https://hub.docker.com/r/ganeshkasture95/hirelens) |

Container images are published under **`ganeshkasture95/hirelens`** with tags **`api-latest`** (Next.js API) and **`worker-latest`** (BullMQ worker).

---

## Features

- **Async REST API** — `POST /api/evaluations` returns `202` with `evaluation_id`; `GET /api/evaluations/:id` returns status and results.
- **Queue-backed workers** — BullMQ + Redis decouple HTTP from LLM latency.
- **Structured LLM output** — Prompts live in `prompts/*.md`; responses are validated with Zod.
- **Docker-ready** — API, worker, MongoDB, and Redis run together via Compose.

---

## Architecture

| Layer | Technology |
|--------|------------|
| Web & API | Next.js (App Router) |
| Database | MongoDB |
| Queue | Redis + BullMQ |
| AI | Google Gemini (`@google/genai`) |
| PDF text | `pdf-parse` |

---

## Prerequisites

- **Node.js** 20+
- **MongoDB** and **Redis** (local, Docker, or cloud)
- **Google Gemini API key** ([Google AI Studio](https://aistudio.google.com/apikey))

---

## Local development

### 1. Clone and install

```bash
git clone https://github.com/ganeshkasture95/AI-Resume-Screening-Service.git
cd AI-Resume-Screening-Service
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env` and set at least:

- `MONGO_DB_URL`
- `REDIS_URL`
- `GOOGLE_GEMINI_API_KEY`
- `GEMINI_MODEL` (e.g. `gemini-2.5-flash`)

Never commit real secrets. `.env` is gitignored.

### 3. Run the app

**Terminal 1 — API**

```bash
npm run dev
```

**Terminal 2 — Worker**

```bash
npm run worker:dev
```

Open [http://localhost:3000](http://localhost:3000) and use **Upload** to submit a resume.

### 4. Production build (local)

```bash
npm run build
npm run start
```

---

## Testing

```bash
npm test
npm run test:integration
```

---

## Docker (full stack locally)

Build and run API, worker, MongoDB, and Redis:

```bash
cp .env.example .env
# Fill GOOGLE_GEMINI_API_KEY and any overrides; compose sets Mongo/Redis URLs for containers.

docker compose up --build
```

- **App:** [http://localhost:3000](http://localhost:3000)
- **MongoDB:** `localhost:27017`
- **Redis:** `localhost:6379`

Stop:

```bash
docker compose down
```

---

## Docker Hub — images

Published repository: **[ganeshkasture95/hirelens](https://hub.docker.com/repository/docker/ganeshkasture95/hirelens/general)** — tags **`api-latest`** (Next.js API) and **`worker-latest`** (BullMQ worker).

Pull pre-built images:

```bash
docker pull ganeshkasture95/hirelens:api-latest
docker pull ganeshkasture95/hirelens:worker-latest
```

Rebuild and push (after `docker login`):

```bash
docker build -t ganeshkasture95/hirelens:api-latest -f Dockerfile .
docker build -t ganeshkasture95/hirelens:worker-latest -f worker/Dockerfile .

docker push ganeshkasture95/hirelens:api-latest
docker push ganeshkasture95/hirelens:worker-latest
```

---

## Deploy with pre-built images (e.g. EC2)

On the server, copy:

- `docker-compose.deploy.yml`
- `.env` (from `.env.example`, with real secrets)
- `.env.deploy` (from `.env.deploy.example`)

Example `.env.deploy`:

```env
DOCKERHUB_USERNAME=ganeshkasture95
API_IMAGE_TAG=api-latest
WORKER_IMAGE_TAG=worker-latest
```

Run:

```bash
docker login
docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d
```

Check status:

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs -f api worker
```

Open port **3000** in your cloud security group / firewall if you access the UI externally.

---

## Git & GitHub

Remote for this project: **[ganeshkasture95/AI-Resume-Screening-Service](https://github.com/ganeshkasture95/AI-Resume-Screening-Service)**.

Clone (contributors):

```bash
git clone https://github.com/ganeshkasture95/AI-Resume-Screening-Service.git
cd AI-Resume-Screening-Service
```

If you are initializing a new clone and pushing for the first time:

```bash
git init
git add .
git commit -m "feat: HireLens initial resume screening service"
git branch -M main
git remote add origin https://github.com/ganeshkasture95/AI-Resume-Screening-Service.git
git push -u origin main
```

Day-to-day:

```bash
git status
git add <files>
git commit -m "your message"
git push origin main
```

Pull latest:

```bash
git pull origin main
```

---

## API quick reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/evaluations` | Multipart: `resume` (PDF), `job_description` (`text`) → `202` + `evaluation_id` |
| `GET` | `/api/evaluations/:id` | Status and result when completed |

---

## Security

- Do **not** commit `.env` or API keys.
- Use `.env.example` only as a template.
- Rotate keys if they are ever exposed.

---

## License

Private / project use unless you add an explicit license.
