import { Fragment, useCallback, useEffect, useState } from "react";
import { api, USE_MOCK, getToken, setOnAuthLost } from "./api/index.js";
import { fmt, fd, ROLE, can, initials, repayment, sumBy, lastPeriods, currentPeriod, MONTHLY_RATE, LOAN_MULTIPLE, INTEREST_PER_MONTH } from "./lib.js";

const ICON = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  plus: "M12 5v14M5 12h14",
  coin: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 12h6M12 9v6",
  users: "M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0",
  check: "M5 12l5 5L20 7",
  all: "M4 5h16M4 12h16M4 19h16",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  news: "M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h6M8 13h6",
  edit: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
};
const Ic = ({ n }) => <svg viewBox="0 0 24 24" aria-hidden="true"><path d={ICON[n]} /></svg>;

/* ---------- Auth gate ---------- */
export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(!!getToken());
  const [screen, setScreen] = useState("public"); // public | login | register
  useEffect(() => {
    setOnAuthLost(() => setUser(null));
    if (getToken()) api.me().then(setUser).catch(() => api.logout()).finally(() => setBooting(false));
  }, []);
  if (booting) return <div className="boot muted">Loading…</div>;
  if (!user)
    return screen === "public"
      ? <PublicPage onSignIn={() => setScreen("login")} onJoin={() => setScreen("register")} />
      : <AuthScreen key={screen} initialMode={screen} onLogin={setUser} onBack={() => setScreen("public")} />;
  return <Shell user={user} onLogout={() => { api.logout(); setUser(null); setScreen("public"); }} />;
}

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

