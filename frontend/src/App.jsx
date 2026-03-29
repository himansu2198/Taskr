import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/Toast";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

// ── Auth guard ────────────────────────────────────────────────────────────────
// Decodes the JWT payload (without verifying signature — server does that).
// Redirects to /login if:
//   • no token in localStorage
//   • token is malformed
//   • token is expired (exp claim is in the past)
function isTokenValid() {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    // JWT is three base64url segments: header.payload.signature
    const payload = JSON.parse(atob(token.split(".")[1]));
    // exp is Unix timestamp in seconds
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      // Token expired — clean up storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return false;
    }
    return true;
  } catch {
    // Malformed token
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return false;
  }
}

function PrivateRoute({ children }) {
  return isTokenValid() ? children : <Navigate to="/login" replace />;
}

// ── Public route — redirect logged-in users away from login/register ──────────
function PublicRoute({ children }) {
  return isTokenValid() ? <Navigate to="/dashboard" replace /> : children;
}

// ── Layout wrapper ────────────────────────────────────────────────────────────
function Layout({ children, showNav = true }) {
  return (
    <>
      {showNav && <Navbar />}
      <main>{children}</main>
    </>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes — redirect to dashboard if already logged in */}
          <Route
            path="/login"
            element={<PublicRoute><Layout showNav={false}><Login /></Layout></PublicRoute>}
          />
          <Route
            path="/register"
            element={<PublicRoute><Layout showNav={false}><Register /></Layout></PublicRoute>}
          />

          {/* Protected route — redirect to login if no valid token */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout><Dashboard /></Layout>
              </PrivateRoute>
            }
          />

          {/* Catch-all → dashboard (PrivateRoute will redirect to login if needed) */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}