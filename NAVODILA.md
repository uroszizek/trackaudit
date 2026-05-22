# TrackAudit — Navodila za začetnike
**by e-laborat** · Korak za korakom

---

## Kaj boš naredil

Postavil boš spletno aplikacijo ki dejansko odpre vsako spletno stran v brskalniku,
preveri kateri tracking skripti so na njej, in pripravi AI analizo.

Na koncu bo aplikacija tekla na internetu na naslovu kot je:
`https://trackaudit.vercel.app`

---

## Kaj potrebuješ

- Računalnik z Windows, Mac ali Linux
- Internetno povezavo
- Račun na [GitHub](https://github.com) (brezplačno)
- Račun na [Vercel](https://vercel.com) (brezplačno)
- Anthropic API ključ (imaš ga — začne se s `sk-ant-...`)

---

## DEL 1 — Namestitev orodij

### Node.js

Node.js je okolje ki poganja JavaScript na tvojem računalniku (ne v brskalniku).

1. Pojdi na https://nodejs.org
2. Klikni na zeleni gumb **"LTS"** (ne Current)
3. Prenesi in namesti kot vsak drug program
4. Po namestitvi odpri terminal in preveri:

```bash
node --version
```
Mora pisati nekaj kot `v20.x.x` ali višje. ✅

```bash
npm --version
```
Mora pisati številko. ✅

> **Kako odpreti terminal?**
> - **Windows**: pritisni `Win + R`, vtipkaj `cmd`, Enter
> - **Mac**: `Cmd + Space`, vtipkaj `Terminal`, Enter

---

### Git

Git je orodje za shranjevanje in deljenje kode.

1. Pojdi na https://git-scm.com/downloads
2. Prenesi in namesti za tvoj sistem
3. Preveri v terminalu:

```bash
git --version
```
Mora pisati `git version 2.x.x` ✅

---

## DEL 2 — Pripravi projekt

### Razpakiraj

1. Prenesi `trackaudit.zip` (datoteka ki si jo dobil)
2. Razpakiraj na mesto kjer imaš projekte, npr:
   - Windows: `C:\Projects\trackaudit\`
   - Mac: `/Users/tvoje-ime/Projects/trackaudit/`

### Odpri terminal v mapi projekta

**Windows:**
1. Odpri mapo `trackaudit` v File Explorerju
2. Drži `Shift` + desni klik na praznem prostoru
3. Klikni "Open PowerShell window here" ali "Open command window here"

**Mac:**
1. Odpri mapo v Finderju
2. Desni klik na mapo → "New Terminal at Folder"

Preveri da si v pravi mapi:
```bash
# Windows
dir
# Mac/Linux
ls
```
Moraš videti datoteke: `package.json`, `README.md`, `api/`, `src/` ✅

---

### Namesti dependencies (knjižnice)

**Korak 1 — Frontend knjižnice (React, Vite):**
```bash
npm install
```
To bo potegnilo ~50MB knjižnic v mapo `node_modules/`. Počakaj da se konča.

**Korak 2 — API knjižnice (Playwright, Anthropic):**
```bash
cd api
npm install
cd ..
```

**Korak 3 — Chromium brskalnik za Playwright:**
```bash
npx playwright install chromium
```
To prenese pravi Chromium brskalnik (~150MB). Počakaj. To je tisto kar bo
odpiralo spletne strani za crawlanje.

> ⏱ Ta korak traja 2-5 minut odvisno od interneta.

---

## DEL 3 — Nastavi API ključ

Aplikacija potrebuje tvoj Anthropic API ključ za AI analizo.

**NIKOLI ne vtipkaj API ključa direktno v kodo!** Uporabljaš environment variable.

**Windows (PowerShell):**
```powershell
$env:ANTHROPIC_API_KEY="sk-ant-tvoj-kljuc-tukaj"
```

**Mac/Linux:**
```bash
export ANTHROPIC_API_KEY="sk-ant-tvoj-kljuc-tukaj"
```

> ⚠️ Ta ukaz velja samo za trenutni terminal. Ko zapreš terminal, ga moraš
> vnesti znova. V DEL 5 (Vercel) ga nastaviš enkrat za vselej.

---

## DEL 4 — Testiraj lokalno

Potrebuješ **dva terminala** odprta hkrati.

### Terminal 1 — Zaženi API server

```bash
node dev-server.js
```

Moraš videti:
```
✅ TrackAudit API running on http://localhost:3001
   POST /api/crawl  →  live crawl endpoint

   Start frontend with: npm run dev
```

**Pusti ta terminal odprt.** Ne zapri ga.

### Terminal 2 — Odpri nov terminal in zaženi frontend

```bash
npm run dev
```

Moraš videti:
```
  VITE v5.x.x  ready in 500ms

  ➜  Local:   http://localhost:5173/
```

### Odpri v brskalniku

Pojdi na: **http://localhost:5173**

Vidiš TrackAudit aplikacijo? ✅

### Testiraj

1. Vtipkaj `https://www.nlb.si` v polje
2. Klikni "Analyze →"
3. Počakaj 15-30 sekund (Playwright odpira pravi brskalnik)
4. Moraš videti rezultate z dejanskimi GTM in GA4 ID-ji

> ⚠️ Če dobiš napako, preveri Terminal 1 — tam se izpisujejo logi.

---

## DEL 5 — Deploy na internet (Vercel)

### Korak 1 — Ustvari GitHub repozitorij

1. Pojdi na https://github.com in se prijavi
2. Klikni zeleni gumb **"New"** (levo zgoraj)
3. Ime repozitorija: `trackaudit`
4. Pusti na **Private** (ne deli kode javno)
5. **Ne** obkljukaj "Initialize with README"
6. Klikni **"Create repository"**

### Korak 2 — Naloži kodo na GitHub

V terminalu (v mapi projekta):

```bash
git init
git add .
git commit -m "TrackAudit MVP"
git branch -M main
git remote add origin https://github.com/TVOJE-GITHUB-IME/trackaudit.git
git push -u origin main
```

> Zamenjaj `TVOJE-GITHUB-IME` s tvojim GitHub uporabniškim imenom!

GitHub te bo vprašal za geslo — vnesi ga.

### Korak 3 — Poveži z Vercel

1. Pojdi na https://vercel.com
2. Klikni **"Sign up"** → izberi **"Continue with GitHub"**
3. Po prijavi klikni **"Add New Project"**
4. Poišči tvoj repozitorij `trackaudit` in klikni **"Import"**
5. Vercel bo samodejno zaznal Vite — pusti vse privzeto
6. **PREDEN klikneš Deploy** — nastavi environment variable:
   - Klikni **"Environment Variables"**
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-tvoj-kljuc-tukaj`
   - Klikni **"Add"**
7. Klikni **"Deploy"**

Počakaj 2-3 minute. Ko je deploy končan, dobiš URL kot je:
`https://trackaudit-tvoje-ime.vercel.app` 🎉

---

## DEL 6 — Posodobitve

Ko boš v prihodnje spremenil kodo, jo objaviš z:

```bash
git add .
git commit -m "Opis spremembe"
git push
```

Vercel avtomatično zazna push in redeploya. V 2 minutah je nova verzija live.

---

## Pogoste napake

**"node is not recognized"**
→ Node.js ni nameščen ali terminal moraš znova zagnati po namestitvi.

**"Cannot find module '@sparticuz/chromium'"**
→ Pozabil si `cd api && npm install && cd ..`

**"ANTHROPIC_API_KEY is not set"**
→ Moraš nastaviti environment variable v terminalu (DEL 3) ali na Vercel (DEL 5).

**Analiza traja >60 sekund in se ne konča**
→ Nekatere strani blokirajo headless brskalnik. Normalno za npr. Cloudflare-zaščitene strani.

**Na Vercel dobim "Function timeout"**
→ Brezplačni Vercel plan ima 10s timeout. Rešitev: nadgradi na Pro (20$) ali
   skrajšaj `waitUntil: "networkidle"` na `"domcontentloaded"` v `api/crawl.js`.

---

## Povzetek ukazov

```bash
# Enkratna namestitev
npm install
cd api && npm install && cd ..
npx playwright install chromium

# Vsak dan ko delaš lokalno (dva terminala)
export ANTHROPIC_API_KEY="sk-ant-..."   # Terminal 1
node dev-server.js                       # Terminal 1
npm run dev                              # Terminal 2

# Objava sprememb
git add . && git commit -m "sprememba" && git push
```

---

*TrackAudit · e-laborat · Uroš Žižek*
