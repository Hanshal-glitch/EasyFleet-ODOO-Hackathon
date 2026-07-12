import nodemailer from 'nodemailer';
import { prisma } from '../config/database';
import { logger } from './logger';

// Setup nodemailer transport
const useMock = !process.env.SMTP_USER;
if (useMock) {
  logger.warn('SMTP_USER not set. Using mock email service. Emails will be logged to console.');
}

const transporter = useMock ? {
  sendMail: async (options: any) => {
    logger.info('MOCK EMAIL SENT:');
    logger.info(`To: ${options.to}`);
    logger.info(`Subject: ${options.subject}`);
    logger.info(`Body: ${options.text}`);
  }
} : nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendRegistrationOtp(email: string, firstName: string, otp: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Transport Ops <alerts@example.com>',
    to: email,
    subject: 'Your Transport Ops verification code',
    text: `Hi ${firstName},\n\nYour verification code is ${otp}. It expires in 10 minutes.\n\nIf you did not request this code, you can safely ignore this email.`,
  });
}

export const sendLicenseExpiryReminders = async () => {
  try {
    logger.info('Running license expiry reminder check...');
    
    const daysToAlert = [30, 14, 7, 1];
    let emailsSent = 0;

    for (const days of daysToAlert) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const drivers = await prisma.driver.findMany({
        where: {
          licenseExpiryDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            not: 'SUSPENDED'
          }
        },
        include: {
          user: true,
        },
      });

      for (const driver of drivers) {
        if (driver.user?.email) {
          try {
            await transporter.sendMail({
              from: process.env.EMAIL_FROM || '"Transport Ops" <alerts@transportops.com>',
              to: driver.user.email,
              subject: `Urgent: License Expiring in ${days} days`,
              text: `Dear ${driver.name},\n\nYour driver's license (${driver.licenseNumber}) is expiring in ${days} days on ${driver.licenseExpiryDate.toDateString()}.\n\nPlease renew it as soon as possible to avoid disruption in your dispatch assignments.\n\nThank you,\nTransport Operations Team`,
            });
            emailsSent++;
          } catch (err) {
            logger.error(`Failed to send email to ${driver.user.email}`, { err });
          }
        }
      }
    }
    
    logger.info(`License expiry check completed. Sent ${emailsSent} reminders.`);
  } catch (error) {
    logger.error('Error running license expiry check', { error });
  }
};
