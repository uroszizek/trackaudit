# TrackAudit — Website Tracking Checker
**by e-laborat** · Live Playwright crawl + AI analysis

---

## Lokalno testiranje

### 1. Instaliraj dependencies

```bash
# Frontend
npm install

# API (Playwright + Anthropic)
cd api && npm install && cd ..

# Playwright browser
npx playwright install chromium
```

### 2. Nastavi environment variable

```bash
# .env.local (za Vite frontend — ni potrebno, API je server-side)
# Za dev-server.js nastavi v terminalu:
export ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Zaženi lokalno

**Terminal 1 — API server:**
```bash
ANTHROPIC_API_KEY=sk-ant-... node dev-server.js
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

Odpri: http://localhost:5173

---

## Deploy na Vercel

### 1. Push na GitHub
```bash
git init
git add .
git commit -m "Initial TrackAudit"
git remote add origin https://github.com/TVOJ-USERNAME/trackaudit.git
git push -u origin main
```

### 2. Poveži z Vercel
1. Pojdi na https://vercel.com
2. "Add New Project" → izberi tvoj GitHub repo
3. Framework: **Vite**
4. Root directory: `/` (privzeto)

### 3. Nastavi environment variable na Vercel
V Vercel dashboardu → Settings → Environment Variables:
```
ANTHROPIC_API_KEY = sk-ant-...
```

### 4. Deploy
Vercel avtomatično deploya ob vsakem git push.

---

## Struktura projekta

```
trackaudit/
├── api/
│   ├── crawl.js          ← Vercel serverless funkcija (Playwright + Claude)
│   └── package.json      ← API dependencies
├── src/
│   ├── App.jsx           ← React frontend
│   └── main.jsx          ← Entry point
├── index.html
├── package.json          ← Frontend dependencies
├── vite.config.js        ← Vite + proxy na :3001 za lokalni dev
├── vercel.json           ← Vercel konfiguracija
└── dev-server.js         ← Lokalni API server za testiranje
```

---

## Kaj crawla

- **GTM container IDs** (GTM-XXXXXX)
- **GA4 Measurement IDs** (G-XXXXXXXXXX)
- **Consent Mode v2** — ali je default state v kodi
- **CMP** — Cookiebot, OneTrust, Usercentrics, Axeptio
- **Vsi tracker skripti** — Meta Pixel, LinkedIn, HubSpot, TikTok, Hotjar, Clarity
- **Network requests** — vsi HTTP klici med nalaganjem
- **dataLayer** — vsebina ob nalaganju
- **Piškotki** — seznam ob nalaganju

---

## Naslednji koraki (V2)

- [ ] Paywall — 49 EUR za PDF poročilo (Stripe)
- [ ] PDF export z brandingom e-laborat
- [ ] Email capture pred plačilom
- [ ] Vprašalnik po plačilu
- [ ] Zgodovinske analize (PostgreSQL)
- [ ] Shareable UUID report links
