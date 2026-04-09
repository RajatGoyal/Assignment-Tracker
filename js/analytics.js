document.addEventListener("DOMContentLoaded", () => {

  const assignments = JSON.parse(localStorage.getItem("assignments")) || [];

  drawPieChart(assignments);
  drawBarChart(assignments);

});

function drawPieChart(assignments) {
  const canvas = document.getElementById("pieChart");
  const ctx = canvas.getContext("2d");

  const counts = {
    Pending: 0,
    Submitted: 0,
    Missed: 0
  };

  assignments.forEach(a => counts[a.status]++);

  const values = Object.values(counts);
  const labels = Object.keys(counts);
  const colors = ["#facc15", "#22c55e", "#ef4444"];

  const total = values.reduce((a, b) => a + b, 0);
  if (total === 0) return;

  let startAngle = 0;

  values.forEach((value, i) => {
    const slice = (value / total) * Math.PI * 2;

    ctx.beginPath();
    ctx.moveTo(150, 150);
    ctx.arc(150, 150, 120, startAngle, startAngle + slice);
    ctx.fillStyle = colors[i];
    ctx.fill();

    startAngle += slice;
  });

  labels.forEach((label, i) => {
    ctx.fillStyle = colors[i];
    ctx.fillRect(10, 10 + i * 20, 12, 12);
    ctx.fillStyle = "#fff";
    ctx.fillText(label, 28, 20 + i * 20);
  });
}

function drawBarChart(assignments) {
  const canvas = document.getElementById("barChart");
  const ctx = canvas.getContext("2d");

  const counts = { Low: 0, Medium: 0, High: 0 };
  assignments.forEach(a => counts[a.priority]++);

  const values = Object.values(counts);
  const labels = Object.keys(counts);

  const max = Math.max(...values, 1);
  const barWidth = 60;
  const gap = 40;
  const baseY = 260;

  values.forEach((value, i) => {
    const height = (value / max) * 180;
    const x = 60 + i * (barWidth + gap);

    ctx.fillStyle = "#60a5fa";
    ctx.fillRect(x, baseY - height, barWidth, height);

    ctx.fillStyle = "#fff";
    ctx.fillText(labels[i], x + 8, baseY + 16);
    ctx.fillText(value, x + 22, baseY - height - 6);
  });
}