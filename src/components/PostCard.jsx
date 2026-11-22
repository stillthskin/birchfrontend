import { fmt, fd, ROLE, can, initials, repayment, sumBy, lastPeriods, currentPeriod, MONTHLY_RATE, LOAN_MULTIPLE, INTEREST_PER_MONTH } from "../lib.js";

import { useState } from "react";
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

export default PostCard;