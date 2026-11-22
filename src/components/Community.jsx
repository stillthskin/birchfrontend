import Carousel from "./Corousel";
import PostCard from "./PostCard";
import { useState } from "react";

function Community({ posts }) {
  const slides = posts.filter((p) => p.featured && p.imageUrl);
  const today = new Date().toISOString().slice(0, 10);
  const events = posts.filter((p) => p.category === "Event" && p.eventDate >= today).sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  return (
    <>
      {slides.length ? <Carousel slides={slides} /> : null}
      <div className="comm">
        <section>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Latest news</h2>
          {posts.length ? <div className="news">{posts.map((p) => <PostCard key={p.id} p={p} />)}</div> : <div className="card empty">No news yet. Check back soon.</div>}
        </section>
        <aside className="card">
          <h3>Upcoming events</h3>
          {events.length ? events.map((e) => {
            const dt = new Date(e.eventDate);
            return (
              <div className="ev" key={e.id}>
                <div className="date">{dt.getDate()}<small>{dt.toLocaleString("en-KE", { month: "short" })}</small></div>
                <div><b>{e.title}</b></div>
              </div>
            );
          }) : <div className="empty">No events scheduled.</div>}
        </aside>
      </div>
    </>
  );
}
export default Community;