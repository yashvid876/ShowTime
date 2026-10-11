import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ResetPasswordBody } from '@mtbs/shared-schemas';
import * as authApi from '@/api/auth.api';
import { errorMessage } from '@/api/errors';
import { toast } from '@/store/toastStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Alert, Button, TextField } from '@/components/ui';
import { AuthShell } from './AuthShell';

const FormSchema = ResetPasswordBody.extend({ confirm: z.string().min(1, 'Re-enter your new password') }).refine((v) => v.newPassword === v.confirm, { path: ['confirm'], message: "Passwords don't match" });

export default function ResetPasswordPage() {
  useDocumentTitle('Choose a new password');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [problem, setProblem] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(FormSchema), defaultValues: { token, newPassword: '', confirm: '' } });

  const onSubmit = async ({ token: t, newPassword }) => {
    setProblem(null);
    try {
      await authApi.resetPassword({ token: t, newPassword });
      toast.success('Password updated.');
      navigate('/login', { replace: true, state: { reset: true } });
    } catch (e) {
      setProblem(e.code === 'BAD_REQUEST' ? 'This reset link is invalid or has expired. Request a new one.' : errorMessage(e));
    }
  };

  return (
    <AuthShell title="Choose a new password" subtitle="You'll be signed out on all other devices." footer={<Link to="/forgot-password" className="font-semibold text-brand-700 hover:underline">Request a new link</Link>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {token ? <input type="hidden" {...register('token')} /> : <TextField label="Reset code" autoComplete="one-time-code" error={errors.token?.message} {...register('token')} />}
        <TextField label="New password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number." error={errors.newPassword?.message} {...register('newPassword')} />
        <TextField label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} />
        {problem && <Alert tone="error">{problem}</Alert>}
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Update password</Button>
      </form>
    </AuthShell>
  );
}
