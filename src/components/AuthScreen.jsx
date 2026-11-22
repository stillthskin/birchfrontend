import { useState } from "react";
import { api, USE_MOCK, getToken, setOnAuthLost } from "../api/index.js";


function AuthScreen({ onLogin, initialMode, onBack }) {
  const [mode, setMode] = useState(initialMode || "login");
  const [f, setF] = useState({ name: "", email: "", phone: "", salary: "", password: "", confirm: "" });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const switchTo = (m) => { setMode(m); setErr(""); };

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setOk("");
    if (mode === "register" && f.password !== f.confirm) return setErr("The two passwords do not match.");
    setBusy(true);
    try {
      if (mode === "login") { const r = await api.login({ email: f.email, password: f.password }); onLogin(r.user); }
      else { const r = await api.register({ name: f.name, email: f.email, phone: f.phone, salary: +f.salary, password: f.password }); setOk(r.message); setMode("login"); setF({ ...f, password: "", confirm: "" }); }
    } catch (x) { setErr(x.message); }
    setBusy(false);
  };

  return (
    <div className="auth">
      <div className="card">
        <button className="link" onClick={onBack} style={{ marginBottom: 12 }}>← SACCO dashboard</button>
        <div className="brand" style={{ padding: 0, marginBottom: 14 }}>Birch</div>
        <h1>{mode === "login" ? "Sign in" : "Join the SACCO"}</h1>
        <p className="muted" style={{ margin: "4px 0 16px" }}>{mode === "login" ? "Use the email you registered with." : "Create your account. An administrator approves new members."}</p>
        <form onSubmit={submit}>
          {mode === "register" && <label>Full name<input value={f.name} onChange={set("name")} autoComplete="name" required /></label>}
          <label>Email<input type="email" value={f.email} onChange={set("email")} autoComplete="email" required /></label>
          {mode === "register" && (
            <>
              <label>Phone (for M-Pesa)<input value={f.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" placeholder="07…" required /></label>
              <label>Monthly pay (KES)<input type="number" min="0" value={f.salary} onChange={set("salary")} required /></label>
            </>
          )}
          <label>Password<input type="password" value={f.password} onChange={set("password")} minLength={mode === "register" ? 8 : undefined} autoComplete={mode === "login" ? "current-password" : "new-password"} required /></label>
          {mode === "register" && <label>Confirm password<input type="password" value={f.confirm} onChange={set("confirm")} autoComplete="new-password" required /></label>}
          {err && <div className="err" role="alert">{err}</div>}
          {ok && <div className="okmsg" role="status">{ok}</div>}
          <button className="btn" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
        </form>
        <p className="muted" style={{ marginTop: 14 }}>
          {mode === "login" ? "New here? " : "Already a member? "}
          <button className="link" onClick={() => switchTo(mode === "login" ? "register" : "login")}>{mode === "login" ? "Create an account" : "Sign in"}</button>
        </p>
        {USE_MOCK && <p className="muted hint">Demo mode (no backend). Password for all: <b>password</b>. Try jane@birch.test (member), mary@birch.test (loans officer), admin@birch.test (administrator: news and new members) or super@birch.test (super admin).</p>}
      </div>
    </div>
  );
}

export default AuthScreen;