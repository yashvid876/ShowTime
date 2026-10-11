import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { VerifyOtpBody } from '@mtbs/shared-schemas';
import * as authApi from '@/api/auth.api';
import { errorMessage } from '@/api/errors';
import { toast } from '@/store/toastStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Alert, Button, TextField } from '@/components/ui';
import { AuthShell } from './AuthShell';

const RESEND_COOLDOWN = 30;

export default function VerifyOtpPage() {
  useDocumentTitle('Verify phone');
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const userId = params.get('userId') || '';
  const [problem, setProblem] = useState(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(VerifyOtpBody), defaultValues: { userId, otp: '' } });

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!userId) {
    return (
      <AuthShell title="Verify your phone">
        <Alert tone="warn" title="This verification link is incomplete">Start from the sign-up form so we know which account to verify.</Alert>
        <Link to="/register" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">Go to sign up</Link>
      </AuthShell>
    );
  }

  const onSubmit = async (values) => {
    setProblem(null);
    try {
      await authApi.verifyOtp(values);
      toast.success('Phone number verified.');
      navigate('/login', { replace: true, state: { verified: true } });
    } catch (e) {
      setProblem(e.code === 'BAD_REQUEST' ? 'That code is incorrect or has expired. Check the code or request a new one.' : errorMessage(e));
    }
  };

  const resend = async () => {
    setResending(true);
    setProblem(null);
    try {
      await authApi.resendOtp(userId);
      toast.success('A new code is on its way.');
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      setProblem(errorMessage(e));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell title="Verify your phone" subtitle={`Enter the 6-digit code we sent${location.state?.phone ? ` to ${location.state.phone}` : ' by SMS'}. It expires in 10 minutes.`}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <input type="hidden" {...register('userId')} />
        <TextField label="One-time code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus placeholder="123456" className="[&_input]:text-center [&_input]:font-display [&_input]:text-2xl [&_input]:tracking-[0.4em]" error={errors.otp?.message} {...register('otp')} />
        {problem && <Alert tone="error">{problem}</Alert>}
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Verify and continue</Button>
      </form>
      <div className="mt-4 text-center text-sm text-ink-600">
        Didn't get a code?{' '}
        <button type="button" onClick={resend} disabled={cooldown > 0 || resending} className="font-semibold text-brand-700 hover:underline disabled:cursor-not-allowed disabled:text-ink-400 disabled:no-underline">
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </AuthShell>
  );
}
