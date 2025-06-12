import agenda from './agendaThread';
import { Review } from '../models/reviewModel';
import AIAnalysisAPI from '../utils/aiApi'
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.OPEN_AI_API_KEY) {
  throw new Error('OPEN_AI_API_KEY is not defined in the environment variables.');
}
const aiAnalysisAPI = new AIAnalysisAPI(process.env.OPEN_AI_API_KEY);
agenda.define('weekly review analyze', async () => {
  console.log('✅ weekly job running at:', new Date());
  const Reviews = await Review.find({ isAnalyzed: false });
  aiAnalysisAPI.batchAnalyzeReviews(Reviews);
});


(async () => {
   await agenda.start();
  await agenda.cancel({ name: 'weekly review analyze' });
  await agenda.every('0 9 * * 1', 'weekly review analyze'); // Monday 9 AM
})();