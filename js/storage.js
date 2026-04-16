const API_BASE = "http://localhost:5050";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(API_BASE + path, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "login.html";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || ("HTTP " + res.status));
  }

  return res;
}

window.Api = {
  list:   async ()         => (await apiFetch("/api/assignments")).json(),
  create: async (data)     => (await apiFetch("/api/assignments",       { method: "POST",   body: JSON.stringify(data) })).json(),
  update: async (id, data) => (await apiFetch("/api/assignments/" + id, { method: "PUT",    body: JSON.stringify(data) })).json(),
  remove: async (id)       => { await apiFetch("/api/assignments/" + id, { method: "DELETE" }); }
};
