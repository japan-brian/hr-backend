import { useState, useEffect } from "react";

const BACKEND_URL = "https://hr-backend-jcsb.onrender.com";
const HR_EMAIL = "jaespeters639@gmail.com";

const gmailLink = (to) =>
  `https://mail.google.com/mail/?view=cm&fs=1&from=${HR_EMAIL}&to=${to}`;

const ROLES = [
  { id: "ops", title: "Operations Lead", emoji: "⚙️", desc: "Turns chaos into systems. Owns execution and keeps organizations running smoothly." },
  { id: "pm", title: "Product Manager", emoji: "🗺️", desc: "Bridges strategy and delivery. Translates vision into roadmaps and drives cross-functional teams." },
  { id: "creative", title: "Creative Strategist", emoji: "🎨", desc: "Finds the unexpected angle. Combines creative thinking with strategic clarity." },
  { id: "data", title: "Data Analyst", emoji: "📊", desc: "Finds signal in noise. Uses data to tell stories that drive decisions." },
  { id: "people", title: "People & Culture Lead", emoji: "🤝", desc: "Builds the environment where others thrive. Expert in human dynamics and organizational health." },
  { id: "engineer", title: "Software Engineer", emoji: "💻", desc: "Solves hard problems through code. Turns abstract requirements into working systems." },
  { id: "bd", title: "Business Development", emoji: "🚀", desc: "Opens doors and builds partnerships. Thrives at the intersection of relationships and opportunity." },
  { id: "coach", title: "Team Lead / Manager", emoji: "🧭", desc: "Unlocks the potential of others. Leads through trust, clarity, and genuine investment in people." },
  { id: "researcher", title: "Research & Insights", emoji: "🔬", desc: "Digs deep to understand the why. Turns curiosity into structured, actionable knowledge." },
  { id: "founder", title: "Entrepreneur / Intrapreneur", emoji: "💡", desc: "Builds from zero. Comfortable with risk, ambiguity, and wearing every hat." },
];

const STRENGTH_COLORS = {
  "Executing": { bg: "#E8FF5A", text: "#0a0a0a", glow: "rgba(232,255,90,0.3)" },
  "Influencing": { bg: "#FF6B35", text: "#fff", glow: "rgba(255,107,53,0.3)" },
  "Strategic Thinking": { bg: "#7B61FF", text: "#fff", glow: "rgba(123,97,255,0.3)" },
  "Relationship Building": { bg: "#00C9A7", text: "#0a0a0a", glow: "rgba(0,201,167,0.3)" },
};

const QUESTIONS = [
  { id: "name", label: "Let's start with your name.", sublabel: "What should we call you?", type: "text", placeholder: "Your full name", section: "About You" },
  { id: "email", label: "What's your email address?", sublabel: "We'll use this to get back to you.", type: "email", placeholder: "you@example.com", section: "About You" },
  { id: "role_applying", label: "What role are you applying for?", sublabel: "Type the position you're interested in.", type: "text", placeholder: "e.g. Software Engineer, Marketing Lead...", section: "About You" },
  { id: "academic", label: "Tell us about your academic background.", sublabel: "Degrees, fields of study, institutions.", type: "textarea", placeholder: "e.g. BSc Computer Science, University of Nairobi...", section: "Your Story" },
  { id: "experience", label: "Walk us through your work experience.", sublabel: "Roles, industries, and what you actually did.", type: "textarea", placeholder: "e.g. 3 years as a software developer at a fintech startup...", section: "Your Story" },
  { id: "skills", label: "What are your strongest skills?", sublabel: "Technical tools, soft skills, anything you're genuinely good at.", type: "textarea", placeholder: "e.g. Python, stakeholder management, systems thinking...", section: "Your Story" },
  { id: "proud", label: "What achievement are you most proud of?", sublabel: "Professional or personal — tell us about a moment that defined you.", type: "textarea", placeholder: "e.g. I led a team that reduced customer churn by 40%...", section: "Your Story" },
  { id: "tradeoff", label: "Tell us about a time you had to choose between doing something right and doing it fast.", sublabel: "What did you decide and what did it cost you?", type: "textarea", placeholder: "e.g. During a product launch, I had to choose between shipping with known bugs or delaying...", section: "How You Think" },
  { id: "learning", label: "What's the most complex thing you've taught yourself?", sublabel: "Walk us through how you approached learning it.", type: "textarea", placeholder: "e.g. I taught myself machine learning from scratch...", section: "How You Think" },
  { id: "stress", label: "When things get overwhelming, what do you do?", sublabel: "How do you actually handle pressure?", type: "choice", options: ["Make a list and tackle one by one", "Step back and look at the big picture", "Talk it through with someone I trust", "Push through independently", "Take a break then come back fresh"], section: "How You Work" },
  { id: "conflict", label: "How do you respond when you disagree with a decision above you?", sublabel: "Be honest — what do you actually do?", type: "choice", options: ["Voice my concern clearly", "Ask questions to understand first", "Go along but note my disagreement", "Find a way to influence indirectly", "Read the situation carefully"], section: "How You Work" },
  { id: "decision", label: "How do you make difficult decisions with incomplete information?", type: "choice", options: ["Gather as much data as possible", "Trust my gut and move fast", "Consult the people most affected", "Identify worst-case and work backwards", "Make a reversible decision and adjust"], section: "How You Work" },
  { id: "energy", label: "Where do you get your energy from?", type: "choice", options: ["Deep focus and solo work", "Collaboration and conversation", "A mix of both", "From the challenge itself"], section: "Who You Are" },
  { id: "values", label: "What do you value most in a workplace?", sublabel: "Pick everything that genuinely matters.", type: "multichoice", options: ["Autonomy & ownership", "Clear structure & guidance", "Strong team culture", "Fast growth & challenge", "Purpose & impact", "Recognition & visibility"], section: "Who You Are" },
  { id: "environment", label: "What kind of environment brings out your best work?", type: "choice", options: ["High-autonomy, figure-it-out culture", "Structured with clear expectations", "Collaborative and team-driven", "Fast-paced and constantly shifting"], section: "Your Ideal Fit" },
  { id: "manager", label: "What does your ideal manager look like?", type: "choice", options: ["A coach who develops me", "Someone who sets goals and steps back", "A peer who collaborates with me", "A visionary I can learn from"], section: "Your Ideal Fit" },
];

function PieChart({ data, size = 140 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ width: size, height: size, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "#444", fontSize: "12px" }}>No data</div>;
  let cumulative = 0;
  const slices = data.map(d => { const start = cumulative; cumulative += d.value / total; return { ...d, start, end: cumulative }; });
  const getCoords = (pct) => { const angle = pct * 2 * Math.PI - Math.PI / 2; return [50 + 45 * Math.cos(angle), 50 + 45 * Math.sin(angle)]; };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      {slices.map((s, i) => {
        if (s.value === 0) return null;
        const [x1, y1] = getCoords(s.start);
        const [x2, y2] = getCoords(s.end);
        const large = (s.end - s.start) > 0.5 ? 1 : 0;
        const path = slices.filter(sl => sl.value > 0).length === 1
          ? `M 50 50 m -45 0 a 45 45 0 1 1 0.001 0 Z`
          : `M 50 50 L ${x1} ${y1} A 45 45 0 ${large} 1 ${x2} ${y2} Z`;
        return <path key={i} d={path} fill={s.color} opacity={0.9} />;
      })}
      <circle cx="50" cy="50" r="25" fill="#070711" />
    </svg>
  );
}

