// api/crawl.js v3 — Vercel Serverless Function
// Enaka logika kot audit100/run_audit.js v3
// Stealth, race condition, gcd, Accept/Reject simulacija, deterministični scoring

const Anthropic = require("@anthropic-ai/sdk");
const { createClient } = require("@supabase/supabase-js");

const supabase = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: {} },
    })
  : null;

function makeSharedId() {
  return Math.random().toString(36).substring(2, 10);
}

// ── Tracker vzorci ────────────────────────────────────────────────────────────
const TRACKERS = [
  { name: "GA4",                    p: ["google-analytics.com/g/collect","gtag/js?id=G-","googletagmanager.com/gtag/js?id=G-"] },
  { name: "Google Tag Manager",     p: ["googletagmanager.com/gtm.js","gtm.js?id=GTM-"] },
  { name: "Google Analytics UA",    p: ["google-analytics.com/analytics.js","google-analytics.com/ga.js"] },
  { name: "Hotjar",                 p: ["static.hotjar.com","script.hotjar.com"] },
  { name: "Clarity (Microsoft)",    p: ["clarity.ms/tag","clarity.ms/s/"] },
  { name: "Matomo",                 p: ["matomo.js","piwik.js","/piwik/","/matomo/"] },
  { name: "Gemius",                 p: ["gem.gemius.pl"] },
  { name: "Google Ads",             p: ["googleadservices.com","gtag/js?id=AW-","google.com/pagead"] },
  { name: "Meta Pixel",             p: ["connect.facebook.net/en_US/fbevents.js","connect.facebook.net/signals"] },
  { name: "LinkedIn Insight Tag",   p: ["snap.licdn.com","linkedin.com/li.lms-analytics","platform.linkedin.com/in.js"] },
  { name: "TikTok Pixel",           p: ["analytics.tiktok.com"] },
  { name: "Microsoft UET",          p: ["bat.bing.com/actionp/","bat.bing.com"] },
  { name: "Criteo",                 p: ["static.criteo.net","criteo.com/js/ld/"] },
  { name: "RTB House",              p: ["creativecdn.com","rtbhouse.com"] },
  { name: "Google Consent Mode v2", p: ["ad_user_data","ad_personalization"] },
  { name: "Cookiebot",              p: ["consent.cookiebot.com"] },
  { name: "OneTrust",               p: ["cdn.cookielaw.org","onetrust.com"] },
  { name: "Usercentrics",           p: ["app.usercentrics.eu","privacy-proxy.usercentrics.eu"] },
  { name: "Cookie Information",     p: ["cookieinformation.com"] },
  { name: "Complianz",              p: ["cdn.complianz.io"] },
  { name: "iubenda",                p: ["cs.iubenda.com"] },
  { name: "HubSpot",                p: ["js.hs-scripts.com","js.hsforms.net"] },
  { name: "Intercom",               p: ["widget.intercom.io"] },
  { name: "Google reCAPTCHA",       p: ["google.com/recaptcha/api.js"] },
  { name: "Cloudflare Insights",    p: ["cloudflareinsights.com/beacon"] },
  { name: "Axeptio",                p: ["static.axept.io"] },
  { name: "TrustArc",               p: ["trustarc.com","truste.com"] },
];

// ── CMP DOM selektorji ────────────────────────────────────────────────────────
const CMP_DOM = [
  { name: "Cookiebot",           sel: ["#CybotCookiebotDialog","[data-cookieconsent]"] },
  { name: "OneTrust",            sel: ["#onetrust-banner-sdk",".optanon-alert-box","#onetrust-consent-sdk"] },
  { name: "Usercentrics",        sel: ["#usercentrics-root","[data-testid='uc-banner']"] },
  { name: "Axeptio",             sel: ["#axeptio_overlay",".axeptio_widget"] },
  { name: "Cookie Information",  sel: [".cookie-information-popup","#coiOverlay","#coiConsentBanner"] },
  { name: "Complianz",           sel: [".cmplz-banner","#cmplz-banner-wrapper"] },
  { name: "iubenda",             sel: ["#iubenda-cs-banner",".iubenda-cs-container"] },
  { name: "HubSpot Banner",      sel: ["#hs-eu-cookie-confirmation"] },
  { name: "WP Cookie Notice",    sel: ["#cookie-notice",".cookie-notice-container"] },
  { name: "GDPR Cookie Consent", sel: ["#gdpr-cookie-consent-bar","#cookie-law-info-bar","#wt-cli-privacy-bar"] },
  { name: "Klaro",               sel: ["#klaro",".klaro"] },
  { name: "Custom Cookie Banner", sel: [
    "[class*='cookie-banner']","[id*='cookie-banner']",
    "[class*='cookie-consent']","[id*='cookie-consent']",
    "[class*='cookie-bar']","[id*='cookie-bar']",
    "[class*='piskot']","[id*='piskot']",
    "[class*='gdpr']","[id*='gdpr']",
  ]},
];

