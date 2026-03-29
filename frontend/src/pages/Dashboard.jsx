import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DateTime } from "luxon";
import { motion, AnimatePresence } from "framer-motion";
import { tasksAPI } from "../services/api";
import { useToast } from "../components/Toast";
import TaskModal from "../components/TaskModal";
import { Tooltip } from "../components/Navbar";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  pending:       { label: "Pending",     color: "#f59e0b", bg: "var(--warning-dim)", dot: "#f59e0b" },
  "in-progress": { label: "In Progress", color: "#3b82f6", bg: "var(--info-dim)",    dot: "#3b82f6" },
  done:          { label: "Done",        color: "#10b981", bg: "var(--success-dim)", dot: "#10b981" },
};

const FILTERS = [
  { key: "all",          label: "All Tasks"   },
  { key: "pending",      label: "Pending"     },
  { key: "in-progress",  label: "In Progress" },
  { key: "done",         label: "Done"        },
];

// ── Framer Motion variants ────────────────────────────────────────────────────

// Page load: entire dashboard fades up
const pageVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

// Header fades down
const headerVariants = {
  hidden:  { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: 0.1 } },
};

// Stat cards stagger in
const statsContainerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};
const statCardVariants = {
  hidden:  { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

// Controls row
const controlsVariants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.38 } },
};

// Task grid stagger
const gridContainerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const taskCardVariants = {
  hidden:  { opacity: 0, scale: 0.94, y: 16 },
  visible: { opacity: 1, scale: 1,    y: 0, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, scale: 0.92, y: -8, transition: { duration: 0.2 } },
};

