const startingBalanceInput = document.getElementById("starting-balance");
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

// Format input with commas while typing
function formatNumberInput(input) {
  // 1. Get cursor position and length before change
  const cursorPosition = input.selectionStart;
  const originalLength = input.value.length;

  // 2. Remove non-numeric chars (except dot)
  let value = input.value.replace(/,/g, '');

  // 3. Check validity (regex: allow digits and one dot)
  if (!/^\d*\.?\d*$/.test(value)) {
    // If invalid char added, just strip non-numeric
    value = value.replace(/[^\d.]/g, '');
  }

  // 4. Format with commas
  if (value) {
    const parts = value.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    input.value = parts.join('.');
  } else {
    input.value = '';
  }

  // 5. Restore cursor position
  // Calculate new position based on added/removed commas
  const newLength = input.value.length;
  const newPosition = cursorPosition + (newLength - originalLength);
  input.setSelectionRange(newPosition, newPosition);
}

function parseFormattedValue(value) {
  if (!value) return 0;
  return parseFloat(value.replace(/,/g, '')) || 0;
}

// Add event listeners for formatting
[startingBalanceInput, amountInput].forEach(input => {
  input.addEventListener('input', () => formatNumberInput(input));
});

function calculateInterest() {
  const startingBalance = parseFormattedValue(startingBalanceInput.value);
  const contribution = parseFormattedValue(amountInput.value);
  const frequency = frequencyInput.value;
  const interestRate = parseFloat(interestRateInput.value) / 100;
  let years = parseInt(yearsInput.value);

  // Validate that we have at least some numbers to work with, but allow 0s
  if (isNaN(interestRate) || isNaN(years)) {
    resultDiv.innerHTML = "<span style='color: #ff6b6b;'>Please enter valid interest rate and years.</span>";
    return;
  }

  if (years > 100) {
    years = 100;
    yearsInput.value = 100;
  }

  let futureValuePrincipal = 0;
  let futureValueContributions = 0;
  let totalInvestedPrincipal = startingBalance;
  let totalInvestedContributions = 0;

  // 1. Calculate Growth of Starting Balance
  // A = P(1 + r)^t
  futureValuePrincipal = startingBalance * Math.pow(1 + interestRate / 12, 12 * years);

  // 2. Calculate Growth of Contributions
  if (frequency === 'once') {
    // None selected, so no regular contributions
    futureValueContributions = 0;
    totalInvestedContributions = 0;
  } else if (frequency === 'monthly') {
    // FV = PMT * ((1 + r/n)^(nt) - 1) / (r/n)
    const n = 12;
    const ratePerPeriod = interestRate / n;
    const periods = n * years;

    if (interestRate === 0) {
      futureValueContributions = contribution * periods;
    } else {
      futureValueContributions = contribution * ((Math.pow(1 + ratePerPeriod, periods) - 1) / ratePerPeriod);
    }
    totalInvestedContributions = contribution * periods;

  } else if (frequency === 'yearly') {
    // FV = PMT * ((1 + r)^t - 1) / r
    if (interestRate === 0) {
      futureValueContributions = contribution * years;
    } else {
      futureValueContributions = contribution * ((Math.pow(1 + interestRate, years) - 1) / interestRate);
    }
    totalInvestedContributions = contribution * years;
  }

  const total = futureValuePrincipal + futureValueContributions;
  const totalInvested = totalInvestedPrincipal + totalInvestedContributions;
  const totalInterest = total - totalInvested;

  resultDiv.innerHTML = `
    <div style="margin-bottom: 0.5rem;">Total Value: <strong style="font-size: 1.2em;">${formatter.format(total)}</strong></div>
    <div style="font-size: 0.9rem; color: #b0c4de;">Total Interest Earned: <span style="color: #4facfe;">${formatter.format(totalInterest)}</span></div>
    <div style="font-size: 0.9rem; color: #b0c4de;">Total Invested: <span>${formatter.format(totalInvested)}</span></div>
  `;

  generateChart(startingBalance, contribution, frequency, interestRate, years);
}

function generateChart(startingBalance, contribution, frequency, rate, years) {
  const labels = [];
  const data = [];
  const investedData = [];

  for (let i = 0; i <= years; i++) {
    labels.push(`Year ${i}`);

    // Principal Growth
    const principalGrowth = startingBalance * Math.pow(1 + rate / 12, 12 * i);
    const principalInvested = startingBalance;

    // Contribution Growth
    let contributionGrowth = 0;
    let contributionInvested = 0;

    if (frequency === 'monthly') {
      const n = 12;
      const ratePerPeriod = rate / n;
      const periods = n * i;

      if (rate === 0) {
        contributionGrowth = contribution * periods;
      } else {
        if (i > 0) {
          contributionGrowth = contribution * ((Math.pow(1 + ratePerPeriod, periods) - 1) / ratePerPeriod);
        }
      }
      contributionInvested = contribution * periods;

    } else if (frequency === 'yearly') {
      if (rate === 0) {
        contributionGrowth = contribution * i;
      } else {
        if (i > 0) {
          contributionGrowth = contribution * ((Math.pow(1 + rate, i) - 1) / rate);
        }
      }
      contributionInvested = contribution * i;
    }

    data.push(principalGrowth + contributionGrowth);
    investedData.push(principalInvested + contributionInvested);
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
