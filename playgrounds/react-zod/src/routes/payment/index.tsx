import { Field, Form, getInput, useForm } from '@formisch/react';
import * as z from 'zod';
import { FormFooter, FormHeader, Select, TextInput } from '../../components';

const PaymentFormSchema = z.intersection(
  z.object({
    owner: z
      .string('Please enter your name.')
      .min(1, 'Please enter your name.'),
  }),
  z.discriminatedUnion(
    'type',
    [
      z.object({
        type: z.literal('card'),
        card: z.object({
          number: z
            .string('Please enter your card number.')
            .min(1, 'Please enter your card number.')
            .regex(
              /^(?:\d[ -]?){12,18}\d$/,
              'The card number is badly formatted.'
            ),
          expiration: z
            .string('Please enter the expiration date.')
            .min(1, 'Please enter the expiration date.')
            .regex(
              /^(?:0[1-9]|1[0-2])\/(?:2[5-9]|3[0-9])$/,
              'The expiration date is badly formatted.'
            ),
        }),
      }),
      z.object({
        type: z.literal('paypal'),
        paypal: z.object({
          email: z
            .string('Please enter your PayPal email.')
            .min(1, 'Please enter your PayPal email.')
            .pipe(z.email('The email address is badly formatted.')),
        }),
      }),
    ],
    { error: 'Please select the payment type.' }
  )
);

export default function PaymentPage() {
  const paymentForm = useForm({
    schema: PaymentFormSchema,
    // The payment type is intentionally unselected at first, so the `type`,
    // `card` and `paypal` field stores are created lazily when they mount.
    initialInput: { owner: '' } as z.input<typeof PaymentFormSchema>,
  });

  const type = getInput(paymentForm, { path: ['type'] });

  return (
    <Form
      of={paymentForm}
      className="space-y-12 md:space-y-14 lg:space-y-16"
      onSubmit={(output) => console.log(output)}
    >
      <FormHeader of={paymentForm} heading="Payment form" />
      <div className="space-y-8 md:space-y-10 lg:space-y-12">
        <Field of={paymentForm} path={['owner']}>
          {(field) => (
            <TextInput
              {...field.props}
              input={field.input}
              errors={field.errors}
              type="text"
              label="Owner"
              placeholder="John Doe"
              required
            />
          )}
        </Field>
        <Field of={paymentForm} path={['type']}>
          {(field) => (
            <Select
              {...field.props}
              input={field.input}
              options={[
                { label: 'Card', value: 'card' },
                { label: 'PayPal', value: 'paypal' },
              ]}
              errors={field.errors}
              label="Type"
              placeholder="Card or PayPal?"
              required
            />
          )}
        </Field>
        {type === 'card' && (
          <>
            <Field of={paymentForm} path={['card', 'number']}>
              {(field) => (
                <TextInput
                  {...field.props}
                  input={field.input}
                  errors={field.errors}
                  type="text"
                  label="Number"
                  placeholder="1234 1234 1234 1234"
                  required
                />
              )}
            </Field>
            <Field of={paymentForm} path={['card', 'expiration']}>
              {(field) => (
                <TextInput
                  {...field.props}
                  input={field.input}
                  errors={field.errors}
                  type="text"
                  label="Expiration"
                  placeholder="MM/YY"
                  required
                />
              )}
            </Field>
          </>
        )}
        {type === 'paypal' && (
          <Field of={paymentForm} path={['paypal', 'email']}>
            {(field) => (
              <TextInput
                {...field.props}
                input={field.input}
                errors={field.errors}
                type="email"
                label="Email"
                placeholder="example@email.com"
                required
              />
            )}
          </Field>
        )}
      </div>
      <FormFooter of={paymentForm} />
    </Form>
  );
}