/* ---------- Shell ---------- */
function Shell({ user, onLogout }) {
  const [tab, setTab] = useState("home");
  const [d, setD] = useState(null);
  const [toast, setT] = useState(null);
  const [modal, setModal] = useState(null);
  const say = (t) => { setT(t); setTimeout(() => setT(null), 2800); };

  const refresh = useCallback(async () => {
    const [members, contribs, loans, users, posts] = await Promise.all([
      api.members(), api.contributions(), api.loans(), can.members(user.role) ? api.users() : [], api.posts(),
    ]);
    setD({ members, contribs, loans, users, posts });
  }, [user.id]);
  useEffect(() => { refresh().catch((e) => say(e.message)); }, [refresh]);

  const run = async (fn, okMsg) => {
    try { await fn(); await refresh(); if (okMsg) say(okMsg); return true; }
    catch (e) { say(e.message); return false; }
  };

  const reqs = d ? d.loans.filter((l) => l.status === "pending" && l.guarantors.some((g) => g.userId === user.id && g.status === "waiting")).length : 0;
  const queue = d ? d.loans.filter((l) => l.status === "review").length : 0;
  const pend = d ? d.users.filter((u) => u.status === "pending").length : 0;
  const memberNav = [["home", "Overview", "home"], ["contribs", "Contributions", "list"], ["pay", "Contribute", "plus"], ["loans", "Loans", "coin"], ["req", "Guarantee", "users", reqs], ["news", "News", "news"], ["dash", "Finances", "chart"]];
  const staffNav = [
    ...(can.loans(user.role) ? [["queue", "Approvals", "check", queue], ["all", "All loans", "all"]] : []),
    ...(can.posts(user.role) ? [["posts", "Posts", "edit"]] : []),
    ...(can.members(user.role) ? [["users", "Members", "users", pend]] : []),
  ];
  const nav = [...memberNav, ...staffNav];
  const cur = nav.some((n) => n[0] === tab) ? tab : nav[0][0];
  const View = { home: Home, contribs: Contribs, pay: Pay, loans: Loans, req: Requests, news: NewsPage, dash: DashPage, posts: PostsAdmin, queue: Queue, all: AllLoans, users: Users }[cur];

  return (
    <div className="app">
      <nav className="side" aria-label="Main">
        <div className="brand">Birch</div>
        {nav.map(([id, label, ic, count], i) => (
          <Fragment key={id}>
            {i === memberNav.length && staffNav.length ? <div className="sep">Staff</div> : null}
            <button className="nb" aria-current={cur === id ? "page" : undefined} onClick={() => setTab(id)}>
              <Ic n={ic} />{label}{count ? <span className="pill">{count}</span> : null}
            </button>
          </Fragment>
        ))}
        <div className="me">
          <b>{user.name}</b><span style={{ opacity: 0.7 }}>{ROLE[user.role]}</span>
          <button className="out" onClick={onLogout}>Sign out</button>
        </div>
      </nav>
      <main>
        <div className="mobwho"><div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}><span><b>{user.name}</b> <span className="muted">· {ROLE[user.role]}</span></span><button className="link" onClick={onLogout}>Sign out</button></div></div>
        {d ? <View user={user} d={d} go={setTab} run={run} say={say} setModal={setModal} /> : <div className="muted">Loading…</div>}
      </main>
      {modal && <div className="modal" role="dialog" aria-modal="true"><div><div className="spin" /><h3>{modal.title}</h3><p className="muted">{modal.text}</p></div></div>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

/* ---------- Member pages ---------- */
function Home({ user, d, go }) {
  const mine = d.contribs;
  const tot = sumBy(mine), mo = sumBy(mine, (c) => c.type === "monthly"), vo = tot - mo;
  const by = lastPeriods().map((p) => ({ ...p, mo: sumBy(mine, (c) => c.period === p.key && c.type === "monthly"), vo: sumBy(mine, (c) => c.period === p.key && c.type === "voluntary") }));
  const mx = Math.max(...by.map((b) => b.mo + b.vo), 1);
  return (
    <>
      <div className="hd">
        <div><h1>Habari, {user.name.split(" ")[0]}</h1><div className="muted">Everything you have contributed so far.</div></div>
        <button className="btn" onClick={() => go("pay")}>Contribute</button>
      </div>
      <div className="grid">
        <div className="card stat hero"><div className="muted">Total contributions</div><div className="big">{fmt(tot)}</div></div>
        <div className="card stat"><div className="muted"><span className="dot m" />Monthly contributions</div><div className="big">{fmt(mo)}</div></div>
        <div className="card stat"><div className="muted"><span className="dot v" />Voluntary contributions</div><div className="big">{fmt(vo)}</div></div>
        <div className="card stat"><div className="muted">You can borrow up to</div><div className="big">{fmt(tot * LOAN_MULTIPLE)}</div><div className="muted">{LOAN_MULTIPLE}× your contributions</div></div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Contributions by month</h3>
        <div className="chart">
          {by.map((b) => (
            <div className="col" key={b.key} tabIndex={0}>
              <div className="tip">{b.label}: {fmt(b.mo)} monthly, {fmt(b.vo)} voluntary</div>
              <div className="stack" style={{ height: ((b.mo + b.vo) / mx) * 80 + "%" }}><div className="m" style={{ flex: b.mo }} /><div className="v" style={{ flex: b.vo }} /></div>
              {b.label}
            </div>
          ))}
        </div>
        <div className="muted" style={{ marginTop: 10 }}><span className="dot m" />Monthly <span className="dot v" style={{ marginLeft: 14 }} />Voluntary</div>
      </div>
    </>
  );
}

function Contribs({ user, d }) {
  const mine = d.contribs;
  const [f, setF] = useState("all");
  const list = [...mine].sort((a, b) => b.date.localeCompare(a.date)).filter((c) => f === "all" || c.type === f);
  const sum = (t) => sumBy(mine, (c) => c.type === t);
  return (
    <>
      <div className="hd"><div><h1>My contributions</h1><div className="muted">Every payment you have made, with the breakdown.</div></div></div>
      <div className="card">
        <h3>Breakdown by month</h3>
        <div className="scroll"><table>
          <thead><tr><th>Month</th><th className="n">Pay</th><th className="n">Monthly</th><th className="n">Voluntary</th><th className="n">Total</th><th className="n">% of pay</th></tr></thead>
          <tbody>
            {lastPeriods().map((p) => {
              const a = sumBy(mine, (c) => c.period === p.key && c.type === "monthly"), b = sumBy(mine, (c) => c.period === p.key && c.type === "voluntary");
              return (
                <tr key={p.key}><td>{p.label} {p.year}</td><td className="n">{fmt(user.salary)}</td><td className="n">{a ? fmt(a) : "-"}</td><td className="n">{b ? fmt(b) : "-"}</td><td className="n">{a + b ? fmt(a + b) : "-"}</td><td className="n">{a + b && user.salary ? Math.round(((a + b) / user.salary) * 100) + "%" : "-"}</td></tr>
              );
            })}
          </tbody>
          <tfoot><tr><td>Total</td><td /><td className="n">{fmt(sum("monthly"))}</td><td className="n">{fmt(sum("voluntary"))}</td><td className="n">{fmt(sum("monthly") + sum("voluntary"))}</td><td /></tr></tfoot>
        </table></div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>All payments</h3>
          <div className="seg" role="group" aria-label="Filter">
            {[["all", "All"], ["monthly", "Monthly"], ["voluntary", "Voluntary"]].map(([id, l]) => <button key={id} aria-pressed={f === id} onClick={() => setF(id)}>{l}</button>)}
          </div>
        </div>
        <div className="scroll"><table>
          <thead><tr><th>Date</th><th>Type</th><th>Method</th><th>Reference</th><th className="n">Amount</th></tr></thead>
          <tbody>{list.map((c) => <tr key={c.id}><td>{fd(c.date)}</td><td><span className={"badge " + (c.type === "monthly" ? "b-ok" : "b-wait")}>{c.type === "monthly" ? "Monthly" : "Voluntary"}</span></td><td>{c.method}</td><td>{c.ref}</td><td className="n">{fmt(c.amount)}</td></tr>)}</tbody>
        </table></div>
        {list.length ? null : <div className="empty">No payments of this type yet.</div>}
      </div>
    </>
  );
}

function Pay({ user, d, run, setModal, go }) {
  const suggested = user.salary ? user.salary * MONTHLY_RATE : 1000;
  const [type, setType] = useState("monthly");
  const [meth, setMeth] = useState("M-Pesa");
  const [phone, setPhone] = useState(user.phone || "");
  const [amt, setAmt] = useState(suggested);
  const paid = d.contribs.some((c) => c.period === currentPeriod() && c.type === "monthly");
  const blocked = type === "monthly" && paid;
  const pick = (t) => { setType(t); setAmt(t === "monthly" ? suggested : 1000); };
  const submit = async (e) => {
    e.preventDefault();
    if (blocked) return;
    setModal({ title: meth === "M-Pesa" ? "Check your phone" : "Processing payment", text: meth === "M-Pesa" ? "Enter your M-Pesa PIN to pay " + fmt(amt) + "." : "Confirming " + fmt(amt) + "…" });
    const ok = await run(() => api.pay({ type, amount: +amt, method: meth, phone }), fmt(amt) + " added to your contributions");
    setModal(null);
    if (ok) go("contribs");
  };
  return (
    <>
      <div className="hd"><div><h1>Contribute</h1><div className="muted">Pay your monthly contribution, or add any amount you like.</div></div></div>
      <div className="card" style={{ maxWidth: 480 }}>
        <form onSubmit={submit}>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <button type="button" className="opt" aria-pressed={type === "monthly"} onClick={() => pick("monthly")}><b>Monthly</b><span className="muted">10% of pay: {fmt(suggested)}</span></button>
            <button type="button" className="opt" aria-pressed={type === "voluntary"} onClick={() => pick("voluntary")}><b>Voluntary</b><span className="muted">Any amount, any time</span></button>
          </div>
          <label>Pay with<select value={meth} onChange={(e) => setMeth(e.target.value)}><option>M-Pesa</option><option>Card</option><option>Bank transfer</option></select></label>
          {meth === "M-Pesa" && <label>M-Pesa phone number<input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" required /></label>}
          <label>Amount (KES)<input type="number" min="100" step="50" value={amt} onChange={(e) => setAmt(e.target.value)} required /></label>
          {blocked && <div className="badge b-ok" style={{ width: "max-content" }}>This month’s contribution is paid. Use voluntary to add more.</div>}
          <button className="btn" disabled={blocked}>Pay {fmt(amt || 0)}</button>
        </form>
      </div>
    </>
  );
}

const STATUS = { pending: ["Waiting for guarantors", "b-wait"], review: ["With loans officer", "b-wait"], approved: ["Approved and paid out", "b-ok"], rejected: ["Rejected by officer", "b-bad"], declined: ["Guarantor declined", "b-bad"] };
function Steps({ l }) {
  const n = { pending: 1, review: 2, approved: 4, rejected: 3, declined: 1 }[l.status];
  return <div className="steps">{["Applied", "Guarantors accept", "Officer reviews", "Paid out"].map((t, i) => <div key={t} className={"st " + (i < n ? "on" : "")}><b />{t}</div>)}</div>;
}
function LoanCard({ l, who }) {
  const b = STATUS[l.status];
  return (
    <div className="card loan">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "start" }}>
        <div><b>{fmt(l.amount)}</b> over {l.months} months{who ? " · " + l.applicantName : ""}<div className="muted">{l.purpose} · applied {fd(l.createdAt)} · {fmt(repayment(l))} a month</div></div>
        <span className={"badge " + b[1]}>{b[0]}</span>
      </div>
      <Steps l={l} />
      <div className="muted">Guarantors: {l.guarantors.map((g) => g.name + " (" + g.status + ")").join(", ")}</div>
    </div>
  );
}

function Loans({ user, d, run, say }) {
  const [a, setA] = useState(""), [m, setM] = useState(12), [p, setP] = useState(""), [g, setG] = useState([]);
  const limit = sumBy(d.contribs) * LOAN_MULTIPLE;
  const toggle = (id) => setG((x) => x.includes(id) ? x.filter((i) => i !== id) : x.length < 2 ? [...x, id] : (say("Pick exactly 2 guarantors"), x));
  const submit = async (e) => {
    e.preventDefault();
    if (g.length !== 2) return say("Choose 2 guarantors before sending");
    const ok = await run(() => api.applyLoan({ amount: +a, months: +m, purpose: p, guarantorIds: g }), "Sent. Your guarantors can now accept.");
    if (ok) { setA(""); setP(""); setG([]); }
  };
  const my = d.loans.filter((l) => l.applicantId === user.id);
  return (
    <>
      <div className="hd"><div><h1>Loans</h1><div className="muted">Borrow up to {fmt(limit)}, {LOAN_MULTIPLE}× your contributions.</div></div></div>
      <div className="two">
        <div className="card">
          <h3>Apply for a loan</h3>
          <form onSubmit={submit}>
            <label>Amount (KES)<input type="number" min="5000" max={limit} step="1000" value={a} onChange={(e) => setA(e.target.value)} required /></label>
            <label>Repay over<select value={m} onChange={(e) => setM(e.target.value)}>{[6, 12, 18, 24].map((x) => <option key={x} value={x}>{x} months</option>)}</select></label>
            <label>What is it for?<input value={p} onChange={(e) => setP(e.target.value)} placeholder="School fees, stock, rent deposit" required /></label>
            {+a ? <div className="muted">You repay <b>{fmt((a * (1 + INTEREST_PER_MONTH * m)) / m)}</b> a month, {fmt(a * (1 + INTEREST_PER_MONTH * m))} in total (1% a month, flat).</div> : null}
            <div style={{ display: "grid", gap: 8 }}>
              <b style={{ fontSize: 14 }}>Choose 2 guarantors ({g.length}/2)</b>
              {d.members.map((o) => (
                <label className="g" key={o.id} data-on={g.includes(o.id)}>
                  <span className="av">{initials(o.name)}</span>
                  <div>{o.name}<div className="muted">Can guarantee {fmt(Math.max(0, o.savings - o.guaranteed))}</div></div>
                  <input type="checkbox" checked={g.includes(o.id)} onChange={() => toggle(o.id)} />
                </label>
              ))}
            </div>
            <button className="btn">Send application</button>
          </form>
        </div>
        <div>
          <h3 style={{ marginBottom: 12 }}>Your loans</h3>
          {my.length ? my.map((l) => <LoanCard key={l.id} l={l} />) : <div className="card empty">No loans yet. Apply on the left.</div>}
        </div>
      </div>
    </>
  );
}

function Requests({ user, d, run }) {
  const rs = d.loans.filter((l) => l.guarantors.some((g) => g.userId === user.id));
  const mySavings = sumBy(d.contribs);
  return (
    <>
      <div className="hd"><div><h1>Guarantee requests</h1><div className="muted">Members who asked you to stand behind their loan.</div></div></div>
      {rs.length ? rs.map((l) => {
        const mg = l.guarantors.find((g) => g.userId === user.id);
        return (
          <div className="card loan" key={l.id}>
            <div className="row" style={{ alignItems: "center" }}>
              <span className="av">{initials(l.applicantName)}</span>
              <div><b>{l.applicantName}</b> wants {fmt(l.amount)} for {l.purpose}.<div className="muted">You would stand behind {fmt(l.amount / 2)}, from your {fmt(mySavings)} in contributions.</div></div>
            </div>
            {mg.status === "waiting" && l.status === "pending" ? (
              <div className="row" style={{ marginTop: 12 }}>
                <button className="btn" onClick={() => run(() => api.respondGuarantee(l.id, true), "You accepted")}>Accept</button>
                <button className="btn alt" onClick={() => run(() => api.respondGuarantee(l.id, false), "You declined")}>Decline</button>
              </div>
            ) : <div style={{ marginTop: 10 }}><span className={"badge " + (mg.status === "accepted" ? "b-ok" : "b-bad")}>You {mg.status}</span></div>}
          </div>
        );
      }) : <div className="card empty">No one has asked you to guarantee a loan.</div>}
    </>
  );
}

/* ---------- Officer and admin pages ---------- */
function Queue({ user, d, run }) {
  const q = d.loans.filter((l) => l.status === "review");
  const involved = (l) => l.applicantId === user.id || l.guarantors.some((g) => g.userId === user.id);
  return (
    <>
      <div className="hd"><div><h1>Approvals</h1><div className="muted">Loans where both guarantors have accepted.</div></div></div>
      {q.length ? q.map((l) => (
        <div className="card loan" key={l.id}>
          <b>{l.applicantName}</b> asks for {fmt(l.amount)} over {l.months} months.
          <div className="muted">{l.purpose} · pay {fmt(l.applicantSalary)} · contributions {fmt(l.applicantSavings)} · repayment {fmt(repayment(l))} a month ({l.applicantSalary ? Math.round((repayment(l) / l.applicantSalary) * 100) : "?"}% of pay)</div>
          <div className="muted">Guarantors: {l.guarantors.map((g) => g.name).join(" and ")}, both accepted</div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" disabled={involved(l)} onClick={() => run(() => api.decideLoan(l.id, true), "Loan approved")}>Approve and pay out</button>
            <button className="btn bad" disabled={involved(l)} onClick={() => run(() => api.decideLoan(l.id, false), "Application rejected")}>Reject</button>
          </div>
          {involved(l) && <div className="muted" style={{ marginTop: 8 }}>You applied for or guarantee this loan, so another approver must decide it.</div>}
        </div>
      )) : <div className="card empty">Nothing to review. Applications appear here once both guarantors accept.</div>}
    </>
  );
}

function AllLoans({ d }) {
  return (
    <>
      <div className="hd"><h1>All loans</h1></div>
      {d.loans.length ? d.loans.map((l) => <LoanCard key={l.id} l={l} who />) : <div className="card empty">No loan applications yet.</div>}
    </>
  );
}

function Users({ user, d, run }) {
  const sup = can.manage(user.role);
  const list = [...d.users].sort((a, b) => (b.status === "pending") - (a.status === "pending"));
  const BS = { active: "b-ok", pending: "b-wait", suspended: "b-bad" };
  return (
    <>
      <div className="hd"><div><h1>Members</h1><div className="muted">{sup ? "Approve sign-ups, choose roles and suspend accounts." : "Approve new members."}</div></div></div>
      <div className="card"><div className="scroll"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th>{sup && <th className="n">Contributions</th>}<th /></tr></thead>
        <tbody>
          {list.map((u) => {
            const self = u.id === user.id;
            return (
              <tr key={u.id}>
                <td>{u.name}</td><td>{u.email}</td>
                <td>{sup && !self
                  ? <select aria-label={"Role for " + u.name} value={u.role} style={{ width: "auto" }} onChange={(e) => run(() => api.updateUser(u.id, { role: e.target.value }), "Role updated")}>{Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                  : ROLE[u.role]}</td>
                <td><span className={"badge " + BS[u.status]}>{u.status}</span></td>
                {sup && <td className="n">{fmt(u.savings)}</td>}
                <td>{self ? null : u.status === "pending"
                  ? <button className="btn" onClick={() => run(() => api.updateUser(u.id, { status: "active" }), u.name + " approved")}>Approve</button>
                  : sup ? (u.status === "active"
                    ? <button className="btn alt" onClick={() => run(() => api.updateUser(u.id, { status: "suspended" }), u.name + " suspended")}>Suspend</button>
                    : <button className="btn alt" onClick={() => run(() => api.updateUser(u.id, { status: "active" }), u.name + " reactivated")}>Reactivate</button>) : null}</td>
              </tr>
            );
          })}
        </tbody>
      </table></div></div>
    </>
  );
}

function PostsAdmin({ d, run, say }) {
  const blank = { title: "", body: "", category: "News", eventDate: "", featured: false, image: null };
  const [f, setF] = useState(blank);
  const [prev, setPrev] = useState(null);
  const [k, setK] = useState(0);
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value });
  const pick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return say("Choose an image file");
    if (file.size > 8 * 1024 * 1024) return say("That image is over 8 MB");
    setF({ ...f, image: file }); setPrev(URL.createObjectURL(file));
  };
  const submit = async (e) => {
    e.preventDefault();
    if (f.featured && !f.image) return say("Add an image to show this in the carousel");
    const ok = await run(() => api.createPost({ title: f.title, body: f.body, category: f.category, eventDate: f.category === "Event" ? f.eventDate : "", featured: f.featured, image: f.image }), "Post published");
    if (ok) { setF(blank); setPrev(null); setK(k + 1); }
  };
  return (
    <>
      <div className="hd"><div><h1>Posts and news</h1><div className="muted">What you publish here shows on the public page.</div></div></div>
      <div className="two">
        <div className="card">
          <h3>New post</h3>
          <form onSubmit={submit}>
            <label>Title<input value={f.title} onChange={set("title")} required /></label>
            <label>Type<select value={f.category} onChange={set("category")}><option>News</option><option>Event</option><option>Notice</option></select></label>
            {f.category === "Event" && <label>Event date<input type="date" value={f.eventDate} onChange={set("eventDate")} required /></label>}
            <label>Text<textarea value={f.body} onChange={set("body")} required /></label>
            <label>Image (optional)<input key={k} type="file" accept="image/*" onChange={pick} /></label>
            {prev && <img src={prev} alt="Preview of the chosen image" style={{ width: "100%", borderRadius: 8, aspectRatio: "16/7", objectFit: "cover" }} />}
            <label className="g" data-on={f.featured}><div>Show in the home carousel<div className="muted">Needs an image</div></div><input type="checkbox" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} /></label>
            <button className="btn">Publish</button>
          </form>
        </div>
        <div>
          <h3 style={{ marginBottom: 12 }}>Published ({d.posts.length})</h3>
          {d.posts.length ? d.posts.map((p) => (
            <div className="card loan" key={p.id}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "start" }}>
                <div><b>{p.title}</b><div className="muted">{p.category} · {fd(p.createdAt)} · {p.author}{p.imageUrl ? "" : " · no image"}</div></div>
                {p.featured && <span className="badge b-ok">In carousel</span>}
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                {p.imageUrl && <button className="btn alt" onClick={() => run(() => api.updatePost(p.id, { featured: !p.featured }), p.featured ? "Removed from carousel" : "Added to carousel")}>{p.featured ? "Remove from carousel" : "Add to carousel"}</button>}
                <button className="btn bad" onClick={() => window.confirm("Delete this post?") && run(() => api.deletePost(p.id), "Post deleted")}>Delete</button>
              </div>
            </div>
          )) : <div className="card empty">No posts yet.</div>}
        </div>
      </div>
    </>
  );
}

