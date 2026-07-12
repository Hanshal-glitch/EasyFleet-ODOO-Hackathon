import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Truck } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { TurnstileCaptcha } from '../../components/auth/TurnstileCaptcha';

const password = z.string().min(8, 'Use at least 8 characters').regex(/[A-Z]/, 'Include an uppercase letter').regex(/[a-z]/, 'Include a lowercase letter').regex(/[0-9]/, 'Include a number');
const loginSchema = z.object({ email: z.string().email('Enter a valid email address'), password: z.string().min(1, 'Password is required') });
const registrationSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  email: z.string().email('Enter a valid email address'),
  password,
  passwordConfirmation: z.string(),
}).refine((values) => values.password === values.passwordConfirmation, { path: ['passwordConfirmation'], message: 'Passwords do not match' });
const otpSchema = z.object({ otp: z.string().regex(/^\d{6}$/, 'Enter the six-digit code') });

type LoginForm = z.infer<typeof loginSchema>;
type RegistrationForm = z.infer<typeof registrationSchema>;
type OtpForm = z.infer<typeof otpSchema>;

function getError(error: any) {
  return error?.response?.data?.error || error?.message || 'Something went wrong. Please try again.';
}

export function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>(
    location.pathname === '/register' ? 'register' : 'login'
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registrationForm = useForm<RegistrationForm>({ resolver: zodResolver(registrationSchema) });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  const submitLogin = async (values: LoginForm) => {
    setError(null); setIsLoading(true);
    try { await login(values.email, values.password); navigate('/'); }
    catch (err) { setError(getError(err)); }
    finally { setIsLoading(false); }
  };

  const requestOtp = async (values: RegistrationForm) => {
    if (!captchaToken) { setError('Please complete the CAPTCHA'); return; }
    setError(null); setIsLoading(true);
    try {
      await api.post('/auth/register/request-otp', { ...values, captchaToken });
      setPendingEmail(values.email);
      setMode('verify');
    } catch (err) { setError(getError(err)); }
    finally { setIsLoading(false); }
  };

  const verifyOtp = async (values: OtpForm) => {
    setError(null); setIsLoading(true);
    try { await api.post('/auth/register/verify-otp', { email: pendingEmail, otp: values.otp }); navigate('/'); }
    catch (err) { setError(getError(err)); }
    finally { setIsLoading(false); }
  };

  const switchMode = (next: 'login' | 'register') => { 
    setError(null); 
    setMode(next); 
    navigate(next === 'login' ? '/login' : '/register'); 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary"><Truck className="h-7 w-7 text-primary-foreground" /></div>
          <CardTitle>{mode === 'login' ? 'Welcome to TransportOps' : mode === 'register' ? 'Create your account' : 'Verify your email'}</CardTitle>
          <CardDescription>{mode === 'verify' ? `We sent a six-digit code to ${pendingEmail}` : mode === 'register' ? 'Create an account to get started' : 'Sign in to your account'}</CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'login' && <form onSubmit={loginForm.handleSubmit(submitLogin)} className="space-y-4">
            <Input type="email" placeholder="Email" autoComplete="email" {...loginForm.register('email')} error={loginForm.formState.errors.email?.message} />
            <Input type="password" placeholder="Password" autoComplete="current-password" {...loginForm.register('password')} error={loginForm.formState.errors.password?.message} />
            <Button type="submit" className="w-full" loading={isLoading}>Sign In</Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                loginForm.setValue('email', 'admin@transport-ops.com');
                loginForm.setValue('password', 'Admin@123');
                loginForm.handleSubmit(submitLogin)();
              }}
              loading={isLoading}
            >
              Sign in as Demo Admin
            </Button>
          </form>}
          {mode === 'register' && <form onSubmit={registrationForm.handleSubmit(requestOtp)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><Input placeholder="First name" autoComplete="given-name" {...registrationForm.register('firstName')} error={registrationForm.formState.errors.firstName?.message} /><Input placeholder="Last name" autoComplete="family-name" {...registrationForm.register('lastName')} error={registrationForm.formState.errors.lastName?.message} /></div>
            <Input type="email" placeholder="Email" autoComplete="email" {...registrationForm.register('email')} error={registrationForm.formState.errors.email?.message} />
            <Input type="password" placeholder="Password" autoComplete="new-password" {...registrationForm.register('password')} error={registrationForm.formState.errors.password?.message} />
            <Input type="password" placeholder="Re-enter password" autoComplete="new-password" {...registrationForm.register('passwordConfirmation')} error={registrationForm.formState.errors.passwordConfirmation?.message} />
            <TurnstileCaptcha onTokenChange={setCaptchaToken} />
            <Button type="submit" className="w-full" loading={isLoading}>Send verification code</Button>
          </form>}
          {mode === 'verify' && <form onSubmit={otpForm.handleSubmit(verifyOtp)} className="space-y-4">
            <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="Six-digit code" {...otpForm.register('otp')} error={otpForm.formState.errors.otp?.message} />
            <Button type="submit" className="w-full" loading={isLoading}>Verify and create account</Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => switchMode('register')}>Use a different email</Button>
          </form>}
          {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
          {mode !== 'verify' && <p className="mt-6 text-center text-sm text-muted-foreground">{mode === 'login' ? <>New here? <button type="button" className="text-primary hover:underline" onClick={() => switchMode('register')}>Create an account</button></> : <>Already have an account? <button type="button" className="text-primary hover:underline" onClick={() => switchMode('login')}>Sign in</button></>}</p>}
          <div className="mt-6 flex justify-center"><Button variant="ghost" size="sm" onClick={toggleTheme}>{theme === 'dark' ? '☀️ Light' : '🌙 Dark'} Mode</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;