// ── CMP URL vzorci ────────────────────────────────────────────────────────────
const CMP_URL_PATTERNS = [
  { name: "Cookiebot",          p: ["consent.cookiebot.com"] },
  { name: "OneTrust",           p: ["cdn.cookielaw.org","onetrust.com"] },
  { name: "Usercentrics",       p: ["app.usercentrics.eu","privacy-proxy.usercentrics.eu"] },
  { name: "Cookie Information", p: ["cookieinformation.com"] },
  { name: "Complianz",          p: ["cdn.complianz.io"] },
  { name: "iubenda",            p: ["cs.iubenda.com"] },
  { name: "HubSpot Banner",     p: ["js.hs-banner.com"] },
  { name: "Axeptio",            p: ["static.axept.io"] },
  { name: "Klaro",              p: ["klaro.kiprotect.com"] },
];

// ── Accept/Reject gumbi ───────────────────────────────────────────────────────
const CMP_BUTTONS = [
  { name: "Cookiebot",
    accept: ["#CybotCookiebotDialogBodyButtonAccept","#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll"],
    reject: ["#CybotCookiebotDialogBodyButtonDecline","#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll"] },
  { name: "OneTrust",
    accept: ["#onetrust-accept-btn-handler",".onetrust-accept-btn-handler"],
    reject: [".onetrust-reject-all-handler","#onetrust-reject-all-handler"] },
  { name: "Usercentrics",
    accept: ["[data-testid='uc-accept-all-button']","#uc-btn-accept-banner"],
    reject: ["[data-testid='uc-deny-all-button']","#uc-btn-deny-banner"] },
  { name: "HubSpot Banner",
    accept: ["#hs-eu-confirmation-button"],
    reject: ["#hs-eu-decline-button"] },
  { name: "WP Cookie Notice",
    accept: ["#cn-accept-cookie"],
    reject: ["#cn-refuse-cookie"] },
  { name: "GDPR Cookie Consent",
    accept: ["#cookie_action_close_header"],
    reject: ["#cookie_action_close_header_reject",".cli-reject-button"] },
  { name: "Klaro",
    accept: [".cm-btn-accept-all","button.cm-btn.cm-btn-success-var"],
    reject: [".cm-btn-decline","button.cm-btn.cm-btn-danger"] },
  { name: "Cookie Information",
    accept: ["#coiAcceptAllBtn","#coiConsentBannerAcceptAll"],
    reject: ["#coiDeclineAllBtn","#coiConsentBannerDeclineAll"] },
  { name: "Complianz",
    accept: [".cmplz-accept"],
    reject: [".cmplz-deny"] },
  { name: "iubenda",
    accept: [".iubenda-cs-accept-btn"],
    reject: [".iubenda-cs-reject-btn"] },
  { name: "Generic",
    accept: [
      "button[id*='accept']","button[class*='accept']",
      "button[id*='agree']","button[class*='agree']",
      "button[id*='allow-all']","button[class*='allow-all']",
      "button[id*='sprejm']","button[class*='sprejm']",
      "button[id*='soglasj']","button[class*='soglasj']",
      "button[id*='dovoli']","button[class*='dovoli']",
      "[data-action='accept']","[data-consent='accept']",
    ],
    reject: [
      "button[id*='reject']","button[class*='reject']",
      "button[id*='decline']","button[class*='decline']",
      "button[id*='deny']","button[class*='deny']",
      "button[id*='zavrn']","button[class*='zavrn']",
      "button[id*='odbi']","button[class*='odbi']",
      "[data-action='reject']","[data-consent='reject']",
    ]},
];

