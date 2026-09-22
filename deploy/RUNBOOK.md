# Greenman CMS - Deployment & Handover Runbook

Everything here is in `deploy/` in the CMS project. The CMS runs on the
client's **own server** (any cheap Linux VPS ~1 GB works); the public website
stays static on **Vercel**. Cost of this setup: $0 in tooling (Caddy issues
Let's Encrypt certs free; SQLite + local media are free).

```
                    ┌─────────────────────────────┐
  editors ──HTTPS──►│  Caddy  ──>  CMS container  │  SQLite + media on disk
   /admin           │  (auto TLS)   (Payload/Next)│  (deploy/server-data/)
                    └──────────────┬──────────────┘
                                   │ publish.sh: export → data/*.json
                                   ▼
                     frontend git repo (client-owned)
                                   │ push
                                   ▼
                    Vercel ── auto redeploy ──> live site
```

---

## 0. What the client must provide (do once)

1. **Server**: Linux VPS, 1 CPU / 1 GB RAM+, Node 22-able Docker host
   (`apt install docker.io docker-compose-v2`). Open ports **80 + 443**.
2. **Domain** for the CMS, e.g. `admin.greenman.com` → A record to server IP.
3. **GitHub repo** for the frontend (empty, public or private), and a
   **Vercel project** connected to it (Vercel Git integration, build = static,
   root = repo root). Vercel redeploys automatically on every push.
4. **Email/SMTP**: EmailJS account owned by the client (contact form) so the
   operator replaces the key/service/template in `contact.html`.
5. **Admin account**: see Step 4 - the client creates it themselves, no
   shared credentials.

## 1. Clone the projects onto the server

```bash
cd /opt
git clone <your-frontend-repo> frontend        # public website source
git clone <your-cms-repo>     cms              # this Payload project
cd cms
```

## 2. Configure env

```bash
cd deploy
cp .env.production.example .env.production
# edit .env.production:
#   PAYLOAD_SECRET              <-- openssl rand -base64 32
#   PAYLOAD_PUBLIC_SERVER_URL   https://admin.your-domain.com
vi .env.production

# Compose/Caddy domain (put in deploy/.env so docker compose sees it):
printf 'CMS_DOMAIN=admin.your-domain.com\n' > .env
```

`deploy/.env.production` and `deploy/.env` are gitignored - never commit them.

## 3. Build & start

```bash
docker compose -f deploy/docker-compose.yml up -d --build
docker compose -f deploy/docker-compose.yml ps
docker compose -f deploy/docker-compose.yml logs -f cms
```

First boot: the entrypoint sees an empty DB and runs `payload db:push` to
create the SQLite schema, then starts the server.

## 4. Create the first admin (owner-only step)

Open `https://admin.your-domain.com/admin` - on an empty DB Payload shows the
**"Create First User"** screen. The client creates ONE real admin account with
a strong password. No default/dev credentials exist in production.

## 5. Publish content (operator)

```bash
cd /opt/cms/deploy
./publish.sh                       # export + install + commit + push → Vercel
```

- Will not publish if the export reports `mismatch` (safety gate).
- Add `DRY_RUN=1 ./publish.sh` to only export and show `git status`.
- Requires Git user identity on the server (`git config --global user.email/name`).
- `FRONTEND_DIR` (default `../frontend`), `GIT_REMOTE`, `GIT_BRANCH` are
  overrideable: e.g. `GIT_BRANCH=master ./publish.sh`.

## 6. Backups

```bash
cd /opt/cms/deploy
./backup.sh                        # tar sqlite + media → deploy/server-data/backups/
```

- Briefly stops the CMS for a consistent snapshot (site is unaffected - it is
  on Vercel). Keeps last `KEEP=14` backups.
- **Best practice**: rsync `deploy/server-data/backups/` nightly off-server.

## 7. Update the CMS image

```bash
cd /opt/cms
git pull
docker compose -f deploy/docker-compose.yml up -d --build
```

## 8. Restore from backup (if ever needed)

```bash
# 1. stop
docker compose -f deploy/docker-compose.yml stop cms
# 2. restore sqlite
tar -xzf deploy/server-data/backups/db-<TS>.tar.gz -C deploy/server-data/db
# 3. restore media
tar -xzf deploy/server-data/backups/media-<TS>.tar.gz -C deploy/server-data/media
# 4. start
docker compose -f deploy/docker-compose.yml start cms
```

## 9. Troubleshooting

| Symptom | Fix |
|---|---|
| Container exits with `db:push` failure | DB dir unwritable - check `deploy/server-data/db` owner is uid 1000 (`chown -R 1000:1000 deploy/server-data frontend`) |
| Caddy shows `certificate ... did not come from any CA` | Internal/acme stager only for `localhost`; use a real domain for production |
| Admin page won't load (502) | CMS still starting - `docker compose logs -f cms`, wait for healthcheck |
| Publish pushes but site unchanged | Confirm Vercel project is connected to that exact repo/branch |
| `mismatch` errors during publish | Don't publish - investigate export/E2E, fix, rerun |

## 10. Known items for the client (not part of server setup)

- ~68 MB product PDFs + ~70 MB videos exceed Vercel's 100 MB static upload;
  decide: keep on Vercel (remove `.vercelignore` exclusion, watch limits),
  move to a CDN/bucket, or host on the same VPS.
- EmailJS credentials in `contact.html` are dev-template values. Fine for now;
  a client-owned account is strongly recommended before public launch.