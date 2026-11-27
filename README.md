# Sight Reading Helper

Sight-reading trainer for choir singers. Load a MIDI score, mute or turn down the other parts, sing your own part into the microphone and get live pitch and timing feedback, plus a list of the bars to work on. Admins upload and label the pieces; everyone else just practises.

Open source, released under the MIT licence.

## How it works

1. Tick **Me** on the track you are going to sing.
2. Turn on the **Mic** (headphones recommended).
3. Press **Play** (or hit Space).

The live view shows your voice against the notes, so you can see whether you are in tune and on time. The **Help** button on the piece page explains this with pictures.

## Pitch detection

Everything runs in the browser (YIN-style detector, nothing is sent to the server). Some vowels can fool a detector by about a tone. When the detected pitch is slightly off the expected note, the app checks whether the expected note explains the spectrum clearly better (a clear series of harmonics on that note); only then it reports the expected note, with its real small deviation. A really wrong note is never turned into a right one.

## Mixer modes

The dropdown next to the Mic button sets the mixer in one go. You can still change volumes, mutes and solos by hand afterwards.

- **Normal mode**: everything unmuted at 100%.
- **Focus on my part**: the "Me" track at 150%, every other track at 30%.
- **Accompaniment only**: choir tracks muted.
- **Choir only**: everything except the choir tracks muted.

Choir tracks are recognised by their label (or MIDI name): Soprano, Alto, Tenor, Bass and their usual variants, or any track whose default instrument is Choir.

## Settings

The cogwheel button on the piece page opens the personal settings, stored in your browser:

- **My voice** (Soprano, Alto, Tenor or Bass): the matching track is ticked as "Me" when you open a piece. Tracks are matched by their label (then their MIDI name), so labels such as "Soprano 1", "Alto", "Tenor", "Basse" or "B" work.
- **Count-in**: one bar of clicks before the music starts.
- **Latency**: the delay between what you sing and what the app detects. Type a value, or run the latency test: with headphones on, sing a short "ta" on each of the ten clicks and the app sets the value for you.

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