const SL_ACCEPT_TEXT = ["Sprejmi vse","Sprejmi","Sprejmem","Soglašam","Dovoli vse","Strinjam se","Potrdi","Da, strinjam se","Accept all","Accept All","Allow all","I agree","Agree"];
const SL_REJECT_TEXT = ["Zavrni vse","Zavrni","Zavrnem","Ne soglašam","Ne dovolim","Reject all","Reject All","Decline all","Decline","Refuse","No thanks"];

const TRACKING_P = ["_ga","_gid","_fbp","_gcl","li_fat","li_gc","hs_","__hs","_ttp","_uetsid","_uet","criteo","IDE","DSID","_dc_gtm"];
const isTracking = n => TRACKING_P.some(p => n.toLowerCase().includes(p.toLowerCase()));

// ── Deterministični scoring ───────────────────────────────────────────────────
function calcScore(d) {
  let s = 0;
  if (d.hasConsentDefault) {
    s += 8;
    if (d.consentAllDenied)           s += 8;
    if (d.consentBeforeGtm)           s += 5;
    if (d.consentHasWaitForUpdate)    s += 4;
    if ((d.waitForUpdateMs||0) >= 200) s += 3;
    if (d.consentUpdateFired)         s += 5;
  }
  if (d.cmp) {
    s += 12;
    if (d.cmpDomDetected)             s += 4;
    if (d.cmpHasRejectButton)         s += 4;
  } else if (d.hasGenericBanner)      s += 4;
  if ((d.gtmIds||[]).length > 0)      s += 8;
  if ((d.trackers||[]).includes("GA4")) s += 7;
  const tc = (d.trackingCookies||[]).length;
  if (tc === 0)       s += 15;
  else if (tc <= 2)   s += 7;
  if (d.afterAccept?.updateFired)     s += 3;
  if (d.afterAccept?.ga4Active)       s += 2;
  if (d.afterReject?.noNewTracking)   s += 3;
  if (d.afterReject?.ga4Cookieless)   s += 2;
  const adsT = (d.trackers||[]).filter(t =>
    ["Meta Pixel","LinkedIn Insight Tag","Google Ads","TikTok Pixel","Criteo","Microsoft UET"].includes(t)
  );
  if (adsT.length > 0 && !d.cmp)     s -= 5;
  if (d.raceCondition)                s -= 8;
  return Math.max(0, Math.min(100, s));
}

// ── Playwright setup ─────────────────────────────────────────────────────────
async function getPlaywright() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = require("@sparticuz/chromium");
    const pw = require("playwright-core");
    // @sparticuz/chromium v131 — specifični path in args za Vercel
    const execPath = await chromium.executablePath();
    return { pw, launchOpts: {
      args: [
        ...chromium.args,
        "--disable-dev-shm-usage",
        "--no-sandbox",
        "--single-process",
      ],
      executablePath: execPath,
      headless: true,
    }};
  }
  const pw = require("playwright-core");
  return { pw, launchOpts: {
    headless: true,
    args: ["--no-sandbox","--disable-setuid-sandbox","--disable-blink-features=AutomationControlled"],
  }};
}

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
];

async function makeContext(browser, attempt = 0) {
  const ua = USER_AGENTS[attempt % USER_AGENTS.length];
  const ctx = await browser.newContext({
    userAgent: ua,
    viewport: { width: 1366, height: 768 },
    locale: "sl-SI",
    timezoneId: "Europe/Ljubljana",
    extraHTTPHeaders: {
      "Accept-Language": "sl-SI,sl;q=0.9,en;q=0.8",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "sec-ch-ua": '"Chromium";v="124","Google Chrome";v="124"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
    },
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver",  { get: () => undefined });
    Object.defineProperty(navigator, "languages",  { get: () => ["sl-SI","sl","en-US","en"] });
    Object.defineProperty(navigator, "plugins",    { get: () => [1,2,3] });
    window.chrome = { runtime: {}, loadTimes: () => {} };
  });
  return { ctx, page };
}

