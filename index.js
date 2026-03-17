const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const CLIFTON_THEMES = {
  "Executing": ["Achiever", "Arranger", "Discipline", "Focus", "Responsibility"],
  "Influencing": ["Activator", "Command", "Communication", "Woo", "Self-Assurance"],
  "Relationship Building": ["Empathy", "Developer", "Harmony", "Connectedness", "Includer"],
  "Strategic Thinking": ["Analytical", "Ideation", "Learner", "Strategic", "Futuristic"]
};

app.post("/analyze", async (req, res) => {
  const { answers } = req.body;

  const prompt = `You are a world-class HR consultant, organizational psychologist, and Clifton StrengthsFinder expert. Analyze this candidate thoroughly and return a JSON object ONLY — no markdown, no explanation, no extra text whatsoever.

Candidate responses:
${Object.entries(answers).map(([k, v]) => `${k}: ${v}`).join("\n")}

STEP 1 - QUALITY CHECK:
First determine if the answers are genuine and thoughtful or gibberish/nonsense. Short answers under 3 words for open questions, random letters, or clearly fake responses should be flagged.

STEP 2 - RUBRIC SCORING (only if genuine):
Score each dimension 0-25:
- Depth (0-25): How detailed, specific and thoughtful are the answers?
- Consistency (0-25): Do answers align with each other across sections?
- Self Awareness (0-25): Does the person understand their own strengths and patterns?
- Clarity (0-25): Are answers clear, specific, and easy to understand?

STEP 3 - CLIFTON ANALYSIS:
Available themes by domain:
- Executing: Achiever, Arranger, Discipline, Focus, Responsibility
- Influencing: Activator, Command, Communication, Woo, Self-Assurance
- Relationship Building: Empathy, Developer, Harmony, Connectedness, Includer
- Strategic Thinking: Analytical, Ideation, Learner, Strategic, Futuristic

STEP 4 - BEHAVIORAL SIGNALS:
- Locus of Control: Does the person take ownership of outcomes (Internal) or attribute things to external factors (External)?
- Team Orientation: Based on use of "we/us" vs "I/me" — are they Team-First, Balanced, or Independent?

Return this EXACT JSON structure:
{
  "genuine": true or false,
  "genuineReason": "only if false — one sentence explaining why answers seem fake",
  "rubricDepth": number 0-25,
  "rubricConsistency": number 0-25,
  "rubricSelfAwareness": number 0-25,
  "rubricClarity": number 0-25,
  "confidence": sum of all four rubric scores,
  "primaryStrength": one of ["Executing", "Influencing", "Strategic Thinking", "Relationship Building"],
  "secondaryStrength": different one from same four,
  "cliftonTheme": one specific theme matching the primary strength domain,
  "cliftonDescription": "2-3 sentences describing what this specific Clifton theme means for THIS person based on their answers. Make it feel personal and specific.",
  "roleId": one of ["ops", "pm", "creative", "data", "people", "engineer", "bd", "coach", "researcher", "founder"],
  "environment": "2-3 affirming sentences about where this person thrives. Be specific to their answers.",
  "greenFlags": ["specific positive observation 1", "specific positive observation 2", "specific positive observation 3"],
  "growthEdge": "One positively framed sentence about their development area. Never use negative language.",
  "locusOfControl": one of ["Internal", "External", "Balanced"],
  "teamOrientation": one of ["Team-First", "Balanced", "Independent"],
  "hireRecommendation": one of ["Strong Yes", "Yes", "Maybe"],
  "hiringNote": "2-3 sentences for the hiring manager about unique value, team complement, and one thing to watch.",
  "fullAssessment": "A warm, celebratory 4-5 sentence paragraph written directly to the candidate like Spotify Wrapped. Make them feel seen, valued, and excited about their potential."
}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        temperature: 0.7
      })
    });

    const data = await response.json();
    console.log("Groq response status:", response.status);

    if (!data.choices || !data.choices[0]) {
      console.error("Unexpected Groq response:", data);
      return res.status(500).json({ error: "AI returned unexpected response", detail: data });
    }

    const text = data.choices[0].message.content.replace(/```json|```/g, "").trim();
    const result = JSON.parse(text);

    // Block gibberish answers
    if (!result.genuine) {
      return res.status(400).json({ 
        error: "validation_failed", 
        message: result.genuineReason || "Please provide thoughtful, genuine answers to continue." 
      });
    }

    const { error: dbError } = await supabase.from("candidates").insert({
      name: answers.name || "Anonymous",
      email: answers.email || "",
      answers: answers,
      primary_strength: result.primaryStrength,
      secondary_strength: result.secondaryStrength,
      clifton_theme: result.cliftonTheme,
      role_id: result.roleId,
      role_title: result.roleId,
      environment: result.environment,
      confidence: result.confidence,
      hiring_note: result.hiringNote,
      full_assessment: result.fullAssessment,
      hire_recommendation: result.hireRecommendation,
      green_flags: result.greenFlags,
      growth_edge: result.growthEdge,
      locus_of_control: result.locusOfControl,
      team_orientation: result.teamOrientation,
      rubric_depth: result.rubricDepth,
      rubric_consistency: result.rubricConsistency,
      rubric_self_awareness: result.rubricSelfAwareness,
      rubric_clarity: result.rubricClarity,
      shortlisted: false
    });

    if (dbError) console.error("Database save error:", dbError);

    res.json(result);
  } catch (err) {
    console.error("Caught error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/hr/login", (req, res) => {
  const { password } = req.body;
  if (password === process.env.HR_PASSWORD) {
    res.json({ success: true, token: process.env.HR_PASSWORD });
  } else {
    res.status(401).json({ success: false, message: "Wrong password" });
  }
});

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

app.patch("/hr/candidates/:id/shortlist", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { shortlisted } = req.body;
  const { error } = await supabase
    .from("candidates")
    .update({ shortlisted })
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/hr/candidates/:id", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { error } = await supabase
    .from("candidates")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.listen(process.env.PORT, () => {
  console.log(`Backend running on port ${process.env.PORT}`);
});