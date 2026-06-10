import { clickButton, compareScenario, type Step } from './helpers.ts';

// Button order in the nested form (top to bottom): per item a "Delete"
// (item) followed by one "Delete" per option and the option-level
// "Add option" / "Move first to end" / "Swap first two" buttons; after
// all items follow the items-level "Add item" / "Move first to end" /
// "Swap first two" / "Replace first" buttons. Option-level and
// items-level buttons that share a label are disambiguated by index.
const steps: Step[] = [
  {
    name: 'edit first item label and first option',
    action: async (page) => {
      await page.getByPlaceholder('Enter item').first().fill('Groceries');
      await page.getByPlaceholder('Enter option').first().fill('Apples');
    },
  },
  {
    name: 'add option to first item and fill it',
    action: async (page) => {
      await clickButton(page, 'Add option');
      await page.getByPlaceholder('Enter option').nth(2).fill('Bananas');
    },
  },
  {
    name: 'move first option of first item to end',
    action: (page) => clickButton(page, 'Move first to end'),
  },
  {
    name: 'swap first two options of first item',
    action: (page) => clickButton(page, 'Swap first two'),
  },
  {
    name: 'add new item',
    action: (page) => clickButton(page, 'Add item'),
  },
  {
    name: 'move first item to end',
    // Index 2: after the per-item buttons of all three items, the
    // items-level "Move first to end" is the last one
    action: (page) => clickButton(page, 'Move first to end', 2),
  },
  {
    name: 'swap first two items',
    action: (page) => clickButton(page, 'Swap first two', 2),
  },
  {
    name: 'replace first item',
    action: (page) => clickButton(page, 'Replace first'),
  },
  {
    name: 'delete first option of first item',
    // Index 1: index 0 deletes the whole first item
    action: (page) => clickButton(page, 'Delete', 1),
  },
  {
    name: 'delete first item',
    action: (page) => clickButton(page, 'Delete'),
  },
  {
    name: 'submit form',
    action: (page) => clickButton(page, 'Submit'),
  },
  {
    name: 'reset form',
    action: (page) => clickButton(page, 'Reset'),
  },
];

compareScenario('/nested', 'nested form behaves identically', steps);
