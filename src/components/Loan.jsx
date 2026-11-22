import {useState} from "react";
import { fmt, fd, ROLE, can, initials, repayment, sumBy, lastPeriods, currentPeriod, MONTHLY_RATE, LOAN_MULTIPLE, INTEREST_PER_MONTH } from "../lib.js";


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

export default Loans;