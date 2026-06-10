import { clickButton, snapshotScenario } from './helpers.ts';

// The two playgrounds intentionally render different forms on /special:
// the valibot app showcases special input types (number, range, checkbox,
// radio, select, file) while the zod app stresses lazy field store
// creation (discriminated union, optional field, optional field array).
// They cannot be compared 1-to-1, so each app is snapshot tested on its
// own to lock in its current behavior.

snapshotScenario(
  'valibot',
  '/special',
  'valibot special form behaves consistently',
  [
    {
      name: 'submit untouched form',
      action: (page) => clickButton(page, 'Submit'),
    },
    {
      name: 'fill number and move range slider',
      action: async (page) => {
        await page.getByLabel('Number').fill('42');
        const slider = page.getByLabel('Range');
        await slider.focus();
        for (let index = 0; index < 5; index++) {
          await slider.press('ArrowRight');
        }
      },
    },
    {
      name: 'toggle checkboxes and select radio option',
      action: async (page) => {
        await page.getByRole('checkbox', { name: 'Option 1' }).check();
        await page.getByRole('checkbox', { name: 'Option 3' }).check();
        await page.getByRole('checkbox', { name: 'Checkbox boolean' }).check();
        await page.getByRole('radio', { name: 'Option 2' }).check();
      },
    },
    {
      name: 'select multiple and single options',
      action: async (page) => {
        await page
          .getByLabel('Select array')
          .selectOption(['option_1', 'option_3']);
        await page.getByLabel('Select string').selectOption('option_2');
      },
    },
    {
      name: 'choose files',
      action: async (page) => {
        await page.getByLabel('File list').setInputFiles([
          { name: 'first.txt', mimeType: 'text/plain', buffer: Buffer.from('first') },
          { name: 'second.txt', mimeType: 'text/plain', buffer: Buffer.from('second') },
        ]);
        await page.getByLabel('File item').setInputFiles({
          name: 'item.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('item'),
        });
      },
    },
    {
      name: 'submit filled form',
      action: (page) => clickButton(page, 'Submit'),
    },
    {
      name: 'reset form',
      action: (page) => clickButton(page, 'Reset'),
    },
  ]
);

snapshotScenario('zod', '/special', 'zod special form behaves consistently', [
  {
    name: 'submit without card number',
    action: (page) => clickButton(page, 'Submit'),
  },
  {
    name: 'fill card number and submit',
    action: async (page) => {
      await page.getByLabel('Card number').fill('1234 5678 9012 3456');
      await clickButton(page, 'Submit');
    },
  },
  {
    // This step exercises the lazy union branch: the `paypal` object store
    // is created when the branch mounts and must be marked as present so
    // the required error appears on the email field
    name: 'switch to paypal and submit without email',
    action: async (page) => {
      await page.getByRole('radio', { name: 'PayPal' }).check();
      await clickButton(page, 'Submit');
    },
  },
  {
    name: 'submit badly formatted paypal email',
    action: async (page) => {
      await page.getByLabel('PayPal email').fill('invalid-email');
      await clickButton(page, 'Submit');
    },
  },
  {
    name: 'submit valid paypal email',
    action: async (page) => {
      await page.getByLabel('PayPal email').fill('jane.doe@example.com');
      await clickButton(page, 'Submit');
    },
  },
  {
    name: 'submit too long note',
    action: async (page) => {
      await page.getByLabel('Note').fill('x'.repeat(101));
      await clickButton(page, 'Submit');
    },
  },
  {
    name: 'fix note and add four tags',
    action: async (page) => {
      await page.getByLabel('Note').fill('A short note');
      for (let index = 0; index < 4; index++) {
        await clickButton(page, 'Add tag');
      }
    },
  },
  {
    name: 'fill three tags and submit too many empty',
    action: async (page) => {
      const labels = ['alpha', 'beta', 'gamma'];
      for (let index = 0; index < labels.length; index++) {
        await page.getByPlaceholder('Enter tag').nth(index).fill(labels[index]);
      }
      await clickButton(page, 'Submit');
    },
  },
  {
    name: 'remove last tag and submit valid form',
    action: async (page) => {
      await clickButton(page, 'Delete', 3);
      await clickButton(page, 'Submit');
    },
  },
  {
    name: 'reset form',
    action: (page) => clickButton(page, 'Reset'),
  },
]);
