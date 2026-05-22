import { useState, useEffect, useRef } from "react";

// ── i18n translations ─────────────────────────────────────────────────────────
const T = {
  en: {
    scoreLabels: ["Good", "Needs work", "Critical"],
    steps: ["Launching browser","Loading page","Capturing network requests","Detecting trackers","Analysing cookies","Generating AI report"],
    reportReady: "Your report is ready",
    reportReadySub: (domain) => `We've completed the tracking audit for`,
    emailPrompt: "Enter your email to view the full report.",
    emailPlaceholder: "you@company.com",
    viewReport: "View report →",
    noSpam: "No spam. Your data is safe with us.",
    heroTitle1: "Check your website",
    heroTitle2: "tracking health",
    heroSub: "Live Playwright crawl. Detects GTM, GA4, Consent Mode v2, cookies and pixels in real time.",
    checkBtn: "Check →",
    scanning: "Scanning…",
    tryLabel: "Try:",
    liveData: "Live crawl data",
    trackers: "Detected trackers",
    consentMode: "Consent Mode v2",
    preConsent: "Cookies before consent",
    noPreConsent: "No cookies set before consent interaction",
    trackingWarning: "Tracking cookies set BEFORE user consent — potential GDPR violation",
    recommendations: "Recommendations",
    checklist: {
      consentMode: "Consent Mode v2",
      serverSide: "Server-side Tracking",
      performance: "Tracking Performance",
      pixel: "Pixel Presence",
      cmp: "CMP (Cookie Banner)",
      enhanced: "Enhanced Conversions",
      metaCapi: "Meta CAPI",
    },
    checklistDetails: {
      consentOk: d.consentOk,
      consentWarn: d.consentWarn,
      consentFail: d.consentFail,
      serverOk: d.serverOk,
      serverFail: "GTM is loaded from googletagmanager.com — no server-side setup detected. Server-side tracking improves data accuracy and bypasses adblockers.",
      pixelOk: d.pixelOk,
      pixelFail: (n, names) => `${n} tracking cookie(s) set before consent: ${names}`,
      cmpOk: (name) => `Cookie Management Platform detected: ${name}`,
      cmpFail: d.cmpFail,
      enhancedFail: d.enhancedFail,
      metaFail: d.metaFail,
    },
    crawlMeta: ["GTM Container","GA4 ID","CMP","Consent Mode v2","dataLayer","Network requests","Scripts loaded"],
    crawlValues: { yes: "✓ In code", no: "✗ Not found", present: "✓ Present", missing: "✗ Missing" },
    trackerStatus: { detected: "Active", partial: "Partial", missing: "Not found" },
    cookieHeaders: ["Cookie name","Provider","Category","Lifetime"],
    cookieType: { tracking: "Tracking", functional: "Functional" },
    consentHeaders: ["Parameter","Before Accept","After Accept"],
    consentAfter: "After click",
    consentUnknown: "Unknown",
    ctaTitle: "Want to fix the issues?",
    ctaSub: "e-laborat will prepare an implementation plan and ensure proper tracking setup.",
    ctaBtn: "Contact us →",
    footer: (date) => `Live Playwright crawl · ${date} · e-laborat.si`,
    recPriority: { high: "High priority", medium: "Medium priority", low: "Low priority" },
  },
  sl: {
    scoreLabels: ["Dobro", "Potrebuje delo", "Kritično"],
    steps: ["Zaganjanje brskalnika","Nalaganje strani","Zajem omrežnih zahtevkov","Zaznavanje sledilnikov","Analiza piškotkov","Generiranje AI poročila"],
    reportReady: "Vaše poročilo je pripravljeno",
    reportReadySub: (domain) => `Zaključili smo tracking revizijo za`,
    emailPrompt: "Vnesite e-mail naslov za ogled celotnega poročila.",
    emailPlaceholder: "vas@podjetje.si",
    viewReport: "Prikaži poročilo →",
    noSpam: "Brez neželene pošte. Vaši podatki so varni.",
    heroTitle1: "Preverite zdravje",
    heroTitle2: "sledenja na vaši spletni strani",
    heroSub: "Live Playwright crawl. Zazna GTM, GA4, Consent Mode v2, piškotke in piksle v realnem času.",
    checkBtn: "Preveri →",
    scanning: "Skeniranje…",
    tryLabel: "Preizkusi:",
    liveData: "Podatki live crawla",
    trackers: "Zaznani sledilniki",
    consentMode: "Consent Mode v2",
    preConsent: "Piškotki pred consentom",
    noPreConsent: "Ni piškotkov nastavljenih pred consentom",
    trackingWarning: "Tracking piškotki nastavljeni PRED privolitvijo — potencialna kršitev GDPR",
    recommendations: "Priporočena dejanja",
    checklist: {
      consentMode: "Consent Mode v2",
      serverSide: "Strežniško sledenje",
      performance: "Zmogljivost sledenja",
      pixel: "Prisotnost pikslov",
      cmp: "CMP (baner za piškotke)",
      enhanced: "Izboljšane konverzije",
      metaCapi: "Meta CAPI",
    },
    checklistDetails: {
      consentOk: "Pravilno implementirano — vsi consent parametri so privzeto nastavljeni na 'denied'.",
      consentWarn: "Consent Mode v2 je v kodi, a niso vsi parametri nastavljeni na 'denied'. Preverite ad_user_data in ad_personalization.",
      consentFail: "Consent mode manjka ali je nepopoln. Vseh 6 parametrov mora biti privzeto 'denied' za EU obiskovalce.",
      serverOk: "Zaznan strežniški GTM. Podatki gredo čez vaš strežnik — boljša natančnost in obhod ad blockerjev.",
      serverFail: "GTM se nalaga z googletagmanager.com — ni strežniškega sledenja. Strežniško sledenje izboljša natančnost podatkov.",
      pixelOk: "Nobeden trženjski piksel ne požge pred privolitvijo uporabnika.",
      pixelFail: (n, names) => `${n} tracking piškotek/i nastavljeni pred consentom: ${names}`,
      cmpOk: (name) => `Zaznan sistem za upravljanje soglasij (CMP): ${name}`,
      cmpFail: "Ni zaznanega CMP. Certificiran baner za piškotke je obvezen za skladnost z GDPR.",
      enhancedFail: "Izboljšane konverzije niso zaznane. Ta Google Ads funkcija izboljša merjenje konverzij s hashiranimi podatki.",
      metaFail: "Ni zaznanih znakov Meta Conversions API. Strežniški Meta eventi izboljšajo kakovost ujemanja.",
    },
    crawlMeta: ["GTM vsebnik","GA4 ID","CMP","Consent Mode v2","dataLayer","Omrežne zahteve","Naloženi skripti"],
    crawlValues: { yes: "✓ V kodi", no: "✗ Ni najden", present: "✓ Prisoten", missing: "✗ Manjka" },
    trackerStatus: { detected: "Aktiven", partial: "Delen", missing: "Ni najden" },
    cookieHeaders: ["Ime piškotka","Ponudnik","Kategorija","Veljavnost"],
    cookieType: { tracking: "Sledenje", functional: "Funkcionalen" },
    consentHeaders: ["Parameter","Pred sprejemom","Po sprejemu"],
    consentAfter: "Po kliku",
    consentUnknown: "Neznano",
    ctaTitle: "Želite odpraviti težave?",
    ctaSub: "e-laborat pripravi implementacijski načrt in poskrbi za pravilno postavitev sledenja.",
    ctaBtn: "Kontaktirajte nas →",
    footer: (date) => `Live Playwright crawl · ${date} · e-laborat.si`,
    recPriority: { high: "Visoka prioriteta", medium: "Srednja prioriteta", low: "Nizka prioriteta" },
  },
};

