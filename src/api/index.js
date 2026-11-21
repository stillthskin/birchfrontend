// All backend calls live here. Set VITE_USE_MOCK=false and VITE_API_URL to use your real backend.
// The endpoint contract is documented in README.md.
import { createMock } from "./mock.js";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const BASE = import.meta.env.VITE_API_URL || "/api";
const TK = "birch_token";

export const getToken = () => { try { return localStorage.getItem(TK); } catch { return null; } };
const setToken = (t) => { try { t ? localStorage.setItem(TK, t) : localStorage.removeItem(TK); } catch {} };
let onAuthLost = () => {};
export const setOnAuthLost = (f) => { onAuthLost = f; };

async function req(path, { method = "GET", body } = {}) {
  const t = getToken();
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...(t ? { Authorization: "Bearer " + t } : {}) },
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    if (res.status === 401 && t) { setToken(null); onAuthLost(); }
    const e = new Error(data?.message || "Something went wrong (" + res.status + ")");
    e.status = res.status;
    throw e;
  }
  return data;
}

const real = {
  login: (c) => req("/auth/login", { method: "POST", body: c }), // -> { token, user }
  register: (f) => req("/auth/register", { method: "POST", body: f }), // -> { message }
  me: () => req("/auth/me"),
  posts: () => req("/public/posts"), // public, no token needed
  createPost: ({ image, ...f }) => { // multipart: title, body, category, eventDate, featured, image (file)
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => v != null && fd.append(k, v));
    if (image) fd.append("image", image);
    return req("/posts", { method: "POST", body: fd });
  },
  updatePost: (id, patch) => req(`/posts/${id}`, { method: "PATCH", body: patch }),
  deletePost: (id) => req(`/posts/${id}`, { method: "DELETE" }),
  stats: () => req("/stats"), // finance totals, signed-in users only
  members: () => req("/members"), // [{ id, name, savings, guaranteed }]
  contributions: () => req("/contributions"),
  loans: () => req("/loans"),
  applyLoan: (b) => req("/loans", { method: "POST", body: b }),
  respondGuarantee: (id, accept) => req(`/loans/${id}/guarantee`, { method: "POST", body: { accept } }),
  decideLoan: (id, approve) => req(`/loans/${id}/decision`, { method: "POST", body: { approve } }),
  users: () => req("/admin/users"),
  updateUser: (id, patch) => req(`/admin/users/${id}`, { method: "PATCH", body: patch }),
  // Starts a payment (e.g. M-Pesa STK Push), then polls until it succeeds or fails.
  async pay(b) {
    const { id } = await req("/payments", { method: "POST", body: b });
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const p = await req("/payments/" + id);
      if (p.status === "success") return p;
      if (p.status === "failed") throw new Error(p.message || "Payment failed or was cancelled.");
    }
    throw new Error("We did not get a payment confirmation. Check your phone and try again.");
  },
};

const base = USE_MOCK ? createMock(getToken) : real;
export const api = {
  ...base,
  async login(c) { const r = await base.login(c); setToken(r.token); return r; },
  logout() { setToken(null); },
};
