const amountInput = document.getElementById("amount");
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

function calculateInterest() {
  const amount = parseFloat(amountInput.value);
  const frequency = frequencyInput.value;
  const interestRate = parseFloat(interestRateInput.value) / 100;
  let years = parseInt(yearsInput.value);

  if (isNaN(amount) || isNaN(interestRate) || isNaN(years)) {
    resultDiv.innerHTML = "<span style='color: #ff6b6b;'>Please enter valid numbers.</span>";
    return;
  }

  if (years > 100) {
    years = 100;
    yearsInput.value = 100;
  }

  let total = 0;

  if (frequency === 'once') {
    // A = P(1 + r)^t
    total = amount * Math.pow(1 + interestRate, years);
  } else if (frequency === 'monthly') {
    // FV = PMT * ((1 + r/n)^(nt) - 1) / (r/n)
    const n = 12;
    const ratePerPeriod = interestRate / n;
    const periods = n * years;
    total = amount * ((Math.pow(1 + ratePerPeriod, periods) - 1) / ratePerPeriod);
  } else if (frequency === 'yearly') {
    // FV = PMT * ((1 + r)^t - 1) / r
    if (interestRate === 0) {
      total = amount * years;
    } else {
      total = amount * ((Math.pow(1 + interestRate, years) - 1) / interestRate);
    }
  }

  let totalInvested = 0;
  if (frequency === 'once') {
    totalInvested = amount;
  } else if (frequency === 'monthly') {
    totalInvested = amount * 12 * years;
  } else if (frequency === 'yearly') {
    totalInvested = amount * years;
  }

  const totalInterest = total - totalInvested;

  resultDiv.innerHTML = `
    <div style="margin-bottom: 0.5rem;">Total Value: <strong style="font-size: 1.2em;">${formatter.format(total)}</strong></div>
    <div style="font-size: 0.9rem; color: #b0c4de;">Total Interest Earned: <span style="color: #4facfe;">${formatter.format(totalInterest)}</span></div>
    <div style="font-size: 0.9rem; color: #b0c4de;">Total Invested: <span>${formatter.format(totalInvested)}</span></div>
  `;

  generateChart(amount, frequency, interestRate, years);
}

function generateChart(amount, frequency, rate, years) {
  const labels = [];
  const data = [];
  const investedData = [];

  for (let i = 0; i <= years; i++) {
    labels.push(`Year ${i}`);
    let yearlyAmount = 0;
    let yearlyInvested = 0;

    if (frequency === 'once') {
      // Compound
      yearlyAmount = amount * Math.pow(1 + rate, i);
      // Invested (Principal remains constant)
      yearlyInvested = amount;
    } else if (frequency === 'monthly') {
      const n = 12;
      const ratePerPeriod = rate / n;
      const periods = n * i;

      // Compound
      if (i === 0) {
        yearlyAmount = 0;
      } else {
        yearlyAmount = amount * ((Math.pow(1 + ratePerPeriod, periods) - 1) / ratePerPeriod);
      }

      // Invested (Simple accumulation)
      yearlyInvested = amount * 12 * i;

    } else if (frequency === 'yearly') {
      // Compound
      if (rate === 0) {
        yearlyAmount = amount * i;
      } else {
        if (i === 0) yearlyAmount = 0;
        else yearlyAmount = amount * ((Math.pow(1 + rate, i) - 1) / rate);
      }

      // Invested
      yearlyInvested = amount * i;
    }

    data.push(yearlyAmount);
    investedData.push(yearlyInvested);
  }

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
          data: data,
          borderColor: '#4facfe',
          backgroundColor: 'rgba(79, 172, 254, 0.2)',
          borderWidth: 3,
          pointBackgroundColor: '#00f2fe',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Total Invested (No Interest)',
          data: investedData,
          borderColor: '#ff9a9e',
          backgroundColor: 'rgba(255, 154, 158, 0.2)',
          borderWidth: 3,
          pointBackgroundColor: '#ff6b6b',
          fill: true,
          tension: 0.4,
          borderDash: [5, 5]
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
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#a0a0a0',
            font: { family: "'Inter', sans-serif" }
          },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        },
        y: {
          ticks: {
            color: '#a0a0a0',
            font: { family: "'Inter', sans-serif" },
            callback: function (value) {
              // Use formatter but compact for axis if needed? 
              // Standard format is requested: "1,000,000"
              return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumSignificantDigits: 3
              }).format(value);
            }
          },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
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

calculateButton.addEventListener("click", calculateInterest);
