import {useState} from "react";
import { fmt, fd, ROLE, can, initials, repayment, sumBy, lastPeriods, currentPeriod, MONTHLY_RATE, LOAN_MULTIPLE, INTEREST_PER_MONTH } from "../lib.js";


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

export default Contribs;