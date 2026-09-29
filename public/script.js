// State management
const state = {
  transactions: [],
  categories: [],
  goals: [],
  currency: '$'
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
  updateDashboard();
});

// Setup event listeners
function setupEventListeners() {
  // Tab navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      switchTab(e.target.dataset.tab);
    });
  });

  // Forms
  document.getElementById('transactionForm').addEventListener('submit', addTransaction);
  document.getElementById('budgetForm').addEventListener('submit', generateBudget);
  document.getElementById('goalForm').addEventListener('submit', addGoal);
  document.getElementById('chatForm').addEventListener('submit', sendChatMessage);
}

// Tab switching
function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show selected tab
  document.getElementById(tabName + '-tab').classList.add('active');
  event.target.classList.add('active');
}

// Load data from server
async function loadData() {
  try {
    const response = await fetch('/api/data');
    const result = await response.json();
    if (result.success) {
      state.transactions = result.data.transactions || [];
      state.categories = result.data.categories || [];
      state.goals = result.data.goals || [];
      state.currency = result.data.currency || '$';
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Save data to server
async function saveData() {
  try {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactions: state.transactions,
        categories: state.categories,
        goals: state.goals,
        currency: state.currency
      })
    });
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Update dashboard
function updateDashboard() {
  const totalIncome = state.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = state.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  document.getElementById('totalIncome').textContent = `${state.currency}${totalIncome.toFixed(2)}`;
  document.getElementById('totalExpense').textContent = `${state.currency}${totalExpense.toFixed(2)}`;
  document.getElementById('netSavings').textContent = `${state.currency}${netSavings.toFixed(2)}`;
  document.getElementById('savingsRate').textContent = `${savingsRate}%`;

  // Fetch and display health report
  fetchHealthReport(totalIncome, totalExpense);
}

// Fetch health report from AI
async function fetchHealthReport(income, expense) {
  try {
    const response = await fetch('/api/ai/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: { totalIncome: income, totalExpense: expense },
        transactions: state.transactions,
        categories: state.categories,
        goals: state.goals,
        currency: state.currency
      })
    });
    const result = await response.json();
    if (result.success) {
      displayHealthReport(result.data);
    }
  } catch (error) {
    console.error('Error fetching health report:', error);
  }
}

// Display health report
function displayHealthReport(data) {
  const report = document.getElementById('healthReport');
  report.innerHTML = `
    <div style="margin-bottom: 1rem;">
      <span class="grade-badge">${data.healthGrade}</span>
      <span style="font-size: 1.5rem; font-weight: bold;">${data.overallScore}/100</span>
    </div>
    <p>${data.summary}</p>
    <h4 style="margin-top: 1rem; margin-bottom: 0.5rem;">Key Strengths:</h4>
    <ul style="margin-left: 1.5rem;">
      ${data.keyStrengths?.map(s => `<li>${s}</li>`).join('')}
    </ul>
    <h4 style="margin-top: 1rem; margin-bottom: 0.5rem;">Areas to Watch:</h4>
    <ul style="margin-left: 1.5rem;">
      ${data.criticalRisks?.map(r => `<li>${r}</li>`).join('')}
    </ul>
  `;
}

// Generate audit
async function generateAudit() {
  const income = state.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = state.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  fetchHealthReport(income, expense);
}

// Add transaction
async function addTransaction(e) {
  e.preventDefault();

  const transaction = {
    id: `tx_${Date.now()}`,
    amount: parseFloat(document.getElementById('txAmount').value),
    description: document.getElementById('txDescription').value,
    category: document.getElementById('txCategory').value,
    type: document.getElementById('txType').value,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'manual'
  };

  try {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction })
    });
    const result = await response.json();
    if (result.success) {
      state.transactions.unshift(transaction);
      saveData();
      e.target.reset();
      updateDashboard();
      displayTransactions();
      alert('Transaction added successfully!');
    }
  } catch (error) {
    console.error('Error adding transaction:', error);
    alert('Error adding transaction');
  }
}

