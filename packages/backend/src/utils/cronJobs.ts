import cron from 'node-cron';
import { logger } from './logger';
import { sendLicenseExpiryReminders } from './emailService';

export const initializeCronJobs = () => {
  logger.info('Initializing cron jobs...');

  // Run daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    logger.info('Executing daily cron jobs');
    await sendLicenseExpiryReminders();
  }, {
    timezone: 'UTC' // Adjust timezone as needed
  });
};
