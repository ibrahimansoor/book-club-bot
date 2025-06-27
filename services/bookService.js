const Anthropic = require('@anthropic-ai/sdk');

class BookService {
    constructor() {
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
    }

    async getBookInfo(title, author = null) {
        try {
            const query = author ? `${title} by ${author}` : title;
            
            const prompt = `Please provide detailed information about the book "${query}". 

Please respond with a JSON object containing:
{
    "title": "exact book title",
    "author": "author name",
    "description": "brief 2-3 sentence description of the book",
    "benefits": "why this book is beneficial to read - focus on practical benefits, life lessons, and value for personal/professional growth",
    "genre": "book genre",
    "themes": ["list", "of", "main", "themes"],
    "target_audience": "who would benefit most from reading this book",
    "key_takeaways": ["3-4", "key", "takeaways", "readers", "can", "expect"]
}

Make sure the response is valid JSON and focuses on actionable benefits and insights readers can gain.`;

            const response = await this.anthropic.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 1000,
                temperature: 0.3,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            const bookData = JSON.parse(response.content[0].text);
            return {
                success: true,
                data: bookData
            };

        } catch (error) {
            console.error('Error fetching book info:', error);
            
            // Fallback response if API fails
            return {
                success: false,
                data: {
                    title: title,
                    author: author || 'Unknown Author',
                    description: 'A great book that will provide valuable insights and knowledge.',
                    benefits: 'This book offers valuable lessons and perspectives that can enhance personal and professional growth.',
                    genre: 'Unknown',
                    themes: ['Personal Growth', 'Learning'],
                    target_audience: 'General readers',
                    key_takeaways: ['Gain new perspectives', 'Learn practical skills', 'Broaden knowledge base']
                },
                error: error.message
            };
        }
    }

    async generateBookDiscussion(bookTitle, currentTopic = null) {
        try {
            const prompt = currentTopic 
                ? `Generate 3-5 thought-provoking discussion questions about "${currentTopic}" from the book "${bookTitle}". Focus on practical application and personal reflection.`
                : `Generate 3-5 thought-provoking discussion questions about the book "${bookTitle}". Focus on key themes, practical applications, and personal reflections.`;

            const response = await this.anthropic.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 500,
                temperature: 0.7,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            return {
                success: true,
                questions: response.content[0].text.split('\n').filter(q => q.trim().length > 0)
            };

        } catch (error) {
            console.error('Error generating discussion questions:', error);
            return {
                success: false,
                questions: [
                    'What was the most impactful lesson you learned from this reading?',
                    'How can you apply the concepts from this book to your daily life?',
                    'What surprised you most about the author\'s perspective?'
                ],
                error: error.message
            };
        }
    }

    async analyzeTakeaway(takeawayText, bookContext) {
        try {
            const prompt = `Analyze this book takeaway and assign an engagement score from 1-10 based on depth, insight, and thoughtfulness:

Book Context: "${bookContext}"
User Takeaway: "${takeawayText}"

Consider:
- Depth of reflection (1-3 points)
- Personal application/connection (1-3 points)
- Insightfulness and original thinking (1-2 points)
- Length and effort put into the response (1-2 points)

Respond with just a number from 1-10.`;

            const response = await this.anthropic.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 50,
                temperature: 0.1,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            const score = parseInt(response.content[0].text.trim());
            return isNaN(score) ? 5 : Math.max(1, Math.min(10, score));

        } catch (error) {
            console.error('Error analyzing takeaway:', error);
            // Default scoring based on length and basic criteria
            return this.basicTakeawayScore(takeawayText);
        }
    }

    basicTakeawayScore(text) {
        let score = 1;
        
        // Length bonus
        if (text.length > 50) score += 1;
        if (text.length > 100) score += 1;
        if (text.length > 200) score += 1;
        
        // Content quality indicators
        const qualityIndicators = [
            /\b(learn|realize|understand|insight|perspective|apply|implement)\b/i,
            /\b(because|since|therefore|however|although|while)\b/i,
            /\b(example|instance|experience|situation)\b/i,
            /[.!?].*[.!?]/  // Multiple sentences
        ];
        
        qualityIndicators.forEach(indicator => {
            if (indicator.test(text)) score += 1;
        });
        
        return Math.min(10, score);
    }

    async suggestReadingGoals(bookTitle, bookLength = null) {
        try {
            const lengthContext = bookLength ? ` (approximately ${bookLength} pages)` : '';
            
            const prompt = `Suggest weekly reading goals and milestones for the book "${bookTitle}"${lengthContext}. 

Provide practical, achievable reading schedules and discussion prompts for each week. Format as a structured plan.`;

            const response = await this.anthropic.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 700,
                temperature: 0.5,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            return {
                success: true,
                plan: response.content[0].text
            };

        } catch (error) {
            console.error('Error generating reading goals:', error);
            return {
                success: false,
                plan: 'Week 1: Read first 25% of the book\nWeek 2: Read next 25% (50% total)\nWeek 3: Read next 25% (75% total)\nWeek 4: Finish the book and reflect on key takeaways',
                error: error.message
            };
        }
    }
}

module.exports = BookService;
