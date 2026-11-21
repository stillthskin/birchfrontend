// In-browser stand-in for your backend so the UI runs on its own.
// Data is kept in localStorage. It mirrors the contract in README.md.
// Demo logins (password "password"): jane@birch.test (member), mary@birch.test (loans officer),
// admin@birch.test (admin: news + new members), super@birch.test (super admin: everything).
// Officers and admins are members too: they contribute, borrow and guarantee like anyone else.
import { lastPeriods, currentPeriod, MONTHLY_RATE, LOAN_MULTIPLE, can } from "../lib.js";

const KEY = "birch_mock_db_v3";
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const art = (a, b, shapes) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 520"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="1200" height="520" fill="url(#g)"/>${shapes}</svg>`);
const toDataUrl = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 1200 / img.width), c = document.createElement("canvas");
      c.width = img.width * s; c.height = img.height * s;
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => rej(new Error("That file is not a readable image."));
    img.src = r.result;
  };
  r.onerror = () => rej(new Error("Could not read the file."));
  r.readAsDataURL(file);
});
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const ACTIVE = ["pending", "review", "approved"];

function seed() {
  const P = lastPeriods(6).map((p) => p.key);
  const mk = (id, name, email, phone, salary, role = "member", status = "active") => ({ id, name, email, phone, salary, role, status, password: "password" });
  const users = [
    mk("u1", "Jane Wanjiku", "jane@birch.test", "0712345678", 85000),
    mk("u2", "Peter Otieno", "peter@birch.test", "0722111222", 120000),
    mk("u3", "Amina Hassan", "amina@birch.test", "0733222333", 95000),
    mk("u4", "David Kiprop", "david@birch.test", "0711333444", 70000),
    mk("u5", "Grace Njeri", "grace@birch.test", "0700444555", 150000),
    mk("u6", "Faith Mwende", "faith@birch.test", "0799555666", 60000, "member", "pending"),
    mk("u0", "Mary Achieng", "mary@birch.test", "0701000111", 110000, "officer"),
    mk("a1", "Samuel Mutua", "admin@birch.test", "0702000222", 130000, "admin"),
    mk("s1", "Joseph Karanja", "super@birch.test", "0703000333", 150000, "super_admin"),
  ];
  const VOL = { u1: [[2, 5000], [4, 3000]], u2: [[1, 20000], [3, 10000]], u3: [[2, 15000]], u4: [], u5: [[0, 30000], [4, 20000]], u0: [[1, 5000]], a1: [[3, 8000]], s1: [[2, 10000]] };
  const contributions = [];
  let n = 0;
  users.filter((u) => VOL[u.id]).forEach((u) => {
    for (let i = 0; i < 5; i++) contributions.push({ id: "c" + n++, userId: u.id, period: P[i], date: P[i] + "-05", type: "monthly", amount: u.salary * MONTHLY_RATE, method: "M-Pesa", ref: "QK" + (7100 + n * 37) + "XZ" });
    VOL[u.id].forEach(([i, a]) => contributions.push({ id: "c" + n++, userId: u.id, period: P[i], date: P[i] + "-18", type: "voluntary", amount: a, method: "M-Pesa", ref: "QK" + (7100 + n * 37) + "XZ" }));
  });
  const loans = [{ id: "l1", applicantId: "u1", amount: 60000, months: 12, purpose: "School fees", status: "approved", createdAt: P[2] + "-12", guarantors: [{ userId: "u2", status: "accepted" }, { userId: "u3", status: "accepted" }] }];
  const posts = [
    { id: "p1", title: "Annual General Meeting: save the date", body: "Members are invited to the AGM at the Birch hall. We will share the year in review, elect officials and take your questions. Bring your member number.", category: "Event", eventDate: day(14), featured: true, createdAt: day(-2), author: "Samuel Mutua",
      imageUrl: art("#1d6b49", "#c8962a", '<circle cx="300" cy="300" r="90" fill="#fff" opacity=".18"/><circle cx="520" cy="260" r="120" fill="#fff" opacity=".14"/><circle cx="780" cy="320" r="100" fill="#fff" opacity=".18"/><circle cx="950" cy="230" r="70" fill="#fff" opacity=".2"/>') },
    { id: "p2", title: "Contribute from your phone", body: "You can now pay your monthly and voluntary contributions with M-Pesa from the member portal. Sign in, choose Contribute, and approve the prompt on your phone.", category: "News", eventDate: "", featured: true, createdAt: day(-5), author: "Samuel Mutua",
      imageUrl: art("#0f3d2a", "#1d6b49", '<rect x="480" y="70" width="240" height="400" rx="34" fill="#fff" opacity=".16"/><rect x="505" y="110" width="190" height="14" rx="7" fill="#fff" opacity=".5"/><rect x="505" y="150" width="190" height="60" rx="10" fill="#c8962a" opacity=".85"/><rect x="505" y="230" width="190" height="14" rx="7" fill="#fff" opacity=".4"/><rect x="505" y="260" width="130" height="14" rx="7" fill="#fff" opacity=".4"/>') },
    { id: "p3", title: "Financial literacy workshop for members", body: "A free half-day session on budgeting, saving and borrowing wisely. Open to members and their families. Light refreshments provided.", category: "Event", eventDate: day(30), featured: true, createdAt: day(-9), author: "Samuel Mutua",
      imageUrl: art("#c8962a", "#8a5a12", '<rect x="330" y="260" width="90" height="170" fill="#fff" opacity=".22"/><rect x="450" y="200" width="90" height="230" fill="#fff" opacity=".28"/><rect x="570" y="140" width="90" height="290" fill="#fff" opacity=".22"/><rect x="690" y="90" width="90" height="340" fill="#fff" opacity=".3"/>') },
    { id: "p4", title: "Thank you for a strong year", body: "Our membership keeps growing thanks to your steady contributions. Keep the savings habit going, and invite a friend to join.", category: "Notice", eventDate: "", featured: false, createdAt: day(-20), author: "Joseph Karanja", imageUrl: "" },
  ];
  return { users, contributions, loans, posts };
}

