import {
  Field,
  FieldArray,
  Form,
  insert,
  remove,
  useField,
  useForm,
} from '@formisch/react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import * as z from 'zod';
import {
  ColorButton,
  FormFooter,
  FormHeader,
  InputErrors,
  InputLabel,
  RadioGroup,
  TextInput,
} from '../../components';

// This form deliberately stresses the lazy field store creation: the
// `payment` field is a discriminated union whose inactive branch is not part
// of the initial input, `note` is optional and missing from the initial
// input, and `tags` is an optional array that is only created when the field
// array is mounted.
const SpecialFormSchema = z.object({
  payment: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('card'),
      card: z.object({
        number: z.string().min(1, 'Please enter your card number.'),
      }),
    }),
    z.object({
      type: z.literal('paypal'),
      paypal: z.object({
        email: z
          .string()
          .min(1, 'Please enter your PayPal email.')
          .pipe(z.email('The email address is badly formatted.')),
      }),
    }),
  ]),
  note: z.optional(z.string().max(100, 'Your note is too long.')),
  tags: z.optional(
    z
      .array(z.string().min(1, 'Please enter a tag.'))
      .max(3, 'You can only add up to 3 tags.')
  ),
});

export default function Page() {
  const specialForm = useForm({
    schema: SpecialFormSchema,
    initialInput: {
      payment: { type: 'card', card: { number: '' } },
    },
  });

  const paymentType = useField(specialForm, { path: ['payment', 'type'] });

  const [listElement] = useAutoAnimate();

  return (
    <Form
      of={specialForm}
      className="space-y-12 md:space-y-14 lg:space-y-16"
      onSubmit={(output) => console.log(output)}
    >
      <FormHeader of={specialForm} heading="Special form" />
      <div className="space-y-8 md:space-y-10 lg:space-y-12">
        <Field of={specialForm} path={['payment', 'type']}>
          {(field) => (
            <RadioGroup
              {...field.props}
              label="Payment type"
              options={[
                { label: 'Card', value: 'card' },
                { label: 'PayPal', value: 'paypal' },
              ]}
              input={field.input}
              errors={field.errors}
            />
          )}
        </Field>

        {paymentType.input === 'card' ? (
          <Field of={specialForm} path={['payment', 'card', 'number']}>
            {(field) => (
              <TextInput
                {...field.props}
                input={field.input}
                errors={field.errors}
                type="text"
                label="Card number"
                placeholder="1234 5678 9012 3456"
                required
              />
            )}
          </Field>
        ) : (
          <Field of={specialForm} path={['payment', 'paypal', 'email']}>
            {(field) => (
              <TextInput
                {...field.props}
                input={field.input}
                errors={field.errors}
                type="email"
                label="PayPal email"
                placeholder="example@email.com"
                required
              />
            )}
          </Field>
        )}

        <Field of={specialForm} path={['note']}>
          {(field) => (
            <TextInput
              {...field.props}
              input={field.input}
              errors={field.errors}
              type="text"
              label="Note"
              placeholder="Optional note"
            />
          )}
        </Field>

        <FieldArray of={specialForm} path={['tags']}>
          {(fieldArray) => (
            <div className="space-y-5 px-8 lg:px-10">
              <InputLabel label="Tags" margin="none" />

              <div>
                <div ref={listElement} className="space-y-5">
                  {fieldArray.items.map((item, index) => (
                    <div
                      key={item}
                      className="flex flex-wrap gap-5 rounded-2xl border-2 border-slate-200 bg-slate-100/25 p-5 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/10 dark:hover:border-slate-700"
                    >
                      <Field of={specialForm} path={['tags', index]}>
                        {(field) => (
                          <TextInput
                            {...field.props}
                            className="w-full p-0! md:w-auto md:flex-1"
                            input={field.input}
                            errors={field.errors}
                            type="text"
                            placeholder="Enter tag"
                            required
                          />
                        )}
                      </Field>

                      <ColorButton
                        color="red"
                        label="Delete"
                        width="auto"
                        onClick={() =>
                          remove(specialForm, { path: ['tags'], at: index })
                        }
                      />
                    </div>
                  ))}
                </div>
                <InputErrors name="tags" errors={fieldArray.errors} />
              </div>

              <ColorButton
                color="green"
                label="Add tag"
                onClick={() =>
                  insert(specialForm, { path: ['tags'], initialInput: '' })
                }
              />
            </div>
          )}
        </FieldArray>
      </div>
      <FormFooter of={specialForm} />
    </Form>
  );
}