// Empty state
const emptyVariants = {
  hidden:  { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const toast    = useToast();
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [filter,  setFilter]  = useState("all");

  const user = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data } = await tasksAPI.getAll();
      setTasks(data);
    } catch {
      toast("Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (form) => {
    try {
      if (modal === "new") {
        const { data } = await tasksAPI.create(form);
        setTasks((t) => [data, ...t]);
        toast("Task created successfully", "success");
      } else {
        const { data } = await tasksAPI.update(modal._id, form);
        setTasks((t) => t.map((x) => (x._id === modal._id ? data : x)));
        toast("Task updated", "success");
      }
      setModal(null);
    } catch {
      toast("Could not save task", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this task?")) return;
    try {
      await tasksAPI.remove(id);
      setTasks((t) => t.filter((x) => x._id !== id));
      toast("Task deleted", "success");
    } catch {
      toast("Could not delete task", "error");
    }
  };

  const counts = {
    all:           tasks.length,
    pending:       tasks.filter((t) => t.status === "pending").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    done:          tasks.filter((t) => t.status === "done").length,
  };

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const statsData = [
    { label: "Total",       count: counts.all,            color: "var(--orange)",  icon: "⊟" },
    { label: "Pending",     count: counts.pending,        color: "var(--warning)", icon: "◷" },
    { label: "In Progress", count: counts["in-progress"], color: "var(--info)",    icon: "⟳" },
    { label: "Done",        count: counts.done,           color: "var(--success)", icon: "✓" },
  ];

  return (
    <motion.div
      style={s.page}
      className="dash-page"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Page Header ── */}
      <motion.div style={s.header} className="dash-header" variants={headerVariants} initial="hidden" animate="visible">
        <div>
          <h1 style={s.title} className="dash-title">
            {user?.role === "admin" && (
              <motion.span
                style={s.adminPip}
                animate={{ boxShadow: ["0 0 0 3px rgba(249,115,22,0.15)", "0 0 0 6px rgba(249,115,22,0.05)", "0 0 0 3px rgba(249,115,22,0.15)"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            {getGreeting()}, {user?.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p style={s.subtitle}>Here's what's happening with your tasks today.</p>
        </div>

        <Tooltip label="Create a new task">
          <motion.button
            className="btn-primary"
            onClick={() => setModal("new")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 2v11M2 7.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New Task
          </motion.button>
        </Tooltip>
      </motion.div>

      {/* ── Stat Cards ── */}
      <motion.div
        style={s.statsRow}
        className="dash-stats"
        variants={statsContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {statsData.map((stat) => (
          <motion.div
            key={stat.label}
            style={s.statCard}
            className="stat-card"
            variants={statCardVariants}
            whileHover={{ y: -3, borderColor: "var(--border-light)", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
          >
            <div style={{ ...s.statIcon, color: stat.color }}>{stat.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <motion.div
                style={{ ...s.statCount, color: stat.color }}
                key={stat.count}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
              >
                {stat.count}
              </motion.div>
              <div style={s.statLabel}>{stat.label}</div>
              {counts.all > 0 && (
                <div className="stat-bar-track">
                  <motion.div
                    className="stat-bar-fill"
                    style={{ background: stat.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((stat.count / counts.all) * 100)}%` }}
                    transition={{ duration: 0.7, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Controls ── */}
      <motion.div style={s.controls} className="dash-filters" variants={controlsVariants} initial="hidden" animate="visible">
        <div style={s.filterTabs} className="dash-filter-tabs">
          {FILTERS.map(({ key, label }) => (
            <motion.button
              key={key}
              style={{ ...s.filterTab, ...(filter === key ? s.filterTabActive : {}) }}
              className={filter === key ? "filter-tab-active" : ""}
              onClick={() => setFilter(key)}
              whileHover={{ backgroundColor: filter === key ? undefined : "var(--surface2)" }}
              whileTap={{ scale: 0.96 }}
            >
              {label}
              <AnimatePresence mode="wait">
                <motion.span
                  key={counts[key]}
                  style={{ ...s.filterCount, ...(filter === key ? s.filterCountActive : {}) }}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1,   opacity: 1 }}
                  exit={{    scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {counts[key]}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
        <span style={s.resultHint}>{filtered.length} task{filtered.length !== 1 ? "s" : ""}</span>
      </motion.div>

      {/* ── Task Grid ── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <LoadingSkeleton key="skeleton" />
        ) : filtered.length === 0 ? (
          <EmptyState key="empty" filter={filter} onAdd={() => setModal("new")} />
        ) : (
          <motion.div
            key={`grid-${filter}`}
            style={s.grid}
            className="dash-grid"
            variants={gridContainerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            {filtered.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onEdit={() => setModal(task)}
                onDelete={() => handleDelete(task._id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal ── */}
      <AnimatePresence>
        {modal && (
          <TaskModal
            key="modal"
            task={modal === "new" ? null : modal}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onEdit, onDelete }) {
  const st      = STATUS[task.status] || STATUS.pending;
  const created = task.createdAt ? DateTime.fromISO(task.createdAt).toFormat("dd MMM yyyy") : "—";

  return (
    <motion.div
      style={s.card}
      className="task-card"
      variants={taskCardVariants}
      whileHover={{ scale: 1.02, borderColor: "var(--border-light)", boxShadow: "0 12px 36px rgba(0,0,0,0.45)", y: -3 }}
      layout
    >
      {/* Top */}
      <div style={s.cardHead}>
        <span style={{ ...s.badge, background: st.bg, color: st.color }}>
          <motion.span
            style={{ ...s.badgeDot, background: st.dot }}
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          {st.label}
        </span>
        <span style={s.cardDate}>{created}</span>
      </div>

      {/* Body */}
      <div style={s.cardBody}>
        <h3 style={s.cardTitle}>{task.title}</h3>
        {task.description && <p style={s.cardDesc}>{task.description}</p>}
      </div>

      {/* Footer */}
      <div style={s.cardFoot}>
        <Tooltip label="Edit task">
          <motion.button
            className="btn-ghost"
            style={{ flex: 1, justifyContent: "center", fontSize: 12 }}
            onClick={onEdit}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M9.5 1.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            </svg>
            Edit
          </motion.button>
        </Tooltip>
        <Tooltip label="Delete task">
          <motion.button
            style={s.deleteBtn}
            onClick={onDelete}
            whileHover={{ scale: 1.04, backgroundColor: "var(--danger-dim)" }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 3.5h9M5 3.5V2.5a1 1 0 012 0v1M5.5 6v3.5M7.5 6v3.5M3 3.5l.5 7a1 1 0 001 1h4a1 1 0 001-1l.5-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Delete
          </motion.button>
        </Tooltip>
      </div>
    </motion.div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ filter, onAdd }) {
  const isFiltered = filter !== "all";
  return (
    <motion.div
      style={s.empty}
      variants={emptyVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        style={s.emptyIcon}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect x="4" y="8" width="32" height="26" rx="4" stroke="var(--border-light)" strokeWidth="2"/>
          <path d="M13 20h14M13 26h8" stroke="var(--border-light)" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="20" cy="14" r="3" stroke="var(--orange)" strokeWidth="1.8"/>
        </svg>
      </motion.div>
      <h3 style={s.emptyTitle}>{isFiltered ? `No ${filter.replace("-", " ")} tasks` : "No tasks yet"}</h3>
      <p style={s.emptyText}>
        {isFiltered ? "Try a different filter or create a new task." : "Get started by creating your first task."}
      </p>
      {!isFiltered && (
        <motion.button
          className="btn-primary"
          onClick={onAdd}
          style={{ marginTop: 8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Create Task
        </motion.button>
      )}
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <motion.div
      style={s.grid}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          style={s.skeleton}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3 }}
        >
          <div style={{ ...s.skeletonLine, width: "40%", height: 18, marginBottom: 16 }} />
          <div style={{ ...s.skeletonLine, width: "85%", height: 14, marginBottom: 10 }} />
          <div style={{ ...s.skeletonLine, width: "60%", height: 12 }} />
        </motion.div>
      ))}
    </motion.div>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: { maxWidth: 1180, margin: "0 auto", padding: "40px 28px 72px" },

  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 36, gap: 16, flexWrap: "wrap",
  },
  title: {
    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26,
    color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 6,
    display: "flex", alignItems: "center", gap: 10,
  },
  subtitle: { color: "var(--text-sec)", fontSize: 14 },
  adminPip: {
    display: "inline-block", width: 8, height: 8,
    borderRadius: "50%", background: "var(--orange)",
  },

  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14, marginBottom: 32,
  },
  statCard: {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "16px 18px",
    display: "flex", alignItems: "center", gap: 14,
    cursor: "default", overflow: "hidden",
  },
  statIcon: {
    fontSize: 20, width: 42, height: 42, borderRadius: "11px",
    background: "var(--surface2)", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  statCount: {
    fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700,
    lineHeight: 1, marginBottom: 2,
  },
  statLabel: { fontSize: 11, color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.02em" },

  controls: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 22, gap: 12, flexWrap: "wrap",
  },
  filterTabs: {
    display: "flex", gap: 4,
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "var(--radius)", padding: 4, flexWrap: "wrap",
  },
  filterTab: {
    display: "flex", alignItems: "center", gap: 7,
    padding: "7px 14px",
    background: "transparent", border: "none",
    borderRadius: "7px", color: "var(--text-sec)",
    fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
  },
  filterTabActive: { background: "var(--surface2)", color: "var(--text)", boxShadow: "var(--shadow-sm)" },
  filterCount: {
    fontSize: 11, fontWeight: 600, padding: "1px 7px",
    borderRadius: "20px", background: "var(--surface2)",
    color: "var(--text-muted)", minWidth: 22, textAlign: "center",
  },
  filterCountActive: { background: "var(--orange-dim)", color: "var(--orange)" },
  resultHint: { fontSize: 13, color: "var(--text-muted)", fontWeight: 500 },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 18,
  },

  card: {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "20px 22px",
    display: "flex", flexDirection: "column", gap: 14, cursor: "default",
    boxSizing: "border-box",
  },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  badge: {
    display: "inline-flex", alignItems: "center", gap: 6,
    fontSize: 11, fontWeight: 600, padding: "4px 10px",
    borderRadius: "20px", letterSpacing: "0.01em",
  },
  badgeDot: { width: 6, height: 6, borderRadius: "50%", flexShrink: 0 },
  cardDate: { fontSize: 11, color: "var(--text-muted)", fontWeight: 500 },
  cardBody: { flex: 1 },
  cardTitle: {
    fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600,
    color: "var(--text)", lineHeight: 1.35, marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6,
    display: "-webkit-box", WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical", overflow: "hidden",
  },
  cardFoot: {
    display: "flex", gap: 8, paddingTop: 14,
    borderTop: "1px solid var(--border)",
  },
  deleteBtn: {
    flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    padding: "8px 14px", background: "transparent",
    color: "var(--danger)", border: "1px solid rgba(244,63,94,0.2)",
    borderRadius: "var(--radius)", fontSize: 12, fontWeight: 500, cursor: "pointer",
  },

  empty: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "80px 24px", textAlign: "center", gap: 12,
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: "20px",
    background: "var(--surface)", border: "1px solid var(--border)",
    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--text)",
  },
  emptyText: { fontSize: 13, color: "var(--text-sec)", maxWidth: 320, lineHeight: 1.6 },

  skeleton: {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "20px",
  },
  skeletonLine: {
    background: "linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%)",
    backgroundSize: "200% 100%", borderRadius: "6px",
    animation: "shimmer 1.4s infinite linear",
  },
};