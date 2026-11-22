import { useState,useEffect } from "react";
import { api, USE_MOCK, getToken, setOnAuthLost } from "../api/index.js";
import { fmt, fd, ROLE, can, initials, repayment, sumBy, lastPeriods, currentPeriod, MONTHLY_RATE, LOAN_MULTIPLE, INTEREST_PER_MONTH } from "../lib.js";

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

export default SaccoDashboard;