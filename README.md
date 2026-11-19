# Déchiffrage

Sight-reading trainer for choir singers. Load a MIDI score, mute or turn down the other parts, sing your own part into the microphone and get live pitch feedback and a score. Admins upload and label the pieces; everyone else just practises.

## Run

```bash
docker run -d --name dechiffrage --restart unless-stopped \
  -p 3000:3000 -v dechiffrage-data:/app/data \
  -e ADMIN_PASSWORD=choose-a-password \
  ghcr.io/OWNER/REPO:latest
```

or copy `docker-compose.yml` to the server and run `docker compose up -d`.

- App: `http://localhost:3000`, admin page: `/#admin`.
- Without Docker: `node server.js` (Node 18 or newer, no dependencies).
- `ADMIN_PASSWORD` defaults to `password`. Change it.
- Pieces are stored in `/app/data`. Keep that volume, and back it up.

## HTTPS

The microphone only works on `localhost` or HTTPS. Serve the app behind Cloudflare (or a reverse proxy) and turn on **Always Use HTTPS**. The server also redirects plain-HTTP requests that arrive through a proxy sending `CF-Visitor` or `X-Forwarded-Proto`.

## Update the server

```bash
docker compose pull && docker compose up -d
```

## Release

Every push to `main` publishes `ghcr.io/OWNER/REPO:latest`. Pushing a tag such as `v0.1.0` also publishes `0.1.0` and `0.1`:

```bash
git tag v0.1.0 && git push origin v0.1.0
```
