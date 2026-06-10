import { clickButton, compareScenario, type Step } from './helpers.ts';

// The "Replace first" button is intentionally not exercised: it inserts
// `Math.random()` and `new Date()` values, which can never be equal
// across two app instances.
const steps: Step[] = [
  {
    name: 'submit empty form',
    action: (page) => clickButton(page, 'Submit'),
  },
  {
    name: 'fill heading and first todo then submit',
    action: async (page) => {
      await page.getByLabel('Heading').fill('Shopping list');
      await page.getByPlaceholder('Enter task').first().fill('Buy milk');
      await page.locator('input[type="date"]').first().fill('2026-07-01');
      await clickButton(page, 'Submit');
    },
  },
  {
    name: 'add four more todos and submit too many',
    action: async (page) => {
      for (let index = 0; index < 4; index++) {
        await clickButton(page, 'Add new');
      }
      await clickButton(page, 'Submit');
    },
  },
  {
    name: 'remove last todo and fill the rest',
    action: async (page) => {
      await clickButton(page, 'Delete', 4);
      const labels = ['Buy eggs', 'Buy bread', 'Buy cheese'];
      for (let index = 0; index < labels.length; index++) {
        await page
          .getByPlaceholder('Enter task')
          .nth(index + 1)
          .fill(labels[index]);
        await page
          .locator('input[type="date"]')
          .nth(index + 1)
          .fill(`2026-07-0${index + 2}`);
      }
    },
  },
  {
    name: 'swap first two todos',
    action: (page) => clickButton(page, 'Swap first two'),
  },
  {
    name: 'move first todo to end',
    action: (page) => clickButton(page, 'Move first to end'),
  },
  {
    name: 'submit valid todos',
    action: (page) => clickButton(page, 'Submit'),
  },
  {
    name: 'remove all todos and submit',
    action: async (page) => {
      for (let index = 0; index < 4; index++) {
        await clickButton(page, 'Delete');
      }
      await clickButton(page, 'Submit');
    },
  },
  {
    name: 'reset form',
    action: (page) => clickButton(page, 'Reset'),
  },
];

compareScenario('/todos', 'todo form behaves identically', steps);
