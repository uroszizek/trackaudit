// api/save-email.js — Shrani email, poveži z auditom, pošlji report
const { createClient } = require("@supabase/supabase-js");
const WebSocket = require('ws');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { realtime: { transport: WebSocket } }
);

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, shared_id } = req.body || {};
  if (!email || !shared_id) return res.status(400).json({ error: "email in shared_id sta obvezna" });

  try {
    // 1. Posodobi audit_results z emailom
    const { data: audit, error: auditErr } = await supabase
      .from("audit_results")
      .select("url, score, report_html")
      .eq("shared_id", shared_id)
      .single();

    if (auditErr || !audit) return res.status(404).json({ error: "Audit ni najden" });

    await supabase
      .from("audit_results")
      .update({ email })
      .eq("shared_id", shared_id);

    // 2. Shrani v leads
    await supabase.from("leads").upsert({
      email, url: audit.url, score: audit.score, source: "trackaudit"
    }, { onConflict: "email" });

    // 3. Pošlji email čez Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TrackAudit <trackaudit@e-laborat.si>",
        to: [email],
        subject: `Vaše poročilo o sledenju — ${audit.url}`,
        html: buildEmailHtml(audit, shared_id),
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      console.error("Resend napaka:", err);
      return res.status(500).json({ error: "Email ni bil poslan", detail: err });
    }

    return res.status(200).json({ success: true, message: "Email poslan!" });

  } catch (err) {
    console.error("save-email napaka:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

function buildEmailHtml(audit, shared_id) {
  const reportUrl = `${process.env.APP_URL || "https://trackaudit.e-laborat.si"}/report/${shared_id}`;
  const score = audit.score || 0;
  const scoreColor = score >= 70 ? "#16a34a" : score >= 45 ? "#d97706" : "#dc2626";
  const scoreLabel = score >= 70 ? "Dobro" : score >= 45 ? "Potrebuje izboljšave" : "Kritično";

  return `<!DOCTYPE html>
<html lang="sl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Vaše poročilo o sledenju</title></head>
<body style="margin:0;padding:0;background:#f5f6fa;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 16px">

  <div style="background:linear-gradient(135deg,#f97316,#ea580c);border-radius:16px;padding:24px;margin-bottom:20px;text-align:center">
    <div style="font-size:22px;margin-bottom:4px">⚡</div>
    <div style="font-size:13px;color:rgba(255,255,255,.85);margin-bottom:6px">e-laborat · TrackAudit</div>
    <h1 style="color:white;font-size:20px;font-weight:800;margin:0">Vaše poročilo o sledenju je pripravljeno</h1>
  </div>

  <div style="background:white;border-radius:16px;border:1px solid #e8eaf0;padding:24px;margin-bottom:16px;text-align:center">
    <div style="font-size:12px;color:#9ca3af;margin-bottom:8px">SPLETNA STRAN</div>
    <div style="font-size:15px;font-weight:700;color:#111827;font-family:monospace;margin-bottom:20px">${audit.url}</div>
    <div style="width:90px;height:90px;border-radius:50%;background:${scoreColor}20;border:6px solid ${scoreColor};display:inline-flex;flex-direction:column;align-items:center;justify-content:center;margin-bottom:12px">
      <div style="font-size:26px;font-weight:800;color:${scoreColor};font-family:monospace;line-height:1">${score}</div>
      <div style="font-size:9px;color:#9ca3af">/100</div>
    </div>
    <div style="font-size:13px;font-weight:700;color:${scoreColor};margin-bottom:20px">${scoreLabel}</div>
    <a href="${reportUrl}" style="display:inline-block;padding:13px 28px;background:linear-gradient(135deg,#f97316,#ea580c);color:white;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none">
      Ogled celotnega poročila →
    </a>
  </div>

  <div style="background:white;border-radius:16px;border:1px solid #e8eaf0;padding:20px;margin-bottom:16px">
    <h3 style="font-size:14px;font-weight:700;margin:0 0 12px 0">Želite odpraviti ugotovljene težave?</h3>
    <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0 0 14px 0">
      e-laborat pripravi natančen implementacijski načrt in poskrbi za pravilno postavitev sledenja na vaši spletni strani.
    </p>
    <a href="mailto:uros@e-laborat.si?subject=TrackAudit%20posvet%20-%20${encodeURIComponent(audit.url)}" 
       style="display:inline-block;padding:10px 20px;background:#f9fafb;border:1px solid #e8eaf0;color:#374151;border-radius:8px;font-weight:600;font-size:13px;text-decoration:none">
      Rezervirajte brezplačen posvet
    </a>
  </div>

  <div style="text-align:center;font-size:11px;color:#9ca3af;margin-top:16px">
    e-laborat · Uroš Žižek · uros@e-laborat.si<br>
    <a href="${reportUrl}" style="color:#f97316">Oglejte si poročilo online</a>
  </div>
</div>
</body>
</html>`;
}
