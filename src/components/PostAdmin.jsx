import { useState } from "react";
import { fmt, fd, ROLE, can, initials, repayment, sumBy, lastPeriods, currentPeriod, MONTHLY_RATE, LOAN_MULTIPLE, INTEREST_PER_MONTH } from "../lib.js";


function PostsAdmin({ d, run, say }) {
  const blank = { title: "", body: "", category: "News", eventDate: "", featured: false, image: null };
  const [f, setF] = useState(blank);
  const [prev, setPrev] = useState(null);
  const [k, setK] = useState(0);
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value });
  const pick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return say("Choose an image file");
    if (file.size > 8 * 1024 * 1024) return say("That image is over 8 MB");
    setF({ ...f, image: file }); setPrev(URL.createObjectURL(file));
  };
  const submit = async (e) => {
    e.preventDefault();
    if (f.featured && !f.image) return say("Add an image to show this in the carousel");
    const ok = await run(() => api.createPost({ title: f.title, body: f.body, category: f.category, eventDate: f.category === "Event" ? f.eventDate : "", featured: f.featured, image: f.image }), "Post published");
    if (ok) { setF(blank); setPrev(null); setK(k + 1); }
  };
  return (
    <>
      <div className="hd"><div><h1>Posts and news</h1><div className="muted">What you publish here shows on the public page.</div></div></div>
      <div className="two">
        <div className="card">
          <h3>New post</h3>
          <form onSubmit={submit}>
            <label>Title<input value={f.title} onChange={set("title")} required /></label>
            <label>Type<select value={f.category} onChange={set("category")}><option>News</option><option>Event</option><option>Notice</option></select></label>
            {f.category === "Event" && <label>Event date<input type="date" value={f.eventDate} onChange={set("eventDate")} required /></label>}
            <label>Text<textarea value={f.body} onChange={set("body")} required /></label>
            <label>Image (optional)<input key={k} type="file" accept="image/*" onChange={pick} /></label>
            {prev && <img src={prev} alt="Preview of the chosen image" style={{ width: "100%", borderRadius: 8, aspectRatio: "16/7", objectFit: "cover" }} />}
            <label className="g" data-on={f.featured}><div>Show in the home carousel<div className="muted">Needs an image</div></div><input type="checkbox" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} /></label>
            <button className="btn">Publish</button>
          </form>
        </div>
        <div>
          <h3 style={{ marginBottom: 12 }}>Published ({d.posts.length})</h3>
          {d.posts.length ? d.posts.map((p) => (
            <div className="card loan" key={p.id}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "start" }}>
                <div><b>{p.title}</b><div className="muted">{p.category} · {fd(p.createdAt)} · {p.author}{p.imageUrl ? "" : " · no image"}</div></div>
                {p.featured && <span className="badge b-ok">In carousel</span>}
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                {p.imageUrl && <button className="btn alt" onClick={() => run(() => api.updatePost(p.id, { featured: !p.featured }), p.featured ? "Removed from carousel" : "Added to carousel")}>{p.featured ? "Remove from carousel" : "Add to carousel"}</button>}
                <button className="btn bad" onClick={() => window.confirm("Delete this post?") && run(() => api.deletePost(p.id), "Post deleted")}>Delete</button>
              </div>
            </div>
          )) : <div className="card empty">No posts yet.</div>}
        </div>
      </div>
    </>
  );
}
export default PostsAdmin;