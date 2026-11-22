import SaccoDashboard from "./SaccoDashboard";

function DashPage() {
  return (
    <>
      <div className="hd"><div><h1>SACCO finances</h1><div className="muted">Totals for the whole SACCO. Only signed-in members see this.</div></div></div>
      <SaccoDashboard />
    </>
  );
}

export default DashPage;