function load() {
  try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch {}
  return seed();
}

export function createMock(getToken) {
  const db = load();
  const commit = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {} };
  const fail = (m, s = 400) => { const e = new Error(m); e.status = s; throw e; };
  const pub = ({ password, ...u }) => u;
  const find = (id) => db.users.find((u) => u.id === id);
  const me = () => { const t = getToken(); const u = t && db.users.find((x) => "mock." + x.id === t); if (!u) fail("Please sign in again.", 401); return u; };
  const savings = (id) => db.contributions.filter((c) => c.userId === id).reduce((a, c) => a + c.amount, 0);
  const guaranteed = (id) => db.loans.filter((l) => ACTIVE.includes(l.status) && l.guarantors.some((g) => g.userId === id)).reduce((a, l) => a + l.amount / 2, 0);
  const shape = (l) => {
    const a = find(l.applicantId);
    return { ...l, applicantName: a.name, applicantSalary: a.salary, applicantSavings: savings(a.id), guarantors: l.guarantors.map((g) => ({ ...g, name: find(g.userId).name })) };
  };

  return {
    async login({ email, password }) {
      await delay();
      const u = db.users.find((x) => x.email === email.trim().toLowerCase() && x.password === password);
      if (!u) fail("Wrong email or password.", 401);
      if (u.status === "pending") fail("Your account is waiting for admin approval.", 403);
      if (u.status === "suspended") fail("This account is suspended. Contact your SACCO.", 403);
      return { token: "mock." + u.id, user: pub(u) };
    },
    async register({ name, email, phone, salary, password }) {
      await delay();
      email = email.trim().toLowerCase();
      if (db.users.some((u) => u.email === email)) fail("An account with this email already exists.", 409);
      if (!password || password.length < 8) fail("Use a password with at least 8 characters.");
      db.users.push({ id: "u" + Date.now(), name: name.trim(), email, phone, salary: +salary || 0, role: "member", status: "pending", password });
      commit();
      return { message: "Account created. An administrator will approve it, then you can sign in." };
    },
    async me() { await delay(100); return pub(me()); },
    async members() {
      const u = me();
      return db.users.filter((x) => x.status === "active" && x.id !== u.id).map((x) => ({ id: x.id, name: x.name, savings: savings(x.id), guaranteed: guaranteed(x.id) }));
    },
    async contributions() { const u = me(); return db.contributions.filter((c) => c.userId === u.id); },
    async loans() {
      const u = me();
      const list = can.loans(u.role) ? db.loans : db.loans.filter((l) => l.applicantId === u.id || l.guarantors.some((g) => g.userId === u.id));
      return list.map(shape).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async applyLoan({ amount, months, purpose, guarantorIds }) {
      await delay();
      const u = me();
      if (!guarantorIds || guarantorIds.length !== 2 || new Set(guarantorIds).size !== 2) fail("Choose 2 different guarantors.");
      if (amount > savings(u.id) * LOAN_MULTIPLE) fail("Amount is above your loan limit.");
      for (const id of guarantorIds) {
        const g = find(id);
        if (!g || g.id === u.id) fail("Invalid guarantor.");
        if (savings(id) - guaranteed(id) < amount / 2) fail(g.name + " cannot cover half of this loan.");
      }
      db.loans.unshift({ id: "l" + Date.now(), applicantId: u.id, amount, months, purpose, status: "pending", createdAt: new Date().toISOString().slice(0, 10), guarantors: guarantorIds.map((userId) => ({ userId, status: "waiting" })) });
      commit();
    },
    async respondGuarantee(id, accept) {
      await delay(150);
      const u = me();
      const l = db.loans.find((x) => x.id === id);
      const g = l?.guarantors.find((x) => x.userId === u.id);
      if (!g || g.status !== "waiting" || l.status !== "pending") fail("This request can no longer be answered.", 409);
      g.status = accept ? "accepted" : "declined";
      if (!accept) l.status = "declined";
      else if (l.guarantors.every((x) => x.status === "accepted")) l.status = "review";
      commit();
    },
    async decideLoan(id, approve) {
      await delay(150);
      const u = me();
      if (!can.loans(u.role)) fail("You do not have permission to approve loans.", 403);
      const l = db.loans.find((x) => x.id === id);
      if (!l || l.status !== "review") fail("This loan is not waiting for a decision.", 409);
      if (l.applicantId === u.id || l.guarantors.some((g) => g.userId === u.id)) fail("You cannot decide a loan you applied for or guarantee. Ask another approver.", 403);
      l.status = approve ? "approved" : "rejected";
      l.decidedBy = u.id;
      commit();
    },
    // Public: news and events. No sign-in needed.
    async posts() {
      await delay(150);
      return [...(db.posts || [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async createPost({ title, body, category, eventDate, featured, image }) {
      const u = me();
      if (!can.posts(u.role)) fail("You do not have permission to publish posts.", 403);
      if (!title?.trim() || !body?.trim()) fail("Add a title and some text.");
      if (category === "Event" && !eventDate) fail("Add the date of the event.");
      const imageUrl = image ? await toDataUrl(image) : "";
      if (featured && !imageUrl) fail("Add an image to show this in the carousel.");
      db.posts.unshift({ id: "p" + Date.now(), title: title.trim(), body: body.trim(), category, eventDate: eventDate || "", featured: !!featured, imageUrl, createdAt: day(0), author: u.name });
      commit();
    },
    async updatePost(id, patch) {
      if (!can.posts(me().role)) fail("You do not have permission to edit posts.", 403);
      const p = db.posts.find((x) => x.id === id);
      if (!p) fail("Post not found.", 404);
      if (patch.featured && !p.imageUrl) fail("This post has no image, so it cannot be in the carousel.");
      if ("featured" in patch) p.featured = !!patch.featured;
      commit();
    },
    async deletePost(id) {
      if (!can.posts(me().role)) fail("You do not have permission to delete posts.", 403);
      db.posts = db.posts.filter((x) => x.id !== id);
      commit();
    },
    // Signed-in users only: finance totals, no personal data.
    async stats() {
      me();
      await delay(150);
      const sum = (f) => db.contributions.filter(f).reduce((a, c) => a + c.amount, 0);
      const out = db.loans.filter((l) => l.status === "approved");
      return {
        members: db.users.filter((u) => u.status === "active").length,
        totalContributions: sum(() => true),
        monthlyContributions: sum((c) => c.type === "monthly"),
        voluntaryContributions: sum((c) => c.type === "voluntary"),
        loansDisbursed: { count: out.length, amount: out.reduce((a, l) => a + l.amount, 0) },
        applicationsInProgress: db.loans.filter((l) => ["pending", "review"].includes(l.status)).length,
        byMonth: lastPeriods(6).map((p) => ({ period: p.key, monthly: sum((c) => c.period === p.key && c.type === "monthly"), voluntary: sum((c) => c.period === p.key && c.type === "voluntary") })),
      };
    },
    async users() {
      const u = me();
      if (!can.members(u.role)) fail("You do not have permission to see members.", 403);
      // Only the super admin sees member finances.
      return db.users.map((x) => ({ ...pub(x), ...(can.manage(u.role) ? { savings: savings(x.id) } : {}) }));
    },
    async updateUser(id, patch) {
      const u = me();
      if (id === u.id) fail("You cannot change your own role or status.");
      const t = find(id);
      if (!t) fail("Member not found.", 404);
      const approving = t.status === "pending" && patch.status === "active" && !patch.role;
      if (approving ? !can.members(u.role) : !can.manage(u.role)) fail("You do not have permission to do that.", 403);
      if (patch.role) t.role = patch.role;
      if (patch.status) t.status = patch.status;
      commit();
    },
    async pay({ type, amount, method }) {
      await delay(2200);
      const u = me();
      if (!(amount >= 100)) fail("The minimum payment is KES 100.");
      const period = currentPeriod();
      if (type === "monthly" && db.contributions.some((c) => c.userId === u.id && c.period === period && c.type === "monthly")) fail("This month's monthly contribution is already paid.");
      const c = { id: "c" + Date.now(), userId: u.id, period, date: new Date().toISOString().slice(0, 10), type, amount, method, ref: "QK" + Math.random().toString(36).slice(2, 9).toUpperCase() };
      db.contributions.push(c);
      commit();
      return { status: "success" };
    },
  };
}
