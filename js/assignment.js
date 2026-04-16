const params = new URLSearchParams(window.location.search);
const assignmentId = params.get("id");

if (!assignmentId) {
  window.location.href = "classes.html";
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
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

function statusBadge(status) {
  return el("span", { class: "status-badge status-" + status.toLowerCase() }, status);
}

function renderHeader(detail) {
  document.getElementById("assignmentTitle").textContent = detail.title;

  const meta = document.getElementById("assignmentMeta");
  meta.replaceChildren();
  if (detail.classId?.name) {
    meta.appendChild(el("span", {}, detail.classId.name));
    meta.appendChild(document.createTextNode("  •  "));
  }
  meta.appendChild(el("span", {}, "Due: " + new Date(detail.deadline).toLocaleString()));
  meta.appendChild(document.createTextNode("  •  "));
  meta.appendChild(el("span", { class: "priority " + detail.priority.toLowerCase() }, detail.priority));

  if (detail.classId?._id) {
    document.getElementById("backLink").href = "class.html?id=" + detail.classId._id;
  }

  document.getElementById("assignmentDescription").textContent = detail.description || "";
}

function renderStats(stats) {
  document.getElementById("totalCount").textContent = stats.total;
  document.getElementById("submittedCount").textContent = stats.submitted;
  document.getElementById("pctSubmitted").textContent = stats.pctSubmitted + "%";
}

function renderRows(rows) {
  const tbody = document.getElementById("submissionRows");
  tbody.replaceChildren();

  if (rows.length === 0) {
    tbody.appendChild(el("tr", {}, el("td", { colSpan: 5, class: "text-center text-muted py-4" }, "No students enrolled in this class.")));
    return;
  }

  rows.forEach(r => {
    const tr = el("tr", {});
    tr.appendChild(el("td", {}, el("div", { class: "fw-semibold" }, r.name), el("small", { class: "text-muted" }, r.email)));
    tr.appendChild(el("td", {}, statusBadge(r.status)));
    tr.appendChild(el("td", { class: "text-muted small" }, r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "—"));

    const contentTd = el("td", { class: "small" });
    if (r.content) {
      const preview = r.content.length > 80 ? r.content.slice(0, 80) + "…" : r.content;
      contentTd.appendChild(el("span", { title: r.content }, preview));
    } else {
      contentTd.appendChild(el("span", { class: "text-muted" }, "—"));
    }
    tr.appendChild(contentTd);

    const linkTd = el("td", {});
    if (r.linkUrl) {
      linkTd.appendChild(el("a", { href: r.linkUrl, target: "_blank", rel: "noopener", class: "link-info small" }, "Open ↗"));
    } else {
      linkTd.appendChild(el("span", { class: "text-muted small" }, "—"));
    }
    tr.appendChild(linkTd);

    tbody.appendChild(tr);
  });
}

(async () => {
  try {
    const detail = await Api.getAssignment(assignmentId);
    if (detail.viewerRole !== "teacher") {
      window.location.href = "index.html";
      return;
    }
    renderHeader(detail);
    renderStats(detail.stats);
    renderRows(detail.submissions);
  } catch (err) {
    if (err.message !== "Unauthorized") alert("Failed to load: " + err.message);
  }
})();
