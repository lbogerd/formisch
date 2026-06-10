import { clickButton, compareScenario } from './helpers.ts';

compareScenario('/payment', 'payment form behaves identically', [
  {
    name: 'submit empty form',
    action: (page) => clickButton(page, 'Submit'),
  },
  {
    name: 'fill owner and select card type',
    action: async (page) => {
      await page.getByLabel('Owner').fill('Jane Doe');
      await page.getByLabel('Type').selectOption('card');
    },
  },
  {
    name: 'submit card type without card details',
    action: (page) => clickButton(page, 'Submit'),
  },
  {
    name: 'submit badly formatted card details',
    action: async (page) => {
      await page.getByLabel('Number').fill('1234');
      await page.getByLabel('Expiration').fill('13/30');
      await clickButton(page, 'Submit');
    },
  },
  {
    name: 'submit valid card details',
    action: async (page) => {
      await page.getByLabel('Number').fill('4242 4242 4242 4242');
      await page.getByLabel('Expiration').fill('12/29');
      await clickButton(page, 'Submit');
    },
  },
  {
    name: 'switch to paypal and submit without email',
    action: async (page) => {
      await page.getByLabel('Type').selectOption('paypal');
      await clickButton(page, 'Submit');
    },
  },
  {
    name: 'submit valid paypal details',
    action: async (page) => {
      await page.getByLabel('Email').fill('jane.doe@example.com');
      await clickButton(page, 'Submit');
    },
  },
  {
    name: 'reset form',
    action: (page) => clickButton(page, 'Reset'),
  },
]);
