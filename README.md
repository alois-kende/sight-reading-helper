# Sight Reading Helper

Sight-reading trainer for choir singers. Load a MIDI score, mute or turn down the other parts, sing your own part into the microphone and get live pitch and timing feedback, plus a list of the bars to work on. Admins upload and label the pieces; everyone else just practises.

Open source, released under the MIT licence.

## How it works

1. Tick **Me** on the track you are going to sing.
2. Turn on the **Mic** (headphones recommended).
3. Press **Play** (or hit Space).

The live view shows your voice against the notes, so you can see whether you are in tune and on time. The **Help** button on the piece page explains this with pictures.

## Run

```bash
docker run -d --name sight-reading-helper --restart unless-stopped \
  -p 3000:3000 -v sight-reading-helper-data:/app/data \
  -e ADMIN_PASSWORD=choose-a-password \
  ghcr.io/OWNER/REPO:latest
```

or copy `docker-compose.yml` to the server and run `docker compose up -d`.

- App: `http://localhost:3000`, admin page: `/#admin`.
- Without Docker: `node server.js` (Node 18 or newer, no dependencies).
- `ADMIN_PASSWORD` defaults to `password`. Change it.
- Pieces and settings are stored in `/app/data`. Keep that volume, and back it up.

## Language

The interface is available in English (default) and French. An admin switches it on the admin page (`/#admin`); the choice applies to everyone and is saved in `/app/data/settings.json`, so it survives restarts and updates as long as the data volume is kept.

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

## Version

The version shown in the ⓘ bubble next to the title on the main menu comes from `package.json` (injected by `server.js`). Bump it before each deployment so you can tell which build is running.
