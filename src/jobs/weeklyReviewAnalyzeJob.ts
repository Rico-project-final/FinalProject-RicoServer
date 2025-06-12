import agenda from './agendaThread';
import { Review } from '../models/reviewModel';
import AIAnalysisAPI from '../utils/aiApi'
import dotenv from 'dotenv';
import { Job } from 'agenda';
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

agenda.define('weekly review analyze', async (job: Job<{ businessId: string }>) => {
  console.log('✅ weekly job running at:', new Date());

  const { businessId } = job.attrs.data || {};

  if (!businessId) {
    console.warn('No businessId provided — skipping');
    return;
  }

  const reviews = await Review.find({ isAnalyzed: false, businessId });
  aiAnalysisAPI.batchAnalyzeReviews(reviews);
});

(async () => {
   await agenda.start();
  await agenda.cancel({ name: 'weekly review analyze' });
  await agenda.every('0 9 * * 1', 'weekly review analyze'); // Monday 9 AM
})();