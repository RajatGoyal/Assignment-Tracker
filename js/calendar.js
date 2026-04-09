const calendarGrid = document.getElementById("calendarGrid");
const monthYear = document.getElementById("monthYear");
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");

let assignments = JSON.parse(localStorage.getItem("assignments")) || [];

const today = new Date();
let currentMonth = today.getMonth(); // 0-11
let currentYear = today.getFullYear();

renderCalendar(currentMonth, currentYear);

function renderCalendar(month, year) {
  calendarGrid.innerHTML = "";

  monthYear.textContent = new Date(year, month).toLocaleString("en-US", {
    month: "long",
    year: "numeric"
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    calendarGrid.appendChild(document.createElement("div"));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.className = "calendar-cell";

    const dateLabel = document.createElement("span");
    dateLabel.className = "date-number";
    dateLabel.textContent = day;
    cell.appendChild(dateLabel);

    assignments
      .filter(a => {
        const d = new Date(a.deadline);
        return (
          d.getDate() === day &&
          d.getMonth() === month &&
          d.getFullYear() === year
        );
      })
      .forEach(a => {
        const tag = document.createElement("div");
        tag.className = `calendar-tag ${a.priority.toLowerCase()}`;
        tag.textContent = a.subject;
        cell.appendChild(tag);
      });

    if (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      cell.classList.add("today");
    }

    calendarGrid.appendChild(cell);
  }
}

prevBtn.addEventListener("click", () => {
  currentMonth--;

  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }

  renderCalendar(currentMonth, currentYear);
});

nextBtn.addEventListener("click", () => {
  currentMonth++;

  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }

  renderCalendar(currentMonth, currentYear);
});