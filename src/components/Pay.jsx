import {useState} from "react";
import { fmt, fd, ROLE, can, initials, repayment, sumBy, lastPeriods, currentPeriod, MONTHLY_RATE, LOAN_MULTIPLE, INTEREST_PER_MONTH } from "../lib.js";


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

export default Pay;