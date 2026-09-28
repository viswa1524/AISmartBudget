import { Transaction, BudgetCategory } from '../types';
import { getAccessToken } from './googleAuth';

export async function exportBudgetToGoogleSheets(
  transactions: Transaction[],
  categories: BudgetCategory[],
  currency: string
): Promise<{ spreadsheetUrl: string; spreadsheetId: string }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google. Please sign in to sync with Google Sheets.');
  }

  // 1. Create a new Google Spreadsheet
  const title = `AISmartBudget - Financial Overview (${new Date().toISOString().split('T')[0]})`;
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        { properties: { title: 'Transactions' } },
        { properties: { title: 'Category Budgets' } },
      ],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create spreadsheet: ${errText}`);
  }

  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;

  // 2. Prepare Transactions data
  const txRows = [
    ['ID', 'Date', 'Description', 'Amount', 'Type', 'Category', 'Payment Method', 'Tags'],
    ...transactions.map((t) => [
      t.id,
      t.date,
      t.description,
      t.amount,
      t.type.toUpperCase(),
      t.category,
      t.paymentMethod.replace('_', ' ').toUpperCase(),
      (t.tags || []).join(', '),
    ]),
  ];

  // 3. Prepare Budget data
  const budgetRows = [
    ['Category', `Monthly Limit (${currency})`, 'Alert Threshold'],
    ...categories.map((c) => [c.category, c.monthlyLimit, `${Math.round(c.alertThreshold * 100)}%`]),
  ];

  // 4. Batch update data
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: 'Transactions!A1',
            values: txRows,
          },
          {
            range: 'Category Budgets!A1',
            values: budgetRows,
          },
        ],
      }),
    }
  );

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}
