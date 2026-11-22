import { Fragment, useCallback, useEffect, useState } from "react";
import { api, USE_MOCK, getToken, setOnAuthLost } from "./api/index.js";
import  PublicPage from "./components/PublicPage";
import AuthScreen from "./components/AuthScreen";
import Shell from "./components/Shell.jsx";
import { fmt, fd, ROLE, can, initials, repayment, sumBy, lastPeriods, currentPeriod, MONTHLY_RATE, LOAN_MULTIPLE, INTEREST_PER_MONTH } from "./lib.js";

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

/* ---------- Auth gate ---------- */
export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(!!getToken());
  const [screen, setScreen] = useState("public"); // public | login | register
  useEffect(() => {
    setOnAuthLost(() => setUser(null));
    if (getToken()) api.me().then(setUser).catch(() => api.logout()).finally(() => setBooting(false));
  }, []);
  if (booting) return <div className="boot muted">Loading…</div>;
  if (!user)
    return screen === "public"
      ? <PublicPage onSignIn={() => setScreen("login")} onJoin={() => setScreen("register")} />
      : <AuthScreen key={screen} initialMode={screen} onLogin={setUser} onBack={() => setScreen("public")} />;
  return <Shell user={user} onLogout={() => { api.logout(); setUser(null); setScreen("public"); }} />;
}








const STATUS = { pending: ["Waiting for guarantors", "b-wait"], review: ["With loans officer", "b-wait"], approved: ["Approved and paid out", "b-ok"], rejected: ["Rejected by officer", "b-bad"], declined: ["Guarantor declined", "b-bad"] };
function Steps({ l }) {
  const n = { pending: 1, review: 2, approved: 4, rejected: 3, declined: 1 }[l.status];
  return <div className="steps">{["Applied", "Guarantors accept", "Officer reviews", "Paid out"].map((t, i) => <div key={t} className={"st " + (i < n ? "on" : "")}><b />{t}</div>)}</div>;
}























