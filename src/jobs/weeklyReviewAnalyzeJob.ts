import agenda from './agendaThread';
import { UserReview } from '../models/userReviewModel';
import AIAnalysisAPI from '../utils/aiApi'
import dotenv from 'dotenv';
import { Job } from 'agenda';
import { GoogleReview } from '../models/googleReviewModel';
dotenv.config();

if (!process.env.OPEN_AI_API_KEY) {
  throw new Error('OPEN_AI_API_KEY is not defined in the environment variables.');
}

const aiAnalysisAPI = new AIAnalysisAPI(process.env.OPEN_AI_API_KEY);

// Define the weekly job to analyze reviews for all businesses
agenda.define('weekly review analyze', async () => {
  console.log('✅ weekly job running at:', new Date());

  // Analyze all unprocessed user reviews
  const userReviews = await UserReview.find({ isAnalyzed: false });
  aiAnalysisAPI.batchAnalyzeReviews(userReviews);

  const googleReviews = await GoogleReview.find({ isAnalyzed: false });
  aiAnalysisAPI.batchAnalyzeReviews(googleReviews);
});

// Define the job with businessId to analyze reviews for a specific business
agenda.define('weekly review analyze', async (job: Job<{ businessId: string }>) => {
  console.log('✅ weekly job running at:', new Date());

  const { businessId } = job.attrs.data || {};

  if (!businessId) {
    console.warn('No businessId provided — skipping');
    return;
  }

  const userReviews = await UserReview.find({ isAnalyzed: false });
  aiAnalysisAPI.batchAnalyzeReviews(userReviews);
  console.log('Analyzing reviews:', userReviews.length);

  const googleReviews = await GoogleReview.find({ isAnalyzed: false });
  aiAnalysisAPI.batchAnalyzeReviews(googleReviews);
  console.log('Analyzing reviews:', googleReviews.length);
});


(async () => {
   await agenda.start();
  await agenda.cancel({ name: 'weekly review analyze' });
  await agenda.every('0 9 * * 1', 'weekly review analyze'); // Monday 9 AM
})();