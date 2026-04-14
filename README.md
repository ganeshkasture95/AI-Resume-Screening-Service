# HireLens

AI-powered resume screening: upload a PDF and a job description, get a `202` with an `evaluation_id`, then poll for score and verdict. Built with **Next.js**, **MongoDB**, **Redis / BullMQ**, and **Google Gemini**. Prompts live in `prompts/*.md`; LLM output is validated with Zod.

| | |
|--|--|
| **GitHub** | [ganeshkasture95/AI-Resume-Screening-Service](https://github.com/ganeshkasture95/AI-Resume-Screening-Service) |
| **Docker Hub** | [ganeshkasture95/hirelens](https://hub.docker.com/repository/docker/ganeshkasture95/hirelens/general) (`api-latest`, `worker-latest`) |

---

## Stack

| Layer | Tech |
|-------|------|
| API & UI | Next.js (App Router) |
| DB | MongoDB |
| Queue | Redis + BullMQ |
| AI | Google Gemini |
| PDF | `pdf-parse` |

---

## Local development

```bash
git clone https://github.com/ganeshkasture95/AI-Resume-Screening-Service.git
cd AI-Resume-Screening-Service
npm install
cp .env.example .env
```

Set in `.env`: `MONGO_DB_URL`, `REDIS_URL`, `GOOGLE_GEMINI_API_KEY`, `GEMINI_MODEL`. Never commit `.env`.

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run worker:dev
```

Open [http://localhost:3000](http://localhost:3000). Production build locally: `npm run build && npm start`.

---

## Tests

```bash
npm test
npm run test:integration
```

---

## Docker (local full stack)

From repo root, with `.env` filled (at least `GOOGLE_GEMINI_API_KEY`):

```bash
docker compose up --build
```

App: [http://localhost:3000](http://localhost:3000). Stop: `docker compose down`.

---

## Docker Hub (images)

```bash
docker pull ganeshkasture95/hirelens:api-latest
docker pull ganeshkasture95/hirelens:worker-latest
```

Rebuild & push (maintainers, after `docker login`):

```bash
docker build -t ganeshkasture95/hirelens:api-latest -f Dockerfile .
docker build -t ganeshkasture95/hirelens:worker-latest -f worker/Dockerfile .
docker push ganeshkasture95/hirelens:api-latest
docker push ganeshkasture95/hirelens:worker-latest
```

---

## Run on AWS EC2 (Ubuntu) — step by step

These steps run the **pre-built** Hub images plus MongoDB and Redis **on the instance** (`docker-compose.deploy.yml`). You do not need external Mongo/Redis for this flow.

### 1. Create the EC2 instance

- Ubuntu 22.04+ (or similar).
- Allow inbound in the **security group**:
  - **TCP 22** — SSH (restrict to your IP if possible).
  - **TCP 3000** — web app (your IP or `0.0.0.0/0` for a public demo).

Do **not** open 27017 / 6379 to the internet unless you have a specific need; the app talks to Mongo/Redis inside Docker.

### 2. Install Docker on the server

SSH in, then (Ubuntu):

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${VERSION_CODENAME:-jammy}") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
```

Log out and SSH back in so `docker` works without `sudo`.

### 3. Get the repo on the instance

`docker-compose.deploy.yml` must live **in the same directory** you run `docker compose` from, alongside `.env` and `.env.deploy`.

```bash
cd ~
git clone https://github.com/ganeshkasture95/AI-Resume-Screening-Service.git
cd AI-Resume-Screening-Service
```

### 4. Configure environment

```bash
cp .env.example .env
vim .env
```

Set **`GOOGLE_GEMINI_API_KEY`** (and **`GEMINI_MODEL`** if you override the default). Compose injects **`MONGO_DB_URL`** and **`REDIS_URL`** for the bundled containers — you can leave localhost entries in `.env` as placeholders; the deploy file overrides them for API/worker.

Create **`.env.deploy`** in **this same folder** (copy from `.env.deploy.example` or create manually):

```env
DOCKERHUB_USERNAME=ganeshkasture95
API_IMAGE_TAG=api-latest
WORKER_IMAGE_TAG=worker-latest
```

If `.env.deploy` is only in a parent directory, either **copy it into `AI-Resume-Screening-Service/`** or pass `--env-file /full/path/to/.env.deploy`.

### 5. Pull and start

```bash
docker login
docker compose --env-file .env.deploy -f docker-compose.deploy.yml pull
docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d
```

### 6. Verify

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
```

Logs: `docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs -f api worker`

### 7. Open the app in a browser

Use **HTTP**, not HTTPS (there is no TLS on port 3000 by default):

```text
http://<EC2_PUBLIC_IP>:3000
```

If you see **ERR_SSL_PROTOCOL_ERROR**, the browser is using **https://**. Switch to **`http://`** explicitly and include **`:3000`**.

### 8. Stop the stack

```bash
cd ~/AI-Resume-Screening-Service
docker compose --env-file .env.deploy -f docker-compose.deploy.yml down
```

---

## API

| Method | Path | Description |
|--------|------|----------------|
| `POST` | `/api/evaluations` | Form: `resume` (PDF), `job_description` → `202` + `evaluation_id` |
| `GET` | `/api/evaluations/:id` | Status and result when ready |

---

## Security

- Never commit `.env` or API keys.
- Rotate keys if exposed.
- For production HTTPS, put a reverse proxy or load balancer with a real certificate in front; do not expect SSL on raw `:3000` without that setup.

---

## License

Private / project use unless you add a license file.
