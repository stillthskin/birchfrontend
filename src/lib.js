export const fmt = (n) => "KES " + Math.round(n).toLocaleString("en-KE");
export const fd = (d) => new Date(d).toLocaleDateString("en-KE", { day: "2-digit", month: "short" });
export const MONTHLY_RATE = 0.1; // monthly contribution as a share of pay
export const LOAN_MULTIPLE = 3; // borrow up to 3x contributions
export const INTEREST_PER_MONTH = 0.01; // flat
export const ROLE = { member: "Member", officer: "Loans officer", admin: "Administrator", super_admin: "Super admin" };
// Everyone is a member. These are the extra powers each role has.
export const can = {
  loans: (r) => r === "officer" || r === "super_admin", // approve loans, see all loans
  members: (r) => r === "admin" || r === "super_admin", // approve new members
  posts: (r) => r === "admin" || r === "super_admin", // publish news and posts
  manage: (r) => r === "super_admin", // change roles, suspend, see member finances
};
export const initials = (n) => n.split(" ").map((x) => x[0]).join("").slice(0, 2);
export const repayment = (l) => (l.amount * (1 + INTEREST_PER_MONTH * l.months)) / l.months;
export const sumBy = (list, fn = () => true) => list.filter(fn).reduce((a, c) => a + c.amount, 0);
export const lastPeriods = (n = 6) => {
  const d = new Date();
  return Array.from({ length: n }, (_, i) => {
    const x = new Date(d.getFullYear(), d.getMonth() - (n - 1 - i), 1);
    return { key: x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0"), label: x.toLocaleString("en-KE", { month: "short" }), year: x.getFullYear() };
  });
};
export const currentPeriod = () => lastPeriods(1)[0].key;
