import { prisma } from '../config/database';
import bcrypt from 'bcrypt';
import { AppError } from '../middleware/errorHandler';
import crypto from 'crypto';
import { sendRegistrationOtp } from '../utils/emailService';

const BCRYPT_COST = 12;

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_COST);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      hasCompletedOnboardingTour: user.hasCompletedOnboardingTour,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        hasCompletedOnboardingTour: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !user.isActive) return null;

    return user;
  }

  static async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new AppError(409, 'Email already registered', 'EMAIL_EXISTS');
    }

    const passwordHash = await this.hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role as any,
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      hasCompletedOnboardingTour: user.hasCompletedOnboardingTour,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static async requestRegistrationOtp(data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  }) {
    const email = data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      throw new AppError(409, 'An account already exists for this email address', 'EMAIL_EXISTS');
    }

    const otp = crypto.randomInt(100000, 1_000_000).toString();
    const [passwordHash, otpHash] = await Promise.all([
      this.hashPassword(data.password),
      this.hashPassword(otp),
    ]);

    await prisma.registrationOtp.upsert({
      where: { email },
      create: {
        email,
        firstName: data.firstName,
        lastName: data.lastName,
        passwordHash,
        otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        passwordHash,
        otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
      },
    });

    try {
      await sendRegistrationOtp(email, data.firstName, otp);
    } catch (error) {
      await prisma.registrationOtp.delete({ where: { email } });
      throw new AppError(503, 'Unable to send verification email. Please try again.', 'EMAIL_DELIVERY_FAILED');
    }
  }

  static async verifyRegistrationOtp(emailInput: string, otp: string) {
    const email = emailInput.toLowerCase();
    const pending = await prisma.registrationOtp.findUnique({ where: { email } });
    if (!pending || pending.expiresAt <= new Date()) {
      if (pending) await prisma.registrationOtp.delete({ where: { email } });
      throw new AppError(400, 'This verification code has expired. Request a new one.', 'OTP_EXPIRED');
    }
    if (pending.attempts >= 5) {
      await prisma.registrationOtp.delete({ where: { email } });
      throw new AppError(429, 'Too many incorrect codes. Request a new one.', 'OTP_ATTEMPTS_EXCEEDED');
    }

    if (!await this.verifyPassword(otp, pending.otpHash)) {
      await prisma.registrationOtp.update({ where: { email }, data: { attempts: { increment: 1 } } });
      throw new AppError(400, 'The verification code is incorrect', 'OTP_INVALID');
    }

    try {
      const user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email: pending.email,
            firstName: pending.firstName,
            lastName: pending.lastName,
            passwordHash: pending.passwordHash,
            role: 'VIEWER',
          },
        });
        await tx.registrationOtp.delete({ where: { email } });
        return created;
      });
      return user;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new AppError(409, 'An account already exists for this email address', 'EMAIL_EXISTS');
      }
      throw error;
    }
  }
}
