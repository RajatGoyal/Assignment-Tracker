const API_BASE = "http://localhost:5050";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(API_BASE + path, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    window.location.href = "login.html";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || ("HTTP " + res.status));
  }

  return res;
}

window.Auth = {
  token: () => localStorage.getItem("token"),
  role: () => localStorage.getItem("role"),
  name: () => localStorage.getItem("name"),
  isLoggedIn: () => !!localStorage.getItem("token"),
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "login.html";
  },
  // Page-level guard: redirect to login if not logged in;
  // if a required role is given, redirect mismatched roles to their home.
  requireRole(requiredRole) {
    if (!this.isLoggedIn()) {
      window.location.href = "login.html";
      return false;
    }
    if (requiredRole && this.role() !== requiredRole) {
      window.location.href = this.role() === "teacher" ? "classes.html" : "index.html";
      return false;
    }
    return true;
  }
};

window.Api = {
  // ---- student ----
  myAssignments: async () => (await apiFetch("/api/me/assignments")).json(),
  myClasses:     async () => (await apiFetch("/api/me/classes")).json(),
  joinClass:     async (joinCode) =>
    (await apiFetch("/api/me/classes/join", {
      method: "POST",
      body: JSON.stringify({ joinCode })
    })).json(),
  submitAssignment: async (assignmentId, data) =>
    (await apiFetch("/api/assignments/" + assignmentId + "/submission", {
      method: "PUT",
      body: JSON.stringify(data)
    })).json(),

  // ---- teacher ----
  createClass: async (data) =>
    (await apiFetch("/api/classes", {
      method: "POST",
      body: JSON.stringify(data)
    })).json(),
  getClass: async (id) => (await apiFetch("/api/classes/" + id)).json(),
  createAssignmentInClass: async (classId, data) =>
    (await apiFetch("/api/classes/" + classId + "/assignments", {
      method: "POST",
      body: JSON.stringify(data)
    })).json(),

  // ---- both ----
  getAssignment: async (id) => (await apiFetch("/api/assignments/" + id)).json()
};
