const amountInput = document.getElementById("amount");
const interestRateInput = document.getElementById("interest-rate");
const yearsInput = document.getElementById("years");
const calculateButton = document.getElementById("calculate");
const resultDiv = document.getElementById("result");

function calculateInterest() {
  const amount = amountInput.value;
  const interestRate = interestRateInput.value / 100;
  const years = yearsInput.value;

  const total = amount * Math.pow(1 + interestRate, years);
  const roundedTotal = Math.round(total * 100) / 100;

  resultDiv.textContent = `Total amount with interest: $${roundedTotal}`;
}

calculateButton.addEventListener("click", calculateInterest);
