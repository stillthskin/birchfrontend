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

export default Queue;