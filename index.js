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

// ─── CANDIDATE ANALYSIS ───────────────────────────────────────────
app.post("/analyze", async (req, res) => {
  const { answers } = req.body;

  const prompt = `You are a world-class HR consultant, organizational psychologist, and Clifton StrengthsFinder expert. Analyze this candidate thoroughly and return a JSON object ONLY — no markdown, no explanation, no extra text whatsoever.

Candidate responses:
${Object.entries(answers).map(([k, v]) => `${k}: ${v}`).join("\n")}

STEP 1 - QUALITY CHECK:
Determine if answers are genuine and thoughtful or gibberish/nonsense. Random letters, single words for open questions, or clearly fake responses = not genuine.

STEP 2 - RUBRIC SCORING (only if genuine):
Score each dimension 0-25:
- Depth (0-25): How detailed, specific and thoughtful are the answers?
- Consistency (0-25): Do answers align with each other across all sections?
- Self Awareness (0-25): Does the person deeply understand their own strengths and patterns?
- Clarity (0-25): Are answers clear, specific, and easy to understand?

STEP 3 - CLIFTON ANALYSIS:
Available themes by domain:
- Executing: Achiever, Arranger, Discipline, Focus, Responsibility
- Influencing: Activator, Command, Communication, Woo, Self-Assurance
- Relationship Building: Empathy, Developer, Harmony, Connectedness, Includer
- Strategic Thinking: Analytical, Ideation, Learner, Strategic, Futuristic

STEP 4 - BEHAVIORAL SIGNALS:
- Locus of Control: Does the person take ownership of outcomes (Internal) or attribute things to external factors (External) or both (Balanced)?
- Team Orientation: Based on use of "we/us" vs "I/me" — are they Team-First, Balanced, or Independent?

STEP 5 - DEEP ANALYSIS:
- Persona Snapshot: One sharp, specific sentence describing this candidate's professional identity.
- Weakness Analysis: 2-3 honest, direct observations about genuine weaknesses. Do NOT frame positively.
- Watchpoints: 2 subtle risk flags HR should monitor.
- Interview Follow-ups: 3 sharp, specific probing questions for the live interview.

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
  "fullAssessment": "4-5 sentences in third person for HR, professional tone"
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

// ─── HR LOGIN ─────────────────────────────────────────────────────
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

// ─── CANDIDATES ───────────────────────────────────────────────────
app.get("/hr/candidates", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  const { data, error } = await supabase.from("candidates").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.patch("/hr/candidates/:id/shortlist", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  const { shortlisted } = req.body;
  const { error } = await supabase.from("candidates").update({ shortlisted }).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.patch("/hr/candidates/:id/status", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  const { status } = req.body;
  const { error } = await supabase.from("candidates").update({ status }).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/hr/candidates/:id", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  const { error } = await supabase.from("candidates").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ─── EMPLOYEES ────────────────────────────────────────────────────
app.get("/hr/employees", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  const { data, error } = await supabase.from("employees").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/hr/employees", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  const { name, email, role, department, skills, candidate_id } = req.body;
  const { data, error } = await supabase.from("employees").insert({
    name, email, role, department,
    skills: Array.isArray(skills) ? skills : skills.split(",").map(s => s.trim()),
    candidate_id: candidate_id || null,
    status: "Active"
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.patch("/hr/employees/:id", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  const { name, email, role, department, skills, status } = req.body;
  const { error } = await supabase.from("employees").update({
    name, email, role, department, status,
    skills: Array.isArray(skills) ? skills : skills.split(",").map(s => s.trim())
  }).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/hr/employees/:id", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  const { error } = await supabase.from("employees").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ─── TASKS ────────────────────────────────────────────────────────
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
  const { title, description, required_skills } = req.body;
  const { data, error } = await supabase.from("tasks").insert({
    title, description,
    required_skills: Array.isArray(required_skills) ? required_skills : required_skills.split(",").map(s => s.trim()),
    status: "Unassigned"
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete("/hr/tasks/:id", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  const { error } = await supabase.from("tasks").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ─── AI TASK ASSIGNMENT ───────────────────────────────────────────
app.post("/hr/tasks/:id/assign", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) return res.status(401).json({ error: "Unauthorized" });

  // Get the task
  const { data: task, error: taskError } = await supabase.from("tasks").select("*").eq("id", req.params.id).single();
  if (taskError || !task) return res.status(404).json({ error: "Task not found" });

  // Get all active employees
  const { data: employees, error: empError } = await supabase.from("employees").select("*").eq("status", "Active");
  if (empError || !employees.length) return res.status(500).json({ error: "Could not fetch employees" });

  const prompt = `You are an AI task assignment system for an IT company. Your job is to match the best employee to a task based on skill overlap.

Task:
- Title: ${task.title}
- Description: ${task.description}
- Required Skills: ${task.required_skills?.join(", ")}

Available Employees:
${employees.map(e => `- ID: ${e.id} | Name: ${e.name} | Role: ${e.role} | Department: ${e.department} | Skills: ${e.skills?.join(", ")}`).join("\n")}

Instructions:
1. Analyze each employee's skills against the required skills
2. Pick the single best match based on skill overlap and role relevance
3. Explain your reasoning clearly

Return ONLY this JSON:
{
  "assignedId": "the employee uuid",
  "assignedName": "the employee name",
  "reasoning": "2-3 sentences explaining why this employee is the best match for this task based on their specific skills"
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
        max_tokens: 500,
        temperature: 0.3
      })
    });

    const data = await response.json();
    if (!data.choices || !data.choices[0]) return res.status(500).json({ error: "AI error" });

    const text = data.choices[0].message.content.replace(/```json|```/g, "").trim();
    const result = JSON.parse(text);

    // Save assignment to database
    const { error: updateError } = await supabase.from("tasks").update({
      assigned_to: result.assignedId,
      assigned_name: result.assignedName,
      ai_reasoning: result.reasoning,
      status: "Assigned"
    }).eq("id", req.params.id);

    if (updateError) return res.status(500).json({ error: updateError.message });

    res.json({ success: true, assignedName: result.assignedName, reasoning: result.reasoning });

  } catch (err) {
    console.error("Task assignment error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PROMOTE CANDIDATE TO EMPLOYEE ───────────────────────────────
app.post("/hr/candidates/:id/hire", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) return res.status(401).json({ error: "Unauthorized" });

  const { data: candidate, error: candError } = await supabase.from("candidates").select("*").eq("id", req.params.id).single();
  if (candError || !candidate) return res.status(404).json({ error: "Candidate not found" });

  // Mark candidate as Hired
  await supabase.from("candidates").update({ status: "Hired" }).eq("id", req.params.id);

  // Create employee from candidate data
  const role = candidate.role_id || "engineer";
  const skills = candidate.answers?.skills
    ? candidate.answers.skills.split(",").map(s => s.trim())
    : [candidate.primary_strength];

  const { data: employee, error: empError } = await supabase.from("employees").insert({
    name: candidate.name,
    email: candidate.email,
    role: role,
    department: "General",
    skills: skills,
    candidate_id: candidate.id,
    status: "Active"
  }).select().single();

  if (empError) return res.status(500).json({ error: empError.message });
  res.json({ success: true, employee });
});

// ─── CSV EXPORT ───────────────────────────────────────────────────
app.get("/hr/candidates/export", async (req, res) => {
  const token = req.headers["x-hr-token"];
  if (token !== process.env.HR_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  const { data, error } = await supabase.from("candidates").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  const headers = ["name","email","primary_strength","clifton_theme","role_id","confidence","hire_recommendation","status","created_at"];
  const csv = [
    headers.join(","),
    ...data.map(c => headers.map(h => `"${(c[h] || "").toString().replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=candidates.csv");
  res.send(csv);
});

app.listen(process.env.PORT, () => {
  console.log(`Backend running on port ${process.env.PORT}`);
});