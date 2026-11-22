import { fmt, fd, ROLE, can, initials, repayment, sumBy, lastPeriods, currentPeriod, MONTHLY_RATE, LOAN_MULTIPLE, INTEREST_PER_MONTH } from "../lib.js";
import { api, USE_MOCK, getToken, setOnAuthLost } from "../api/index.js";


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

export default Users;