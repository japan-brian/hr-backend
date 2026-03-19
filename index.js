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

app.post("/analyze", async (req, res) => {
  const { answers } = req.body;

  const prompt = `You are a world-class HR consultant and Clifton StrengthsFinder expert. Analyze this candidate and return a JSON object ONLY — no markdown, no explanation, no extra text.

Candidate responses:
${Object.entries(answers).map(([k, v]) => `${k}: ${v}`).join("\n")}

STEP 1 - QUALITY CHECK:
Determine if answers are genuine. Random letters or single words for open questions = not genuine.

STEP 2 - RUBRIC SCORING (only if genuine):
Score each 0-25:
- Depth (0-25): How detailed and thoughtful?
- Consistency (0-25): Do answers align across sections?
- Self Awareness (0-25): Do they understand their own strengths?
- Clarity (0-25): Are answers clear and specific?

STEP 3 - CLIFTON ANALYSIS:
Themes by domain:
- Executing: Achiever, Arranger, Discipline, Focus, Responsibility
- Influencing: Activator, Command, Communication, Woo, Self-Assurance
- Relationship Building: Empathy, Developer, Harmony, Connectedness, Includer
- Strategic Thinking: Analytical, Ideation, Learner, Strategic, Futuristic

STEP 4 - BEHAVIORAL SIGNALS:
- Locus of Control: Internal, External, or Balanced
- Team Orientation: Team-First, Balanced, or Independent

STEP 5 - DEEP ANALYSIS (write in THIRD PERSON — HR is the audience):
- Persona Snapshot: One sharp specific sentence about this candidate
- Weakness Analysis: 2-3 honest direct weaknesses with evidence
- Watchpoints: 2 subtle risk flags grounded in their answers
- Interview Follow-ups: 3 specific probing questions referencing what they said

Return this EXACT JSON:
{
  "genuine": true or false,
  "genuineReason": "only if false",
  "rubricDepth": 0-25,
  "rubricConsistency": 0-25,
  "rubricSelfAwareness": 0-25,
  "rubricClarity": 0-25,
  "confidence": sum of four rubric scores,
  "primaryStrength": one of ["Executing","Influencing","Strategic Thinking","Relationship Building"],
  "secondaryStrength": different one from same four,
  "cliftonTheme": one specific theme matching primary domain,
  "cliftonDescription": "2-3 sentences about what this theme means for THIS person",
  "personaSnapshot": "one sharp sentence about this candidate",
  "roleId": one of ["ops","pm","creative","data","people","engineer","bd","coach","researcher","founder"],
  "environment": "2-3 affirming sentences about where they thrive",
  "greenFlags": ["observation 1","observation 2","observation 3"],
  "weaknessAnalysis": ["weakness 1","weakness 2"],
  "watchpoints": ["risk 1","risk 2"],
  "interviewFollowUps": ["question 1","question 2","question 3"],
  "growthEdge": "one positively framed development sentence",
  "locusOfControl": "Internal" or "External" or "Balanced",
  "teamOrientation": "Team-First" or "Balanced" or "Independent",
  "hireRecommendation": "Strong Yes" or "Yes" or "Maybe",
  "hiringNote": "2-3 sentences in third person for hiring manager",
  "fullAssessment": "4-5 sentences in third person for HR, professional tone, reference actual answers"
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
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: "AI returned unexpected response" });
    }

    const text = data.choices[0].message.content.replace(/```json|```/g, "").trim();
    const result = JSON.parse(text);

    if (!result.genuine) {
      return res.status(400).json({
        error: "validation_failed",
        message: result.genuineReason || "Please provide thoughtful answers."
      });
    }

    const { error: dbError } = await supabase.from("candidates").insert({
      name: answers.name || "Anonymous",
      email: answers.email || "",
      answers: {
        ...answers,
        personaSnapshot: result.personaSnapshot,
        weaknessAnalysis: result.weaknessAnalysis,
        watchpoints: result.watchpoints,
        interviewFollowUps: result.interviewFollowUps,
      },
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
  const { password, pin } = req.body;
  if (password !== process.env.HR_PASSWORD) {
    return res.status(401).json({ success: false, step: "password", message: "Wrong password." });
  }
  if (pin === undefined) {
    return res.json({ success: false, step: "pin", message: "Password correct. Enter your PIN." });
  }
  if (pin !== process.env.HR_PIN) {
    return res.status(401).json({ success: false, step: "pin", message: "Wrong PIN." });
  }
  res.json({ success: true, token: process.env.HR_PASSWORD });
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

app.patch("/hr/candidates/:id/status", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { status } = req.body;
  const { error } = await supabase
    .from("candidates")
    .update({ status })
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

app.get("/hr/candidates/export", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  const headers = ["name","email","primary_strength","clifton_theme","role_id","confidence","hire_recommendation","locus_of_control","team_orientation","status","created_at"];
  const csv = [
    headers.join(","),
    ...data.map(c => headers.map(h => `"${(c[h] || "").toString().replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=candidates.csv");
  res.send(csv);
});

app.get("/hr/tasks", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/hr/tasks", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  const { title } = req.body;
  const { data, error } = await supabase.from("tasks").insert({ title, done: false }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.patch("/hr/tasks/:id", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  const { done } = req.body;
  const { error } = await supabase.from("tasks").update({ done }).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/hr/tasks/:id", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  const { error } = await supabase.from("tasks").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.get("/hr/jobs", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/hr/jobs", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  const { title, department, type } = req.body;
  const { data, error } = await supabase.from("jobs").insert({ title, department, type, status: "Open" }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.patch("/hr/jobs/:id", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  const { status } = req.body;
  const { error } = await supabase.from("jobs").update({ status }).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/hr/jobs/:id", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  const { error } = await supabase.from("jobs").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.listen(process.env.PORT, () => {
  console.log(`Backend running on port ${process.env.PORT}`);
});