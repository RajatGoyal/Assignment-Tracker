
function getAssignments() {
  return JSON.parse(localStorage.getItem("assignments")) || [];
}

function saveAssignments(data) {
  localStorage.setItem("assignments", JSON.stringify(data));
}

let assignments = getAssignments();
let editIndex = null;

const list = document.getElementById("assignmentList");
const modal = document.getElementById("modal");

const titleInput = document.getElementById("title");
const subjectInput = document.getElementById("subject");
const deadlineInput = document.getElementById("deadline");
const priorityInput = document.getElementById("priority");

const addBtn = document.getElementById("addBtn");
const saveBtn = document.getElementById("saveAssignment");
const closeModal = document.getElementById("closeModal");

renderAssignments();

function renderAssignments() {
  list.innerHTML = "";
  assignments = getAssignments();

  assignments.forEach((a, index) => {
    const card = document.createElement("div");
    card.className = "assignment-card";

   card.innerHTML = `
  <div class="card-main">

    <!-- LEFT CONTENT -->
    <div class="card-left">
      <div class="card-header">
        <h3>${a.title}</h3>
        <span class="priority ${a.priority.toLowerCase()}">${a.priority}</span>
      </div>

      <p><strong>Subject:</strong> ${a.subject}</p>
      <p><strong>Deadline:</strong> ${new Date(a.deadline).toLocaleString()}</p>

      <div class="card-actions">
        <button class="edit-btn" onclick="editAssignment(${index})">✏️ Edit</button>
        <button class="delete-btn" onclick="deleteAssignment(${index})">🗑 Delete</button>
      </div>
    </div>

    <!-- RIGHT STATUS -->
    <div class="card-right">
      <select class="status-select"
        onchange="changeStatus(${index}, this.value)">
        <option value="Pending" ${a.status === "Pending" ? "selected" : ""}>Pending</option>
        <option value="Submitted" ${a.status === "Submitted" ? "selected" : ""}>Submitted</option>
        <option value="Missed" ${a.status === "Missed" ? "selected" : ""}>Missed</option>
      </select>
    </div>

  </div>
`;

    list.appendChild(card);
  });

  updateStats();
}
function changeStatus(index, newStatus) {
  assignments[index].status = newStatus;
  saveAssignments(assignments);
  renderAssignments();
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
  modal.style.display = "flex";
};

saveBtn.onclick = () => {
  const title = titleInput.value.trim();
  const subject = subjectInput.value.trim();
  const deadline = deadlineInput.value;
  const priority = priorityInput.value;

  if (!title || !subject || !deadline) {
    alert("Please fill all required fields");
    return;
  }

  if (editIndex !== null) {
    assignments[editIndex] = {
      ...assignments[editIndex],
      title,
      subject,
      deadline,
      priority
    };
  } else {
    assignments.push({
      title,
      subject,
      deadline,
      priority,
      status: "Pending",
      createdAt: new Date().toISOString()
    });
  }

  saveAssignments(assignments);
  modal.style.display = "none";
  clearForm();
  renderAssignments();
};

function editAssignment(index) {
  const a = assignments[index];

  titleInput.value = a.title;
  subjectInput.value = a.subject;
  deadlineInput.value = a.deadline;
  priorityInput.value = a.priority;

  editIndex = index;
  modal.style.display = "flex";
}

function deleteAssignment(index) {
  if (!confirm("Delete this assignment?")) return;

  assignments.splice(index, 1);
  saveAssignments(assignments);
  renderAssignments();
}

closeModal.onclick = () => {
  modal.style.display = "none";
};

function clearForm() {
  titleInput.value = "";
  subjectInput.value = "";
  deadlineInput.value = "";
  priorityInput.value = "Medium";
}