// ── Glavni crawl ──────────────────────────────────────────────────────────────
async function crawlMain(browser, siteUrl, attempt = 1) {
  const { ctx, page } = await makeContext(browser, attempt);
  const networkRequests = [], scriptUrls = [], ga4Hits = [];

  page.on("request", req => {
    const url = req.url();
    networkRequests.push(url);
    if (req.resourceType() === "script") scriptUrls.push(url);
    if (url.includes("google-analytics.com/g/collect") || url.includes("analytics.google.com/g/collect")) {
      ga4Hits.push(url);
    }
  });

  let loadError = null, finalUrl = siteUrl;
  try {
    await page.goto(siteUrl, { waitUntil: "networkidle", timeout: 28000 });
    finalUrl = page.url();
    const title = await page.title();
    if ((title.includes("Just a moment") || title.includes("Checking")) && attempt < 3) {
      await ctx.close();
      await new Promise(r => setTimeout(r, 4000 + attempt * 2000));
      return await crawlMain(browser, siteUrl, attempt + 1);
    }
  } catch(e) {
    try {
      await page.goto(siteUrl, { waitUntil: "domcontentloaded", timeout: 18000 });
      finalUrl = page.url();
    } catch(e2) { loadError = e2.message.split("\n")[0]; }
  }

  await page.waitForTimeout(4000);

  const rawCookies = await ctx.cookies().catch(() => []);
  const preConsentCookies = rawCookies.map(c => ({
    name: c.name, domain: c.domain,
    expires: c.expires === -1 ? "session" : new Date(c.expires * 1000).toISOString().split("T")[0],
    secure: c.secure, sameSite: c.sameSite || "None",
  }));

  // gcd parser
  let gcdValue = null, gcdAnalysis = null;
  for (const hit of ga4Hits) {
    const m = hit.match(/[?&]gcd=([^&\s]+)/);
    if (m) {
      gcdValue = decodeURIComponent(m[1]);
      const pairs = (gcdValue.match(/\d+([lpqrLP])/g)||[]).map(p => p.slice(-1).toLowerCase());
      const mv = { p:"granted", l:"denied", q:"unset", r:"not_applicable" };
      const vals = pairs.map(c => mv[c]||"?");
      if (vals.length >= 2) {
        gcdAnalysis = {
          raw: gcdValue,
          ad_storage:         vals[0]||"?",
          analytics_storage:  vals[1]||"?",
          ad_user_data:       vals[2]||"?",
          ad_personalization: vals[3]||"?",
        };
      }
      break;
    }
  }

  const pageData = await page.evaluate((cmpDomList) => {
    const scripts   = Array.from(document.querySelectorAll("script[src]")).map(s => s.src);
    const inline    = Array.from(document.querySelectorAll("script:not([src])")).map(s => s.textContent);
    const html      = document.documentElement.innerHTML;

    const gtmIds = [...new Set((html.match(/GTM-[A-Z0-9]+/g)||[]))];
    const ga4Ids = [...new Set((html.match(/G-[A-Z0-9]{8,12}/g)||[]))];

    // Race condition — HTML pozicija
    let consentPos = -1, gtmPos = -1;
    for (const p of ["gtag('consent', 'default'", 'gtag("consent", "default"']) {
      const idx = html.indexOf(p); if (idx !== -1 && (consentPos === -1 || idx < consentPos)) consentPos = idx;
    }
    for (const p of ["googletagmanager.com/gtm.js","(function(w,d,s,l,i){"]) {
      const idx = html.indexOf(p); if (idx !== -1 && (gtmPos === -1 || idx < gtmPos)) gtmPos = idx;
    }
    const raceCondition = consentPos !== -1 && gtmPos !== -1 && consentPos > gtmPos;
    const consentBeforeGtm = consentPos !== -1 && gtmPos !== -1 && consentPos < gtmPos;

    // Consent Mode
    let hasConsentDefault = false, consentValues = null;
    let consentHasWaitForUpdate = false, consentHasRegions = false, waitForUpdateMs = 0;
    for (const s of inline) {
      if (s.includes("consent") && (s.includes("'default'") || s.includes('"default"'))) {
        hasConsentDefault = true;
        if (s.includes("wait_for_update")) {
          consentHasWaitForUpdate = true;
          const wm = s.match(/wait_for_update['"]?\s*:\s*(\d+)/);
          if (wm) waitForUpdateMs = parseInt(wm[1]);
        }
        if (s.includes("regions")) consentHasRegions = true;
        try {
          const params = ["ad_storage","analytics_storage","ad_user_data","ad_personalization","functionality_storage","security_storage"];
          consentValues = {};
          for (const p of params) {
            const m2 = s.match(new RegExp(`['"]?${p}['"]?\\s*:\\s*['"]?(denied|granted)['"]?`));
            if (m2) consentValues[p] = m2[1];
          }
          if (!Object.keys(consentValues).length) consentValues = null;
        } catch(e) {}
        break;
      }
    }

    // dataLayer
    let dataLayerContent = null;
    try { if (window.dataLayer?.length) dataLayerContent = JSON.stringify(window.dataLayer.slice(0,5)).substring(0,1500); } catch(e) {}

    // CMP DOM
    let cmpFromDom = null, cmpDomDetected = false;
    for (const cmp of cmpDomList) {
      for (const sel of cmp.sel) {
        try { if (document.querySelector(sel)) { cmpFromDom = cmp.name; cmpDomDetected = true; break; } } catch(e) {}
      }
      if (cmpFromDom) break;
    }

    const htmlLow = html.toLowerCase();
    const hasGenericBanner = ["cookie-banner","cookie-bar","cookie-notice","cookie-popup","piskot","gdpr-notice"]
      .some(b => htmlLow.includes(b)) || !!(document.querySelector('[class*="cookie"]') || document.querySelector('[id*="cookie"]'));

    const serverSideGtm = scripts.some(s => s.includes("gtm.js") && !s.includes("googletagmanager.com"));
    const implementationMode = hasConsentDefault ? (scripts.some(s => s.includes("gtag/js") || s.includes("gtm.js")) ? "Advanced" : "Basic") : "None";

    const title = document.title;
    const isBlocked = title.includes("Just a moment") || title.includes("Access denied") || title.includes("Attention Required");
    const inlineJoined = inline.join(" ");

    return {
      scripts, gtmIds, ga4Ids, hasConsentDefault, consentValues,
      consentHasWaitForUpdate, consentHasRegions, waitForUpdateMs,
      raceCondition, consentBeforeGtm, implementationMode,
      dataLayerContent, cmpFromDom, cmpDomDetected, hasGenericBanner,
      serverSideGtm, title, isBlocked, inlineJoined,
    };
  }, CMP_DOM).catch(() => ({
    scripts: [], gtmIds: [], ga4Ids: [], hasConsentDefault: false, consentValues: null,
    consentHasWaitForUpdate: false, consentHasRegions: false, waitForUpdateMs: 0,
    raceCondition: false, consentBeforeGtm: false, implementationMode: "None",
    dataLayerContent: null, cmpFromDom: null, cmpDomDetected: false,
    hasGenericBanner: false, serverSideGtm: false, title: "", isBlocked: false, inlineJoined: "",
  }));

  await ctx.close();

  // Tracker detekcija
  const allText = [...networkRequests,...scriptUrls,...pageData.scripts,pageData.inlineJoined,pageData.dataLayerContent||""]
    .join(" ").toLowerCase();
  const detectedTrackers = TRACKERS.filter(t => t.p.some(p => allText.includes(p.toLowerCase()))).map(t => t.name);

  // CMP URL fallback
  let cmp = pageData.cmpFromDom;
  if (!cmp) {
    const urlText = [...networkRequests,...pageData.scripts].join(" ").toLowerCase();
    for (const c of CMP_URL_PATTERNS) {
      if (c.p.some(p => urlText.includes(p))) { cmp = c.name; break; }
    }
  }

  const trackingCookies = preConsentCookies.filter(c => isTracking(c.name));
  const consentAllDenied = pageData.consentValues &&
    ["ad_storage","analytics_storage","ad_user_data","ad_personalization"].every(p => pageData.consentValues[p] === "denied");
  const isBlocked = pageData.isBlocked || (networkRequests.length <= 3 && !loadError && !pageData.title);

  return {
    url: siteUrl, final_url: finalUrl, loadError, blocked: isBlocked,
    gtm_ids: pageData.gtmIds, ga4_ids: pageData.ga4Ids,
    cmp, cmp_dom_detected: pageData.cmpDomDetected,
    has_generic_banner: pageData.hasGenericBanner,
    server_side_gtm: pageData.serverSideGtm,
    has_consent_mode: pageData.hasConsentDefault,
    consent_all_denied: consentAllDenied,
    consent_has_wait_for_update: pageData.consentHasWaitForUpdate,
    wait_for_update_ms: pageData.waitForUpdateMs,
    consent_has_regions: pageData.consentHasRegions,
    consent_values: pageData.consentValues,
    consent_before_gtm: pageData.consentBeforeGtm,
    race_condition: pageData.raceCondition,
    implementation_mode: pageData.implementationMode,
    ga4_hits_count: ga4Hits.length,
    gcd_value: gcdValue,
    gcd_analysis: gcdAnalysis,
    trackers: detectedTrackers,
    pre_consent_cookies: preConsentCookies,
    tracking_cookies_before_consent: trackingCookies,
    total_requests: networkRequests.length,
    script_count: scriptUrls.length,
    page_title: pageData.title,
    datalayer: !!pageData.dataLayerContent,
  };
}

// ── Accept/Reject simulacija ──────────────────────────────────────────────────
async function crawlConsent(browser, siteUrl, mainResult) {
  if (!mainResult.cmp && !mainResult.has_consent_mode && !mainResult.has_generic_banner) {
    return { skipped: true, reason: "No CMP detected" };
  }

  const simulation = { accept: null, reject: null };

  for (const action of ["accept", "reject"]) {
    const { ctx, page } = await makeContext(browser, action === "accept" ? 10 : 11);
    const newRequests = [], newGA4Hits = [];

    // Interceptor za gtag consent update
    await page.addInitScript(() => {
      window.__trackaudit_updates = [];
      const _orig = window.gtag;
      window.gtag = function() {
        if (arguments[0] === "consent" && arguments[1] === "update" && arguments[2]) {
          window.__trackaudit_updates.push(JSON.parse(JSON.stringify(arguments[2])));
        }
        if (_orig) _orig.apply(this, arguments);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(Array.from(arguments));
      };
    });

    page.on("request", req => {
      const url = req.url();
      newRequests.push(url);
      if (url.includes("google-analytics.com/g/collect") || url.includes("analytics.google.com/g/collect")) {
        newGA4Hits.push(url);
      }
    });

    try {
      await page.goto(siteUrl, { waitUntil: "networkidle", timeout: 25000 });
    } catch(e) {
      try { await page.goto(siteUrl, { waitUntil: "domcontentloaded", timeout: 15000 }); }
      catch(e2) { await ctx.close(); simulation[action] = { error: e2.message.split("\n")[0] }; continue; }
    }
    await page.waitForTimeout(2500);

    // Poišči in klikni gumb
    let clicked = false, clickedSelector = null, detectedCmp = null;

    for (const cmpDef of CMP_BUTTONS) {
      const selectors = cmpDef[action];
      for (const sel of selectors) {
        try {
          const btn = await page.$(sel);
          if (btn && await btn.isVisible()) {
            await btn.click(); clicked = true; clickedSelector = sel; detectedCmp = cmpDef.name; break;
          }
        } catch(e) {}
      }
      if (clicked) break;
    }

    // Fallback: Playwright getByRole z besedilom
    if (!clicked) {
      const textList = action === "accept" ? SL_ACCEPT_TEXT : SL_REJECT_TEXT;
      for (const txt of textList) {
        try {
          const loc = page.getByRole("button", { name: txt, exact: false });
          if (await loc.isVisible({ timeout: 500 })) {
            await loc.click(); clicked = true; clickedSelector = `text:${txt}`; detectedCmp = "Text-based"; break;
          }
        } catch(e) {}
        if (clicked) break;
      }
    }

    if (clicked) await page.waitForTimeout(3000);

    // Zajemi update vrednosti
    const afterData = await page.evaluate(() => {
      let updateFired = false, updateValues = null;
      try {
        if (window.__trackaudit_updates?.length > 0) {
          updateFired = true;
          updateValues = Object.assign({}, ...window.__trackaudit_updates);
        }
        if (!updateFired && window.dataLayer) {
          const updates = window.dataLayer.filter(e => Array.isArray(e) && e[0]==="consent" && e[1]==="update");
          if (updates.length > 0) { updateFired = true; updateValues = updates[0][2]||null; }
        }
      } catch(e) {}
      return { updateFired, updateValues };
    }).catch(() => ({ updateFired: false, updateValues: null }));

    const afterCookies = await ctx.cookies().catch(() => []);
    const TRACKING_P2 = ["_ga","_gid","_fbp","_gcl","li_fat","li_gc","_ttp","_uetsid","IDE","DSID"];
    const newTrackingCookies = afterCookies
      .filter(c => TRACKING_P2.some(p => c.name.toLowerCase().includes(p.toLowerCase())))
      .map(c => c.name);

    let gcdAfter = null;
    if (newGA4Hits.length > 0) {
      const gm = newGA4Hits[0].match(/[?&]gcd=([^&]+)/);
      if (gm) gcdAfter = gm[1];
    }

    await ctx.close();
    simulation[action] = {
      clicked, clicked_selector: clickedSelector, cmp_identified: detectedCmp,
      update_fired: afterData.updateFired,
      update_values: afterData.updateValues,
      ga4_hits_after: newGA4Hits.length,
      gcd_after: gcdAfter,
      new_tracking_cookies: newTrackingCookies,
      no_new_tracking: action === "reject" ? newTrackingCookies.length === 0 : null,
      ga4_cookieless: action === "reject" ? (newGA4Hits.length > 0 && !newTrackingCookies.includes("_ga")) : null,
      total_requests_after: newRequests.length,
    };
    await new Promise(r => setTimeout(r, 1000));
  }
  return simulation;
}

// ── AI analiza z Anthropic ────────────────────────────────────────────────────
async function analyzeWithClaude(siteUrl, crawlData, sim) {
  const client = new Anthropic();
  const gcd = crawlData.gcd_analysis;
  const acc = sim?.accept || {};
  const rej = sim?.reject || {};

  const summary = `
URL: ${siteUrl}
Score: ${crawlData._score}
GTM IDs: ${crawlData.gtm_ids?.join(", ")||"ni"}
GA4 IDs: ${crawlData.ga4_ids?.join(", ")||"ni"}
CMP: ${crawlData.cmp||"ni zaznan"}
Has Consent Mode v2: ${crawlData.has_consent_mode}
Consent all denied: ${crawlData.consent_all_denied}
Consent before GTM: ${crawlData.consent_before_gtm}
Race condition: ${crawlData.race_condition}
wait_for_update: ${crawlData.wait_for_update_ms}ms
Implementation: ${crawlData.implementation_mode}
gcd: ${gcd ? `${gcd.raw} → ad=${gcd.ad_storage} analytics=${gcd.analytics_storage}` : "ni"}
Accept simulation: klik=${acc.clicked}, update=${acc.update_fired}, ga4_hits=${acc.ga4_hits_after}
Reject simulation: klik=${rej.clicked}, tracking_pk_po_reject=${rej.new_tracking_cookies?.join(",")||"ni"}
Tracking piškotki pred consentom: ${crawlData.tracking_cookies_before_consent?.map(c=>c.name).join(", ")||"ni"}
Zaznani trackerji: ${crawlData.trackers?.join(", ")||"ni"}
Server-side GTM: ${crawlData.server_side_gtm}
`.trim();

  const resp = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content: `Si strokovnjak za spletno analitiko in GDPR. Analiziraj sledenje za: ${siteUrl}

PODATKI IZ CRAWLA:
${summary}

Vrni SAMO veljaven JSON (brez markdown):
{
  "domain": "example.com",
  "industry": "zaznana industrija",
  "overall_score": ${crawlData._score},
  "category_scores": {
    "Consent & GDPR": 0-100,
    "Analytics": 0-100,
    "Advertising": 0-100,
    "Technical": 0-100
  },
  "summary": "2-3 stavki na podlagi dejanskih podatkov",
  "recommendations": [
    {
      "title": "Kratek naslov",
      "category": "Consent & GDPR",
      "priority": "high|medium|low",
      "detail": "Konkretno priporočilo na podlagi podatkov."
    }
  ]
}` }],
  });

  const text = resp.content.map(b => b.text||"").join("");
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  if (start === -1) throw new Error("No JSON in AI response");
  return JSON.parse(text.slice(start, end + 1));
}

