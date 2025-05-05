// jobs/weeklyJob.ts
import agenda from './agendaThread';
agenda.define('weekly report job', async (job) => {
  console.log('✅ Weekly job running at:', new Date());

  // Your task logic here
  // e.g. send a report, cleanup DB, sync data
});

(async function start() {
    await agenda.start();
  
    // Prevent duplicate jobs by clearing before creating
    await agenda.cancel({ name: 'weekly report job' });
  
    // Schedule job once a week (every Sunday at 1 AM)
    await agenda.every('0 1 * * 0', 'weekly report job'); // cron format
  
    console.log('📅 Agenda started and job scheduled.');
  })();