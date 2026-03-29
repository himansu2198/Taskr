import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Animation variants ────────────────────────────────────────────────────────
const overlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22 } },
  exit:    { opacity: 0, transition: { duration: 0.18, delay: 0.05 } },
};

const modalVariants = {
  hidden:  { opacity: 0, scale: 0.92, y: 16 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0, scale: 0.94, y: 10,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

const fieldVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.12 + i * 0.06, duration: 0.25, ease: "easeOut" },
  }),
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function TaskModal({ task, onSave, onClose }) {
  const [form,    setForm]    = useState({ title: "", description: "", status: "pending" });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) setForm({ title: task.title || "", description: task.description || "", status: task.status || "pending" });
  }, [task]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  const fields = [
    { key: "title",       label: "Title",       type: "input",    placeholder: "e.g. Redesign the homepage" },
    { key: "description", label: "Description", type: "textarea", placeholder: "Optional details..." },
    { key: "status",      label: "Status",      type: "select"  },
  ];

  return (
    <AnimatePresence>
      <motion.div
        style={st.overlay}
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          style={st.modal}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Header */}
          <div style={st.header}>
            <div>
              <h2 style={st.title}>{task ? "Edit Task" : "New Task"}</h2>
              <p style={st.subtitle}>{task ? "Update the details below" : "Fill in the details to create a task"}</p>
            </div>
            <motion.button
              style={st.closeBtn}
              onClick={onClose}
              whileHover={{ scale: 1.1, backgroundColor: "var(--surface3)" }}
              whileTap={{ scale: 0.9 }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </motion.button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {fields.map(({ key, label, type, placeholder }, i) => (
              <motion.div
                key={key}
                style={{ marginBottom: 18 }}
                custom={i}
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
              >
                <label style={st.label}>{label}</label>

                {type === "input" && (
                  <input
                    style={{ ...st.input, ...(errors[key] ? st.inputError : {}) }}
                    value={form[key]}
                    placeholder={placeholder}
                    onChange={(e) => { setForm({ ...form, [key]: e.target.value }); setErrors({}); }}
                  />
                )}

                {type === "textarea" && (
                  <textarea
                    rows={3}
                    style={{ ...st.input, resize: "vertical" }}
                    value={form[key]}
                    placeholder={placeholder}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                )}

                {type === "select" && (
                  <select
                    style={st.input}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                )}

                <AnimatePresence>
                  {errors[key] && (
                    <motion.span
                      style={st.errMsg}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      {errors[key]}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {/* Actions */}
            <motion.div
              style={st.actions}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.32, duration: 0.2 }}
            >
              <motion.button
                type="button"
                style={st.btnCancel}
                onClick={onClose}
                whileHover={{ scale: 1.02, backgroundColor: "var(--surface2)" }}
                whileTap={{ scale: 0.97 }}
              >
                Cancel
              </motion.button>

              <motion.button
                type="submit"
                className="btn-primary"
                disabled={loading}
                whileHover={!loading ? { scale: 1.03 } : {}}
                whileTap={!loading ? { scale: 0.97 } : {}}
              >
                {loading ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                      style={{ display: "inline-block" }}
                    >
                      ⟳
                    </motion.span>
                    Saving...
                  </>
                ) : (
                  task ? "Update Task" : "Create Task"
                )}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const st = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.65)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, backdropFilter: "blur(6px)",
    padding: "16px",
  },
  modal: {
    width: "100%", maxWidth: 500,
    background: "var(--surface)",
    border: "1px solid var(--border-light)",
    borderRadius: "var(--radius-lg)",
    padding: "28px 28px 24px",
    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 24,
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: 18, fontWeight: 700,
    color: "var(--text)", letterSpacing: "-0.01em",
    marginBottom: 3,
  },
  subtitle: { fontSize: 13, color: "var(--text-muted)" },
  closeBtn: {
    width: 32, height: 32, borderRadius: "8px",
    background: "var(--surface2)", border: "1px solid var(--border)",
    color: "var(--text-sec)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0,
  },
  label: {
    display: "block", fontSize: 12, fontWeight: 600,
    color: "var(--text-sec)", marginBottom: 7,
    letterSpacing: "0.01em",
  },
  input: {
    width: "100%", padding: "10px 13px",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--text)", outline: "none",
    fontSize: 14, lineHeight: 1.5,
    transition: "border-color 0.15s",
  },
  inputError: { borderColor: "var(--danger)" },
  errMsg: {
    display: "block", fontSize: 12,
    color: "var(--danger)", marginTop: 5,
  },
  actions: {
    display: "flex", gap: 10, justifyContent: "flex-end",
    marginTop: 8, paddingTop: 20,
    borderTop: "1px solid var(--border)",
  },
  btnCancel: {
    padding: "10px 20px",
    background: "transparent",
    border: "1px solid var(--border-light)",
    borderRadius: "var(--radius)",
    color: "var(--text-sec)",
    fontSize: 14, fontWeight: 500,
    cursor: "pointer",
  },
};