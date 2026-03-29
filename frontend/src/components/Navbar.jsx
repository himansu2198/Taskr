import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  useFloating, useClick, useDismiss, useInteractions,
  useHover, FloatingPortal, offset, flip, shift,
} from "@floating-ui/react";

// ── Animation variants ────────────────────────────────────────────────────────
const tooltipVariants = {
  hidden: { opacity: 0, y: 4, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.15, ease: "easeOut" } },
  exit:   { opacity: 0, y: 4, scale: 0.95, transition: { duration: 0.1 } },
};

const dropdownVariants = {
  hidden:  { opacity: 0, y: -8, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.15 } },
};

const dropItemVariants = {
  hidden:  { opacity: 0, x: -6 },
  visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.05, duration: 0.18 } }),
};

// ── Tooltip ───────────────────────────────────────────────────────────────────
export function Tooltip({ label, children }) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open, onOpenChange: setOpen,
    placement: "top",
    middleware: [offset(8), flip(), shift()],
  });
  const hover = useHover(context, { delay: { open: 350, close: 0 } });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  return (
    <>
      <span ref={refs.setReference} {...getReferenceProps()} style={{ display: "inline-flex" }}>
        {children}
      </span>
      <AnimatePresence>
        {open && (
          <FloatingPortal>
            <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 9999 }} {...getFloatingProps()}>
              <motion.div
                style={tooltipStyle}
                variants={tooltipVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {label}
              </motion.div>
            </div>
          </FloatingPortal>
        )}
      </AnimatePresence>
    </>
  );
}

const tooltipStyle = {
  background: "#0f172a",
  border: "1px solid #334155",
  color: "#e5e7eb",
  fontSize: "12px",
  fontWeight: 500,
  padding: "5px 11px",
  borderRadius: "6px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
  whiteSpace: "nowrap",
};

