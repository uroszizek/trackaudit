// api/report.js — Vrne shranjeno poročilo po shared_id
// GET /api/report?id=abc12345
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { realtime: { transport: WebSocket } }
);

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const id = req.query.id;
  if (!id) return res.status(400).json({ error: "id je obvezen" });

  try {
    const { data, error } = await supabase
      .from("audit_results")
      .select("url, score, report_data, report_html, created_at, shared_id")
      .eq("shared_id", id)
      .single();

    if (error || !data) return res.status(404).json({ error: "Poročilo ni najdeno" });

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
