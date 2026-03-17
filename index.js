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
- Persona Snapshot: One sharp, specific sentence describing this candidate's professional identity. NOT generic. Reference their actual answers.
- Weakness Analysis: 2-3 honest, direct observations about genuine weaknesses or risks. Do NOT frame positively. Be objective and useful for HR. Reference specific answers as evidence.
- Watchpoints: 2 subtle risk flags HR should monitor. Specific and grounded in their answers.
- Interview Follow-ups: 3 sharp, specific probing questions HR should ask this exact candidate in the live interview. Reference things they said or left vague. Make these genuinely useful.

STEP 6 - WRITE IN THIRD PERSON:
The full assessment and hiring note must refer to the candidate in third person (e.g. "Alex demonstrates..." not "Alex, you are..."). HR is the audience, not the candidate.

Return this EXACT JSON structure:
{
  "genuine": true or false,
  "genuineReason": "only if false — one sentence explaining why",
  "rubricDepth": number 0-25,
  "rubricConsistency": number 0-25,
  "rubricSelfAwareness": number 0-25,
  "rubricClarity": number 0-25,
  "confidence": sum of all four rubric scores as a number out of 100,
  "primaryStrength": one of ["Executing", "Influencing", "Strategic Thinking", "Relationship Building"],
  "secondaryStrength": different one from same four,
  "cliftonTheme": one specific theme matching the primary strength domain,
  "cliftonDescription": "2-3 sentences describing what this specific Clifton theme means for THIS person based on their actual answers. Specific, not generic.",
  "personaSnapshot": "One sharp sentence describing this candidate's professional identity. Reference their actual background.",
  "roleId": one of ["ops", "pm", "creative", "data", "people", "engineer", "bd", "coach", "researcher", "founder"],
  "environment": "2-3 affirming sentences about where this person thrives. Specific to their answers.",
  "greenFlags": ["specific positive observation 1 grounded in their answers", "specific positive observation 2", "specific positive observation 3"],
  "weaknessAnalysis": ["direct honest weakness 1 with evidence from answers", "direct honest weakness 2", "optional third weakness if clearly present"],
  "watchpoints": ["subtle risk flag 1 specific to this candidate", "subtle risk flag 2"],
  "interviewFollowUps": ["specific probing question 1 referencing something they said", "specific probing question 2", "specific probing question 3"],
  "growthEdge": "One positively framed sentence about their primary development area.",
  "locusOfControl": one of ["Internal", "External", "Balanced"],
  "teamOrientation": one of ["Team-First", "Balanced", "Independent"],
  "hireRecommendation": one of ["Strong Yes", "Yes", "Maybe"],
  "hiringNote": "2-3 sentences in third person for the hiring manager about unique value, team complement, and one thing to watch.",
  "fullAssessment": "A sharp, insightful 4-5 sentence paragraph in THIRD PERSON written for HR. Describe the candidate's strengths, working style, and fit. Reference their actual answers specifically. Professional tone, not celebratory."
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
    console.log("Groq response status:", response.status);

    if (!data.choices || !data.choices[0]) {
      console.error("Unexpected Groq response:", data);
      return res.status(500).json({ error: "AI returned unexpected response", detail: data });
    }

    const text = data.choices[0].message.content.replace(/```json|```/g, "").trim();
    const result = JSON.parse(text);

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
      shortlisted: false,
      answers: {
        ...answers,
        personaSnapshot: result.personaSnapshot,
        weaknessAnalysis: result.weaknessAnalysis,
        watchpoints: result.watchpoints,
        interviewFollowUps: result.interviewFollowUps,
      }
    });

    if (dbError) console.error("Database save error:", dbError);

    // Store extra fields in answers for dashboard display
    const enrichedResult = {
      ...result,
      personaSnapshot: result.personaSnapshot,
      weaknessAnalysis: result.weaknessAnalysis,
      watchpoints: result.watchpoints,
      interviewFollowUps: result.interviewFollowUps,
    };

    res.json(enrichedResult);
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