import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginBody } from '@mtbs/shared-schemas';
import { errorMessage } from '@/api/errors';
import { homeFor, loginUser, safeNext } from '@/features/auth/session';
import { toast } from '@/store/toastStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Alert, Button, TextField } from '@/components/ui';
import { AuthShell } from './AuthShell';

export default function LoginPage() {
  useDocumentTitle('Log in');
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [problem, setProblem] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(LoginBody), defaultValues: { identifier: '', password: '' } });

  const onSubmit = async (values) => {
    setProblem(null);
    try {
      const user = await loginUser(values);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}.`);
      navigate(safeNext(params.get('next'), homeFor(user)), { replace: true });
    } catch (e) {
      setProblem({ tone: e.code === 'ACCOUNT_LOCKED' ? 'warn' : 'error', text: e.code === 'UNAUTHENTICATED' ? 'The email/phone or password is incorrect.' : errorMessage(e) });
    }
  };

  return (
    <AuthShell title="Log in" subtitle="Log in to pick seats and manage your bookings." footer={<>New to ShowTime? <Link to={`/register${location.search}`} className="font-semibold text-brand-700 hover:underline">Create an account</Link></>}>
      {location.state?.verified && <Alert tone="success" className="mb-4">Phone verified. Log in to continue.</Alert>}
      {location.state?.reset && <Alert tone="success" className="mb-4">Password updated. Log in with your new password.</Alert>}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <TextField label="Email or phone number" autoComplete="username" autoFocus error={errors.identifier?.message} {...register('identifier')} />
        <TextField label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <div className="text-right"><Link to="/forgot-password" className="text-sm font-semibold text-brand-700 hover:underline">Forgot password?</Link></div>
        {problem && <Alert tone={problem.tone}>{problem.text}</Alert>}
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Log in</Button>
      </form>
    </AuthShell>
  );
}
