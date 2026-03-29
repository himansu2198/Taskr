import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { authAPI } from "../services/api";
import { useToast } from "../components/Toast";

// ── Animation variants ────────────────────────────────────────────────────────
const pageVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 32, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.1 },
  },
};

const fieldVariants = {
  hidden:  { opacity: 0, x: -12 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: 0.28 + i * 0.08, duration: 0.3, ease: "easeOut" },
  }),
};

// ── Blob config ───────────────────────────────────────────────────────────────
const BLOBS = [
  { size: 520, color: "rgba(59,130,246,0.18)",  top: "-10%",  left: "-10%",  dur: 18 },
  { size: 440, color: "rgba(99,102,241,0.14)",  top: "55%",   left: "65%",   dur: 22 },
  { size: 360, color: "rgba(249,115,22,0.10)",  top: "70%",   left: "-5%",   dur: 16 },
  { size: 280, color: "rgba(139,92,246,0.12)",  top: "10%",   left: "72%",   dur: 26 },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();
  const toast    = useToast();
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  useEffect(() => {
    if (localStorage.getItem("token")) navigate("/dashboard");
    // Reset form on page load to prevent stale autofill values
    setForm({ email: "", password: "" });
  }, []);

  const validate = () => {
    const e = {};
    if (!form.email)   e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email address";
    if (!form.password) e.password = "Password is required";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast("Logged in successfully", "success");
      navigate("/dashboard");
    } catch (err) {
      toast(err.response?.data?.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // autoComplete values defined per field
  const fields = [
    { key: "email",    label: "Email address", type: "email",    placeholder: "you@example.com", autoComplete: "email"            },
    { key: "password", label: "Password",       type: "password", placeholder: "••••••••",        autoComplete: "current-password" },
  ];

  return (
    <motion.div style={s.page} variants={pageVariants} initial="hidden" animate="visible">

      {/* ── Background layer ── */}
      <div style={s.bgBase} />
      <div style={s.grid} />

      {/* Animated blobs */}
      {BLOBS.map((b, i) => (
        <motion.div
          key={i}
          style={{
            ...s.blob,
            width: b.size, height: b.size,
            background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
            top: b.top, left: b.left,
          }}
          animate={{
            x: [0, 30, -20, 15, 0],
            y: [0, -25, 20, -10, 0],
            scale: [1, 1.08, 0.95, 1.04, 1],
          }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: i * 2.5 }}
        />
      ))}

      {/* Noise/grain overlay */}
      <div style={s.grain} />

      {/* ── Card ── */}
      <motion.div style={s.card} variants={cardVariants} initial="hidden" animate="visible">

        {/* Logo */}
        <motion.div
          style={s.logoWrap}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div style={s.logoIcon}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="#f97316"/>
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill="#f97316" opacity="0.6"/>
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill="#f97316" opacity="0.6"/>
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill="#f97316" opacity="0.35"/>
            </svg>
          </div>
          <span style={s.logoText}>Taskr</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <h1 style={s.heading}>Welcome back</h1>
          <p style={s.sub}>Sign in to your workspace</p>
        </motion.div>

        {/* ── Form ── autoComplete="off" on the form element */}
        <form onSubmit={handleSubmit} noValidate autoComplete="off" style={{ marginTop: 28 }}>

          {/* Dummy honeypot inputs — browsers fill the first text/password
              inputs they find; these hidden ones absorb that so real
              fields stay clean */}
          <input type="text"     style={s.honeypot} aria-hidden="true" tabIndex={-1} readOnly />
          <input type="password" style={s.honeypot} aria-hidden="true" tabIndex={-1} readOnly />

          {fields.map(({ key, label, type, placeholder, autoComplete }, i) => (
            <motion.div
              key={key}
              style={{ marginBottom: 18 }}
              custom={i}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
            >
              <label style={s.label}>{label}</label>
              <div style={s.inputWrap}>
                <input
                  type={type}
                  value={form[key]}
                  placeholder={placeholder}
                  autoComplete={autoComplete}
                  onFocus={() => setFocused(key)}
                  onBlur={() => setFocused(null)}
                  onChange={(e) => {
                    setForm({ ...form, [key]: e.target.value });
                    setErrors({ ...errors, [key]: "" });
                  }}
                  style={{
                    ...s.input,
                    ...(errors[key] ? s.inputError : {}),
                    ...(focused === key ? s.inputFocused : {}),
                  }}
                />
                <AnimatePresence>
                  {focused === key && (
                    <motion.div
                      style={s.focusRing}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    />
                  )}
                </AnimatePresence>
              </div>
              <AnimatePresence>
                {errors[key] && (
                  <motion.span
                    style={s.errMsg}
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    ⚠ {errors[key]}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48, duration: 0.3 }}
          >
            <motion.button
              type="submit"
              style={{ ...s.btn, ...(loading ? s.btnLoading : {}) }}
              disabled={loading}
              whileHover={!loading ? { scale: 1.02, boxShadow: "0 8px 32px rgba(249,115,22,0.45)" } : {}}
              whileTap={!loading ? { scale: 0.97 } : {}}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                    style={{ display: "inline-block", fontSize: 16 }}
                  >
                    ⟳
                  </motion.span>
                  Signing in...
                </span>
              ) : "Sign in →"}
            </motion.button>
          </motion.div>
        </form>

        {/* Divider */}
        <motion.div
          style={s.divider}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.3 }}
        >
          <span style={s.dividerLine} />
          <span style={s.dividerText}>New to Taskr?</span>
          <span style={s.dividerLine} />
        </motion.div>

        <motion.p
          style={s.footer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          <Link to="/register" style={s.link}>Create a free account →</Link>
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: {
    position: "relative", minHeight: "100vh",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "24px 16px", overflow: "hidden",
  },
  bgBase: {
    position: "fixed", inset: 0, zIndex: 0,
    background: "radial-gradient(ellipse 80% 60% at 50% -10%, #1e3a5f 0%, #0f172a 55%, #000510 100%)",
  },
  grid: {
    position: "fixed", inset: 0, zIndex: 1,
    backgroundImage: `
      linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)
    `,
    backgroundSize: "44px 44px",
  },
  blob: {
    position: "fixed", zIndex: 2, borderRadius: "50%",
    filter: "blur(60px)", pointerEvents: "none",
  },
  grain: {
    position: "fixed", inset: 0, zIndex: 3,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
    backgroundRepeat: "repeat", backgroundSize: "180px 180px",
    pointerEvents: "none", opacity: 0.6,
  },
  card: {
    position: "relative", zIndex: 10,
    width: "100%", maxWidth: 420,
    background: "rgba(30,41,59,0.65)",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: "20px", padding: "36px 36px 32px",
    backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
    boxShadow: `
      0 0 0 1px rgba(255,255,255,0.05) inset,
      0 24px 64px rgba(0,0,0,0.55),
      0 0 80px rgba(59,130,246,0.08)
    `,
  },
  logoWrap: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 10, marginBottom: 24,
  },
  logoIcon: {
    width: 36, height: 36, borderRadius: "9px",
    background: "rgba(249,115,22,0.12)",
    border: "1px solid rgba(249,115,22,0.25)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  logoText: {
    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20,
    color: "#fff", letterSpacing: "-0.03em",
  },
  heading: {
    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22,
    color: "#f1f5f9", textAlign: "center", marginBottom: 6, letterSpacing: "-0.02em",
  },
  sub: { color: "var(--text-muted)", fontSize: 13, textAlign: "center", lineHeight: 1.5 },
  label: {
    display: "block", fontSize: 12, fontWeight: 600,
    color: "var(--text-sec)", marginBottom: 7, letterSpacing: "0.01em",
  },
  inputWrap: { position: "relative" },
  input: {
    width: "100%", padding: "11px 14px",
    background: "rgba(15,23,42,0.6)",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: "10px", color: "#e2e8f0",
    outline: "none", fontSize: 14,
    transition: "border-color 0.2s, background 0.2s",
    fontFamily: "var(--font)",
  },
  inputFocused: { background: "rgba(15,23,42,0.8)", borderColor: "rgba(249,115,22,0.5)" },
  inputError: { borderColor: "rgba(244,63,94,0.6)" },
  focusRing: {
    position: "absolute", inset: -2, borderRadius: "12px",
    border: "2px solid rgba(249,115,22,0.25)", pointerEvents: "none",
  },
  errMsg: {
    display: "flex", alignItems: "center", gap: 5,
    color: "#f87171", fontSize: 12, marginTop: 5, overflow: "hidden",
  },
  // Honeypot — completely hidden, traps browser autofill away from real inputs
  honeypot: {
    position: "absolute",
    width: 0, height: 0,
    opacity: 0, pointerEvents: "none", overflow: "hidden",
  },
  btn: {
    width: "100%", padding: "12px",
    background: "linear-gradient(135deg, #f97316, #ea580c)",
    color: "#fff", border: "none", borderRadius: "10px",
    fontWeight: 700, fontSize: 14, cursor: "pointer",
    boxShadow: "0 4px 20px rgba(249,115,22,0.3)",
    transition: "box-shadow 0.2s", fontFamily: "var(--font)",
  },
  btnLoading: { opacity: 0.75, cursor: "not-allowed" },
  divider: { display: "flex", alignItems: "center", gap: 12, margin: "24px 0 16px" },
  dividerLine: { flex: 1, height: 1, background: "rgba(148,163,184,0.1)" },
  dividerText: { fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" },
  footer: { textAlign: "center", margin: 0 },
  link: { color: "var(--orange)", fontSize: 13, fontWeight: 600, textDecoration: "none", transition: "opacity 0.15s" },
};