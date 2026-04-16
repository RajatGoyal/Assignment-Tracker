const role = Auth.role();
const params = new URLSearchParams(window.location.search);
const classId = params.get("id");

if (!classId) {
  window.location.href = "classes.html";
}

let currentClass = null;
let currentSubmitTarget = null;

const submitModal = bootstrap.Modal.getOrCreateInstance(document.getElementById("submitModal"));
const createAssignmentModal = bootstrap.Modal.getOrCreateInstance(document.getElementById("createAssignmentModal"));

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "onClick") node.addEventListener("click", v);
    else if (k in node) node[k] = v;
    else node.setAttribute(k, v);
  }
  for (const child of children) {
    if (child == null) continue;
    if (typeof child === "string" || typeof child === "number") {
      node.appendChild(document.createTextNode(String(child)));
    } else {
      node.appendChild(child);
    }
  }
  return node;
}

function renderNav() {
  const nav = document.getElementById("navLinks");
  if (role === "teacher") {
    nav.appendChild(el("a", { href: "classes.html" }, "Classes"));
  } else {
    nav.appendChild(el("a", { href: "index.html" }, "Dashboard"));
    nav.appendChild(el("a", { href: "calendar.html" }, "Calendar"));
    nav.appendChild(el("a", { href: "analytics.html" }, "Analytics"));
    nav.appendChild(el("a", { href: "classes.html" }, "Classes"));
  }
  const logout = el("a", { href: "#" }, "Logout");
  logout.addEventListener("click", (e) => { e.preventDefault(); Auth.logout(); });
  nav.appendChild(logout);
}

function deriveStatus(rawStatus, deadline) {
  if (rawStatus === "Submitted") return "Submitted";
  if (deadline && new Date(deadline).getTime() < Date.now()) return "Missed";
  return "Pending";
}

function renderTeacherAssignmentRow(a) {
  const card = el("div", { class: "assignment-card mb-2" });
  const left = el("div", { class: "card-left" },
    el("div", { class: "card-header" },
      el("h3", {}, a.title),
      el("span", { class: "priority " + a.priority.toLowerCase() }, a.priority)
    ),
    el("p", { class: "mb-2" },
      el("strong", {}, "Due: "),
      new Date(a.deadline).toLocaleString()
    ),
    el("div", { class: "card-actions" },
      el("a", {
        href: "assignment.html?id=" + a._id,
        class: "btn btn-sm btn-outline-light"
      }, "View Submissions")
    )
  );
  card.appendChild(el("div", { class: "card-main" }, left));
  return card;
}

function renderStudentAssignmentRow(a) {
  const status = deriveStatus("Pending", a.deadline);
  const card = el("div", { class: "assignment-card mb-2" });
  const left = el("div", { class: "card-left" },
    el("div", { class: "card-header" },
      el("h3", {}, a.title),
      el("span", { class: "priority " + a.priority.toLowerCase() }, a.priority)
    ),
    el("p", { class: "mb-2" },
      el("strong", {}, "Due: "),
      new Date(a.deadline).toLocaleString()
    ),
    el("div", { class: "card-actions" },
      el("button", {
        class: "btn btn-sm btn-primary",
        onClick: () => openSubmitModal(a._id)
      }, "📝 Open Submission")
    )
  );
  const right = el("div", { class: "card-right" },
    el("span", { class: "status-badge status-" + status.toLowerCase() }, status)
  );
  card.appendChild(el("div", { class: "card-main" }, left, right));
  return card;
}

function renderRoster(roster) {
  const container = document.getElementById("rosterList");
  document.getElementById("rosterHeader").style.display = "block";
  container.replaceChildren();

  if (roster.length === 0) {
    container.appendChild(el("div", { class: "empty-state" },
      el("p", {}, "No students enrolled yet. Share the join code below.")
    ));
    return;
  }

  const list = el("div", { class: "list-group" });
  roster.forEach(s => {
    list.appendChild(el("div", { class: "list-group-item bg-dark text-light border-secondary" },
      el("div", { class: "fw-semibold" }, s.name),
      el("small", { class: "text-muted" }, s.email)
    ));
  });
  container.appendChild(list);
}

