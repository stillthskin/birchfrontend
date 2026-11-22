import { fmt, fd, ROLE, can, initials, repayment, sumBy, lastPeriods, currentPeriod, MONTHLY_RATE, LOAN_MULTIPLE, INTEREST_PER_MONTH } from "../lib.js";


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

export default Requests;