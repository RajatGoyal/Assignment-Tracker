const API_BASE = "http://localhost:5050";

let currentUser = null;
let readyPromise = null;

async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const res = await fetch(API_BASE + path, { ...options, headers, credentials: "include" });

  if (res.status === 401) {
    currentUser = null;
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
  role: () => currentUser?.role || null,
  name: () => currentUser?.name || null,
  isLoggedIn: () => !!currentUser,

  // Promise that resolves once requireRole has finished its /api/me check.
  // Page scripts should: Auth.ready().then(async () => { ... })
  ready: () => readyPromise,

  logout: async () => {
    try {
      await fetch(API_BASE + "/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch (_) {}
    currentUser = null;
    window.location.href = "login.html";
  },

  // Page-level guard. Hides <html> until /api/me resolves so we don't
  // flash protected content before a redirect.
  requireRole(requiredRole) {
    document.documentElement.style.visibility = "hidden";

    readyPromise = (async () => {
      let res;
      try {
        res = await fetch(API_BASE + "/api/me", { credentials: "include" });
      } catch (_) {
        window.location.href = "login.html";
        return new Promise(() => {});
      }

      if (!res.ok) {
        window.location.href = "login.html";
        return new Promise(() => {});
      }

      currentUser = await res.json();

      if (requiredRole && currentUser.role !== requiredRole) {
        window.location.href = currentUser.role === "teacher" ? "classes.html" : "index.html";
        return new Promise(() => {});
      }

      document.documentElement.style.visibility = "";
      return currentUser;
    })();

    return readyPromise;
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
