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