function Avatar({ name, size = 40 }) {
  const initials = name ? name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "?";
  const colors = ["#7B61FF", "#00C9A7", "#FF6B35", "#E8FF5A", "#a78bfa"];
  const color = colors[name ? name.charCodeAt(0) % colors.length : 0];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}30`, border: `2px solid ${color}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: "800", color, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function EmailLink({ email, style = {} }) {
  if (!email) return <span style={{ color: "#555", fontSize: "13px" }}>No email</span>;
  return (
    
      href={gmailLink(email)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      style={{ color: "#a78bfa", fontSize: "13px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", ...style }}
      onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
      onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
    >
      ✉️ {email}
    </a>
  );
}

function NavBar({ onStart }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const h = () => setScrolled(window.scrollY > 20); window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h); }, []);
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "0 2rem", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", background: scrolled ? "rgba(7,7,17,0.95)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none", transition: "all 0.3s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "20px" }}>🍯</span>
        <span style={{ fontWeight: "800", fontSize: "16px", background: "linear-gradient(135deg, #E8FF5A, #00C9A7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>HoneypotAdvisory</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        <a href="#features" style={{ color: "#888", fontSize: "14px", textDecoration: "none" }}>Features</a>
        <a href="#how" style={{ color: "#888", fontSize: "14px", textDecoration: "none" }}>How It Works</a>
        <button onClick={onStart} style={{ padding: "8px 20px", background: "linear-gradient(135deg, #7B61FF, #5a45cc)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>Apply Now</button>
      </div>
    </nav>
  );
}

function LandingPage({ onStart }) {
  return (
    <div style={{ minHeight: "100vh", background: "#070711" }}>
      <NavBar onStart={onStart} />
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8rem 2rem 4rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(123,97,255,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", background: "rgba(123,97,255,0.15)", border: "1px solid rgba(123,97,255,0.3)", borderRadius: "999px", fontSize: "13px", color: "#a78bfa", letterSpacing: "1px", marginBottom: "2rem" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00C9A7", display: "inline-block", animation: "pulse 2s infinite" }} />
          AI-Powered Talent Intelligence
        </div>
        <h1 style={{ fontSize: "clamp(2.8rem, 7vw, 5rem)", fontWeight: "900", lineHeight: 1.05, margin: "0 0 1.5rem", maxWidth: "800px", background: "linear-gradient(135deg, #fff 0%, #c4b5fd 50%, #00C9A7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Beyond the CV. We Want to Know the Real You.
        </h1>
        <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "#888", lineHeight: 1.7, maxWidth: "580px", margin: "0 auto 1rem" }}>This isn't a typical application. We use AI to understand who you are, how you think, and where you'll genuinely thrive.</p>
        <p style={{ fontSize: "15px", color: "#555", marginBottom: "3rem" }}>Takes about 8 minutes. No wrong answers.</p>
        <button onClick={onStart} style={{ padding: "18px 48px", background: "linear-gradient(135deg, #7B61FF, #5a45cc)", border: "none", borderRadius: "14px", color: "#fff", fontSize: "17px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 30px rgba(123,97,255,0.3)", marginBottom: "3rem" }}>
          Start My Application →
        </button>
        <div style={{ display: "flex", gap: "3rem", justifyContent: "center", flexWrap: "wrap" }}>
          {[["16", "questions"], ["~8 min", "to complete"], ["AI-powered", "analysis"]].map(([big, small]) => (
            <div key={big} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#fff" }}>{big}</div>
              <div style={{ fontSize: "13px", color: "#555" }}>{small}</div>
            </div>
          ))}
        </div>
      </div>

      <div id="features" style={{ padding: "6rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <div style={{ fontSize: "13px", letterSpacing: "3px", color: "#7B61FF", textTransform: "uppercase", marginBottom: "1rem" }}>Why HoneypotAdvisory</div>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: "900", margin: 0, color: "#fff" }}>Hiring intelligence that goes deeper.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {[
            { icon: "🧠", title: "Clifton Strength Profiling", desc: "Identifies your specific Clifton theme — the precise talent that defines how you operate." },
            { icon: "📊", title: "Rubric-Based Scoring", desc: "Evaluates depth, consistency, self-awareness, and clarity. Every score means something." },
            { icon: "⚡", title: "Behavioral Intelligence", desc: "Detects ownership mindset, team orientation, and patterns CVs never reveal." },
            { icon: "🎯", title: "Role Match Engine", desc: "Matches candidates to the exact role where they'll do their best work." },
            { icon: "👥", title: "Employee Management", desc: "Track your team, their skills, and AI-assigned tasks all in one place." },
            { icon: "🤖", title: "AI Task Assignment", desc: "AI autonomously assigns tasks to employees based on skill match." },
          ].map(f => (
            <div key={f.title} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "2rem", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(123,97,255,0.08)"; e.currentTarget.style.borderColor = "rgba(123,97,255,0.3)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ fontSize: "32px", marginBottom: "1rem" }}>{f.icon}</div>
              <div style={{ fontSize: "17px", fontWeight: "700", marginBottom: "0.5rem", color: "#fff" }}>{f.title}</div>
              <div style={{ fontSize: "14px", color: "#666", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div id="how" style={{ padding: "6rem 2rem", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: "13px", letterSpacing: "3px", color: "#00C9A7", textTransform: "uppercase", marginBottom: "1rem" }}>The Process</div>
        <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: "900", margin: "0 0 4rem", color: "#fff" }}>Simple, fast, insightful.</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {[
            { num: "01", title: "Answer Thoughtfully", desc: "16 questions about who you are, how you think, and what you value." },
            { num: "02", title: "AI Analyzes Your Profile", desc: "Our AI maps your specific Clifton strength theme and evaluates across 4 dimensions." },
            { num: "03", title: "HR Reviews Your Intelligence Report", desc: "Your hiring manager receives a detailed profile with strengths, signals, and a recommendation." },
          ].map(s => (
            <div key={s.num} style={{ display: "flex", gap: "2rem", alignItems: "flex-start", textAlign: "left", padding: "2rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px" }}>
              <div style={{ fontSize: "3rem", fontWeight: "900", color: "rgba(123,97,255,0.3)", flexShrink: 0, lineHeight: 1 }}>{s.num}</div>
              <div>
                <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "0.5rem", color: "#fff" }}>{s.title}</div>
                <div style={{ fontSize: "15px", color: "#666", lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onStart} style={{ marginTop: "3rem", padding: "18px 48px", background: "linear-gradient(135deg, #7B61FF, #5a45cc)", border: "none", borderRadius: "14px", color: "#fff", fontSize: "17px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
          Begin My Application →
        </button>
      </div>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "3rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "2rem", marginBottom: "2rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.8rem" }}>
              <span>🍯</span>
              <span style={{ fontWeight: "800", background: "linear-gradient(135deg, #E8FF5A, #00C9A7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>HoneypotAdvisory</span>
            </div>
            <p style={{ color: "#555", fontSize: "14px", maxWidth: "260px", lineHeight: 1.6, margin: 0 }}>AI-powered talent intelligence for companies that take hiring seriously.</p>
          </div>
          <div style={{ display: "flex", gap: "4rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "12px", letterSpacing: "2px", color: "#444", textTransform: "uppercase", marginBottom: "1rem" }}>Product</div>
              {["Features", "How It Works", "Apply Now"].map(l => <div key={l} style={{ color: "#666", fontSize: "14px", marginBottom: "0.5rem" }}>{l}</div>)}
            </div>
            <div>
              <div style={{ fontSize: "12px", letterSpacing: "2px", color: "#444", textTransform: "uppercase", marginBottom: "1rem" }}>Contact</div>
              <a href={gmailLink("info@honeypotadvisory.com")} target="_blank" rel="noopener noreferrer" style={{ color: "#666", fontSize: "14px", textDecoration: "none" }}>info@honeypotadvisory.com</a>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "0.8rem" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00C9A7" }} />
                <span style={{ color: "#00C9A7", fontSize: "13px" }}>All systems operational</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <span style={{ color: "#444", fontSize: "13px" }}>© 2026 HoneypotAdvisory. All rights reserved.</span>
          <span style={{ color: "#444", fontSize: "13px" }}>Built with AI. Designed for humans.</span>
        </div>
      </footer>
      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} } *{box-sizing:border-box} html{scroll-behavior:smooth}`}</style>
    </div>
  );
}

function QuestionScreen({ question, value, onChange, onNext, onBack, current, total, sectionName }) {
  const isValid = () => {
    if (question.type === "text" || question.type === "email" || question.type === "textarea") return value && value.trim().length > 2;
    if (question.type === "multichoice") return value && value.split(",").filter(Boolean).length > 0;
    return !!value;
  };
  useEffect(() => {
    const h = (e) => { if (e.key === "Enter" && question.type !== "textarea" && isValid()) onNext(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [value]);
  const inputStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "14px", padding: "16px 20px", color: "#fff", fontSize: "17px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  return (
    <div style={{ minHeight: "100vh", background: "#070711", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10 }}>
        <div style={{ height: "3px", background: "rgba(255,255,255,0.06)" }}>
          <div style={{ height: "100%", width: `${(current / total) * 100}%`, background: "linear-gradient(90deg, #7B61FF, #00C9A7)", transition: "width 0.5s ease" }} />
        </div>
      </div>
      <div style={{ padding: "1.5rem 2rem 0", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "3px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🍯</span>
          <span style={{ fontWeight: "800", fontSize: "14px", background: "linear-gradient(135deg, #E8FF5A, #00C9A7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>HoneypotAdvisory</span>
        </div>
        <div style={{ fontSize: "13px", color: "#555" }}><span style={{ color: "#a78bfa", fontWeight: "700" }}>{current}</span> / {total}</div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: "640px" }}>
          <div style={{ fontSize: "12px", letterSpacing: "3px", color: "#555", textTransform: "uppercase", marginBottom: "1.5rem" }}>{sectionName}</div>
          <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: "800", lineHeight: 1.2, margin: "0 0 0.6rem", color: "#fff" }}>{question.label}</h2>
          {question.sublabel && <p style={{ fontSize: "15px", color: "#666", margin: "0 0 2rem", lineHeight: 1.5 }}>{question.sublabel}</p>}
          {(question.type === "text" || question.type === "email") && (
            <input type={question.type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={question.placeholder} style={inputStyle} autoFocus />
          )}
          {question.type === "textarea" && (
            <textarea rows={5} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={question.placeholder} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} autoFocus />
          )}
          {question.type === "choice" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {question.options.map((opt, i) => (
                <button key={opt} onClick={() => { onChange(opt); setTimeout(onNext, 300); }}
                  style={{ padding: "16px 20px", borderRadius: "14px", border: `1px solid ${value === opt ? "rgba(123,97,255,0.6)" : "rgba(255,255,255,0.08)"}`, background: value === opt ? "rgba(123,97,255,0.15)" : "rgba(255,255,255,0.03)", color: value === opt ? "#c4b5fd" : "#aaa", cursor: "pointer", fontSize: "15px", textAlign: "left", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ width: "24px", height: "24px", borderRadius: "50%", border: `1px solid ${value === opt ? "#7B61FF" : "rgba(255,255,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: value === opt ? "#7B61FF" : "#555", flexShrink: 0 }}>{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              ))}
            </div>
          )}
          {question.type === "multichoice" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {question.options.map(opt => {
                const selected = value ? value.split(",").includes(opt) : false;
                return (
                  <button key={opt} onClick={() => { const arr = value ? value.split(",").filter(Boolean) : []; const next = selected ? arr.filter(s => s !== opt) : [...arr, opt]; onChange(next.join(",")); }}
                    style={{ padding: "12px 18px", borderRadius: "999px", border: `1px solid ${selected ? "#E8FF5A" : "rgba(255,255,255,0.1)"}`, background: selected ? "rgba(232,255,90,0.12)" : "rgba(255,255,255,0.03)", color: selected ? "#E8FF5A" : "#888", cursor: "pointer", fontSize: "14px", fontFamily: "inherit" }}>
                    {selected ? "✓ " : ""}{opt}
                  </button>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {current > 1 ? (
              <button onClick={onBack} style={{ padding: "12px 24px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#666", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
            ) : <div />}
            {(question.type === "textarea" || question.type === "text" || question.type === "email" || question.type === "multichoice") && (
              <button onClick={onNext} disabled={!isValid()}
                style={{ padding: "14px 32px", background: isValid() ? "linear-gradient(135deg, #7B61FF, #5a45cc)" : "rgba(255,255,255,0.05)", border: "none", borderRadius: "12px", color: isValid() ? "#fff" : "#444", fontSize: "15px", fontWeight: "700", cursor: isValid() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                {current === total ? "Submit Application →" : "Next →"}
              </button>
            )}
          </div>
          {question.type !== "textarea" && question.type !== "multichoice" && (
            <p style={{ color: "#444", fontSize: "13px", marginTop: "1rem" }}>Press Enter ↵ to continue</p>
          )}
        </div>
      </div>
      <style>{`*{box-sizing:border-box}`}</style>
    </div>
  );
}

function LoadingScreen() {
  const messages = ["Reading between the lines...", "Mapping your Clifton theme...", "Evaluating depth and consistency...", "Detecting behavioral signals...", "Building your intelligence report...", "Almost there..."];
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const m = setInterval(() => setMsgIdx(i => (i + 1) % messages.length), 2500);
    const p = setInterval(() => setProgress(v => Math.min(v + 1, 90)), 300);
    return () => { clearInterval(m); clearInterval(p); };
  }, []);
  return (
    <div style={{ minHeight: "100vh", background: "#070711", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2rem", padding: "2rem" }}>
      <div style={{ fontSize: "48px", animation: "spin 3s linear infinite" }}>🍯</div>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: "800", margin: "0 0 0.5rem", background: "linear-gradient(135deg, #fff, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Analyzing your profile</h2>
        <p style={{ color: "#666", fontSize: "16px", margin: 0 }}>{messages[msgIdx]}</p>
      </div>
      <div style={{ width: "300px", height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #7B61FF, #00C9A7)", borderRadius: "2px", transition: "width 0.3s ease" }} />
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ThankYouScreen({ name }) {
  return (
    <div style={{ minHeight: "100vh", background: "#070711", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ textAlign: "center", maxWidth: "560px" }}>
        <div style={{ fontSize: "72px", marginBottom: "1.5rem" }}>🎉</div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "900", margin: "0 0 1rem", background: "linear-gradient(135deg, #fff, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Thank you, {name?.split(" ")[0] || "there"}!</h1>
        <p style={{ fontSize: "18px", color: "#888", lineHeight: 1.8, marginBottom: "2rem" }}>Your application has been received. Our team will review your profile and reach out via email shortly.</p>
        <div style={{ padding: "1.5rem 2rem", background: "rgba(123,97,255,0.08)", border: "1px solid rgba(123,97,255,0.2)", borderRadius: "16px" }}>
          <p style={{ color: "#a78bfa", margin: 0, fontSize: "15px", lineHeight: 1.6 }}>✨ We loved getting to know you. Every answer you gave helps us find the right fit.</p>
        </div>
        <p style={{ color: "#444", fontSize: "13px", marginTop: "2rem" }}>© 2026 HoneypotAdvisory</p>
      </div>
    </div>
  );
}

function HRLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState("password");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => {
    setLoading(true); setError("");
    try {
      const body = step === "password" ? { password } : { password, pin };
      const res = await fetch(`${BACKEND_URL}/hr/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { onLogin(password); }
      else if (data.step === "pin") { setStep("pin"); }
      else { setError(data.message); }
    } catch { setError("Could not connect to server."); }
    setLoading(false);
  };
  return (
    <div style={{ minHeight: "100vh", background: "#070711", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "420px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "3rem 2.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🍯</div>
        <h2 style={{ fontSize: "1.8rem", fontWeight: "800", margin: "0 0 0.5rem", color: "#fff" }}>HR Dashboard</h2>
        <p style={{ color: "#555", fontSize: "14px", marginBottom: "2rem" }}>HoneypotAdvisory · Talent Intelligence</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "2rem" }}>
          {[{ label: "Password", num: "1" }, { label: "PIN", num: "2" }].map((s, i) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {i > 0 && <div style={{ width: "24px", height: "1px", background: "rgba(255,255,255,0.1)" }} />}
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: (step === "pin" && i === 0) ? "rgba(0,201,167,0.3)" : (step === s.label.toLowerCase() ? "rgba(123,97,255,0.3)" : "rgba(255,255,255,0.05)"), border: `1px solid ${(step === "pin" && i === 0) ? "#00C9A7" : (step === s.label.toLowerCase() ? "#7B61FF" : "rgba(255,255,255,0.1)")}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", color: (step === "pin" && i === 0) ? "#00C9A7" : "#a78bfa" }}>
                {step === "pin" && i === 0 ? "✓" : s.num}
              </div>
              <span style={{ fontSize: "12px", color: "#555" }}>{s.label}</span>
            </div>
          ))}
        </div>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="Enter HR password" disabled={step === "pin"}
          style={{ width: "100%", padding: "14px 18px", background: step === "pin" ? "rgba(0,201,167,0.08)" : "rgba(255,255,255,0.05)", border: `1px solid ${step === "pin" ? "rgba(0,201,167,0.3)" : "rgba(255,255,255,0.1)"}`, borderRadius: "12px", color: step === "pin" ? "#00C9A7" : "#fff", fontSize: "15px", fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: "1rem" }} />
        {step === "pin" && (
          <input type="password" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="Enter your 6-digit PIN" maxLength={6} autoFocus
            style={{ width: "100%", padding: "14px 18px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(123,97,255,0.4)", borderRadius: "12px", color: "#fff", fontSize: "15px", fontFamily: "inherit", outline: "none", boxSizing: "border-box", letterSpacing: "6px", textAlign: "center", marginBottom: "1rem" }} />
        )}
        {step === "pin" && <p style={{ fontSize: "12px", color: "#555", marginBottom: "1rem" }}>Password verified ✓ — now enter your PIN</p>}
        {error && <p style={{ color: "#ff6b6b", fontSize: "14px", marginBottom: "1rem" }}>{error}</p>}
        <button onClick={handleSubmit} disabled={loading || (step === "password" && !password) || (step === "pin" && pin.length < 6)}
          style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #7B61FF, #5a45cc)", border: "none", borderRadius: "12px", color: "#fff", fontSize: "16px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
          {loading ? "Verifying..." : step === "password" ? "Continue →" : "Enter Dashboard →"}
        </button>
      </div>
    </div>
  );
}

function HRDashboard({ token }) {
  const [candidates, setCandidates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("overview");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [assigningTask, setAssigningTask] = useState(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: "", email: "", role: "", department: "", skills: "" });
  const [newTask, setNewTask] = useState({ title: "", description: "", required_skills: "" });

  const headers = { "x-hr-token": token };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/hr/candidates`, { headers }).then(r => r.json()),
      fetch(`${BACKEND_URL}/hr/employees`, { headers }).then(r => r.json()),
      fetch(`${BACKEND_URL}/hr/tasks`, { headers }).then(r => r.json()),
    ]).then(([c, e, t]) => {
      setCandidates(Array.isArray(c) ? c : []);
      setEmployees(Array.isArray(e) ? e : []);
      setTasks(Array.isArray(t) ? t : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const toggleShortlist = async (id, current) => {
    await fetch(`${BACKEND_URL}/hr/candidates/${id}/shortlist`, { method: "PATCH", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ shortlisted: !current }) });
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, shortlisted: !current } : c));
    if (selected?.id === id) setSelected(prev => ({ ...prev, shortlisted: !current }));
    showToast(!current ? "⭐ Added to shortlist" : "Removed from shortlist");
  };

  const hireCandidate = async (id) => {
    const res = await fetch(`${BACKEND_URL}/hr/candidates/${id}/hire`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" } });
    const data = await res.json();
    if (data.success) {
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: "Hired" } : c));
      setEmployees(prev => [data.employee, ...prev]);
      if (selected?.id === id) setSelected(prev => ({ ...prev, status: "Hired" }));
      showToast("🎉 Candidate hired and added to employees!");
    }
  };

  const deleteCandidate = async (id) => {
    if (!window.confirm("Delete this candidate?")) return;
    await fetch(`${BACKEND_URL}/hr/candidates/${id}`, { method: "DELETE", headers });
    setCandidates(prev => prev.filter(c => c.id !== id));
    setSelected(null); setPage("candidates");
    showToast("🗑️ Candidate deleted");
  };

  const addEmployee = async () => {
    if (!newEmployee.name.trim()) return;
    const res = await fetch(`${BACKEND_URL}/hr/employees`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(newEmployee) });
    const data = await res.json();
    setEmployees(prev => [data, ...prev]);
    setNewEmployee({ name: "", email: "", role: "", department: "", skills: "" });
    setShowAddEmployee(false);
    showToast("👤 Employee added!");
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm("Remove this employee?")) return;
    await fetch(`${BACKEND_URL}/hr/employees/${id}`, { method: "DELETE", headers });
    setEmployees(prev => prev.filter(e => e.id !== id));
    showToast("🗑️ Employee removed");
  };

  const addTask = async () => {
    if (!newTask.title.trim()) return;
    const res = await fetch(`${BACKEND_URL}/hr/tasks`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(newTask) });
    const data = await res.json();
    if (data.id) {
      setTasks(prev => [data, ...prev]);
      setNewTask({ title: "", description: "", required_skills: "" });
      setShowAddTask(false);
      showToast("📋 Task created!");
    } else {
      showToast("❌ Failed to create task.");
    }
  };

  const assignTask = async (taskId) => {
    setAssigningTask(taskId);
    try {
      const res = await fetch(`${BACKEND_URL}/hr/tasks/${taskId}/assign`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" } });
      const data = await res.json();
      if (data.success) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "Assigned", assigned_name: data.assignedName, ai_reasoning: data.reasoning } : t));
        showToast(`🤖 Assigned to ${data.assignedName}!`);
      } else {
        showToast("❌ Assignment failed — " + (data.error || "Try again."));
      }
    } catch {
      showToast("❌ Could not reach server.");
    }
    setAssigningTask(null);
  };

  const deleteTask = async (id) => {
    await fetch(`${BACKEND_URL}/hr/tasks/${id}`, { method: "DELETE", headers });
    setTasks(prev => prev.filter(t => t.id !== id));
    showToast("🗑️ Task deleted");
  };

  const strengthCounts = candidates.reduce((acc, c) => { acc[c.primary_strength] = (acc[c.primary_strength] || 0) + 1; return acc; }, {});
  const avgConfidence = candidates.length ? Math.round(candidates.reduce((a, c) => a + (c.confidence || 0), 0) / candidates.length) : 0;
  const strengthPieData = Object.entries(STRENGTH_COLORS).map(([s, c]) => ({ label: s, value: strengthCounts[s] || 0, color: c.bg }));
  const deptCounts = employees.reduce((acc, e) => { acc[e.department] = (acc[e.department] || 0) + 1; return acc; }, {});
  const deptColors = ["#7B61FF", "#00C9A7", "#E8FF5A", "#FF6B35", "#a78bfa"];
  const deptPieData = Object.entries(deptCounts).map(([label, value], i) => ({ label, value, color: deptColors[i % deptColors.length] }));

  const sidebarItems = [
    { id: "overview", icon: "🏠", label: "Overview" },
    { id: "candidates", icon: "👥", label: "Candidates" },
    { id: "employees", icon: "🧑‍💼", label: "Employees" },
    { id: "tasks", icon: "📋", label: "Task Assignment" },
    { id: "shortlisted", icon: "⭐", label: "Shortlisted" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  const cardBg = "rgba(255,255,255,0.03)";
  const cardBorder = "rgba(255,255,255,0.07)";

  const Sidebar = () => (
    <div style={{ width: "240px", flexShrink: 0, background: "rgba(255,255,255,0.02)", borderRight: `1px solid ${cardBorder}`, padding: "2rem 1rem", display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2rem", padding: "0 0.5rem" }}>
        <span>🍯</span>
        <span style={{ fontWeight: "800", fontSize: "14px", background: "linear-gradient(135deg, #E8FF5A, #00C9A7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>HoneypotAdvisory</span>
      </div>
      {sidebarItems.map(item => (
        <button key={item.id} onClick={() => { setPage(item.id); setSelected(null); }}
          style={{ padding: "10px 14px", borderRadius: "10px", border: "none", background: page === item.id && !selected ? "rgba(123,97,255,0.15)" : "transparent", color: page === item.id && !selected ? "#a78bfa" : "#666", cursor: "pointer", fontSize: "14px", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "10px", textAlign: "left", borderLeft: page === item.id && !selected ? "2px solid #7B61FF" : "2px solid transparent" }}>
          {item.icon} {item.label}
          {item.id === "shortlisted" && candidates.filter(c => c.shortlisted).length > 0 && (
            <span style={{ marginLeft: "auto", background: "#E8FF5A", color: "#0a0a0a", borderRadius: "999px", padding: "1px 8px", fontSize: "11px", fontWeight: "700" }}>{candidates.filter(c => c.shortlisted).length}</span>
          )}
          {item.id === "tasks" && tasks.filter(t => t.status === "Unassigned").length > 0 && (
            <span style={{ marginLeft: "auto", background: "#FF6B35", color: "#fff", borderRadius: "999px", padding: "1px 8px", fontSize: "11px", fontWeight: "700" }}>{tasks.filter(t => t.status === "Unassigned").length}</span>
          )}
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ padding: "0.5rem", fontSize: "12px", color: "#333", display: "flex", alignItems: "center", gap: "6px" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00C9A7" }} />
        All systems operational
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#070711", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "1rem", animation: "spin 2s linear infinite" }}>🍯</div>
        <p style={{ color: "#666" }}>Loading dashboard...</p>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (selected) {
    const colors = STRENGTH_COLORS[selected.primary_strength] || STRENGTH_COLORS["Strategic Thinking"];
    const role = ROLES.find(r => r.id === selected.role_id) || ROLES[0];
    const recColor = { "Strong Yes": "#00C9A7", "Yes": "#E8FF5A", "Maybe": "#FF6B35" }[selected.hire_recommendation] || "#888";
    const weaknesses = Array.isArray(selected.answers?.weaknessAnalysis) ? selected.answers.weaknessAnalysis : [];
    const watchpoints = Array.isArray(selected.answers?.watchpoints) ? selected.answers.watchpoints : [];
    const interviewQs = Array.isArray(selected.answers?.interviewFollowUps) ? selected.answers.interviewFollowUps : [];
    return (
      <div style={{ minHeight: "100vh", background: "#070711", color: "#fff", fontFamily: "'Sora', system-ui, sans-serif", display: "flex" }}>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <Sidebar />
        <div style={{ flex: 1, overflowY: "auto", padding: "2rem" }}>
          <button onClick={() => setSelected(null)} style={{ background: "transparent", border: `1px solid ${cardBorder}`, borderRadius: "8px", color: "#888", padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", marginBottom: "2rem", fontSize: "14px" }}>← Back</button>
          <div style={{ background: `linear-gradient(135deg, ${colors.bg}, ${colors.bg}bb)`, borderRadius: "24px", padding: "3rem", marginBottom: "1.5rem", position: "relative", overflow: "hidden", boxShadow: `0 20px 60px ${colors.glow}` }}>
            <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", background: "rgba(255,255,255,0.08)", borderRadius: "50%" }} />
            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-start", gap: "1.5rem" }}>
              <Avatar name={selected.name} size={56} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "4px", color: colors.text, opacity: 0.6, textTransform: "uppercase", marginBottom: "0.2rem" }}>Primary Clifton Strength</div>
                <div style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: "900", color: colors.text, lineHeight: 1, marginBottom: "0.2rem" }}>{selected.clifton_theme || selected.primary_strength}</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: colors.text, opacity: 0.7, marginBottom: "1rem" }}>{selected.primary_strength} Domain</div>
                <div style={{ fontSize: "14px", color: colors.text, opacity: 0.85, lineHeight: 1.6 }}>{selected.full_assessment}</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: `${recColor}18`, border: `1px solid ${recColor}44`, borderRadius: "999px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: recColor }} />
              <span style={{ color: recColor, fontWeight: "700", fontSize: "14px" }}>{selected.hire_recommendation}</span>
            </div>
            {selected.status !== "Hired" ? (
              <button onClick={() => hireCandidate(selected.id)} style={{ padding: "10px 20px", background: "rgba(0,201,167,0.15)", border: "1px solid rgba(0,201,167,0.4)", borderRadius: "999px", color: "#00C9A7", cursor: "pointer", fontFamily: "inherit", fontSize: "14px", fontWeight: "700" }}>
                ✅ Hire & Add to Employees
              </button>
            ) : (
              <span style={{ padding: "10px 20px", background: "rgba(0,201,167,0.1)", border: "1px solid rgba(0,201,167,0.3)", borderRadius: "999px", color: "#00C9A7", fontSize: "14px" }}>✓ Hired</span>
            )}
          </div>

          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "20px", padding: "2rem", marginBottom: "1rem" }}>
            <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#555", textTransform: "uppercase", marginBottom: "1.5rem" }}>Assessment Breakdown</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              {[{ label: "Depth", value: selected.rubric_depth, color: "#7B61FF" }, { label: "Consistency", value: selected.rubric_consistency, color: "#00C9A7" }, { label: "Self-Awareness", value: selected.rubric_self_awareness, color: "#E8FF5A" }, { label: "Clarity", value: selected.rubric_clarity, color: "#FF6B35" }].map(r => (
                <div key={r.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "13px", color: "#888" }}>{r.label}</span>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: r.color }}>{r.value || 0}/25</span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px" }}>
                    <div style={{ height: "100%", width: `${((r.value || 0) / 25) * 100}%`, background: r.color, borderRadius: "3px" }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: `1px solid ${cardBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#666", fontSize: "14px" }}>Overall Match Score</span>
              <span style={{ fontSize: "2rem", fontWeight: "900", color: "#fff" }}>{selected.confidence}%</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ background: "rgba(0,201,167,0.05)", border: "1px solid rgba(0,201,167,0.15)", borderRadius: "16px", padding: "1.5rem" }}>
              <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#00C9A7", textTransform: "uppercase", marginBottom: "1rem" }}>✨ Green Flags</div>
              {(Array.isArray(selected.green_flags) ? selected.green_flags : []).map((f, i) => (
                <div key={i} style={{ fontSize: "13px", color: "#ccc", lineHeight: 1.5, marginBottom: "0.6rem", paddingLeft: "0.8rem", borderLeft: "2px solid #00C9A7" }}>{f}</div>
              ))}
            </div>
            <div style={{ background: "rgba(232,255,90,0.04)", border: "1px solid rgba(232,255,90,0.15)", borderRadius: "16px", padding: "1.5rem" }}>
              <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#E8FF5A", textTransform: "uppercase", marginBottom: "1rem" }}>🌱 Growth Edge</div>
              <div style={{ fontSize: "13px", color: "#ccc", lineHeight: 1.6, marginBottom: "1rem" }}>{selected.growth_edge}</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ padding: "3px 10px", borderRadius: "999px", background: "rgba(123,97,255,0.15)", border: "1px solid rgba(123,97,255,0.3)", fontSize: "11px", color: "#a78bfa" }}>{selected.locus_of_control} Locus</span>
                <span style={{ padding: "3px 10px", borderRadius: "999px", background: "rgba(0,201,167,0.1)", border: "1px solid rgba(0,201,167,0.3)", fontSize: "11px", color: "#00C9A7" }}>{selected.team_orientation}</span>
              </div>
            </div>
          </div>

          {weaknesses.length > 0 && (
            <div style={{ background: "rgba(255,107,107,0.05)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#ff6b6b", textTransform: "uppercase", marginBottom: "1rem" }}>⚠️ Weakness Analysis</div>
              {weaknesses.map((w, i) => <div key={i} style={{ fontSize: "13px", color: "#ccc", lineHeight: 1.6, marginBottom: "0.6rem", paddingLeft: "0.8rem", borderLeft: "2px solid #ff6b6b" }}>{w}</div>)}
            </div>
          )}

          {watchpoints.length > 0 && (
            <div style={{ background: "rgba(255,165,0,0.04)", border: "1px solid rgba(255,165,0,0.2)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#ffa500", textTransform: "uppercase", marginBottom: "1rem" }}>👁️ Watchpoints</div>
              {watchpoints.map((w, i) => <div key={i} style={{ fontSize: "13px", color: "#ccc", lineHeight: 1.6, marginBottom: "0.6rem", paddingLeft: "0.8rem", borderLeft: "2px solid #ffa500" }}>{w}</div>)}
            </div>
          )}

          {interviewQs.length > 0 && (
            <div style={{ background: "rgba(123,97,255,0.05)", border: "1px solid rgba(123,97,255,0.2)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#a78bfa", textTransform: "uppercase", marginBottom: "1rem" }}>🎯 Interview Questions</div>
              {interviewQs.map((q, i) => (
                <div key={i} style={{ fontSize: "13px", color: "#ccc", lineHeight: 1.6, marginBottom: "0.8rem", padding: "0.8rem 1rem", background: "rgba(123,97,255,0.08)", borderRadius: "10px", display: "flex", gap: "10px" }}>
                  <span style={{ color: "#7B61FF", fontWeight: "700", flexShrink: 0 }}>Q{i + 1}.</span> {q}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.5rem" }}>
              <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#555", textTransform: "uppercase", marginBottom: "0.8rem" }}>Best Fit Role</div>
              <div style={{ fontSize: "20px", marginBottom: "0.3rem" }}>{role.emoji} {role.title}</div>
              <div style={{ fontSize: "13px", color: "#666", lineHeight: 1.5 }}>{role.desc}</div>
            </div>
            <div style={{ background: "rgba(123,97,255,0.05)", border: "1px solid rgba(123,97,255,0.15)", borderRadius: "16px", padding: "1.5rem" }}>
              <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#a78bfa", textTransform: "uppercase", marginBottom: "0.8rem" }}>Where They Thrive</div>
              <div style={{ fontSize: "13px", color: "#ccc", lineHeight: 1.6 }}>{selected.environment}</div>
            </div>
          </div>

          <div style={{ background: "rgba(232,255,90,0.04)", border: "1px solid rgba(232,255,90,0.15)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1rem" }}>
            <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#E8FF5A", textTransform: "uppercase", marginBottom: "0.8rem" }}>🔒 Hiring Manager Note</div>
            <div style={{ fontSize: "14px", color: "#ccc", lineHeight: 1.7 }}>{selected.hiring_note}</div>
          </div>

          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.5rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "11px", letterSpacing: "2px", color: "#555", textTransform: "uppercase", marginBottom: "0.6rem" }}>Contact</div>
              <EmailLink email={selected.email} style={{ fontSize: "14px" }} />
            </div>
            <div style={{ display: "flex", gap: "0.8rem" }}>
              <button onClick={() => toggleShortlist(selected.id, selected.shortlisted)} style={{ padding: "10px 20px", background: selected.shortlisted ? "rgba(232,255,90,0.15)" : cardBg, border: `1px solid ${selected.shortlisted ? "rgba(232,255,90,0.4)" : cardBorder}`, borderRadius: "10px", color: selected.shortlisted ? "#E8FF5A" : "#888", cursor: "pointer", fontFamily: "inherit", fontSize: "14px" }}>
                {selected.shortlisted ? "⭐ Shortlisted" : "☆ Shortlist"}
              </button>
              <button onClick={() => deleteCandidate(selected.id)} style={{ padding: "10px 20px", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "10px", color: "#ff6b6b", cursor: "pointer", fontFamily: "inherit", fontSize: "14px" }}>🗑️ Delete</button>
            </div>
          </div>

          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.5rem" }}>
            <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#555", textTransform: "uppercase", marginBottom: "1.2rem" }}>All Responses</div>
            {selected.answers && Object.entries(selected.answers).filter(([k]) => !["weaknessAnalysis", "watchpoints", "interviewFollowUps", "personaSnapshot"].includes(k)).map(([key, val]) => (
              <div key={key} style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: `1px solid ${cardBorder}` }}>
                <div style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.3rem" }}>{key}</div>
                <div style={{ fontSize: "13px", color: "#bbb", lineHeight: 1.6 }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "12px", color: "#444", marginTop: "1rem", textAlign: "right" }}>Submitted: {new Date(selected.created_at).toLocaleString()}</div>
        </div>
        {toast && <div style={{ position: "fixed", bottom: "2rem", right: "2rem", padding: "12px 20px", background: "rgba(30,30,50,0.95)", border: `1px solid ${cardBorder}`, borderRadius: "12px", color: "#fff", fontSize: "14px", backdropFilter: "blur(20px)", zIndex: 999 }}>{toast}</div>}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#070711", color: "#fff", fontFamily: "'Sora', system-ui, sans-serif", display: "flex" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <Sidebar />
      <div style={{ flex: 1, overflowY: "auto", padding: "2.5rem" }}>

        {page === "overview" && (
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: "900", margin: "0 0 0.3rem" }}>Overview</h1>
            <p style={{ color: "#555", margin: "0 0 2.5rem", fontSize: "14px" }}>Your talent pipeline and workforce at a glance.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "2rem" }}>
              {[
                { label: "Total Candidates", value: candidates.length, color: "#7B61FF", icon: "👥" },
                { label: "Avg Match Score", value: `${avgConfidence}%`, color: "#00C9A7", icon: "📊" },
                { label: "Employees", value: employees.length, color: "#E8FF5A", icon: "🧑‍💼" },
                { label: "Pending Tasks", value: tasks.filter(t => t.status === "Unassigned").length, color: "#FF6B35", icon: "📋" },
              ].map(s => (
                <div key={s.label} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.5rem" }}>
                  <div style={{ fontSize: "20px", marginBottom: "0.5rem" }}>{s.icon}</div>
                  <div style={{ fontSize: "2rem", fontWeight: "900", color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: "12px", color: "#555", marginTop: "0.3rem" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
              <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "20px", padding: "1.5rem" }}>
                <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#555", textTransform: "uppercase", marginBottom: "1rem" }}>Candidate Strengths</div>
                {Object.entries(STRENGTH_COLORS).map(([s, c]) => (
                  <div key={s} style={{ marginBottom: "0.8rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                      <span style={{ fontSize: "11px", color: "#888" }}>{s.split(" ")[0]}</span>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: c.bg }}>{strengthCounts[s] || 0}</span>
                    </div>
                    <div style={{ height: "5px", background: "rgba(255,255,255,0.05)", borderRadius: "3px" }}>
                      <div style={{ height: "100%", width: candidates.length ? `${((strengthCounts[s] || 0) / candidates.length) * 100}%` : "0%", background: c.bg, borderRadius: "3px" }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "20px", padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#555", textTransform: "uppercase", marginBottom: "4px", alignSelf: "flex-start" }}>Strength Mix</div>
                <div style={{ fontSize: "11px", color: "#444", marginBottom: "1rem", alignSelf: "flex-start" }}>Clifton domain breakdown</div>
                <PieChart data={strengthPieData} size={110} />
              </div>
              <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "20px", padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#555", textTransform: "uppercase", marginBottom: "4px", alignSelf: "flex-start" }}>Employees by Dept</div>
                <div style={{ fontSize: "11px", color: "#444", marginBottom: "1rem", alignSelf: "flex-start" }}>Current workforce distribution</div>
                <PieChart data={deptPieData.length ? deptPieData : [{ label: "None", value: 1, color: "rgba(255,255,255,0.05)" }]} size={110} />
                <div style={{ marginTop: "0.8rem", display: "flex", flexWrap: "wrap", gap: "4px", justifyContent: "center" }}>
                  {deptPieData.map(d => (
                    <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: d.color }} />
                      <span style={{ fontSize: "10px", color: "#555" }}>{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "20px", padding: "2rem" }}>
              <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#555", textTransform: "uppercase", marginBottom: "1.5rem" }}>Recent Candidates</div>
              {candidates.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "#444" }}>
                  <div style={{ fontSize: "48px", marginBottom: "1rem" }}>☕</div>
                  <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "0.5rem" }}>The waiting room is empty.</div>
                  <div style={{ fontSize: "14px" }}>Share your application link to get started!</div>
                </div>
              ) : candidates.slice(0, 5).map(c => {
                const colors = STRENGTH_COLORS[c.primary_strength] || STRENGTH_COLORS["Strategic Thinking"];
                const recColor = { "Strong Yes": "#00C9A7", "Yes": "#E8FF5A", "Maybe": "#FF6B35" }[c.hire_recommendation] || "#888";
                return (
                  <div key={c.id} onClick={() => setSelected(c)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", borderRadius: "12px", cursor: "pointer", marginBottom: "4px" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Avatar name={c.name} size={36} />
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: "600" }}>{c.name}</div>
                        <div style={{ fontSize: "12px", color: "#555" }}>{c.clifton_theme || c.primary_strength}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span style={{ padding: "3px 10px", borderRadius: "999px", background: `${recColor}18`, border: `1px solid ${recColor}33`, fontSize: "11px", color: recColor }}>{c.hire_recommendation}</span>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: colors.bg }}>{c.confidence}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {page === "candidates" && (
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: "900", margin: "0 0 0.3rem" }}>Candidates</h1>
            <p style={{ color: "#555", margin: "0 0 2rem", fontSize: "14px" }}>{candidates.length} total submissions</p>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name or email..." style={{ width: "100%", maxWidth: "400px", padding: "10px 16px", background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", color: "#fff", fontSize: "14px", fontFamily: "inherit", outline: "none", marginBottom: "1.5rem", boxSizing: "border-box" }} />
            {candidates.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())).map(c => {
              const colors = STRENGTH_COLORS[c.primary_strength] || STRENGTH_COLORS["Strategic Thinking"];
              const recColor = { "Strong Yes": "#00C9A7", "Yes": "#E8FF5A", "Maybe": "#FF6B35" }[c.hire_recommendation] || "#888";
              return (
                <div key={c.id} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.2rem 1.5rem", marginBottom: "0.8rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", cursor: "pointer" }}
                  onClick={() => setSelected(c)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(123,97,255,0.3)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = cardBorder}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Avatar name={c.name} size={40} />
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: "700", marginBottom: "2px" }}>{c.name}</div>
                      <div style={{ fontSize: "12px", color: "#555", marginBottom: "3px" }}>{c.clifton_theme || c.primary_strength}</div>
                      <EmailLink email={c.email} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    {c.status === "Hired" && <span style={{ padding: "3px 10px", borderRadius: "999px", background: "rgba(0,201,167,0.15)", border: "1px solid rgba(0,201,167,0.3)", fontSize: "11px", color: "#00C9A7" }}>✓ Hired</span>}
                    <span style={{ padding: "3px 10px", borderRadius: "999px", background: `${recColor}18`, border: `1px solid ${recColor}44`, fontSize: "11px", color: recColor }}>{c.hire_recommendation}</span>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: colors.bg }}>{c.confidence}%</div>
                    <button onClick={e => { e.stopPropagation(); toggleShortlist(c.id, c.shortlisted); }} style={{ background: "transparent", border: "none", fontSize: "16px", cursor: "pointer", opacity: c.shortlisted ? 1 : 0.3 }}>⭐</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {page === "employees" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
              <h1 style={{ fontSize: "1.8rem", fontWeight: "900", margin: 0 }}>Employees</h1>
              <button onClick={() => setShowAddEmployee(!showAddEmployee)} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #7B61FF, #5a45cc)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
                + Add Employee
              </button>
            </div>
            <p style={{ color: "#555", margin: "0 0 2rem", fontSize: "14px" }}>{employees.length} active employees</p>

            {showAddEmployee && (
              <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "20px", padding: "2rem", marginBottom: "2rem" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#888", marginBottom: "1.5rem" }}>New Employee</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  {[{ key: "name", placeholder: "Full name" }, { key: "email", placeholder: "Email address" }, { key: "role", placeholder: "Job title / Role" }, { key: "department", placeholder: "Department" }].map(f => (
                    <input key={f.key} value={newEmployee[f.key]} onChange={e => setNewEmployee(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                      style={{ padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: `1px solid ${cardBorder}`, borderRadius: "10px", color: "#fff", fontSize: "14px", fontFamily: "inherit", outline: "none" }} />
                  ))}
                </div>
                <input value={newEmployee.skills} onChange={e => setNewEmployee(p => ({ ...p, skills: e.target.value }))} placeholder="Skills (comma separated — e.g. Python, React, SQL)"
                  style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: `1px solid ${cardBorder}`, borderRadius: "10px", color: "#fff", fontSize: "14px", fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: "1rem" }} />
                <div style={{ display: "flex", gap: "0.8rem" }}>
                  <button onClick={addEmployee} style={{ padding: "10px 24px", background: "linear-gradient(135deg, #7B61FF, #5a45cc)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>Add Employee</button>
                  <button onClick={() => setShowAddEmployee(false)} style={{ padding: "10px 24px", background: "transparent", border: `1px solid ${cardBorder}`, borderRadius: "10px", color: "#888", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                </div>
              </div>
            )}

            {employees.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem", color: "#444" }}>
                <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🧑‍💼</div>
                <div style={{ fontSize: "16px", marginBottom: "0.5rem" }}>No employees yet.</div>
                <div style={{ fontSize: "14px" }}>Hire a candidate or add one manually above.</div>
              </div>
            ) : employees.map(e => (
              <div key={e.id} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.5rem", marginBottom: "0.8rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <Avatar name={e.name} size={44} />
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "2px" }}>{e.name}</div>
                    <div style={{ fontSize: "13px", color: "#555", marginBottom: "4px" }}>{e.role} · {e.department}</div>
                    <EmailLink email={e.email} style={{ marginBottom: "6px" }} />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                      {(Array.isArray(e.skills) ? e.skills : []).slice(0, 4).map(skill => (
                        <span key={skill} style={{ padding: "2px 8px", background: "rgba(123,97,255,0.12)", border: "1px solid rgba(123,97,255,0.25)", borderRadius: "999px", fontSize: "11px", color: "#a78bfa" }}>{skill}</span>
                      ))}
                      {Array.isArray(e.skills) && e.skills.length > 4 && (
                        <span style={{ padding: "2px 8px", background: "rgba(255,255,255,0.05)", borderRadius: "999px", fontSize: "11px", color: "#555" }}>+{e.skills.length - 4} more</span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                  <span style={{ padding: "4px 12px", borderRadius: "999px", background: "rgba(0,201,167,0.12)", border: "1px solid rgba(0,201,167,0.3)", fontSize: "12px", color: "#00C9A7" }}>{e.status}</span>
                  <button onClick={() => deleteEmployee(e.id)} style={{ background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: "16px" }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {page === "tasks" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
              <h1 style={{ fontSize: "1.8rem", fontWeight: "900", margin: 0 }}>AI Task Assignment</h1>
              <button onClick={() => setShowAddTask(!showAddTask)} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #7B61FF, #5a45cc)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
                + New Task
              </button>
            </div>
            <p style={{ color: "#555", margin: "0 0 2rem", fontSize: "14px" }}>{tasks.filter(t => t.status === "Unassigned").length} unassigned · {tasks.filter(t => t.status === "Assigned").length} assigned</p>

            {showAddTask && (
              <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "20px", padding: "2rem", marginBottom: "2rem" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#888", marginBottom: "1.5rem" }}>Create New Task</div>
                <input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} placeholder="Task title"
                  style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: `1px solid ${cardBorder}`, borderRadius: "10px", color: "#fff", fontSize: "14px", fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: "1rem" }} />
                <textarea value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} placeholder="Task description — what needs to be done?" rows={3}
                  style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: `1px solid ${cardBorder}`, borderRadius: "10px", color: "#fff", fontSize: "14px", fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: "1rem", resize: "vertical" }} />
                <input value={newTask.required_skills} onChange={e => setNewTask(p => ({ ...p, required_skills: e.target.value }))} placeholder="Required skills (comma separated — e.g. Python, SQL, React)"
                  style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: `1px solid ${cardBorder}`, borderRadius: "10px", color: "#fff", fontSize: "14px", fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: "1rem" }} />
                <div style={{ display: "flex", gap: "0.8rem" }}>
                  <button onClick={addTask} style={{ padding: "10px 24px", background: "linear-gradient(135deg, #7B61FF, #5a45cc)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>Create Task</button>
                  <button onClick={() => setShowAddTask(false)} style={{ padding: "10px 24px", background: "transparent", border: `1px solid ${cardBorder}`, borderRadius: "10px", color: "#888", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                </div>
              </div>
            )}

            {tasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem", color: "#444" }}>
                <div style={{ fontSize: "48px", marginBottom: "1rem" }}>📋</div>
                <div style={{ fontSize: "16px", marginBottom: "0.5rem" }}>No tasks yet.</div>
                <div style={{ fontSize: "14px" }}>Create a task and let AI assign the best employee.</div>
              </div>
            ) : tasks.map(t => (
              <div key={t.id} style={{ background: cardBg, border: `1px solid ${t.status === "Assigned" ? "rgba(0,201,167,0.25)" : cardBorder}`, borderRadius: "16px", padding: "1.5rem", marginBottom: "0.8rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.4rem" }}>
                      <div style={{ fontSize: "16px", fontWeight: "700" }}>{t.title}</div>
                      <span style={{ padding: "3px 10px", borderRadius: "999px", background: t.status === "Assigned" ? "rgba(0,201,167,0.15)" : "rgba(255,107,53,0.15)", border: `1px solid ${t.status === "Assigned" ? "rgba(0,201,167,0.3)" : "rgba(255,107,53,0.3)"}`, fontSize: "11px", color: t.status === "Assigned" ? "#00C9A7" : "#FF6B35", fontWeight: "600" }}>{t.status}</span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#666", lineHeight: 1.5, marginBottom: "0.8rem" }}>{t.description}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "0.8rem" }}>
                      {(Array.isArray(t.required_skills) ? t.required_skills : []).map(skill => (
                        <span key={skill} style={{ padding: "2px 8px", background: "rgba(232,255,90,0.08)", border: "1px solid rgba(232,255,90,0.2)", borderRadius: "999px", fontSize: "11px", color: "#E8FF5A" }}>{skill}</span>
                      ))}
                    </div>
                    {t.assigned_name && (
                      <div style={{ padding: "0.8rem 1rem", background: "rgba(0,201,167,0.06)", border: "1px solid rgba(0,201,167,0.15)", borderRadius: "10px" }}>
                        <div style={{ fontSize: "12px", color: "#00C9A7", fontWeight: "700", marginBottom: "0.3rem" }}>🤖 AI Assigned to: {t.assigned_name}</div>
                        <div style={{ fontSize: "12px", color: "#666", lineHeight: 1.5 }}>{t.ai_reasoning}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0 }}>
                    {t.status === "Unassigned" && (
                      <button onClick={() => assignTask(t.id)} disabled={assigningTask === t.id} style={{ padding: "8px 16px", background: "linear-gradient(135deg, #7B61FF, #5a45cc)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", opacity: assigningTask === t.id ? 0.7 : 1, whiteSpace: "nowrap" }}>
                        {assigningTask === t.id ? "🤖 Assigning..." : "🤖 AI Assign"}
                      </button>
                    )}
                    <button onClick={() => deleteTask(t.id)} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${cardBorder}`, borderRadius: "8px", color: "#555", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {page === "shortlisted" && (
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: "900", margin: "0 0 0.3rem" }}>⭐ Shortlisted</h1>
            <p style={{ color: "#555", margin: "0 0 2rem", fontSize: "14px" }}>{candidates.filter(c => c.shortlisted).length} candidates shortlisted</p>
            {candidates.filter(c => c.shortlisted).length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem", color: "#444" }}>
                <div style={{ fontSize: "48px", marginBottom: "1rem" }}>⭐</div>
                <div style={{ fontSize: "16px" }}>No shortlisted candidates yet.</div>
              </div>
            ) : candidates.filter(c => c.shortlisted).map(c => {
              const colors = STRENGTH_COLORS[c.primary_strength] || STRENGTH_COLORS["Strategic Thinking"];
              return (
                <div key={c.id} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.2rem 1.5rem", marginBottom: "0.8rem", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                  onClick={() => setSelected(c)}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Avatar name={c.name} size={40} />
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: "700", marginBottom: "3px" }}>{c.name}</div>
                      <EmailLink email={c.email} />
                    </div>
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: colors.bg }}>{c.confidence}%</div>
                </div>
              );
            })}
          </div>
        )}

        {page === "settings" && (
          <div style={{ maxWidth: "600px" }}>
            <h1 style={{ fontSize: "1.8rem", fontWeight: "900", margin: "0 0 0.3rem" }}>Settings</h1>
            <p style={{ color: "#555", margin: "0 0 2.5rem", fontSize: "14px" }}>System information and configuration.</p>
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "20px", padding: "2rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#555", textTransform: "uppercase", marginBottom: "1.5rem" }}>About</div>
              <p style={{ color: "#888", fontSize: "14px", lineHeight: 1.7, margin: "0 0 1rem" }}>HoneypotAdvisory is an AI-powered talent intelligence platform using Clifton StrengthsFinder methodology, rubric-based behavioral analysis, and autonomous AI task assignment.</p>
              <EmailLink email="info@honeypotadvisory.com" style={{ fontSize: "13px" }} />
            </div>
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "20px", padding: "2rem" }}>
              <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#555", textTransform: "uppercase", marginBottom: "1.5rem" }}>System Status</div>
              {[["AI Engine", "Groq LLaMA 3.3 70B"], ["Database", "Supabase PostgreSQL"], ["Backend", "Render (Node.js)"], ["Frontend", "Vercel (React)"]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.8rem 0", borderBottom: `1px solid ${cardBorder}` }}>
                  <span style={{ fontSize: "14px", color: "#888" }}>{k}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00C9A7" }} />
                    <span style={{ fontSize: "13px", color: "#555" }}>{v}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {toast && <div style={{ position: "fixed", bottom: "2rem", right: "2rem", padding: "12px 20px", background: "rgba(30,30,50,0.95)", border: `1px solid ${cardBorder}`, borderRadius: "12px", color: "#fff", fontSize: "14px", backdropFilter: "blur(20px)", zIndex: 999 }}>{toast}</div>}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("landing");
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [hrToken, setHrToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (window.location.pathname === "/hr-dashboard") setPage("hr-login");
  }, []);

  const currentQuestion = QUESTIONS[questionIdx];

  const handleNext = async () => {
    if (questionIdx < QUESTIONS.length - 1) {
      setQuestionIdx(i => i + 1);
    } else {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`${BACKEND_URL}/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers }) });
        const data = await res.json();
        if (res.status === 400 && data.error === "validation_failed") { setError(data.message); setLoading(false); return; }
        setPage("thankyou");
      } catch { setError("Something went wrong. Please try again."); }
      setLoading(false);
    }
  };

  const containerStyle = { minHeight: "100vh", background: "#070711", color: "#fff", fontFamily: "'Sora', system-ui, sans-serif" };

  if (page === "hr-login") return <div style={containerStyle}><link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />{hrToken ? <HRDashboard token={hrToken} /> : <HRLogin onLogin={t => { setHrToken(t); setPage("hr-dashboard"); }} />}</div>;
  if (page === "hr-dashboard") return <div style={containerStyle}><link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" /><HRDashboard token={hrToken} /></div>;
  if (page === "thankyou") return <div style={containerStyle}><link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" /><ThankYouScreen name={answers.name} /></div>;
  if (loading) return <div style={containerStyle}><link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" /><LoadingScreen /></div>;

  if (page === "form") {
    if (error) return (
      <div style={{ ...containerStyle, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1.5rem", padding: "2rem", textAlign: "center" }}>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <div style={{ fontSize: "48px" }}>⚠️</div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "800", margin: 0 }}>Please provide genuine answers</h2>
        <p style={{ color: "#888", maxWidth: "400px", lineHeight: 1.6 }}>{error}</p>
        <button onClick={() => { setError(null); setQuestionIdx(0); setAnswers({}); setPage("landing"); }} style={{ padding: "14px 32px", background: "linear-gradient(135deg, #7B61FF, #5a45cc)", border: "none", borderRadius: "12px", color: "#fff", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>Start Over</button>
      </div>
    );
    return (
      <div style={containerStyle}>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <QuestionScreen question={currentQuestion} value={answers[currentQuestion.id]} onChange={val => setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }))} onNext={handleNext} onBack={() => setQuestionIdx(i => Math.max(0, i - 1))} current={questionIdx + 1} total={QUESTIONS.length} sectionName={currentQuestion.section} />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <LandingPage onStart={() => { setPage("form"); setQuestionIdx(0); setAnswers({}); }} />
    </div>
  );
}