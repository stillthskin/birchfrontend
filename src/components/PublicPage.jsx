import { Fragment, useCallback, useEffect, useState } from "react";
import { api, USE_MOCK, getToken, setOnAuthLost } from "../api/index.js";
import Community  from "./Community.jsx";


function PublicPage({ onSignIn, onJoin }) {
  const [posts, setPosts] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { api.posts().then(setPosts).catch((e) => setErr(e.message)); }, []);
  return (
    <>
      <header className="pubbar">
        <div className="brand">Birch</div>
        <div className="row"><button className="btn alt" onClick={onSignIn}>Sign in</button><button className="btn" onClick={onJoin}>Join</button></div>
      </header>
      <div className="pubmain">
        <div className="hd"><div><h1>Birch</h1><div className="muted">Saving together. News and events from our members.</div></div></div>
        {err ? <div className="err" role="alert">{err}</div> : posts ? <Community posts={posts} /> : <div className="muted">Loading…</div>}
      </div>
    </>
  );
}
export default PublicPage;