/* ---------- Public SACCO dashboard (no sign-in) ---------- */
const monthLabel = (k) => new Date(k + "-01").toLocaleString("en-KE", { month: "short" });

function SaccoDashboard() {
  const [s, setS] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { api.stats().then(setS).catch((e) => setErr(e.message)); }, []);
  if (err) return <div className="err" role="alert">{err}</div>;
  if (!s) return <div className="muted">Loading…</div>;
  const mx = Math.max(...s.byMonth.map((b) => b.monthly + b.voluntary), 1);
  const lent = s.totalContributions ? Math.round((s.loansDisbursed.amount / s.totalContributions) * 100) : 0;
  return (
    <>
      <div className="grid">
        <div className="card stat hero"><div className="muted">Total contributions</div><div className="big">{fmt(s.totalContributions)}</div></div>
        <div className="card stat"><div className="muted">Members</div><div className="big">{s.members}</div><div className="muted">About {fmt(s.members ? s.totalContributions / s.members : 0)} each</div></div>
        <div className="card stat"><div className="muted">Loans paid out</div><div className="big">{fmt(s.loansDisbursed.amount)}</div><div className="muted">{s.loansDisbursed.count} {s.loansDisbursed.count === 1 ? "loan" : "loans"}</div></div>
        <div className="card stat"><div className="muted">Applications in progress</div><div className="big">{s.applicationsInProgress}</div></div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Contributions by month</h3>
        <div className="chart">
          {s.byMonth.map((b) => (
            <div className="col" key={b.period} tabIndex={0}>
              <div className="tip">{monthLabel(b.period)}: {fmt(b.monthly)} monthly, {fmt(b.voluntary)} voluntary</div>
              <div className="stack" style={{ height: ((b.monthly + b.voluntary) / mx) * 80 + "%" }}><div className="m" style={{ flex: b.monthly }} /><div className="v" style={{ flex: b.voluntary }} /></div>
              {monthLabel(b.period)}
            </div>
          ))}
        </div>
        <div className="muted" style={{ marginTop: 10 }}><span className="dot m" />Monthly {fmt(s.monthlyContributions)} <span className="dot v" style={{ marginLeft: 14 }} />Voluntary {fmt(s.voluntaryContributions)}</div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Savings lent out</h3>
        <div className="prog" role="img" aria-label={lent + " percent of contributions lent out"}><i style={{ width: Math.min(100, lent) + "%" }} /></div>
        <div className="muted" style={{ marginTop: 8 }}>{lent}% of all contributions has been paid out as loans.</div>
      </div>
      <p className="muted" style={{ marginTop: 16 }}>Totals for the whole SACCO. Only signed-in members can see these.</p>
    </>
  );
}

