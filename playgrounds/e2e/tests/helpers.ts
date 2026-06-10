import { type Browser, expect, type Page, test } from '@playwright/test';
import { VALIBOT_PORT, ZOD_PORT } from '../playwright.config.ts';

export interface Step {
  /** Step name recorded in the snapshot next to the captured state. */
  name: string;
  /** Interaction to perform on the page before capturing its state. */
  action: (page: Page) => Promise<void>;
}

interface StepState {
  step: string;
  fields: Record<string, unknown>;
  errors: Record<string, string>;
  submits: unknown[];
}

declare global {
  interface Window {
    __submits?: unknown[];
  }
}

/**
 * Opens one playground at the given route in a fresh browser context with
 * animations disabled and `console.log` instrumented so that the playground
 * `onSubmit` handlers (which log the validated output) can be captured.
 */
async function openApp(
  browser: Browser,
  port: number,
  route: string
): Promise<Page> {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    const submits: unknown[] = [];
    window.__submits = submits;
    const original = console.log.bind(console);
    console.log = (...args: unknown[]) => {
      try {
        submits.push(
          JSON.parse(JSON.stringify(args.length === 1 ? args[0] : args))
        );
      } catch {
        // Non-serializable logs are not part of the compared behavior
      }
      original(...args);
    };
  });
  const page = await context.newPage();
  await page.goto(`http://localhost:${port}${route}`);
  await page.addStyleTag({
    content:
      '*, *::before, *::after { transition-duration: 0s !important; animation-duration: 0s !important; }',
  });
  return page;
}

/**
 * Serializes the observable form behavior of the page: the value of every
 * named input, every visible validation error, and every submitted output.
 */
async function captureState(page: Page): Promise<Omit<StepState, 'step'>> {
  // Let validation, list animations and the 200ms error collapse settle
  await page.waitForTimeout(300);
  return page.evaluate(() => {
    const fields: Record<string, unknown> = {};
    for (const element of Array.from(
      document.querySelectorAll('input, select, textarea')
    )) {
      const el = element as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement;
      const key = el.name || el.id;
      if (!key) continue;
      let value: unknown;
      if (el instanceof HTMLSelectElement) {
        value = el.multiple
          ? Array.from(el.selectedOptions, (option) => option.value)
          : el.value;
      } else if (
        el instanceof HTMLInputElement &&
        (el.type === 'checkbox' || el.type === 'radio')
      ) {
        value = el.checked;
      } else {
        value = el.value;
      }
      if (key in fields) {
        const existing = fields[key];
        fields[key] = Array.isArray(existing)
          ? [...existing, value]
          : [existing, value];
      } else {
        fields[key] = value;
      }
    }

    // InputErrors renders `<div id="{name}-error">` inside an Expandable
    // wrapper that toggles `aria-hidden`, so only expanded errors count
    const errors: Record<string, string> = {};
    for (const el of Array.from(document.querySelectorAll('[id$="-error"]'))) {
      const wrapper = el.closest('[aria-hidden]');
      const text = el.textContent?.trim();
      if (wrapper?.getAttribute('aria-hidden') === 'false' && text) {
        errors[el.id] = text;
      }
    }

    return { fields, errors, submits: window.__submits ?? [] };
  });
}

/**
 * Runs the step sequence against one playground and returns the captured
 * state after every step (plus the initial state).
 */
async function runApp(
  browser: Browser,
  port: number,
  route: string,
  steps: Step[]
): Promise<StepState[]> {
  const page = await openApp(browser, port, route);
  const states: StepState[] = [
    { step: 'initial', ...(await captureState(page)) },
  ];
  for (const step of steps) {
    await step.action(page);
    states.push({ step: step.name, ...(await captureState(page)) });
  }
  await page.context().close();
  return states;
}

/**
 * Declares a test that executes the same interaction sequence against the
 * valibot playground and the zod playground, asserts that both produce
 * identical behavior, and records that behavior as a snapshot.
 */
export function compareScenario(
  route: string,
  title: string,
  steps: Step[]
): void {
  test(title, async ({ browser }) => {
    const [valibot, zod] = await Promise.all([
      runApp(browser, VALIBOT_PORT, route, steps),
      runApp(browser, ZOD_PORT, route, steps),
    ]);
    expect
      .soft(
        zod,
        'react-zod playground must behave identically to the valibot playground'
      )
      .toEqual(valibot);
    expect(JSON.stringify(valibot, null, 2)).toMatchSnapshot(
      `${route.replace(/\//g, '')}-${title.replace(/[^a-z0-9]+/gi, '-')}.json`
    );
  });
}

/**
 * Declares a test that executes an interaction sequence against a single
 * playground and records the behavior as a snapshot. Used for routes like
 * `/special` where the two playgrounds intentionally render different
 * forms, so cross-app comparison is impossible and each app is regression
 * tested against its own recorded behavior instead.
 */
export function snapshotScenario(
  app: 'valibot' | 'zod',
  route: string,
  title: string,
  steps: Step[]
): void {
  test(title, async ({ browser }) => {
    const port = app === 'valibot' ? VALIBOT_PORT : ZOD_PORT;
    const states = await runApp(browser, port, route, steps);
    expect(JSON.stringify(states, null, 2)).toMatchSnapshot(
      `${route.replace(/\//g, '')}-${app}-${title.replace(/[^a-z0-9]+/gi, '-')}.json`
    );
  });
}

/**
 * Clicks the nth visible button with the given accessible name. The
 * playgrounds render duplicate submit/reset buttons (header vs. footer)
 * where only one set is visible per viewport size.
 */
export async function clickButton(
  page: Page,
  name: string,
  nth = 0
): Promise<void> {
  await page
    .getByRole('button', { name, exact: true })
    .filter({ visible: true })
    .nth(nth)
    .click();
}
