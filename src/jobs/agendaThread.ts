// jobs/agenda.ts
import { Agenda } from 'agenda';

const agenda = new Agenda({
  db: {
    address: process.env.MONGO_URI || 'mongodb://localhost:27017/agenda-db',
    collection: 'agendaJobs',
  },
  processEvery: '30 seconds', // check for jobs every 30s
  defaultConcurrency: 5
});

export default agenda;
