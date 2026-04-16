let assignments = [];
let editIndex = null;
let statusFilter = "All";

function setStatusFilter(value) {
  statusFilter = value;
  document.getElementById("statusFilterBtn").textContent = value === "All" ? "All Status" : value;
  renderAssignments();
}

const list = document.getElementById("assignmentList");
const modalEl = document.getElementById("modal");
const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
const modalLabel = document.getElementById("modalLabel");

const titleInput = document.getElementById("title");
const subjectInput = document.getElementById("subject");
const deadlineInput = document.getElementById("deadline");
const priorityInput = document.getElementById("priority");

const addBtn = document.getElementById("addBtn");
const saveBtn = document.getElementById("saveAssignment");

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

loadAndRender();

async function loadAndRender() {
  try {
    assignments = await Api.list();
    renderAssignments();
  } catch (err) {
    if (err.message !== "Unauthorized") alert("Failed to load: " + err.message);
  }
}

function renderAssignments() {
  list.innerHTML = "";

  assignments.forEach((a, index) => {
    if (statusFilter !== "All" && a.status !== statusFilter) return;

    const card = document.createElement("div");
    card.className = "assignment-card";

    const title = esc(a.title);
    const subject = esc(a.subject);
    const priority = esc(a.priority);
    const priorityClass = esc(a.priority.toLowerCase());
    const deadline = esc(new Date(a.deadline).toLocaleString());

    card.innerHTML = `
  <div class="card-main">

    <!-- LEFT CONTENT -->
    <div class="card-left">
      <div class="card-header">
        <h3>${title}</h3>
        <span class="priority ${priorityClass}">${priority}</span>
      </div>

      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Deadline:</strong> ${deadline}</p>

      <div class="card-actions">
        <button class="btn btn-sm btn-primary" onclick="editAssignment(${index})">✏️ Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteAssignment(${index})">🗑 Delete</button>
      </div>
    </div>

    <!-- RIGHT STATUS -->
    <div class="card-right">
      <div class="dropdown">
        <button class="btn btn-sm btn-outline-light dropdown-toggle status-dropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false">
          ${esc(a.status)}
        </button>
        <ul class="dropdown-menu">
          <li><a class="dropdown-item" href="#" onclick="changeStatus(${index}, 'Pending'); return false;">Pending</a></li>
          <li><a class="dropdown-item" href="#" onclick="changeStatus(${index}, 'Submitted'); return false;">Submitted</a></li>
          <li><a class="dropdown-item" href="#" onclick="changeStatus(${index}, 'Missed'); return false;">Missed</a></li>
        </ul>
      </div>
    </div>

  </div>
`;

    list.appendChild(card);
  });

  updateStats();
}

async function changeStatus(index, newStatus) {
  const a = assignments[index];
  try {
    await Api.update(a._id, { status: newStatus });
    await loadAndRender();
  } catch (err) {
    if (err.message !== "Unauthorized") alert("Update failed: " + err.message);
  }
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

addBtn.onclick = () => {
  editIndex = null;
  clearForm();
  modalLabel.textContent = "Add Assignment";
  saveBtn.textContent = "Add Assignment";
  modal.show();
};

saveBtn.onclick = async () => {
  const title = titleInput.value.trim();
  const subject = subjectInput.value.trim();
  const deadline = deadlineInput.value;
  const priority = priorityInput.value;

  if (!title || !subject || !deadline) {
    alert("Please fill all required fields");
    return;
  }

  try {
    if (editIndex !== null) {
      const a = assignments[editIndex];
      await Api.update(a._id, { title, subject, deadline, priority });
    } else {
      await Api.create({ title, subject, deadline, priority, status: "Pending" });
    }

    modal.hide();
    clearForm();
    await loadAndRender();
  } catch (err) {
    if (err.message !== "Unauthorized") alert("Save failed: " + err.message);
  }
};

function editAssignment(index) {
  const a = assignments[index];

  titleInput.value = a.title;
  subjectInput.value = a.subject;
  deadlineInput.value = typeof a.deadline === "string" ? a.deadline.slice(0, 16) : a.deadline;
  priorityInput.value = a.priority;

  editIndex = index;
  modalLabel.textContent = "Edit Assignment";
  saveBtn.textContent = "Save Changes";
  modal.show();
}

async function deleteAssignment(index) {
  if (!confirm("Delete this assignment?")) return;

  const a = assignments[index];
  try {
    await Api.remove(a._id);
    await loadAndRender();
  } catch (err) {
    if (err.message !== "Unauthorized") alert("Delete failed: " + err.message);
  }
}

function clearForm() {
  titleInput.value = "";
  subjectInput.value = "";
  deadlineInput.value = "";
  priorityInput.value = "Medium";
}
