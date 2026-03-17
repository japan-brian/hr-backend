const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to Supabase database
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─── CANDIDATE ROUTE ─────────────────────────────────────────────
app.post("/analyze", async (req, res) => {
  const { answers } = req.body;

  const prompt = `You are an expert HR consultant and organizational psychologist. Analyze this candidate's responses and return a JSON object only — no markdown, no explanation, no extra text.

Candidate responses:
${Object.entries(answers).map(([k, v]) => `${k}: ${v}`).join("\n")}

Return this exact JSON structure:
{
  "primaryStrength": one of ["Executing", "Influencing", "Strategic Thinking", "Relationship Building"],
  "secondaryStrength": one of the same four options but different from primary,
  "roleId": one of ["ops", "pm", "creative", "data", "people", "engineer", "bd", "coach", "researcher", "founder"],
  "environment": "2-3 sentence description of where this person thrives. Be specific and affirming.",
  "confidence": a number between 65 and 97,
  "hiringNote": "2-3 sentences for the hiring manager about this candidate unique value, which team they complement, and one thing to watch.",
  "fullAssessment": "A warm, celebratory 4-5 sentence paragraph written directly to the candidate. Describe their strengths positively like Spotify Wrapped. Make them feel seen, valued, and excited about their potential."
}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    console.log("Gemini response status:", response.status);
    console.log("Gemini response body:", JSON.stringify(data));

    if (!data.candidates || !data.candidates[0]) {
      console.error("Unexpected Gemini response:", data);
      return res.status(500).json({ error: "AI returned an unexpected response", detail: data });
    }

    const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(text);

    // Save to Supabase database
    const { error: dbError } = await supabase.from("candidates").insert({
      name: answers.name || "Anonymous",
      answers: answers,
      primary_strength: result.primaryStrength,
      secondary_strength: result.secondaryStrength,
      role_id: result.roleId,
      role_title: result.roleId,
      environment: result.environment,
      confidence: result.confidence,
      hiring_note: result.hiringNote,
      full_assessment: result.fullAssessment
    });

    if (dbError) console.error("Database save error:", dbError);

    res.json(result);
  } catch (err) {
    console.error("Caught error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── HR LOGIN ROUTE ───────────────────────────────────────────────
app.post("/hr/login", (req, res) => {
  const { password } = req.body;
  if (password === process.env.HR_PASSWORD) {
    res.json({ success: true, token: process.env.HR_PASSWORD });
  } else {
    res.status(401).json({ success: false, message: "Wrong password" });
  }
});

// ─── HR DASHBOARD ROUTE ───────────────────────────────────────────
app.get("/hr/candidates", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── START SERVER ─────────────────────────────────────────────────
app.listen(process.env.PORT, () => {
  console.log(`Backend running on port ${process.env.PORT}`);
});