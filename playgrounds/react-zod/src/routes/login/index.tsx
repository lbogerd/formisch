import { Field, Form, useForm } from '@formisch/react';
import * as z from 'zod';
import { FormFooter, FormHeader, TextInput } from '../../components';

const LoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Please enter your email.')
    .pipe(z.email('The email address is badly formatted.')),
  password: z
    .string()
    .min(1, 'Please enter your password.')
    .min(8, 'Your password must have 8 characters or more.'),
});

export default function LoginPage() {
  const loginForm = useForm({
    schema: LoginSchema,
    initialInput: {
      email: '',
      password: '',
    },
  });

  return (
    <Form
      of={loginForm}
      className="space-y-12 md:space-y-14 lg:space-y-16"
      onSubmit={(output) => console.log(output)}
    >
      <FormHeader of={loginForm} heading="Login form" />
      <div className="space-y-8 md:space-y-10 lg:space-y-12">
        <Field of={loginForm} path={['email']}>
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
        <Field of={loginForm} path={['password']}>
          {(field) => (
            <TextInput
              {...field.props}
              input={field.input}
              errors={field.errors}
              type="password"
              label="Password"
              placeholder="********"
              required
            />
          )}
        </Field>
      </div>
      <FormFooter of={loginForm} />
    </Form>
  );
}
