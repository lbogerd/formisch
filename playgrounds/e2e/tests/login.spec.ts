import { clickButton, compareScenario } from './helpers.ts';

compareScenario('/login', 'login form behaves identically', [
  {
    name: 'submit empty form',
    action: (page) => clickButton(page, 'Submit'),
  },
  {
    name: 'submit badly formatted email and short password',
    action: async (page) => {
      await page.getByLabel('Email').fill('invalid-email');
      await page.getByLabel('Password').fill('short');
      await clickButton(page, 'Submit');
    },
  },
  {
    name: 'fix email but keep short password',
    action: async (page) => {
      await page.getByLabel('Email').fill('jane.doe@example.com');
      await clickButton(page, 'Submit');
    },
  },
  {
    name: 'submit valid credentials',
    action: async (page) => {
      await page.getByLabel('Password').fill('super-secret-password');
      await clickButton(page, 'Submit');
    },
  },
  {
    name: 'reset form',
    action: (page) => clickButton(page, 'Reset'),
  },
  {
    name: 'submit empty form after reset',
    action: (page) => clickButton(page, 'Submit'),
  },
]);
