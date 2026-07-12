import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout, me, register, changePassword, requestRegistrationOtp, verifyRegistrationOtp, getCaptcha } from '../controllers/authController';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { loginSchema, registerSchema, changePasswordSchema, requestRegistrationOtpSchema, verifyRegistrationOtpSchema } from '@transport-ops/shared/schemas';

const router = Router();

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts. Please try again later.', code: 'REGISTRATION_RATE_LIMITED' },
});

router.post('/login', validateBody(loginSchema), login);
router.get('/register/captcha', getCaptcha);
router.post('/register/request-otp', registrationLimiter, validateBody(requestRegistrationOtpSchema), requestRegistrationOtp);
router.post('/register/verify-otp', registrationLimiter, validateBody(verifyRegistrationOtpSchema), verifyRegistrationOtp);
router.post('/logout', logout);
router.get('/me', me);
router.post('/register', requireAuth, requireRole('ADMIN'), validateBody(registerSchema), register);
router.post('/change-password', requireAuth, validateBody(changePasswordSchema), changePassword);

export default router;