// ── helpers ──────────────────────────────────────────────────────────────────
const scoreColor = s => s >= 70 ? "#16a34a" : s >= 40 ? "#d97706" : "#dc2626";
const scoreBg    = s => s >= 70 ? "#f0fdf4" : s >= 40 ? "#fffbeb" : "#fef2f2";

// ── Progress ──────────────────────────────────────────────────────────────────
const STEPS_EN = [
  { label: "Launching browser",          pct: 12 },
  { label: "Loading page",               pct: 28 },
  { label: "Capturing network requests", pct: 48 },
  { label: "Detecting trackers",         pct: 65 },
  { label: "Analysing cookies",          pct: 80 },
  { label: "Generating AI report",       pct: 95 },
];

function ProgressBar({ active, lang }) {
  const [pct, setPct]         = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const timer = useRef(null);
  const STEPS = STEPS_EN.map((s,i) => ({ ...s, label: T[lang].steps[i] }));

  useEffect(() => {
    if (!active) { setPct(0); setStepIdx(0); return; }
    let i = 0;
    const tick = () => {
      if (i >= STEPS.length) return;
      setStepIdx(i); setPct(STEPS[i].pct); i++;
      timer.current = setTimeout(tick, i === 1 ? 500 : i >= STEPS.length ? 9000 : 3200);
    };
    tick();
    return () => clearTimeout(timer.current);
  }, [active, lang]);

  if (!active) return null;
  return (
    <div style={{ margin:"28px 0 0", padding:"24px 28px", background:"#fff", borderRadius:16, border:"1px solid #e5e7eb", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
        <span style={{ fontSize:14, fontWeight:600, color:"#111827" }}>{STEPS[stepIdx]?.label}…</span>
        <span style={{ fontSize:13, color:"#6b7280", fontFamily:"monospace" }}>{pct}%</span>
      </div>
      <div style={{ height:8, background:"#f3f4f6", borderRadius:99, overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:99, background:"linear-gradient(90deg,#f97316,#fb923c)", width:`${pct}%`, transition:"width 0.9s cubic-bezier(.4,0,.2,1)" }} />
      </div>
      <div style={{ marginTop:14, display:"flex", gap:6, flexWrap:"wrap" }}>
        {STEPS.map((s,i) => (
          <span key={i} style={{ fontSize:11, color: i<=stepIdx ? "#f97316":"#d1d5db", display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background: i<stepIdx?"#f97316":i===stepIdx?"#f97316":"#e5e7eb", display:"inline-block", flexShrink:0 }} />
            {s.label}{i<STEPS.length-1 && <span style={{color:"#e5e7eb",marginLeft:2}}>·</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Email gate ────────────────────────────────────────────────────────────────
function EmailGate({ domain, onSubmit, lang }) {
  const [email, setEmail] = useState("");
  const [err,   setErr]   = useState("");
  const t = T[lang];
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div style={{ margin:"32px 0 0", padding:"40px 32px", background:"#fff", borderRadius:16, border:"1px solid #e5e7eb", boxShadow:"0 4px 24px rgba(0,0,0,0.08)", textAlign:"center" }}>
      <div style={{ width:56, height:56, borderRadius:16, background:"linear-gradient(135deg,#fff7ed,#fed7aa)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, margin:"0 auto 16px" }}>📊</div>
      <h3 style={{ margin:"0 0 8px", fontSize:20, fontWeight:700, color:"#111827" }}>{t.reportReady}</h3>
      <p style={{ margin:"0 0 8px", fontSize:14, color:"#6b7280", lineHeight:1.6 }}>
        {t.reportReadySub(domain)} <strong>{domain}</strong>.
      </p>
      <p style={{ margin:"0 0 28px", fontSize:14, color:"#6b7280" }}>{t.emailPrompt}</p>
      <div style={{ display:"flex", gap:8, maxWidth:420, margin:"0 auto" }}>
        <input value={email} onChange={e=>{setEmail(e.target.value);setErr("");}}
          onKeyDown={e=>e.key==="Enter"&&valid&&onSubmit(email)}
          placeholder={t.emailPlaceholder}
          style={{ flex:1, padding:"12px 16px", borderRadius:10, border:`1.5px solid ${err?"#dc2626":"#e5e7eb"}`, fontSize:14, outline:"none", color:"#111827", background:"#fafafa" }} />
        <button onClick={()=>{ if(!valid){setErr(lang==="sl"?"Prosimo vnesite veljaven e-mail naslov.":"Please enter a valid email.");return;} onSubmit(email); }}
          style={{ padding:"12px 22px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#f97316,#ea580c)", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
          {t.viewReport}
        </button>
      </div>
      {err && <div style={{ marginTop:8, fontSize:12, color:"#dc2626" }}>{err}</div>}
      <div style={{ marginTop:12, fontSize:11, color:"#9ca3af" }}>{t.noSpam}</div>
    </div>
  );
}

// ── Score circle ──────────────────────────────────────────────────────────────
function ScoreCircle({ score, lang }) {
  const t = T[lang];
  const scoreLabel = s => t.scoreLabels[s >= 70 ? 0 : s >= 40 ? 1 : 2];
  const r=52, circ=2*Math.PI*r, color=scoreColor(score);
  return (
    <div style={{ position:"relative", width:140, height:140, flexShrink:0 }}>
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10"/>
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${(score/100)*circ} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 60 60)" style={{transition:"stroke-dasharray 1.2s ease"}}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontSize:30, fontWeight:800, color, fontFamily:"monospace", lineHeight:1 }}>{score}</span>
        <span style={{ fontSize:10, color:"#9ca3af" }}>/100</span>
        <span style={{ marginTop:4, fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:99, background:scoreBg(score), color }}>{scoreLabel(score)}</span>
      </div>
    </div>
  );
}

// ── Obsidian-style checklist row ──────────────────────────────────────────────
function CheckRow({ label, pts, maxPts, status, detail }) {
  const [open, setOpen] = useState(false);
  // status: 'ok' | 'warn' | 'fail'
  const cfg = {
    ok:   { icon:"✓", color:"#16a34a", bg:"#f0fdf4", border:"#bbf7d0" },
    warn: { icon:"⚠", color:"#d97706", bg:"#fffbeb", border:"#fde68a" },
    fail: { icon:"✗", color:"#dc2626", bg:"#fef2f2", border:"#fecaca" },
  }[status] || { icon:"–", color:"#9ca3af", bg:"#f9fafb", border:"#e5e7eb" };

  return (
    <div style={{ borderBottom:"1px solid #f3f4f6" }}>
      <div onClick={()=>detail&&setOpen(!open)} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 20px", cursor:detail?"pointer":"default", background:open?"#fafafa":"#fff", transition:"background 0.1s" }}>
        <div style={{ width:28, height:28, borderRadius:8, background:cfg.bg, border:`1px solid ${cfg.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:cfg.color, flexShrink:0 }}>
          {cfg.icon}
        </div>
        <div style={{ flex:1 }}>
          <span style={{ fontSize:14, fontWeight:500, color:"#111827" }}>{label}</span>
        </div>
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <span style={{ fontSize:13, fontWeight:700, color:cfg.color, fontFamily:"monospace" }}>{pts}/{maxPts} pts</span>
        </div>
        {detail && <span style={{ color:"#9ca3af", fontSize:14, transform:open?"rotate(180deg)":"none", transition:"transform 0.2s" }}>▾</span>}
      </div>
      {open && detail && (
        <div style={{ padding:"0 20px 16px 60px", fontSize:13, color:"#4b5563", lineHeight:1.75, background:"#fafafa" }}>{detail}</div>
      )}
    </div>
  );
}

// ── Consent Mode deep table ───────────────────────────────────────────────────
function ConsentModeTable({ values, meta, lang }) {
  const params = ["ad_storage","analytics_storage","ad_user_data","ad_personalization","functionality_storage","security_storage"];
  const getVal = (p) => {
    if (!values) return null;
    return values[p] || null;
  };
  const StatusPill = ({val}) => {
    if (!val) return <span style={{fontSize:11,padding:"2px 8px",borderRadius:99,background:"#f3f4f6",color:"#9ca3af"}}>{T[lang].consentUnknown}</span>;
    const ok = val==="denied";
    return <span style={{fontSize:11,padding:"2px 8px",borderRadius:99,background:ok?"#f0fdf4":"#fef2f2",color:ok?"#16a34a":"#dc2626",fontWeight:600}}>{val}</span>;
  };

  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
        <thead>
          <tr style={{ background:"#f9fafb" }}>
            <th style={{ padding:"10px 14px", textAlign:"left", color:"#6b7280", fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.5 }}>Parameter</th>
            <th style={{ padding:"10px 14px", textAlign:"center", color:"#6b7280", fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.5 }}>{T[lang].consentHeaders[1]}</th>
            <th style={{ padding:"10px 14px", textAlign:"center", color:"#6b7280", fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.5 }}>{T[lang].consentHeaders[2]}</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p,i) => (
            <tr key={p} style={{ borderTop:"1px solid #f3f4f6", background: i%2===0?"#fff":"#fafafa" }}>
              <td style={{ padding:"10px 14px", fontFamily:"monospace", fontSize:12, color:"#374151" }}>{p}</td>
              <td style={{ padding:"10px 14px", textAlign:"center" }}><StatusPill val={getVal(p)} /></td>
              <td style={{ padding:"10px 14px", textAlign:"center" }}>
                <span style={{fontSize:11,padding:"2px 8px",borderRadius:99,background:"#f3f4f6",color:"#9ca3af"}}>{T[lang].consentAfter}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {values?.wait_for_update && (
        <div style={{ padding:"10px 14px", fontSize:12, color:"#6b7280", borderTop:"1px solid #f3f4f6" }}>
          <code style={{background:"#f3f4f6",padding:"2px 6px",borderRadius:4}}>wait_for_update: {values.wait_for_update}</code>
          {values.regions && <code style={{background:"#f3f4f6",padding:"2px 6px",borderRadius:4,marginLeft:8}}>regions: {JSON.stringify(values.regions).substring(0,60)}</code>}
        </div>
      )}
    </div>
  );
}

// ── Tracker table (Obsidian style) ────────────────────────────────────────────
const TRACKER_META = {
  "Google Tag Manager":      { icon:"📦", category:"Tag Management" },
  "GA4":                     { icon:"📈", category:"Analytics" },
  "Google Ads":              { icon:"📢", category:"Advertising" },
  "Meta Pixel":              { icon:"🎯", category:"Advertising" },
  "LinkedIn Insight Tag":    { icon:"💼", category:"Advertising" },
  "HubSpot":                 { icon:"🟠", category:"Marketing" },
  "HubSpot Ads Pixel":       { icon:"🟠", category:"Advertising" },
  "HubSpot Collected Forms": { icon:"🟠", category:"Marketing" },
  "TikTok Pixel":            { icon:"🎵", category:"Advertising" },
  "Hotjar":                  { icon:"🔥", category:"Analytics" },
  "Clarity (Microsoft)":     { icon:"🔷", category:"Analytics" },
  "Google Consent Mode v2":  { icon:"🛡", category:"Consent" },
  "Cookiebot":               { icon:"🍪", category:"CMP" },
  "OneTrust":                { icon:"🍪", category:"CMP" },
  "Usercentrics":            { icon:"🍪", category:"CMP" },
  "Google reCAPTCHA":        { icon:"🤖", category:"Security" },
};

function TrackerTable({ trackers, lang }) {
  const tStatus = T[lang].trackerStatus;
  const statusCfg = {
    detected: { label:tStatus.detected, color:"#16a34a", bg:"#f0fdf4" },
    partial:  { label:tStatus.partial,  color:"#d97706", bg:"#fffbeb" },
    missing:  { label:tStatus.missing,  color:"#9ca3af", bg:"#f9fafb" },
  };
  const visible = trackers.filter(t => t.status !== "missing" || ["GA4","Google Tag Manager","Google Consent Mode v2","Meta Pixel"].includes(t.name));
  return (
    <table style={{ width:"100%", borderCollapse:"collapse" }}>
      <thead>
        <tr style={{ background:"#f9fafb", borderBottom:"1px solid #e5e7eb" }}>
          {["Platform","Category","Status"].map(h=>(
            <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, color:"#9ca3af", fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {visible.map((t,i) => {
          const meta = TRACKER_META[t.name] || { icon:"🔌", category:"Other" };
          const sc = statusCfg[t.status] || statusCfg.missing;
          return (
            <tr key={i} style={{ borderBottom:"1px solid #f3f4f6", background: i%2===0?"#fff":"#fafafa" }}>
              <td style={{ padding:"12px 14px" }}>
                <span style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:16 }}>{meta.icon}</span>
                  <span style={{ fontSize:14, fontWeight:500, color:"#111827" }}>{t.name}</span>
                </span>
              </td>
              <td style={{ padding:"12px 14px", fontSize:13, color:"#6b7280" }}>{meta.category}</td>
              <td style={{ padding:"12px 14px" }}>
                <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:99, background:sc.bg, color:sc.color }}>{sc.label}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Cookie table ──────────────────────────────────────────────────────────────
const TRACKING_NAMES = ["_ga","_gid","_fbp","_gcl","hubspot","hs_","__hs","_uetsid","li_","ttclid","_ttp","ads","pixel"];
const isTracking = n => TRACKING_NAMES.some(t => n.toLowerCase().includes(t));

function CookieTable({ cookies, lang }) {
  if (!cookies?.length) return (
    <div style={{ padding:"20px", color:"#16a34a", fontSize:14, display:"flex", alignItems:"center", gap:8 }}>
      <span style={{ fontSize:18 }}>✓</span> {T[lang].noPreConsent}
    </div>
  );
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ background:"#f9fafb", borderBottom:"1px solid #e5e7eb" }}>
            {T[lang].cookieHeaders.map(h=>(
              <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, color:"#9ca3af", fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cookies.map((c,i) => {
            const track = isTracking(c.name);
            return (
              <tr key={i} style={{ borderBottom:"1px solid #f3f4f6", background: track?"#fef9f9": i%2===0?"#fff":"#fafafa" }}>
                <td style={{ padding:"11px 14px", fontFamily:"monospace", fontSize:12, color: track?"#dc2626":"#111827", fontWeight: track?600:400 }}>
                  {track && <span style={{marginRight:5}}>⚠</span>}{c.name}
                </td>
                <td style={{ padding:"11px 14px", fontSize:12, color:"#6b7280" }}>{c.domain}</td>
                <td style={{ padding:"11px 14px" }}>
                  {track
                    ? <span style={{ fontSize:11, padding:"2px 8px", borderRadius:99, background:"#fef2f2", color:"#dc2626", fontWeight:600 }}>{T[lang].cookieType.tracking}</span>
                    : <span style={{ fontSize:11, padding:"2px 8px", borderRadius:99, background:"#f9fafb", color:"#9ca3af" }}>{T[lang].cookieType.functional}</span>}
                </td>
                <td style={{ padding:"11px 14px", fontSize:12, color:"#6b7280", fontFamily:"monospace" }}>{c.expires}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {cookies.some(c=>isTracking(c.name)) && (
        <div style={{ padding:"12px 16px", background:"#fef2f2", borderTop:"1px solid #fecaca", fontSize:12, color:"#dc2626" }}>
          ⚠ {T[lang].trackingWarning}
        </div>
      )}
    </div>
  );
}

// ── Recommendation card ───────────────────────────────────────────────────────
function RecCard({ item, index, lang }) {
  const [open, setOpen] = useState(false);
  const rp = T[lang].recPriority;
  const cfg = {
    high:   { label:rp.high,   color:"#dc2626", bg:"#fef2f2" },
    medium: { label:rp.medium, color:"#d97706", bg:"#fffbeb" },
    low:    { label:rp.low,    color:"#16a34a", bg:"#f0fdf4" },
  }[item.priority] || { label:rp.medium, color:"#d97706", bg:"#fffbeb" };

  return (
    <div style={{ borderBottom:"1px solid #f3f4f6" }}>
      <div onClick={()=>setOpen(!open)} style={{ display:"flex", gap:14, padding:"18px 20px", cursor:"pointer", background:open?"#fafafa":"#fff" }}>
        <span style={{ fontSize:13, fontWeight:700, color:"#d1d5db", minWidth:24, paddingTop:1 }}>{index+1}.</span>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", gap:8, marginBottom:5, flexWrap:"wrap" }}>
            <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:99, background:cfg.bg, color:cfg.color }}>{cfg.label}</span>
            <span style={{ fontSize:11, color:"#9ca3af" }}>{item.category}</span>
          </div>
          <div style={{ fontSize:14, fontWeight:600, color:"#111827", lineHeight:1.4 }}>{item.title}</div>
        </div>
        <span style={{ color:"#9ca3af", fontSize:14, flexShrink:0, paddingTop:2, transform:open?"rotate(180deg)":"none", transition:"transform 0.2s" }}>▾</span>
      </div>
      {open && (
        <div style={{ padding:"0 20px 18px 56px", fontSize:13, color:"#4b5563", lineHeight:1.75, background:"#fafafa" }}>{item.detail}</div>
      )}
    </div>
  );
}

function Card({ children, style={} }) {
  return <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e7eb", boxShadow:"0 1px 8px rgba(0,0,0,0.04)", marginBottom:20, overflow:"hidden", ...style }}>{children}</div>;
}

function CardHeader({ emoji, title, count, right }) {
  return (
    <div style={{ padding:"18px 20px 14px", borderBottom:"1px solid #f3f4f6", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:18 }}>{emoji}</span>
        <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:"#111827" }}>
          {title}{count!==undefined && <span style={{ marginLeft:6, fontSize:13, color:"#9ca3af", fontWeight:400 }}>({count})</span>}
        </h3>
      </div>
      {right}
    </div>
  );
}


// ── Share Button ──────────────────────────────────────────────────────────────
function ShareButton({ sharedId, lang }) {
  const [copied, setCopied] = useState(false);
  if (!sharedId) return null;
  const url = `${window.location.origin}/report/${sharedId}`;
  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} style={{
      display:"flex", alignItems:"center", gap:6,
      padding:"8px 14px", background:"#f9fafb", border:"1px solid #e8eaf0",
      borderRadius:10, fontSize:12, fontWeight:600, color:"#374151",
      cursor:"pointer", transition:"all .15s"
    }}>
      {copied ? "✓ Kopirano!" : "↗ Deli poročilo"}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [url,        setUrl]        = useState("");
  const [loading,    setLoading]    = useState(false);
  const [rawResult,  setRawResult]  = useState(null);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState("");
  const [emailDone,  setEmailDone]  = useState(false);
  const [lang,       setLang]       = useState("sl");
  const t = T[lang];

  const analyze = async () => {
    if (!url.trim()) return;
    setLoading(true); setResult(null); setRawResult(null); setError(""); setEmailDone(false);
    const siteUrl = url.startsWith("http") ? url.trim() : "https://" + url.trim();
    try {
      const res  = await fetch("/api/crawl", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({url:siteUrl}) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Crawl failed");
      setRawResult(data);
    } catch(e) { setError(`Error: ${e.message}`); }
    setLoading(false);
  };

  const handleEmail = async (em) => {
    setEmailDone(true);
    setResult(rawResult);
    // Pošlji email čez API
    if (rawResult?.shared_id) {
      try {
        await fetch("/api/save-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: em, shared_id: rawResult.shared_id }),
        });
      } catch(e) { console.error("Email napaka:", e); }
    }
  };

  // Build Obsidian-style checklist from result
  const buildChecklist = (r, lang) => {
    const t = T[lang];
    const d = t.checklistDetails;
    const ck = t.checklist;
    if (!r) return [];
    const meta = r.crawl_meta || {};
    const cv = meta.consent_mode_values;
    const hasCMP = !!meta.cmp_detected;
    const hasConsentCode = meta.consent_mode_in_code;
    const consentAllDenied = cv && ["ad_storage","analytics_storage","ad_user_data","ad_personalization"].every(p => cv[p]==="denied");
    const hasServerSide = r.trackers?.some(t => t.name?.includes("Server-Side") && t.status==="detected");
    const hasGTM = r.trackers?.some(t => t.name==="Google Tag Manager" && t.status==="detected");
    const hasGA4 = r.trackers?.some(t => t.name==="GA4" && t.status==="detected");
    const preConsentTrack = (meta.tracking_cookies_before_consent||meta.pre_consent_cookies||[]).filter(c=>isTracking(c.name));
    const raceCondition   = meta.race_condition || false;
    const consentBeforeGtm = meta.consent_before_gtm || false;
    const wfuMs           = meta.wait_for_update_ms || 0;
    const implMode        = meta.implementation_mode || "None";
    const gcdAnalysis     = meta.gcd_analysis || null;
    const sim             = meta.consent_simulation || {};
    const updateFired     = sim?.accept?.update_fired || false;
    const trackAfterReject = (sim?.reject?.new_tracking_cookies||[]).length > 0;
    const trackingScore = r.category_scores?.["Tracking Performance"] || r.category_scores?.Performance || 50;

    return [
      {
        label: ck.consentMode,
        pts: hasConsentCode ? (consentAllDenied ? 20 : 10) : 0,
        maxPts: 20,
        status: hasConsentCode ? (consentAllDenied ? "ok" : "warn") : "fail",
        detail: hasConsentCode
          ? (consentAllDenied ? "Correctly implemented with all consent codes set to denied by default." : "Consent Mode v2 found in code but not all parameters are set to denied. Check ad_user_data and ad_personalization.")
          : "Missing or incomplete consent mode implementation. All 6 parameters should default to 'denied' for EU visitors.",
      },
      {
        label: ck.serverSide,
        pts: hasServerSide ? 30 : 0,
        maxPts: 30,
        status: hasServerSide ? "ok" : "fail",
        detail: hasServerSide
          ? "Server-side GTM detected. Data is routed through your own server, improving accuracy and bypassing ad blockers."
          : d.serverFail,
      },
      {
        label: ck.performance,
        pts: Math.round((trackingScore/100)*20),
        maxPts: 20,
        status: trackingScore>=70?"ok":trackingScore>=40?"warn":"fail",
        detail: "Measures how many tracking scripts add significant load time to your page.",
      },
      {
        label: ck.pixel,
        pts: preConsentTrack.length===0 ? 10 : 0,
        maxPts: 10,
        status: preConsentTrack.length===0 ? "ok" : "fail",
        detail: preConsentTrack.length===0
          ? "No marketing pixels firing before user consent."
          : d.pixelFail(preConsentTrack.length, preConsentTrack.map(c=>c.name).join(", ")),
      },
      {
        label: ck.cmp,
        pts: hasCMP ? 10 : 0,
        maxPts: 10,
        status: hasCMP ? "ok" : "fail",
        detail: hasCMP
          ? d.cmpOk(meta.cmp_detected)
          : "No recognized CMP detected. A certified cookie banner is required for GDPR compliance.",
      },
      {
        label: ck.enhanced,
        pts: 0,
        maxPts: 5,
        status: "fail",
        detail: "Enhanced Conversions not detected. This Google Ads feature improves conversion measurement by sending hashed first-party data.",
      },
      {
        label: ck.metaCapi,
        pts: 0,
        maxPts: 5,
        status: "fail",
        detail: "No Meta Conversions API indicators found. Server-side Meta events improve match quality and bypass browser restrictions.",
      },
    ];
  };

  const score = result?.overall_score;
  const cookies = result?.crawl_meta?.pre_consent_cookies || [];
  const trackers = result?.trackers || [];
  const checklist = buildChecklist(result, lang);
  const consentValues = result?.crawl_meta?.consent_mode_values;

  return (
    <div style={{ minHeight:"100vh", background:"#f9fafb" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; font-family:'DM Sans',system-ui,sans-serif; }
        input::placeholder { color:#9ca3af; }
        input:focus { outline:none; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        .fade-up { animation:fadeUp 0.35s ease forwards; }
      `}</style>

      {/* Header */}
      <header style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"0 24px" }}>
        <div style={{ maxWidth:960, margin:"0 auto", height:58, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, background:"linear-gradient(135deg,#f97316,#ea580c)", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>⚡</div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"#111827", letterSpacing:-0.3 }}>TrackAudit</div>
              <div style={{ fontSize:10, color:"#9ca3af", letterSpacing:0.3 }}>by e-laborat</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            {["sl","en"].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding:"5px 12px", borderRadius:8, border:"none",
                background: lang===l ? "#f97316" : "#f3f4f6",
                color: lang===l ? "#fff" : "#6b7280",
                fontSize:12, fontWeight:700, cursor:"pointer",
                transition:"all 0.15s", letterSpacing:0.5
              }}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background:"linear-gradient(160deg,#fff7ed 0%,#fff 55%)", borderBottom:"1px solid #f3f4f6", padding:"52px 24px 44px" }}>
        <div style={{ maxWidth:640, margin:"0 auto", textAlign:"center" }}>
          <h1 style={{ fontSize:38, fontWeight:800, color:"#111827", lineHeight:1.12, marginBottom:14, letterSpacing:-0.8 }}>
            {t.heroTitle1}<br/><span style={{color:"#f97316"}}>{t.heroTitle2}</span>
          </h1>
          <p style={{ fontSize:16, color:"#6b7280", lineHeight:1.65, marginBottom:32, maxWidth:480, margin:"0 auto 32px" }}>
            {t.heroSub}
          </p>
          <div style={{ display:"flex", maxWidth:540, margin:"0 auto", background:"#fff", borderRadius:14, border:"2px solid #e5e7eb", boxShadow:"0 4px 20px rgba(0,0,0,0.07)", overflow:"hidden" }}>
            <input value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&analyze()}
              placeholder="https://yourwebsite.com"
              style={{ flex:1, padding:"15px 18px", border:"none", fontSize:15, color:"#111827", background:"transparent" }} />
            <button onClick={analyze} disabled={loading||!url.trim()} style={{ padding:"15px 28px", border:"none", background:loading?"#f3f4f6":"linear-gradient(135deg,#f97316,#ea580c)", color:loading?"#9ca3af":"#fff", fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer", transition:"all 0.2s" }}>
              {loading ? t.scanning : t.checkBtn}
            </button>
          </div>
          <div style={{ marginTop:14, display:"flex", justifyContent:"center", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, color:"#9ca3af" }}>{t.tryLabel}</span>
            {["https://www.nlb.si","https://cosylab.com","https://harvest.si"].map(u=>(
              <button key={u} onClick={()=>setUrl(u)} style={{ background:"none", border:"1px solid #e5e7eb", borderRadius:20, padding:"3px 12px", fontSize:12, color:"#6b7280", cursor:"pointer" }}>
                {u.replace("https://www.","").replace("https://"," ")}
              </button>
            ))}
          </div>
          {error && <div style={{ marginTop:16, padding:"10px 16px", background:"#fef2f2", borderRadius:8, fontSize:13, color:"#dc2626", fontFamily:"monospace" }}>⚠ {error}</div>}
        </div>
      </div>

      <div style={{ maxWidth:720, margin:"0 auto", padding:"0 24px" }}>
        <ProgressBar active={loading} lang={lang} />
      </div>

      {rawResult && !emailDone && (
        <div style={{ maxWidth:620, margin:"0 auto", padding:"0 24px" }} className="fade-up">
          <EmailGate domain={rawResult.domain} onSubmit={handleEmail} lang={lang} />
        </div>
      )}

      {result && emailDone && (
        <div style={{ maxWidth:960, margin:"0 auto", padding:"32px 24px 60px" }} className="fade-up">

          {/* Score + checklist */}
          <Card>
            <div style={{ padding:"28px 28px 20px", display:"flex", gap:28, alignItems:"flex-start", flexWrap:"wrap" }}>
              <ScoreCircle score={score} lang={lang} />
              <div style={{ flex:1, minWidth:220 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <h2 style={{ fontSize:22, fontWeight:800, color:"#111827", margin:0 }}>{result.domain}</h2>
                  <span style={{ fontSize:12, padding:"3px 10px", borderRadius:99, background:scoreBg(score), color:scoreColor(score), fontWeight:600 }}>{scoreLabel(score)}</span>
                  {result.shared_id && <ShareButton sharedId={result.shared_id} lang={lang} />}
                </div>
                <div style={{ fontSize:12, color:"#9ca3af", marginBottom:10 }}>{result.industry}</div>
                <p style={{ fontSize:14, color:"#4b5563", lineHeight:1.7, margin:0 }}>{result.summary}</p>
              </div>
            </div>
            {/* Checklist */}
            <div style={{ borderTop:"1px solid #f3f4f6" }}>
              {checklist.map((item,i) => <CheckRow key={i} {...item} />)}
            </div>
          </Card>

          {/* Two-col: Trackers + Consent */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
            <Card style={{ marginBottom:0 }}>
              <CardHeader emoji="🔍" title="Detected Trackers" count={trackers.filter(t=>t.status==="detected").length} />
              <TrackerTable trackers={trackers} lang={lang} />
            </Card>

            <Card style={{ marginBottom:0 }}>
              <CardHeader emoji="🛡" title="Consent Mode v2" />
              <ConsentModeTable values={consentValues} meta={result.crawl_meta} lang={lang} />
            </Card>
          </div>

          {/* Pre-consent cookies */}
          <Card>
            <CardHeader emoji="🍪" title="Pre-consent cookies" count={cookies.length}
              right={cookies.some(c=>isTracking(c.name)) && <span style={{fontSize:11,padding:"3px 10px",borderRadius:99,background:"#fef2f2",color:"#dc2626",fontWeight:600}}>⚠ Tracking before consent</span>} />
            <CookieTable cookies={cookies} lang={lang} />
          </Card>

          {/* Live crawl meta */}
          <Card>
            <CardHeader emoji="🔬" title="Live Crawl Data" />
            <div style={{ padding:"18px 20px", display:"flex", flexWrap:"wrap", gap:20 }}>
              {[
                [t.crawlMeta[0],result.crawl_meta?.gtm_ids?.join(", ")||"—"],
                [t.crawlMeta[1],result.crawl_meta?.ga4_ids?.join(", ")||"—"],
                [t.crawlMeta[2],result.crawl_meta?.cmp_detected||"—"],
                [t.crawlMeta[3],result.crawl_meta?.consent_mode_in_code?t.crawlValues.yes:t.crawlValues.no],
                [t.crawlMeta[4],result.crawl_meta?.datalayer_present?t.crawlValues.present:t.crawlValues.missing],
                [t.crawlMeta[5],result.crawl_meta?.total_requests],
                [t.crawlMeta[6],result.crawl_meta?.script_count],
              ].map(([label,value])=>(
                <div key={label} style={{minWidth:130}}>
                  <div style={{fontSize:11,color:"#9ca3af",marginBottom:3,textTransform:"uppercase",letterSpacing:0.5}}>{label}</div>
                  <div style={{fontSize:13,fontWeight:600,color:"#111827",fontFamily:"monospace"}}>{value}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader emoji="💡" title="Recommended actions" count={result.recommendations?.length} />
            {(result.recommendations||[]).map((r,i)=><RecCard key={i} item={r} index={i} lang={lang}/>)}
          </Card>

          {/* CTA */}
          <div style={{ background:"linear-gradient(135deg,#f97316,#ea580c)", borderRadius:16, padding:"36px 32px", textAlign:"center", color:"#fff" }}>
            <h3 style={{ fontSize:22, fontWeight:700, marginBottom:10 }}>Ali želite odpraviti težave?</h3>
            <p style={{ fontSize:15, opacity:0.9, marginBottom:24, lineHeight:1.6 }}>
              e-laborat pripravi implementacijski plan in poskrbi za pravilno postavitev trackinga.
            </p>
            <a href="mailto:uros@e-laborat.si" style={{ display:"inline-block", padding:"14px 32px", background:"#fff", color:"#f97316", borderRadius:12, fontWeight:700, fontSize:15, textDecoration:"none" }}>
              Kontaktirajte nas →
            </a>
          </div>

          <div style={{ marginTop:20, textAlign:"center", fontSize:11, color:"#9ca3af" }}>
            {t.footer(new Date().toLocaleString(lang === "sl" ? "sl-SI" : "en-GB"))}
          </div>
        </div>
      )}
    </div>
  );
}
