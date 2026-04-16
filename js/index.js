let assignments = [];
let statusFilter = "All";
let searchTerm = "";
let currentAssignment = null;

const list = document.getElementById("assignmentList");
const submitModalEl = document.getElementById("submitModal");
const submitModal = bootstrap.Modal.getOrCreateInstance(submitModalEl);
const submitModalLabel = document.getElementById("submitModalLabel");
const assignmentMeta = document.getElementById("assignmentMeta");
const submissionContent = document.getElementById("submissionContent");
const submissionLink = document.getElementById("submissionLink");
const saveDraftBtn = document.getElementById("saveDraftBtn");
const submitBtn = document.getElementById("submitBtn");
const searchInput = document.getElementById("searchInput");

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "dataset") Object.assign(node.dataset, v);
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

function setStatusFilter(value) {
  statusFilter = value;
  document.getElementById("statusFilterBtn").textContent = value === "All" ? "All Status" : value;
  renderAssignments();
}

searchInput.addEventListener("input", (e) => {
  searchTerm = e.target.value.toLowerCase();
  renderAssignments();
});

loadAndRender();

async function loadAndRender() {
  try {
    assignments = await Api.myAssignments();
    renderAssignments();
  } catch (err) {
    if (err.message !== "Unauthorized") alert("Failed to load: " + err.message);
  }
}

function renderEmptyState() {
  list.replaceChildren(
    el("div", { class: "empty-state" },
      el("h3", {}, "No assignments yet"),
      el("p", {}, "Join a class to start receiving assignments."),
      el("a", { href: "classes.html", class: "btn btn-primary" }, "Go to Classes")
    )
  );
}

function renderAssignmentCard(a) {
  const card = el("div", { class: "assignment-card" });

  const left = el("div", { class: "card-left" },
    el("div", { class: "card-header" },
      el("h3", {}, a.title),
      el("span", { class: "priority " + a.priority.toLowerCase() }, a.priority)
    ),
    el("p", {},
      el("strong", {}, "Class: "),
      a.className || "",
      " ",
      el("span", { class: "text-muted" }, "(" + (a.subject || "") + ")")
    ),
    el("p", {},
      el("strong", {}, "Deadline: "),
      new Date(a.deadline).toLocaleString()
    ),
    el("div", { class: "card-actions" },
      el("button", {
        class: "btn btn-sm btn-primary",
        onClick: () => openSubmitModal(a._id)
      }, a.status === "Submitted" ? "📝 Update" : "📝 Submit")
    )
  );

  const right = el("div", { class: "card-right" },
    el("span", { class: "status-badge status-" + a.status.toLowerCase() }, a.status)
  );

  card.appendChild(el("div", { class: "card-main" }, left, right));
  return card;
}

function renderAssignments() {
  if (assignments.length === 0) {
    renderEmptyState();
    updateStats();
    return;
  }

  const filtered = assignments.filter(a => {
    if (statusFilter !== "All" && a.status !== statusFilter) return false;
    if (searchTerm) {
      const hay = (a.title + " " + (a.subject || "") + " " + (a.className || "")).toLowerCase();
      if (!hay.includes(searchTerm)) return false;
    }
    return true;
  });

  list.replaceChildren();
  filtered.forEach(a => list.appendChild(renderAssignmentCard(a)));

  if (filtered.length === 0) {
    list.appendChild(el("div", { class: "empty-state" }, el("p", {}, "No assignments match your filter.")));
  }

  updateStats();
}

function updateStats() {
  const total = assignments.length;
  const pending = assignments.filter(a => a.status === "Pending").length;
  const submitted = assignments.filter(a => a.status === "Submitted").length;
  const missed = assignments.filter(a => a.status === "Missed").length;

  document.getElementById("totalCount").textContent = total;
  document.getElementById("pendingCount").textContent = pending;
  document.getElementById("submittedCount").textContent = submitted;
  document.getElementById("missedCount").textContent = missed;
  document.getElementById("completion").textContent =
    total ? Math.round((submitted / total) * 100) + "%" : "0%";
}

async function openSubmitModal(assignmentId) {
  try {
    const detail = await Api.getAssignment(assignmentId);
    currentAssignment = detail;

    submitModalLabel.textContent = detail.title;

    const meta = el("div", {});
    const badges = el("div", { class: "mb-2" });
    if (detail.classId?.name) badges.appendChild(el("span", { class: "badge bg-secondary me-1" }, detail.classId.name));
    if (detail.classId?.subject) badges.appendChild(el("span", { class: "badge bg-info text-dark me-1" }, detail.classId.subject));
    badges.appendChild(el("span", { class: "badge bg-warning text-dark" }, detail.priority));
    meta.appendChild(badges);
    if (detail.description) meta.appendChild(el("p", {}, detail.description));
    meta.appendChild(el("p", { class: "text-muted small mb-0" },
      el("strong", {}, "Due: "),
      new Date(detail.deadline).toLocaleString()
    ));
    assignmentMeta.replaceChildren(meta);

    submissionContent.value = detail.submission?.content || "";
    submissionLink.value = detail.submission?.linkUrl || "";

    submitModal.show();
  } catch (err) {
    if (err.message !== "Unauthorized") alert("Failed to open: " + err.message);
  }
}

async function saveSubmission(status) {
  if (!currentAssignment) return;
  const content = submissionContent.value.trim();
  const linkUrl = submissionLink.value.trim();

  if (status === "Submitted" && !content && !linkUrl) {
    alert("Please add some content or a link before submitting.");
    return;
  }

  try {
    await Api.submitAssignment(currentAssignment._id, { status, content, linkUrl });
    submitModal.hide();
    await loadAndRender();
  } catch (err) {
    if (err.message !== "Unauthorized") alert("Save failed: " + err.message);
  }
}

saveDraftBtn.addEventListener("click", () => saveSubmission("Pending"));
submitBtn.addEventListener("click", () => saveSubmission("Submitted"));
