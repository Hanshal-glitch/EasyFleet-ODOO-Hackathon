import { AppError } from '../middleware/errorHandler';

export async function verifyCaptcha(token: string, sessionCaptcha?: string): Promise<void> {
  if (process.env.NODE_ENV !== 'production' && token === 'development-captcha') {
    return;
  }

  if (!sessionCaptcha || token.toLowerCase() !== sessionCaptcha.toLowerCase()) {
    throw new AppError(400, 'CAPTCHA verification failed', 'CAPTCHA_FAILED');
  }
}
