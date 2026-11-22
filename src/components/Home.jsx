/* ---------- Member pages ---------- */
import { fmt, fd, ROLE, can, initials, repayment, sumBy, lastPeriods, currentPeriod, MONTHLY_RATE, LOAN_MULTIPLE, INTEREST_PER_MONTH } from "../lib.js";


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

export default Home;