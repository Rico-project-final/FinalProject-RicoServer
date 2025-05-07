import agenda from './agendaThread';
import {Task} from '../models/taskModel';

agenda.define('daily task manager', async () => {
    console.log('✅ Daily task manager job running at:', new Date());
    const tasks = await Task.find({ isCompleted: false });
    tasks.forEach(task => {
        // Perform your task management logic here
        // console.log(`Managing task: ${task.name}`);
    });
});

(async function start() {
    await agenda.start();
  
    // Prevent duplicate jobs by clearing before creating
    await agenda.cancel({ name: 'daily task manager' });
  
    // Schedule job once a week (every Sunday at 1 AM)
    await agenda.every('0 10 * * *', 'daily task manager'); // daily at 10 AM
  
    console.log('📅 Agenda started and job scheduled.');
  })();