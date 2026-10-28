
const expressionBox = document.getElementById("expression");
const resultBox = document.getElementById("result");
const historyBox = document.getElementById("historyList");

let expression = "";
let finished = false;
let history = [];

// Load previous calculations from the browser.
try {
  history = JSON.parse(localStorage.getItem("calcMateHistory")) || [];
  if (!Array.isArray(history)) history = [];
} catch {
  history = [];
}

// Convert a number into a neat display format.
function formatNumber(number) {
  if (!Number.isFinite(number)) return "Error";

  if (Math.abs(number) < 1e-10) number = 0;

  return Number(number.toPrecision(12)).toLocaleString("en-US", {
    maximumFractionDigits: 10,
    useGrouping: true
  });
}

// Calculate the current mathematical expression.
function calculate(input) {
  if (!input) return null;

  // Only allow numbers, decimal points, and arithmetic symbols.
  if (!/^[0-9+\-*/.()\s]+$/.test(input)) {
    throw new Error("Invalid expression");
  }

  const answer = Function('"use strict"; return (' + input + ')')();

  if (typeof answer !== "number" || !Number.isFinite(answer)) {
    throw new Error("Invalid calculation");
  }

  return answer;
}

// Update the calculator screen.
function updateScreen() {
  expressionBox.textContent = expression;

  if (!expression) {
    resultBox.textContent = "0";
    return;
  }

  try {
    const answer = calculate(expression);
    resultBox.textContent =
      answer === null ? "0" : formatNumber(answer);
  } catch {
    resultBox.textContent = "…";
  }
}

// Add a number or operator.
function addValue(value) {
  const operators = ["+", "-", "*", "/"];

  if (finished) {
    if (operators.includes(value)) {
      finished = false;
    } else {
      expression = "";
      finished = false;
    }
  }

  if (operators.includes(value)) {
    if (!expression) {
      if (value === "-") expression = "-";
      updateScreen();
      return;
    }

    if (expression === "-") return;

    if (operators.includes(expression.slice(-1))) {
      expression = expression.slice(0, -1) + value;
    } else {
      expression += value;
    }
  } else if (value === ".") {
    const currentNumber = expression.split(/[+\-*/]/).pop();

    if (currentNumber.includes(".")) return;

    expression += currentNumber === "" ? "0." : ".";
  } else {
    expression += value;
  }

  updateScreen();
}

// Clear the calculator.
function clearCalculator() {
  expression = "";
  finished = false;
  updateScreen();
}

// Delete the last character.
function deleteLast() {
  if (finished) {
    clearCalculator();
    return;
  }

  expression = expression.slice(0, -1);
  updateScreen();
}

// Convert the last number to a percentage.
function percentage() {
  if (finished) finished = false;

  const match = expression.match(/(\d*\.?\d+)$/);

  if (!match) return;

  const value = Number(match[0]) / 100;

  expression =
    expression.slice(0, match.index) +
    String(Number(value.toPrecision(12)));

  updateScreen();
}

// Save a completed calculation.
function saveHistory(oldExpression, answer) {
  history.unshift({
    expression: oldExpression,
    answer: answer
  });

  history = history.slice(0, 30);

  try {
    localStorage.setItem("calcMateHistory", JSON.stringify(history));
  } catch {
    // Calculation still works if storage is unavailable.
  }

  showHistory();
}

// Calculate when the equals button is pressed.
function showAnswer() {
  if (!expression) return;

  try {
    const oldExpression = expression;
    const answer = calculate(expression);

    if (answer === null) return;

    expressionBox.textContent = oldExpression + " =";
    resultBox.textContent = formatNumber(answer);

    saveHistory(oldExpression, answer);

    expression = String(Number(answer.toPrecision(12)));
    finished = true;
  } catch {
    resultBox.textContent = "Error";
    finished = false;
  }
}

// Display saved calculations beside the calculator.
function showHistory() {
  historyBox.innerHTML = "";

  if (history.length === 0) {
    const message = document.createElement("p");
    message.className = "empty";
    message.textContent = "Your calculations will appear here.";
    historyBox.appendChild(message);
    return;
  }

  history.forEach(function (item) {
    const button = document.createElement("button");
    button.className = "history-item";
    button.type = "button";

    const oldExpression = document.createElement("span");
    oldExpression.className = "history-expression";
    oldExpression.textContent = item.expression;

    const oldAnswer = document.createElement("span");
    oldAnswer.className = "history-answer";
    oldAnswer.textContent = "= " + formatNumber(item.answer);

    button.append(oldExpression, oldAnswer);

    // Clicking history reuses that answer.
    button.addEventListener("click", function () {
      expression = String(item.answer);
      finished = true;
      expressionBox.textContent = item.expression + " =";
      resultBox.textContent = formatNumber(item.answer);
    });

    historyBox.appendChild(button);
  });
}

// Connect each calculator button to its function.
document.querySelectorAll(".key").forEach(function (button) {
  button.addEventListener("click", function () {
    const value = button.dataset.value;
    const action = button.dataset.action;

    if (value !== undefined) {
      addValue(value);
      return;
    }

    if (action === "clear") clearCalculator();
    if (action === "delete") deleteLast();
    if (action === "percent") percentage();
    if (action === "decimal") addValue(".");
    if (action === "equals") showAnswer();
  });
});

// Clear the complete calculation history.
document.getElementById("clearHistory").addEventListener("click", function () {
  history = [];

  try {
    localStorage.removeItem("calcMateHistory");
  } catch {
    // Ignore unavailable browser storage.
  }

  showHistory();
});

// Keyboard support.
document.addEventListener("keydown", function (event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  const key = event.key;

  if (/^[0-9]$/.test(key)) addValue(key);
  else if (key === ".") addValue(".");
  else if (key === "+") addValue("+");
  else if (key === "-") addValue("-");
  else if (key === "*") addValue("*");
  else if (key === "/") {
    event.preventDefault();
    addValue("/");
  }
  else if (key === "%") percentage();
  else if (key === "Enter" || key === "=") {
    event.preventDefault();
    showAnswer();
  }
  else if (key === "Backspace") deleteLast();
  else if (key === "Escape" || key === "Delete") clearCalculator();
});

// Start the calculator.
updateScreen();
showHistory();
