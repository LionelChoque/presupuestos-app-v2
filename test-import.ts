import { readFileSync } from 'fs';
import { convertCsvToBudgets } from './client/src/lib/csvParser';

const csvData = readFileSync('./attached_assets/PRESUPUESTOS_CON_ITEMS.csv', 'utf-8');

// Test the parser function
const runTest = async () => {
  try {
    console.log('Parsing CSV file...');
    const budgets = await convertCsvToBudgets(csvData);
    console.log(`Successfully parsed ${budgets.length} budgets!`);
    console.log('First budget:', JSON.stringify(budgets[0], null, 2));
  } catch (error) {
    console.error('Error parsing CSV:', error);
  }
};

runTest();