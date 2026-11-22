import { useState, useCallback, useEffect,Fragment } from "react";
import Home from "./Home.jsx";
import Contribs from "./Contribs.jsx";
import Pay from "./Pay.jsx";
import Loans from "./Loan.jsx";
import Requests from "./Requests.jsx";
import NewsPage from "./NewsPage.jsx";
import DashPage from "./DashPage.jsx";
import PostsAdmin from "./PostAdmin.jsx";
import Queue from "./Queues.jsx";
import AllLoans from "./AllLoans.jsx";
import Users from "./Users.jsx";
import { api, USE_MOCK, getToken, setOnAuthLost } from "../api/index.js";

import { fmt, fd, ROLE, can, initials, repayment, sumBy, lastPeriods, currentPeriod, MONTHLY_RATE, LOAN_MULTIPLE, INTEREST_PER_MONTH } from "../lib.js";

/* ---------- Shell ---------- */

const Ic = ({ n }) => <svg viewBox="0 0 24 24" aria-hidden="true"><path d={ICON[n]} /></svg>;

const ICON = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  plus: "M12 5v14M5 12h14",
  coin: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 12h6M12 9v6",
  users: "M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0",
  check: "M5 12l5 5L20 7",
  all: "M4 5h16M4 12h16M4 19h16",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  news: "M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h6M8 13h6",
  edit: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
};

function Shell({ user, onLogout }) {
  const [tab, setTab] = useState("home");
  const [d, setD] = useState(null);
  const [toast, setT] = useState(null);
  const [modal, setModal] = useState(null);
  const say = (t) => { setT(t); setTimeout(() => setT(null), 2800); };

  const refresh = useCallback(async () => {
    const [members, contribs, loans, users, posts] = await Promise.all([
      api.members(), api.contributions(), api.loans(), can.members(user.role) ? api.users() : [], api.posts(),
    ]);
    setD({ members, contribs, loans, users, posts });
  }, [user.id]);
  useEffect(() => { refresh().catch((e) => say(e.message)); }, [refresh]);

  const run = async (fn, okMsg) => {
    try { await fn(); await refresh(); if (okMsg) say(okMsg); return true; }
    catch (e) { say(e.message); return false; }
  };

  const reqs = d ? d.loans.filter((l) => l.status === "pending" && l.guarantors.some((g) => g.userId === user.id && g.status === "waiting")).length : 0;
  const queue = d ? d.loans.filter((l) => l.status === "review").length : 0;
  const pend = d ? d.users.filter((u) => u.status === "pending").length : 0;
  const memberNav = [["home", "Overview", "home"], ["contribs", "Contributions", "list"], ["pay", "Contribute", "plus"], ["loans", "Loans", "coin"], ["req", "Guarantee", "users", reqs], ["news", "News", "news"], ["dash", "Finances", "chart"]];
  const staffNav = [
    ...(can.loans(user.role) ? [["queue", "Approvals", "check", queue], ["all", "All loans", "all"]] : []),
    ...(can.posts(user.role) ? [["posts", "Posts", "edit"]] : []),
    ...(can.members(user.role) ? [["users", "Members", "users", pend]] : []),
  ];
  const nav = [...memberNav, ...staffNav];
  const cur = nav.some((n) => n[0] === tab) ? tab : nav[0][0];
  const View = { home: Home, contribs: Contribs, pay: Pay, loans: Loans, req: Requests, news: NewsPage, dash: DashPage, posts: PostsAdmin, queue: Queue, all: AllLoans, users: Users }[cur];

  return (
    <div className="app">
      <nav className="side" aria-label="Main">
        <div className="brand">Birch</div>
        {nav.map(([id, label, ic, count], i) => (
          <Fragment key={id}>
            {i === memberNav.length && staffNav.length ? <div className="sep">Staff</div> : null}
            <button className="nb" aria-current={cur === id ? "page" : undefined} onClick={() => setTab(id)}>
              <Ic n={ic} />{label}{count ? <span className="pill">{count}</span> : null}
            </button>
          </Fragment>
        ))}
        <div className="me">
          <b>{user.name}</b><span style={{ opacity: 0.7 }}>{ROLE[user.role]}</span>
          <button className="out" onClick={onLogout}>Sign out</button>
        </div>
      </nav>
      <main>
        <div className="mobwho"><div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}><span><b>{user.name}</b> <span className="muted">· {ROLE[user.role]}</span></span><button className="link" onClick={onLogout}>Sign out</button></div></div>
        {d ? <View user={user} d={d} go={setTab} run={run} say={say} setModal={setModal} /> : <div className="muted">Loading…</div>}
      </main>
      {modal && <div className="modal" role="dialog" aria-modal="true"><div><div className="spin" /><h3>{modal.title}</h3><p className="muted">{modal.text}</p></div></div>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

export default Shell;