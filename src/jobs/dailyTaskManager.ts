import agenda from './agendaThread';
import {Task} from '../models/taskModel';
// import { getSocket } from '../socket'; // adjust path
// const io = getSocket(); // get the socket instance

agenda.define('daily task manager', async () => {
    const now = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const tasks = await Task.find({
    isCompleted: false,
    dueDate: { $ne: null }
  }).populate('createdBy', '_id name');

  tasks.forEach(task => {
    const due = task.dueDate!;
    const timeDiff = due.getTime() - Date.now();
    const daysUntilDue = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const adminId = task.createdBy._id.toString();

    const shouldRemind =
      (task.priority === 'high') ||
      (task.priority === 'medium' && daysUntilDue <= 3 && daysUntilDue >= 0) ||
      (task.priority === 'low' && due >= todayStart && due <= todayEnd);

    // if (shouldRemind) {
    //   io.to(adminId).emit('taskReminder', {
    //     taskId: task._id,
    //     title: task.title,
    //     dueDate: task.dueDate,
    //     priority: task.priority
    //   });
    // }
  });

  console.log(`🔔 Task reminders checked and emitted.`);
});

(async () => {
   await agenda.start();
    await agenda.cancel({ name: 'daily task reminder' });
    await agenda.every('0 8 * * *', 'daily task reminder'); // daily at 8 AM
  })();