function DashPage() {
  return (
    <>
      <div className="hd"><div><h1>SACCO finances</h1><div className="muted">Totals for the whole SACCO. Only signed-in members see this.</div></div></div>
      <SaccoDashboard />
    </>
  );
}

/* ---------- News, events and carousel (public) ---------- */
const excerpt = (t, n = 120) => (t.length > n ? t.slice(0, n).trimEnd() + "…" : t);

function Carousel({ slides }) {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const n = slides.length;
  useEffect(() => {
    if (n < 2 || hold || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 5500);
    return () => clearInterval(t);
  }, [n, hold]);
  const go = (k) => setI((k + n) % n);
  const cur = Math.min(i, n - 1);
  return (
    <div className="car" role="region" aria-roledescription="carousel" aria-label="SACCO highlights"
      onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}>
      {slides.map((s, k) => (
        <div className={"slide" + (k === cur ? " on" : "")} key={s.id} aria-hidden={k !== cur}>
          <img src={s.imageUrl} alt="" />
          <div className="cap"><span className="badge b-wait">{s.category}</span><h2>{s.title}</h2><p>{excerpt(s.body)}</p></div>
        </div>
      ))}
      {n > 1 && (
        <>
          <button className="cbtn l" aria-label="Previous slide" onClick={() => go(cur - 1)}>‹</button>
          <button className="cbtn r" aria-label="Next slide" onClick={() => go(cur + 1)}>›</button>
          <div className="dots">{slides.map((s, k) => <button key={s.id} aria-label={"Show slide " + (k + 1)} aria-current={k === cur} onClick={() => setI(k)} />)}</div>
        </>
      )}
    </div>
  );
}

