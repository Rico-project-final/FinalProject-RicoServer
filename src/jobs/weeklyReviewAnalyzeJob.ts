import agenda from './agendaThread';
import { Review } from '../models/reviewModel';
import AIAnalysisAPI from '../helpers/aiApi'
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.OPEN_AI_API_KEY) {
  throw new Error('OPEN_AI_API_KEY is not defined in the environment variables.');
}
const aiAnalysisAPI = new AIAnalysisAPI(process.env.OPEN_AI_API_KEY);
agenda.define('daily review analyze', async () => {
  console.log('✅ daily job running at:', new Date());
  const Reviews = await Review.find({ isAnalyzed: false });
  aiAnalysisAPI.batchAnalyzeReviews(Reviews);
});


(async function start() {
    await agenda.start();
  
    // Prevent duplicate jobs by clearing before creating
    await agenda.cancel({ name: 'daily review analyze' });
  
    // Schedule job once a week (every Sunday at 1 AM)
    await agenda.every('0 11 * * *', 'daily review analyze'); // daily at 11 AM
  
    console.log('📅 Agenda started and job scheduled.');
  })();