import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import { ForgotPasswordBody } from '@mtbs/shared-schemas';
import * as authApi from '@/api/auth.api';
import { errorMessage } from '@/api/errors';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Alert, Button, TextField } from '@/components/ui';
import { AuthShell } from './AuthShell';

export default function ForgotPasswordPage() {
  useDocumentTitle('Reset password');
  const [sentTo, setSentTo] = useState(null);
  const [problem, setProblem] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(ForgotPasswordBody), defaultValues: { email: '' } });

  const onSubmit = async (values) => {
    setProblem(null);
    try {
      await authApi.forgotPassword(values); // always 200 — never reveals whether the email exists
      setSentTo(values.email);
    } catch (e) {
      setProblem(errorMessage(e));
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a link to choose a new password." footer={<Link to="/login" className="font-semibold text-brand-700 hover:underline">Back to log in</Link>}>
      {sentTo ? (
        <div className="text-center">
          <MailCheck className="mx-auto h-10 w-10 text-ok-600" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold">Check your inbox</h2>
          <p className="mt-1 text-sm text-ink-600">If an account exists for <b>{sentTo}</b>, a reset link is on its way. The link works once and expires soon.</p>
          <Link to="/reset-password" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">I have a reset code</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <TextField label="Email" type="email" autoComplete="email" autoFocus error={errors.email?.message} {...register('email')} />
          {problem && <Alert tone="error">{problem}</Alert>}
          <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Send reset link</Button>
        </form>
      )}
    </AuthShell>
  );
}