// ── Navbar ────────────────────────────────────────────────────────────────────
export default function Navbar() {
  const navigate   = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);

  const user = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
  const initials = (user?.name || user?.email || "U").slice(0, 2).toUpperCase();

  const { refs, floatingStyles, context } = useFloating({
    open: dropOpen, onOpenChange: setDropOpen,
    placement: "bottom-end",
    middleware: [offset(10), flip(), shift()],
  });
  const click   = useClick(context);
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const dropItems = [
    {
      label: "Dashboard",
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/></svg>,
      onClick: () => { navigate("/dashboard"); setDropOpen(false); },
      danger: false,
    },
    {
      label: "Sign out",
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 7h7M9 5l3 2-3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    // Navbar slides down on mount
    <motion.nav
      style={s.nav}
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Logo */}
      <motion.div
        style={s.logo}
        onClick={() => navigate("/dashboard")}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <motion.div
          style={s.logoIcon}
          initial={{ rotate: -15, scale: 0.7, opacity: 0 }}
          animate={{ rotate: 0,   scale: 1,   opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1.5" fill="#f97316"/>
            <rect x="9" y="1" width="6" height="6" rx="1.5" fill="#f97316" opacity="0.6"/>
            <rect x="1" y="9" width="6" height="6" rx="1.5" fill="#f97316" opacity="0.6"/>
            <rect x="9" y="9" width="6" height="6" rx="1.5" fill="#f97316" opacity="0.35"/>
          </svg>
        </motion.div>
        <motion.span
          style={s.logoText}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
        >
          Taskr
        </motion.span>
      </motion.div>

      {/* Right side */}
      {user && (
        <motion.div
          style={s.right}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, duration: 0.4, ease: "easeOut" }}
        >
          {/* Role badge */}
          <motion.span
            style={{ ...s.roleBadge, ...(user.role === "admin" ? s.adminBadge : {}) }}
            className="hide-mobile"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.3 }}
          >
            {user.role === "admin" ? "Admin" : "Member"}
          </motion.span>

          <div style={s.divider} className="hide-mobile" />

          {/* Avatar button */}
          <motion.button
            ref={refs.setReference}
            {...getReferenceProps()}
            style={s.avatarBtn}
            whileHover={{ scale: 1.02, borderColor: "var(--border-light)" }}
            whileTap={{ scale: 0.97 }}
          >
            <div style={s.avatar}>{initials}</div>
            <div style={s.userInfo} className="hide-mobile">
              <span style={s.userName}>{user.name || "User"}</span>
              <span style={s.userEmail}>{user.email}</span>
            </div>
            <motion.svg
              width="14" height="14" viewBox="0 0 14 14" fill="none"
              className="hide-mobile"
              style={{ color: "var(--text-muted)" }}
              animate={{ rotate: dropOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
          </motion.button>

          {/* Dropdown */}
          <AnimatePresence>
            {dropOpen && (
              <FloatingPortal>
                <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 9999 }} {...getFloatingProps()}>
                  <motion.div
                    style={s.dropdown}
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    {/* Header */}
                    <div style={s.dropHead}>
                      <div style={s.dropAvatar}>{initials}</div>
                      <div>
                        <div style={s.dropName}>{user.name || "User"}</div>
                        <div style={s.dropEmail}>{user.email}</div>
                      </div>
                    </div>
                    <div style={s.sep} />

                    {dropItems.map((item, i) => (
                      <motion.button
                        key={item.label}
                        style={{ ...s.dropItem, ...(item.danger ? { color: "var(--danger)" } : {}) }}
                        custom={i}
                        variants={dropItemVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={{ backgroundColor: "var(--surface2)", x: 2 }}
                        onClick={item.onClick}
                      >
                        {item.icon}
                        {item.label}
                      </motion.button>
                    ))}
                  </motion.div>
                </div>
              </FloatingPortal>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.nav>
  );
}

const s = {
  nav: {
    position: "sticky", top: 0, zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 28px", height: 60,
    background: "rgba(15,23,42,0.92)",
    borderBottom: "1px solid var(--border)",
    backdropFilter: "blur(12px)",
  },
  logo: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  logoIcon: {
    width: 32, height: 32, borderRadius: "8px",
    background: "var(--surface2)",
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "1px solid var(--border-light)",
  },
  logoText: {
    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17,
    color: "var(--text)", letterSpacing: "-0.02em",
  },
  right: { display: "flex", alignItems: "center", gap: 12 },
  roleBadge: {
    fontSize: 11, fontWeight: 600, padding: "3px 10px",
    borderRadius: "20px", letterSpacing: "0.02em",
    background: "var(--surface2)", color: "var(--text-sec)",
    border: "1px solid var(--border-light)",
  },
  adminBadge: {
    background: "var(--orange-dim)", color: "var(--orange)",
    border: "1px solid rgba(249,115,22,0.3)",
  },
  divider: { width: 1, height: 24, background: "var(--border)" },
  avatarBtn: {
    display: "flex", alignItems: "center", gap: 9,
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "10px", padding: "5px 10px 5px 5px",
    cursor: "pointer", transition: "border-color 0.15s",
  },
  avatar: {
    width: 30, height: 30, borderRadius: "7px",
    background: "var(--grad-orange)", color: "#fff",
    fontWeight: 700, fontSize: 12,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  userInfo: { display: "flex", flexDirection: "column", textAlign: "left", lineHeight: 1.3 },
  userName:  { fontSize: 13, fontWeight: 600, color: "var(--text)" },
  userEmail: { fontSize: 11, color: "var(--text-muted)" },
  dropdown: {
    minWidth: 220,
    background: "var(--surface)",
    border: "1px solid var(--border-light)",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden",
    boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
  },
  dropHead: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "16px 16px 14px",
  },
  dropAvatar: {
    width: 38, height: 38, borderRadius: "9px", flexShrink: 0,
    background: "var(--grad-orange)", color: "#fff",
    fontWeight: 700, fontSize: 14,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  dropName:  { fontSize: 14, fontWeight: 600, color: "var(--text)" },
  dropEmail: { fontSize: 12, color: "var(--text-muted)", marginTop: 1 },
  sep:       { height: 1, background: "var(--border)" },
  dropItem: {
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", textAlign: "left",
    padding: "11px 16px",
    background: "transparent", border: "none",
    color: "var(--text-sec)", fontSize: 13, fontWeight: 500,
    cursor: "pointer",
  },
};