import Community from "./Community";

function NewsPage({ d }) {
  return (
    <>
      <div className="hd"><div><h1>News and events</h1><div className="muted">What is happening at Birch.</div></div></div>
      <Community posts={d.posts} />
    </>
  );
}

export default NewsPage;