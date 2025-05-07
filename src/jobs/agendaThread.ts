// jobs/agenda.ts
import { Agenda } from 'agenda';

const agenda = new Agenda({
  db: {
    address: process.env.MONGODB_URI || 'mongodb://localhost:27017/agenda-db',
    collection: 'agendaJobs',
  },
  processEvery: '30 minutes', // check for jobs every 30m
  defaultConcurrency: 3
});

export default agenda;
