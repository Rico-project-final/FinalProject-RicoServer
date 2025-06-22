import axios from 'axios';
import { Review , IReview } from '../models/reviewModel';
import { IReviewAnalysis, ReviewAnalysis } from '../models/reviewAnalysisModel';
import { ITask, Task } from '../models/taskModel';
import mongoose from 'mongoose';

interface AIAnalysisResponse {
  category: 'food' | 'service' | 'overall experience';
  sentiment: 'positive' | 'neutral' | 'negative';
  analysisSummary: string;
  suggestions?: string;
  adminResponse?: string;
  taskRecommendation?: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    timeframe?: string; // Suggested timeframe like "immediate", "within a week", etc.
  };
}

class AIAnalysisAPI {
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey: string, apiUrl = 'https://api.openai.com/v1/chat/completions') {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  /**
   * Analyzes a review using OpenAI's API
   * @param reviewText The text of the review to analyze
   * @returns AIAnalysisResponse object with the analysis results
   */
  async analyzeReview(reviewText: string): Promise<AIAnalysisResponse> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: "gpt-4-turbo", // or another appropriate OpenAI model
          messages: [
            {
              role: "system",
              content: `
                You are an AI assistant that analyzes customer reviews for a restaurant application.
                Analyze the review and provide the following:
                1. Categorize the review as 'food', 'service', or 'overall experience'
                2. Determine the sentiment as 'positive', 'neutral', or 'negative'
                3. Provide a brief analysis summary
                4. If there's a recurring issue, suggest improvements
                5. Generate a thoughtful response that the admin could send to the customer
                6. Create a specific task recommendation for the restaurant manager that addresses the feedback:
                   - For negative reviews: create a task to fix the issue
                   - For positive reviews: create a task to maintain or enhance the praised aspect
                   - For neutral reviews: create a task to improve the experience if applicable
                
                Format your response as valid JSON with the following fields:
                {
                  "category": "food" | "service" | "overall experience",
                  "sentiment": "positive" | "neutral" | "negative",
                  "analysisSummary": "brief analysis of the review",
                  "suggestions": "suggestions for improvement, if applicable",
                  "adminResponse": "a personalized response to the customer",
                  "taskRecommendation": {
                    "title": "short, action-oriented task title",
                    "description": "detailed description of what needs to be done",
                    "priority": "low" | "medium" | "high",
                    "timeframe": "suggested timeframe for completion"
                  }
                }
              `
            },
            {
              role: "user",
              content: reviewText
            }
          ],
          temperature: 0.2,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Extract the JSON response from the AI
      const assistantMessage = response.data.choices[0].message.content;
      return JSON.parse(assistantMessage) as AIAnalysisResponse;
    } catch (error) {
      console.error('Error analyzing review with AI:', error);
      throw new Error('Failed to analyze review with AI');
    }
  }

  /**
   * Creates a ReviewAnalysis document from a review
   * @param review The review to analyze
   * @returns The created ReviewAnalysis document
   */
  async createReviewAnalysis(review: IReview): Promise<IReviewAnalysis> {
    try {
      // Analyze the review using OpenAI
      const analysis = await this.analyzeReview(review.text);

      // Create a new ReviewAnalysis document
      const reviewAnalysis = new ReviewAnalysis({
        reviewId: review.id,
        userId: review.userId || null,
        text: review.text,
        category: analysis.category,
        sentiment: analysis.sentiment,
        analysisSummary: analysis.analysisSummary,
        suggestions: analysis.suggestions,
        adminResponse: analysis.adminResponse,
        isResolved: false,
        businessId: review.businessId 
      });

      // Save the document
      await reviewAnalysis.save();
      await Review.findByIdAndUpdate(review.id, { isAnalyzed: true });
      
      // If we have a task recommendation, create a task
      if (analysis.taskRecommendation) {
        await this.createTaskFromRecommendation(
          analysis.taskRecommendation,
          reviewAnalysis._id as unknown as mongoose.Types.ObjectId,
          (review.userId || new mongoose.Types.ObjectId()) as mongoose.Types.ObjectId
        );
      }
      
      return reviewAnalysis;
    } catch (error) {
      console.error('Error creating review analysis:', error);
      throw new Error('Failed to create review analysis');
    }
  }

  /**
   * Batch analyzes multiple reviews
   * @param reviews Array of reviews to analyze
   * @returns Array of created ReviewAnalysis documents
   */
  async batchAnalyzeReviews(reviews: IReview[]): Promise<IReviewAnalysis[]> {
    try {
      console.log(reviews.length, 'reviews to analyze');
      const analysisPromises = reviews.map(review => this.createReviewAnalysis(review));
      return await Promise.all(analysisPromises);
    } catch (error) {
      console.error('Error in batch analysis:', error);
      throw new Error('Failed to complete batch analysis');
    }
  }

  /**
   * Gets insights from review analyses
   * @returns Object with insights about the reviews
   */
  async getInsights(): Promise<{
    totalAnalyzed: number;
    sentimentCounts: { positive: number; neutral: number; negative: number };
    categoryCounts: { food: number; service: number; overall: number };
    commonIssues: string[];
  }> {
    try {
      // Get total count
      const totalAnalyzed = await ReviewAnalysis.countDocuments();

      // Get sentiment distribution
      const sentimentCounts = {
        positive: await ReviewAnalysis.countDocuments({ sentiment: 'positive' }),
        neutral: await ReviewAnalysis.countDocuments({ sentiment: 'neutral' }),
        negative: await ReviewAnalysis.countDocuments({ sentiment: 'negative' })
      };

      // Get category distribution
      const categoryCounts = {
        food: await ReviewAnalysis.countDocuments({ category: 'food' }),
        service: await ReviewAnalysis.countDocuments({ category: 'service' }),
        overall: await ReviewAnalysis.countDocuments({ category: 'overall experience' })
      };

      // Find common issues (negative reviews with suggestions)
      const negativeReviews = await ReviewAnalysis.find({
        sentiment: 'negative',
        suggestions: { $exists: true, $ne: '' }
      }).sort({ createdAt: -1 }).limit(10);

      const commonIssues = negativeReviews.map(review => review.suggestions as string);

      return {
        totalAnalyzed,
        sentimentCounts,
        categoryCounts,
        commonIssues
      };
    } catch (error) {
      console.error('Error generating insights:', error);
      throw new Error('Failed to generate insights');
    }
  }

  /**
   * Gets reviews that need attention (negative and unresolved)
   * @param limit Number of reviews to return
   * @returns Array of unresolved negative reviews
   */
  async getReviewsNeedingAttention(limit = 10): Promise<IReviewAnalysis[]> {
    try {
      return await ReviewAnalysis.find({
        sentiment: 'negative',
        isResolved: false
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'name email') // Populate user details if needed
        .exec();
    } catch (error) {
      console.error('Error finding reviews needing attention:', error);
      throw new Error('Failed to find reviews needing attention');
    }
  }

  /**
   * Mark a review analysis as resolved
   * @param reviewAnalysisId ID of the review analysis to mark as resolved
   * @returns The updated review analysis
   */
  async markAsResolved(reviewAnalysisId: string): Promise<IReviewAnalysis | null> {
    try {
      return await ReviewAnalysis.findByIdAndUpdate(
        reviewAnalysisId,
        { isResolved: true },
        { new: true }
      );
    } catch (error) {
      console.error('Error marking review as resolved:', error);
      throw new Error('Failed to mark review as resolved');
    }
  }
  
  /**
   * Creates a task from AI recommendation
   * @param taskRecommendation The task recommendation from AI
   * @param reviewAnalysisId The ID of the related review analysis
   * @param adminId The ID of the admin/manager creating the task
   * @returns The created task
   */
  async createTaskFromRecommendation(
    taskRecommendation: {
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      timeframe?: string;
    },
    reviewAnalysisId: mongoose.Types.ObjectId,
    adminId: mongoose.Types.ObjectId
  ): Promise<ITask> {
    try {
      // Calculate due date based on timeframe if provided
      let dueDate: Date | undefined = undefined;
      
      if (taskRecommendation.timeframe) {
        const today = new Date();
        
        if (taskRecommendation.timeframe.includes('immediate') || 
            taskRecommendation.timeframe.includes('today')) {
          // Due today
          dueDate = today;
        } else if (taskRecommendation.timeframe.includes('week')) {
          // Due in a week
          dueDate = new Date(today);
          dueDate.setDate(today.getDate() + 7);
        } else if (taskRecommendation.timeframe.includes('month')) {
          // Due in a month
          dueDate = new Date(today);
          dueDate.setMonth(today.getMonth() + 1);
        }
      }
      
      // Create the task
      const task = new Task({
        title: taskRecommendation.title,
        description: taskRecommendation.description,
        relatedReview: reviewAnalysisId,
        isCompleted: false,
        createdBy: adminId,
        dueDate: dueDate,
        priority: taskRecommendation.priority
      });
      
      // Save and return
      await task.save();
      return task;
    } catch (error) {
      console.error('Error creating task from recommendation:', error);
      throw new Error('Failed to create task from recommendation');
    }
  }
  
  /**
   * Generates optimization tasks by analyzing review trends
   * @param adminId The ID of the admin/manager
   * @returns Array of created tasks
   */
  async generateOptimizationTasks(adminId: mongoose.Types.ObjectId): Promise<ITask[]> {
    try {
      // Get insights to identify trends
      const insights = await this.getInsights();
      const tasks: ITask[] = [];
      
      // 1. Check for negative category trends
      const highestNegativeCategory = 
        insights.categoryCounts.food > insights.categoryCounts.service ? 
          (insights.categoryCounts.food > insights.categoryCounts.overall ? 'food' : 'overall') : 
          (insights.categoryCounts.service > insights.categoryCounts.overall ? 'service' : 'overall');
      
      // 2. Create an improvement task for the most problematic category
      if (insights.sentimentCounts.negative > (insights.totalAnalyzed * 0.2)) { // If > 20% negative
        const categoryTask = new Task({
          title: `Improve ${highestNegativeCategory} based on customer feedback`,
          description: `Multiple customers have expressed concerns about ${highestNegativeCategory}. Review negative feedback and implement improvements.`,
          isCompleted: false,
          createdBy: adminId,
          priority: 'high',
          dueDate: new Date(new Date().setDate(new Date().getDate() + 14)) // Two weeks from now
        });
        
        await categoryTask.save();
        tasks.push(categoryTask);
      }
      
      // 3. Create tasks for common issues (up to 3)
      const uniqueIssues = Array.from(new Set(insights.commonIssues)).slice(0, 3);
      
      for (const issue of uniqueIssues) {
        if (issue) {
          const issueTask = new Task({
            title: `Address recurring issue: ${issue.substring(0, 40)}...`,
            description: `Multiple customers mentioned: ${issue}. Create an action plan to address this feedback.`,
            isCompleted: false,
            createdBy: adminId,
            priority: 'medium',
            dueDate: new Date(new Date().setDate(new Date().getDate() + 7)) // One week from now
          });
          
          await issueTask.save();
          tasks.push(issueTask);
        }
      }
      
      // 4. Create a preservation task for positive aspects (if there are many positive reviews)
      if (insights.sentimentCounts.positive > (insights.totalAnalyzed * 0.5)) { // If > 50% positive
        // Find what people like most
        const positiveReviews = await ReviewAnalysis.find({ sentiment: 'positive' })
          .sort({ createdAt: -1 })
          .limit(20);
          
        const categories = positiveReviews.map(review => review.category);
        const mostPositiveCategory = this.getMostFrequent(categories);
        
        const preservationTask = new Task({
          title: `Maintain excellent standards in ${mostPositiveCategory}`,
          description: `Customers are consistently pleased with ${mostPositiveCategory}. Document current practices and ensure they are maintained.`,
          isCompleted: false,
          createdBy: adminId,
          priority: 'medium',
          dueDate: new Date(new Date().setDate(new Date().getDate() + 21)) // Three weeks
        });
        
        await preservationTask.save();
        tasks.push(preservationTask);
      }
      
      return tasks;
    } catch (error) {
      console.error('Error generating optimization tasks:', error);
      throw new Error('Failed to generate optimization tasks');
    }
  }
  
  /**
   * Helper method to find the most frequent item in an array
   * @param arr Array of items
   * @returns The most frequent item
   */
  private getMostFrequent(arr: any[]): any {
    const hashmap = arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    
    return Object.keys(hashmap).reduce((a, b) => 
      hashmap[a] > hashmap[b] ? a : b
    );
  }
  
  /**
   * Gets all tasks related to reviews
   * @returns Array of tasks with populated review data
   */
  async getReviewRelatedTasks(): Promise<ITask[]> {
    try {
      return await Task.find({
        relatedReview: { $exists: true, $ne: null }
      })
        .populate('relatedReview')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      console.error('Error getting review-related tasks:', error);
      throw new Error('Failed to get review-related tasks');
    }
  }
  
  /**
   * Gets all optimization tasks (not directly related to specific reviews)
   * @returns Array of optimization tasks
   */
  async getOptimizationTasks(): Promise<ITask[]> {
    try {
      return await Task.find({
        $or: [
          { relatedReview: { $exists: false } },
          { relatedReview: null }
        ]
      })
        .sort({ priority: -1, createdAt: -1 })
        .exec();
    } catch (error) {
      console.error('Error getting optimization tasks:', error);
      throw new Error('Failed to get optimization tasks');
    }
  }
}

export default AIAnalysisAPI;