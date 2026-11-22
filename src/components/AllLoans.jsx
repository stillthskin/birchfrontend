function AllLoans({ d }) {
  return (
    <>
      <div className="hd"><h1>All loans</h1></div>
      {d.loans.length ? d.loans.map((l) => <LoanCard key={l.id} l={l} who />) : <div className="card empty">No loan applications yet.</div>}
    </>
  );
}

export default AllLoans;