// ── Handler ───────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json"); // Vedno JSON
  if (req.method === "OPTIONS") { res.setHeader("Content-Type", "*/*"); return res.status(200).end(); }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: "URL je obvezen" });

  const siteUrl = url.startsWith("http") ? url : "https://" + url;

  try {
    console.log(`[TrackAudit v3] Crawlam: ${siteUrl}`);
    const { pw, launchOpts } = await getPlaywright();
    const browser = await pw.chromium.launch(launchOpts);

    // Nivo 1: main crawl
    const crawlData = await crawlMain(browser, siteUrl);

    // Deterministični score
    crawlData._score = calcScore({
      hasConsentDefault:     crawlData.has_consent_mode,
      consentAllDenied:      crawlData.consent_all_denied,
      consentBeforeGtm:      crawlData.consent_before_gtm,
      consentHasWaitForUpdate: crawlData.consent_has_wait_for_update,
      waitForUpdateMs:       crawlData.wait_for_update_ms,
      cmp:                   crawlData.cmp,
      cmpDomDetected:        crawlData.cmp_dom_detected,
      hasGenericBanner:      crawlData.has_generic_banner,
      gtmIds:                crawlData.gtm_ids,
      trackers:              crawlData.trackers,
      trackingCookies:       crawlData.tracking_cookies_before_consent,
      raceCondition:         crawlData.race_condition,
    });

    // Nivo 2: consent simulacija
    const sim = await crawlConsent(browser, siteUrl, crawlData);
    await browser.close();

    // Posodobi score z Nivo 2 podatki
    crawlData._score = calcScore({
      hasConsentDefault:     crawlData.has_consent_mode,
      consentAllDenied:      crawlData.consent_all_denied,
      consentBeforeGtm:      crawlData.consent_before_gtm,
      consentHasWaitForUpdate: crawlData.consent_has_wait_for_update,
      waitForUpdateMs:       crawlData.wait_for_update_ms,
      consentUpdateFired:    sim?.accept?.update_fired || false,
      cmp:                   crawlData.cmp,
      cmpDomDetected:        crawlData.cmp_dom_detected,
      cmpHasRejectButton:    sim?.reject?.clicked || false,
      hasGenericBanner:      crawlData.has_generic_banner,
      gtmIds:                crawlData.gtm_ids,
      trackers:              crawlData.trackers,
      trackingCookies:       crawlData.tracking_cookies_before_consent,
      afterAccept:           sim?.accept ? { updateFired: sim.accept.update_fired, ga4Active: sim.accept.ga4_hits_after > 0 } : null,
      afterReject:           sim?.reject ? { noNewTracking: sim.reject.no_new_tracking, ga4Cookieless: sim.reject.ga4_cookieless } : null,
      raceCondition:         crawlData.race_condition,
    });

    // AI analiza
    const analysis = await analyzeWithClaude(siteUrl, crawlData, sim);

    // Sestavi končni odgovor
    const shared_id = makeSharedId();
    const result = {
      ...analysis,
      overall_score: crawlData._score,
      shared_id,
      crawl_meta: {
        gtm_ids:                    crawlData.gtm_ids,
        ga4_ids:                    crawlData.ga4_ids,
        cmp_detected:               crawlData.cmp,
        cmp_dom_detected:           crawlData.cmp_dom_detected,
        has_generic_banner:         crawlData.has_generic_banner,
        consent_mode_in_code:       crawlData.has_consent_mode,
        consent_all_denied:         crawlData.consent_all_denied,
        consent_before_gtm:         crawlData.consent_before_gtm,
        race_condition:             crawlData.race_condition,
        implementation_mode:        crawlData.implementation_mode,
        wait_for_update_ms:         crawlData.wait_for_update_ms,
        consent_has_regions:        crawlData.consent_has_regions,
        consent_mode_values:        crawlData.consent_values,
        gcd_value:                  crawlData.gcd_value,
        gcd_analysis:               crawlData.gcd_analysis,
        server_side_gtm:            crawlData.server_side_gtm,
        datalayer_present:          crawlData.datalayer,
        total_requests:             crawlData.total_requests,
        script_count:               crawlData.script_count,
        pre_consent_cookies:        crawlData.pre_consent_cookies,
        tracking_cookies_before_consent: crawlData.tracking_cookies_before_consent,
        consent_simulation:         sim,
      },
      trackers: TRACKERS.map(tr => ({
        name: tr.name,
        status: (crawlData.trackers||[]).includes(tr.name) ? "detected" : "missing",
      })),
    };

    // Shrani v Supabase (await — save-email ga potrebuje takoj zatem)
    if (supabase) {
      const { error: dbErr } = await supabase.from("audit_results").insert({
        url: siteUrl, score: crawlData._score,
        report_data: result, shared_id,
      });
      if (dbErr) console.error("[Supabase]", dbErr.message);
      else console.log("[Supabase] Shranjeno:", shared_id);
    }

    console.log(`[TrackAudit v3] Končano. Score: ${crawlData._score} | ID: ${shared_id}`);
    return res.status(200).json(result);

  } catch(err) {
    console.error("[TrackAudit v3] Napaka:", err.message);
    return res.status(500).json({ error: "Crawl failed", detail: err.message });
  }
};
