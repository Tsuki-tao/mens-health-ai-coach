/**
 * charts.js
 * ---------
 * Thin wrappers around Chart.js so app.js can call one-liners instead of
 * repeating chart config. Each function destroys any previous chart
 * instance on the same canvas first, since views get re-rendered often.
 */

const ChartRegistry = {};

function destroyChart(id) {
  if (ChartRegistry[id]) {
    ChartRegistry[id].destroy();
    delete ChartRegistry[id];
  }
}

function baseGridColor() { return "rgba(229, 231, 235, 0.12)"; }
function baseTextColor() { return "#94A3B8"; }

function renderSleepChart(canvasId, labels, hoursData) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  ChartRegistry[canvasId] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "ชั่วโมงการนอน",
        data: hoursData,
        backgroundColor: "rgba(139, 92, 246, 0.55)",
        borderColor: "#8B5CF6",
        borderWidth: 1.5,
        borderRadius: 8,
        maxBarThickness: 28
      }]
    },
    options: chartBaseOptions("ชั่วโมง")
  });
}

function renderHydrationChart(canvasId, labels, mlData, goal) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  ChartRegistry[canvasId] = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "น้ำดื่ม (มล.)",
          data: mlData,
          borderColor: "#06B6D4",
          backgroundColor: "rgba(6, 182, 212, 0.15)",
          fill: true,
          tension: 0.35,
          pointBackgroundColor: "#06B6D4",
          pointRadius: 4
        },
        {
          label: "เป้าหมาย",
          data: labels.map(() => goal),
          borderColor: "rgba(148,163,184,0.5)",
          borderDash: [6, 6],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: chartBaseOptions("มล.")
  });
}

function renderProgressChart(canvasId, labels, datasets) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  ChartRegistry[canvasId] = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: chartBaseOptions("%")
  });
}

function chartBaseOptions(yLabel) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { color: baseTextColor(), font: { family: "Inter", size: 11 } }
      },
      tooltip: {
        backgroundColor: "#1F2937",
        titleColor: "#F8FAFC",
        bodyColor: "#F8FAFC",
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        padding: 10
      }
    },
    scales: {
      x: {
        grid: { color: baseGridColor(), drawTicks: false },
        ticks: { color: baseTextColor(), font: { family: "Inter", size: 11 } }
      },
      y: {
        grid: { color: baseGridColor(), drawTicks: false },
        ticks: { color: baseTextColor(), font: { family: "Inter", size: 11 } },
        title: { display: !!yLabel, text: yLabel, color: baseTextColor() },
        beginAtZero: true
      }
    }
  };
}
