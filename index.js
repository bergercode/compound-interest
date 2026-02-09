const startingBalanceInput = document.getElementById("starting-balance");
const depositAmountInput = document.getElementById("amount");
const frequencyInput = document.getElementById("frequency");
const interestRateInput = document.getElementById("interest-rate");
const yearsInput = document.getElementById("years");
const calculateButton = document.getElementById("calculate");
const resultDiv = document.getElementById("result");
const ctx = document.getElementById('growthChart').getContext('2d');

let chart;

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
});

// Button is the only trigger
calculateButton.addEventListener("click", calculateInterest);

function calculateInterest() {
  // 1. Sanitize Inputs (prevent negative numbers)
  const startingBalance = Math.max(0, parseFloat(startingBalanceInput.value) || 0);
  const depositAmount = Math.max(0, parseFloat(depositAmountInput.value) || 0);
  const frequency = frequencyInput.value;
  const interestRate = Math.max(0, parseFloat(interestRateInput.value) || 0) / 100;
  let years = Math.max(1, parseInt(yearsInput.value) || 0);

  // Enforce max years
  if (years > 100) {
    years = 100;
    // We don't force update the UI value while typing to avoid annoyance, 
    // unless focus is lost, but for calculation we cap it.
  }

  // Determine periods per year
  let n = 12;
  if (frequency === 'weekly') n = 52;
  else if (frequency === 'fortnightly') n = 26;
  else if (frequency === 'monthly') n = 12;
  else if (frequency === 'annually') n = 1;

  // 2. Calculate All Data Points (Refactored)
  const { labels, totalData, investedData, interestData, finalTotal, finalInvested, finalInterest } = calculateData(
    startingBalance,
    depositAmount,
    n,
    interestRate,
    years
  );

  // 3. Update DOM
  resultDiv.innerHTML = `
    <div style="margin-bottom: 0.5rem;">Total Value: <strong style="font-size: 1.2em;">${formatter.format(finalTotal)}</strong></div>
    <div style="font-size: 0.9rem; color: #b0c4de;">Total Interest Earned: <span style="color: #4facfe;">${formatter.format(finalInterest)}</span></div>
    <div style="font-size: 0.9rem; color: #b0c4de;">Total Invested: <span>${formatter.format(finalInvested)}</span></div>
  `;

  // 4. Update Chart
  updateChart(labels, totalData, investedData, interestData);
}

function calculateData(startingBalance, depositAmount, n, rate, years) {
  const labels = [];
  const totalData = [];
  const investedData = [];
  const interestData = []; // Derived: Total - Invested

  const ratePerPeriod = rate / n;

  for (let i = 0; i <= years; i++) {
    labels.push(`Year ${i}`);

    const totalPeriods = n * i;

    // Principal Growth (Compound Interest)
    let principalGrowth = startingBalance;
    if (rate > 0) {
      principalGrowth = startingBalance * Math.pow(1 + ratePerPeriod, totalPeriods);
    }

    // Deposits Growth (Annuity Due: Deposits at START of period)
    // Formula: PMT * [ ((1+r/n)^(nt) - 1) / (r/n) ] * (1+r/n)
    let depositsGrowth = 0;
    if (rate === 0) {
      depositsGrowth = depositAmount * totalPeriods;
    } else {
      depositsGrowth = depositAmount *
        ((Math.pow(1 + ratePerPeriod, totalPeriods) - 1) / ratePerPeriod) *
        (1 + ratePerPeriod);
    }

    const totalValue = principalGrowth + depositsGrowth;
    const totalInvested = startingBalance + (depositAmount * totalPeriods);
    const totalInterest = totalValue - totalInvested;

    totalData.push(totalValue);
    investedData.push(totalInvested);
    interestData.push(totalInterest);
  }

  return {
    labels,
    totalData,
    investedData,
    interestData,
    finalTotal: totalData[totalData.length - 1],
    finalInvested: investedData[investedData.length - 1],
    finalInterest: interestData[interestData.length - 1]
  };
}

function updateChart(labels, totalData, investedData, interestData) {
  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Total with Interest',
          data: totalData, // Back to Total Value
          borderColor: '#4facfe',
          backgroundColor: 'rgba(79, 172, 254, 0.2)', // Lower opacity for overlap
          borderWidth: 3,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Total Invested',
          data: investedData,
          borderColor: '#ff9a9e',
          backgroundColor: 'rgba(255, 154, 158, 0.2)', // Lower opacity for overlap
          borderWidth: 3,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: true,
          tension: 0.4,
          borderDash: [5, 5] // Add back dashed line for distinction
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#e0e0e0',
            font: { family: "'Inter', sans-serif", size: 14 }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          titleColor: '#fff',
          bodyColor: '#fff',
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += formatter.format(context.parsed.y);
              }
              return label;
            },
            // Removed footer as Total is now a dataset
          }
        }
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 10, // Avoid cluttering x-axis
            color: '#a0a0a0',
            font: { family: "'Inter', sans-serif" }
          },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        },
        y: {
          stacked: false, // Disable stacking
          beginAtZero: true,
          ticks: {
            color: '#a0a0a0',
            font: { family: "'Inter', sans-serif" },
            callback: function (value) {
              return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                notation: "compact",
                compactDisplay: "short"
              }).format(value);
            }
          },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });
}

// Initial Calculation on Load (optional) - Removed to wait for button click
// calculateInterest();
