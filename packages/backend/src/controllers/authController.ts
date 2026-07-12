import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthService } from '../services/authService';
import { asyncHandler } from '../middleware/errorHandler';
import { loginSchema, registerSchema, changePasswordSchema, requestRegistrationOtpSchema, verifyRegistrationOtpSchema } from '@transport-ops/shared/schemas';
import { requireRole } from '../middleware/auth';
import { verifyCaptcha } from '../services/captchaService';
import svgCaptcha from 'svg-captcha';

export const getCaptcha = asyncHandler(async (req: Request, res: Response) => {
  const captcha = svgCaptcha.create({
    size: 6,
    noise: 2,
    color: true,
    background: '#1a1a1a',
  });
  
  (req.session as any).captcha = captcha.text;
  await new Promise<void>((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
  
  res.type('svg');
  res.status(200).send(captcha.data);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await AuthService.login(email, password);

  await new Promise<void>((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()));
  req.session.userId = user.id;
  await new Promise<void>((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));

  res.json({ user });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.clearCookie('transport_ops_sid');
    res.json({ success: true });
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await AuthService.getUserById(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'Session invalid' });
  }

  res.json({ user });
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  const user = await AuthService.register(data);
  res.status(201).json({ user });
});

export const requestRegistrationOtp = asyncHandler(async (req: Request, res: Response) => {
  const data = requestRegistrationOtpSchema.parse(req.body);
  await verifyCaptcha(data.captchaToken, (req.session as any).captcha);
  (req.session as any).captcha = null; // Clear it after verification attempt
  await new Promise<void>((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
  await AuthService.requestRegistrationOtp(data);
  res.status(202).json({ success: true, message: 'Verification code sent' });
});

export const verifyRegistrationOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = verifyRegistrationOtpSchema.parse(req.body);
  const user = await AuthService.verifyRegistrationOtp(email, otp);

  await new Promise<void>((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()));
  req.session.userId = user.id;
  await new Promise<void>((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));

  res.status(201).json({ user: await AuthService.getUserById(user.id) });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: { passwordHash: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const isValid = await AuthService.verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  const passwordHash = await AuthService.hashPassword(newPassword);
  await prisma.user.update({
    where: { id: req.session.userId },
    data: { passwordHash },
  });

  res.json({ success: true });
});
