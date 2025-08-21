const logElement = document.getElementById('log') || null;
const STORAGE_KEY = 'taskTrackerLogs';
const CLICKED_BUTTONS_KEY = 'taskTrackerClickedButtons';
const LAST_RESET_DATE_KEY = 'taskTrackerLastResetDate';

let logEntries = [];
let clickedButtons = new Set();

function loadLogs() {
  loadClickedButtons();

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    logEntries = JSON.parse(saved);
    if (logElement) {
      logEntries.forEach(entry => {
        logElement.textContent += formatLogEntry(entry) + '\n';
      });
    }
  }
}

function saveLogs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logEntries));
}

function formatLogEntry(entry) {
  return `[${entry.timestamp}] ${entry.category} - ${entry.task}: ${entry.value}`;
}

function addLogEntry(category, task, value) {
  const timestamp = new Date().toLocaleString();
  const entry = { timestamp, category, task, value };
  logEntries.push(entry);
  if (logElement) {
    logElement.textContent += formatLogEntry(entry) + '\n';
  }
  saveLogs();
}

function saveClickedButtons() {
  localStorage.setItem(CLICKED_BUTTONS_KEY, JSON.stringify([...clickedButtons]));
}

function loadClickedButtons() {
  const saved = localStorage.getItem(CLICKED_BUTTONS_KEY);
  if (saved) {
    clickedButtons = new Set(JSON.parse(saved));
  }
}

function setupButtons() {
  document.querySelectorAll('.track-btn').forEach(button => {
    const category = button.getAttribute('data-category');
    const task = button.getAttribute('data-task');
    const buttonId = `${category}_${task}`;

    if (clickedButtons.has(buttonId)) {
      button.classList.add('clicked');
    }

    button.addEventListener('click', () => {
      addLogEntry(category, task, 1);
      button.classList.add('clicked');
      clickedButtons.add(buttonId);
      saveClickedButtons();
    });
  });
}

function recordBP() {
  const sys = document.getElementById('systolic').value.trim();
  const dia = document.getElementById('diastolic').value.trim();
  if (sys && dia) {
    addLogEntry('Blood Pressure', 'Check', `${sys}/${dia}`);
    document.getElementById('systolic').value = '';
    document.getElementById('diastolic').value = '';
  } else {
    alert('Please fill both systolic and diastolic values.');
  }
}

function recordPulse() {
  const pulse = document.getElementById('pulse').value.trim();
  if (pulse) {
    addLogEntry('Pulse', 'Measurement', pulse);
    document.getElementById('pulse').value = '';
  } else {
    alert('Please enter a pulse value.');
  }
}

function recordOxygen() {
  const oxygen = document.getElementById('oxygen').value.trim();
  if (oxygen) {
    addLogEntry('Oxygen Saturation', 'Level', `${oxygen}%`);
    document.getElementById('oxygen').value = '';
  } else {
    alert('Please enter an oxygen level.');
  }
}

function downloadCSV() {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Timestamp,Category,Task,Value\n";
  logEntries.forEach(entry => {
    const row = [
      `"${entry.timestamp}"`,
      `"${entry.category}"`,
      `"${entry.task}"`,
      `"${entry.value}"`
    ].join(",");
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  const filename = `task_log_${new Date().toISOString().slice(0, 10)}.csv`;
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function resetButtons() {
  if (confirm('Reset all clicked buttons?')) {
    clickedButtons.clear();
    saveClickedButtons();
    document.querySelectorAll('.track-btn').forEach(button => {
      button.classList.remove('clicked');
    });
  }
}

function checkDailyReset() {
  const today = new Date().toLocaleDateString();
  const lastReset = localStorage.getItem(LAST_RESET_DATE_KEY);

  if (lastReset !== today) {
    clickedButtons.clear();
    localStorage.removeItem(CLICKED_BUTTONS_KEY);
    localStorage.setItem(LAST_RESET_DATE_KEY, today);
  }
}

function scheduleMidnightReset() {
  const now = new Date();
  const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();

  setTimeout(() => {
    resetButtons();
    localStorage.setItem(LAST_RESET_DATE_KEY, new Date().toLocaleDateString());
    scheduleMidnightReset(); // schedule next midnight reset
  }, msUntilMidnight + 1000); // small buffer
}

// Run setup once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  checkDailyReset();
  loadLogs();
  setupButtons();
  scheduleMidnightReset();

  // Make required functions available to inline HTML onclicks
  window.recordBP = recordBP;
  window.recordPulse = recordPulse;
  window.recordOxygen = recordOxygen;
  window.downloadCSV = downloadCSV;
  window.resetButtons = resetButtons;
});