// Display transactions
function displayTransactions() {
  const list = document.getElementById('transactionsList');
  if (state.transactions.length === 0) {
    list.innerHTML = '<p>No transactions yet</p>';
    return;
  }

  list.innerHTML = state.transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(tx => `
      <div class="transaction-item ${tx.type}">
        <div class="transaction-info">
          <div style="font-weight: bold;">${tx.description}</div>
          <div class="transaction-date">${tx.date} • ${tx.category}</div>
        </div>
        <div>
          <div class="transaction-amount ${tx.type}">
            ${tx.type === 'income' ? '+' : '-'}${state.currency}${tx.amount.toFixed(2)}
          </div>
          <button class="btn btn-danger" onclick="deleteTransaction('${tx.id}')">Delete</button>
        </div>
      </div>
    `)
    .join('');
}

// Delete transaction
async function deleteTransaction(id) {
  if (!confirm('Delete this transaction?')) return;

  try {
    const response = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (result.success) {
      state.transactions = state.transactions.filter(t => t.id !== id);
      saveData();
      updateDashboard();
      displayTransactions();
    }
  } catch (error) {
    console.error('Error deleting transaction:', error);
  }
}

// Generate budget
async function generateBudget(e) {
  e.preventDefault();

  const income = parseFloat(document.getElementById('monthlyIncome').value);
  const style = document.getElementById('budgetStyle').value;

  try {
    const response = await fetch('/api/ai/generate-budget-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthlyIncome: income, style })
    });
    const result = await response.json();
    if (result.success) {
      displayBudgetBreakdown(result.data);
    }
  } catch (error) {
    console.error('Error generating budget:', error);
  }
}

// Display budget breakdown
function displayBudgetBreakdown(data) {
  const breakdown = document.getElementById('budgetBreakdown');
  const items = [
    { label: 'Needs', percentage: data.breakdown.needs.percentage, amount: data.breakdown.needs.amount },
    { label: 'Wants', percentage: data.breakdown.wants.percentage, amount: data.breakdown.wants.amount },
    { label: 'Savings', percentage: data.breakdown.savings.percentage, amount: data.breakdown.savings.amount }
  ];

  breakdown.innerHTML = items
    .map(item => `
      <div class="budget-item">
        <h3>${item.label}</h3>
        <div class="budget-percentage">${item.percentage}%</div>
        <div class="budget-amount">${state.currency}${item.amount.toFixed(2)}</div>
      </div>
    `)
    .join('');
}

// Add goal
async function addGoal(e) {
  e.preventDefault();

  const goal = {
    id: `goal_${Date.now()}`,
    title: document.getElementById('goalTitle').value,
    targetAmount: parseFloat(document.getElementById('goalAmount').value),
    deadline: document.getElementById('goalDate').value,
    saved: 0,
    createdAt: new Date().toISOString()
  };

  state.goals.push(goal);
  saveData();
  e.target.reset();
  displayGoals();
  alert('Goal added successfully!');
}

// Display goals
function displayGoals() {
  const list = document.getElementById('goalsList');
  if (state.goals.length === 0) {
    list.innerHTML = '<p>No goals yet</p>';
    return;
  }

  list.innerHTML = state.goals
    .map(goal => {
      const progress = (goal.saved / goal.targetAmount) * 100;
      return `
        <div class="goal-item">
          <div class="goal-info">
            <div style="font-weight: bold;">${goal.title}</div>
            <div class="goal-progress">
              <div class="goal-progress-bar" style="width: ${progress}%"></div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
              <span>${state.currency}${goal.saved.toFixed(2)} / ${state.currency}${goal.targetAmount.toFixed(2)}</span>
              <span class="goal-deadline">Due: ${goal.deadline}</span>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

// Send chat message
async function sendChatMessage(e) {
  e.preventDefault();

  const message = document.getElementById('chatInput').value;
  const messagesDiv = document.getElementById('chatMessages');

  // Add user message
  const userMsg = document.createElement('div');
  userMsg.className = 'message user-message';
  userMsg.textContent = message;
  messagesDiv.appendChild(userMsg);

  const income = state.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = state.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        context: {
          currency: state.currency,
          totalIncome: income,
          totalExpense: expense,
          savingsRate: income > 0 ? Math.round((income - expense) / income * 100) : 0
        }
      })
    });
    const result = await response.json();
    if (result.success) {
      const aiMsg = document.createElement('div');
      aiMsg.className = 'message ai-message';
      aiMsg.textContent = result.reply;
      messagesDiv.appendChild(aiMsg);
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }

  document.getElementById('chatInput').value = '';
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Display initial transactions and goals
displayTransactions();
displayGoals();