function PostCard({ p }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="card post">
      {p.imageUrl ? <img src={p.imageUrl} alt="" /> : null}
      <div className="pb">
        <div className="row" style={{ alignItems: "center" }}><span className="badge b-ok">{p.category}</span><span className="muted">{fd(p.createdAt)}</span></div>
        <h3>{p.title}</h3>
        <div className={open ? "" : "clamp"}>{p.body}</div>
        {p.body.length > 120 && <button className="link" style={{ justifySelf: "start" }} onClick={() => setOpen(!open)}>{open ? "Show less" : "Read more"}</button>}
      </div>
    </article>
  );
}

function Community({ posts }) {
  const slides = posts.filter((p) => p.featured && p.imageUrl);
  const today = new Date().toISOString().slice(0, 10);
  const events = posts.filter((p) => p.category === "Event" && p.eventDate >= today).sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  return (
    <>
      {slides.length ? <Carousel slides={slides} /> : null}
      <div className="comm">
        <section>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Latest news</h2>
          {posts.length ? <div className="news">{posts.map((p) => <PostCard key={p.id} p={p} />)}</div> : <div className="card empty">No news yet. Check back soon.</div>}
        </section>
        <aside className="card">
          <h3>Upcoming events</h3>
          {events.length ? events.map((e) => {
            const dt = new Date(e.eventDate);
            return (
              <div className="ev" key={e.id}>
                <div className="date">{dt.getDate()}<small>{dt.toLocaleString("en-KE", { month: "short" })}</small></div>
                <div><b>{e.title}</b></div>
              </div>
            );
          }) : <div className="empty">No events scheduled.</div>}
        </aside>
      </div>
    </>
  );
}

function NewsPage({ d }) {
  return (
    <>
      <div className="hd"><div><h1>News and events</h1><div className="muted">What is happening at Birch.</div></div></div>
      <Community posts={d.posts} />
    </>
  );
}

function PublicPage({ onSignIn, onJoin }) {
  const [posts, setPosts] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { api.posts().then(setPosts).catch((e) => setErr(e.message)); }, []);
  return (
    <>
      <header className="pubbar">
        <div className="brand">Birch</div>
        <div className="row"><button className="btn alt" onClick={onSignIn}>Sign in</button><button className="btn" onClick={onJoin}>Join</button></div>
      </header>
      <div className="pubmain">
        <div className="hd"><div><h1>Birch</h1><div className="muted">Saving together. News and events from our members.</div></div></div>
        {err ? <div className="err" role="alert">{err}</div> : posts ? <Community posts={posts} /> : <div className="muted">Loading…</div>}
      </div>
    </>
  );
}
