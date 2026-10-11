import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RegisterBody } from '@mtbs/shared-schemas';
import * as authApi from '@/api/auth.api';
import { applyServerErrors, errorMessage } from '@/api/errors';
import { toast } from '@/store/toastStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { normalizePhone } from '@/utils/format';
import { Alert, Button, Checkbox, TextField } from '@/components/ui';
import { AuthShell } from './AuthShell';

const FormSchema = RegisterBody.extend({
  phone: z.preprocess((v) => normalizePhone(v), RegisterBody.shape.phone),
  confirmPassword: z.string().min(1, 'Re-enter your password'),
  accept: z.literal(true, { errorMap: () => ({ message: 'You need to accept the terms to continue' }) }),
}).refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: "Passwords don't match" });

export default function RegisterPage() {
  useDocumentTitle('Create account');
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '', accept: false },
  });

  const onSubmit = async ({ name, email, phone, password }) => {
    setProblem(null);
    try {
      const { userId } = await authApi.register({ name, email, phone, password });
      toast.success('Account created. We sent a code to your phone.');
      navigate(`/verify-otp?userId=${encodeURIComponent(userId)}`, { state: { phone } });
    } catch (e) {
      if (applyServerErrors(e, setError)) return;
      if (e.code === 'CONFLICT') setProblem('An account with this email or phone number already exists. Try logging in instead.');
      else setProblem(errorMessage(e));
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="You'll verify your phone number with a one-time code." footer={<>Already registered? <Link to="/login" className="font-semibold text-brand-700 hover:underline">Log in</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <TextField label="Full name" autoComplete="name" required error={errors.name?.message} {...register('name')} />
        <TextField label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...register('email')} />
        <TextField label="Phone number" type="tel" autoComplete="tel" placeholder="9999999999 or +919999999999" required hint="10-digit Indian numbers get +91 added automatically." error={errors.phone?.message} {...register('phone')} />
        <TextField label="Password" type="password" autoComplete="new-password" required hint="At least 8 characters, with a letter and a number." error={errors.password?.message} {...register('password')} />
        <TextField label="Confirm password" type="password" autoComplete="new-password" required error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Checkbox error={errors.accept?.message} label={<>I agree to the <Link to="/terms" target="_blank" className="font-semibold text-brand-700 underline">Terms of Service</Link> and the <Link to="/refund-policy" target="_blank" className="font-semibold text-brand-700 underline">Cancellation &amp; Refund Policy</Link>.</>} {...register('accept')} />
        {problem && <Alert tone="error">{problem}</Alert>}
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Create account</Button>
      </form>
    </AuthShell>
  );
}
