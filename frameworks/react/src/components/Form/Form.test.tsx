import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import * as v from 'valibot';
import { describe, expect, test, vi } from 'vitest';
import * as z from 'zod';
import { useField, useForm } from '../../hooks/index.ts';
import { Form } from './Form.tsx';

const schema = v.object({
  email: v.pipe(v.string(), v.nonEmpty('Email is required')),
});

describe('Form', () => {
  test('should render a form element with noValidate, children, and forwarded attributes', () => {
    function Test(): ReactElement {
      const form = useForm({ schema, initialInput: { email: '' } });
      return (
        <Form
          of={form}
          onSubmit={vi.fn()}
          aria-label="Test"
          className="my-form"
          id="signup"
        >
          <span data-testid="child">child</span>
        </Form>
      );
    }

    render(<Test />);

    const formElement = screen.getByRole('form', { name: 'Test' });
    expect(formElement.tagName).toBe('FORM');
    expect(formElement).toHaveAttribute('novalidate');
    expect(formElement).toHaveClass('my-form');
    expect(formElement).toHaveAttribute('id', 'signup');
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  test('should call onSubmit with the validated output when submitted', async () => {
    const onSubmit = vi.fn();

    function Test(): ReactElement {
      const form = useForm({
        schema,
        initialInput: { email: 'user@example.com' },
      });
      return (
        <Form of={form} onSubmit={onSubmit} aria-label="Test">
          <button type="submit">Submit</button>
        </Form>
      );
    }

    render(<Test />);

    fireEvent.submit(screen.getByRole('form', { name: 'Test' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        { email: 'user@example.com' },
        expect.any(Object)
      );
    });
  });

  test('should not call onSubmit when validation fails', async () => {
    const onSubmit = vi.fn();

    function Test(): ReactElement {
      const form = useForm({ schema, initialInput: { email: '' } });
      return (
        <Form of={form} onSubmit={onSubmit} aria-label="Test">
          <span data-testid="valid">{String(form.isValid)}</span>
          <button type="submit">Submit</button>
        </Form>
      );
    }

    render(<Test />);

    const valid = screen.getByTestId('valid');

    expect(valid).toHaveTextContent('true');

    fireEvent.submit(screen.getByRole('form', { name: 'Test' }));

    await waitFor(() => {
      expect(valid).toHaveTextContent('false');
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  // Uses a Zod schema to prove that any Standard Schema library is supported
  test('should validate and submit with a Zod schema', async () => {
    const zodSchema = z.object({ email: z.email('Invalid email') });
    const onSubmit = vi.fn();

    function Test(): ReactElement {
      const form = useForm({
        schema: zodSchema,
        initialInput: { email: 'invalid' },
      });
      const field = useField(form, { path: ['email'] });
      return (
        <Form of={form} onSubmit={onSubmit} aria-label="Test">
          <input
            data-testid="input"
            {...field.props}
            value={field.input ?? ''}
          />
          {field.errors && <span data-testid="error">{field.errors[0]}</span>}
          <button type="submit">Submit</button>
        </Form>
      );
    }

    render(<Test />);

    expect(screen.queryByTestId('error')).toBeNull();

    fireEvent.submit(screen.getByRole('form', { name: 'Test' }));

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid email');
    });
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByTestId('input'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.submit(screen.getByRole('form', { name: 'Test' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        { email: 'user@example.com' },
        expect.any(Object)
      );
    });
  });
});