function renderClassHeader(cls) {
  document.getElementById("className").textContent = cls.name;
  const meta = document.getElementById("classMeta");
  meta.replaceChildren();
  meta.appendChild(el("span", {}, cls.subject));
  if (cls.viewerRole === "teacher") {
    meta.appendChild(document.createTextNode("  •  "));
    meta.appendChild(el("span", {},
      "Join code: ",
      el("code", { class: "text-info" }, cls.joinCode)
    ));
  }
}

function renderAssignments(cls) {
  const container = document.getElementById("assignmentList");
  container.replaceChildren();
  if (cls.assignments.length === 0) {
    container.appendChild(el("div", { class: "empty-state" },
      el("p", {}, cls.viewerRole === "teacher"
        ? "No assignments yet. Create the first one."
        : "No assignments in this class yet.")
    ));
    return;
  }
  cls.assignments.forEach(a => {
    container.appendChild(
      cls.viewerRole === "teacher"
        ? renderTeacherAssignmentRow(a)
        : renderStudentAssignmentRow(a)
    );
  });
}

async function loadClass() {
  try {
    currentClass = await Api.getClass(classId);
    renderClassHeader(currentClass);
    renderAssignments(currentClass);
    if (currentClass.viewerRole === "teacher") {
      document.getElementById("createAssignmentBtn").style.display = "inline-block";
      renderRoster(currentClass.roster || []);
    }
  } catch (err) {
    if (err.message !== "Unauthorized") alert("Failed to load class: " + err.message);
  }
}

// --- Student submit modal ---
async function openSubmitModal(assignmentId) {
  try {
    const detail = await Api.getAssignment(assignmentId);
    currentSubmitTarget = detail;
    document.getElementById("submitModalLabel").textContent = detail.title;

    const meta = document.getElementById("assignmentMeta");
    meta.replaceChildren();
    if (detail.description) meta.appendChild(el("p", {}, detail.description));
    meta.appendChild(el("p", { class: "text-muted small mb-0" },
      el("strong", {}, "Due: "),
      new Date(detail.deadline).toLocaleString()
    ));

    document.getElementById("submissionContent").value = detail.submission?.content || "";
    document.getElementById("submissionLink").value = detail.submission?.linkUrl || "";

    submitModal.show();
  } catch (err) {
    if (err.message !== "Unauthorized") alert("Failed to open: " + err.message);
  }
}

async function saveSubmission(status) {
  if (!currentSubmitTarget) return;
  const content = document.getElementById("submissionContent").value.trim();
  const linkUrl = document.getElementById("submissionLink").value.trim();
  if (status === "Submitted" && !content && !linkUrl) {
    alert("Please add some content or a link before submitting.");
    return;
  }
  try {
    await Api.submitAssignment(currentSubmitTarget._id, { status, content, linkUrl });
    submitModal.hide();
    await loadClass();
  } catch (err) {
    if (err.message !== "Unauthorized") alert("Save failed: " + err.message);
  }
}

document.getElementById("saveDraftBtn").addEventListener("click", () => saveSubmission("Pending"));
document.getElementById("submitBtn").addEventListener("click", () => saveSubmission("Submitted"));

// --- Teacher create assignment ---
document.getElementById("createAssignmentBtn").addEventListener("click", () => {
  document.getElementById("assignmentTitle").value = "";
  document.getElementById("assignmentDescription").value = "";
  document.getElementById("assignmentDeadline").value = "";
  document.getElementById("assignmentPriority").value = "Medium";
  createAssignmentModal.show();
});

document.getElementById("saveAssignmentBtn").addEventListener("click", async () => {
  const title = document.getElementById("assignmentTitle").value.trim();
  const description = document.getElementById("assignmentDescription").value.trim();
  const deadline = document.getElementById("assignmentDeadline").value;
  const priority = document.getElementById("assignmentPriority").value;

  if (!title || !deadline) {
    alert("Title and deadline are required.");
    return;
  }
  try {
    await Api.createAssignmentInClass(classId, { title, description, deadline, priority });
    createAssignmentModal.hide();
    await loadClass();
  } catch (err) {
    if (err.message !== "Unauthorized") alert(err.message);
  }
});

renderNav();
loadClass();
