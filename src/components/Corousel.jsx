import { useState ,useEffect} from "react";
/* ---------- News, events and carousel (public) ---------- */
const excerpt = (t, n = 120) => (t.length > n ? t.slice(0, n).trimEnd() + "…" : t);




function Carousel({ slides }) {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const n = slides.length;
  useEffect(() => {
    if (n < 2 || hold || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 5500);
    return () => clearInterval(t);
  }, [n, hold]);
  const go = (k) => setI((k + n) % n);
  const cur = Math.min(i, n - 1);
  return (
    <div className="car" role="region" aria-roledescription="carousel" aria-label="SACCO highlights"
      onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}>
      {slides.map((s, k) => (
        <div className={"slide" + (k === cur ? " on" : "")} key={s.id} aria-hidden={k !== cur}>
          <img src={s.imageUrl} alt="" />
          <div className="cap"><span className="badge b-wait">{s.category}</span><h2>{s.title}</h2><p>{excerpt(s.body)}</p></div>
        </div>
      ))}
      {n > 1 && (
        <>
          <button className="cbtn l" aria-label="Previous slide" onClick={() => go(cur - 1)}>‹</button>
          <button className="cbtn r" aria-label="Next slide" onClick={() => go(cur + 1)}>›</button>
          <div className="dots">{slides.map((s, k) => <button key={s.id} aria-label={"Show slide " + (k + 1)} aria-current={k === cur} onClick={() => setI(k)} />)}</div>
        </>
      )}
    </div>
  );
}

export default Carousel;