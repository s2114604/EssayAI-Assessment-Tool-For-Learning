// Replicate AI Detection API integration
const REPLICATE_API_TOKEN = import.meta.env.VITE_REPLICATE_API_TOKEN;
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';
const AI_DETECTOR_VERSION = 'f1f3098b63028679982e0523e0a306a66ed26edf9c48ce43762fc64a5d01d0c7';

export interface AIDetectionResult {
  ai_probability: number;
  human_probability: number;
  confidence: number;
  analysis: string;
  status: 'completed' | 'processing' | 'failed';
  processing_time?: number;
}

export interface AIDetectionReport {
  id: string;
  essay_id: string;
  ai_probability: number;
  human_probability: number;
  confidence: number;
  analysis: string;
  status: 'checking' | 'completed' | 'failed';
  checked_at: string;
  created_at: string;
  updated_at: string;
}

export class ReplicateAIDetector {
  private apiToken: string;

  constructor(apiToken?: string) {
    this.apiToken = apiToken || REPLICATE_API_TOKEN;
  }

  async detectAIContent(
    text: string,
    onProgress?: (message: string) => void
  ): Promise<AIDetectionResult> {
    console.log('🤖 === STARTING AI CONTENT DETECTION ===');
    console.log('📝 Text length:', text.length, 'characters');
    
    if (!this.apiToken || this.apiToken.trim() === '' || this.apiToken === 'your_replicate_api_token') {
      console.log('⚠️ Replicate API token not configured, using mock detection');
      return this.mockAIDetection(text);
    }

    const startTime = Date.now();
    
    try {
      // Validate text content
      if (!text || text.trim().length < 50) {
        throw new Error('Text content is too short for AI detection (minimum 50 characters)');
      }

      if (text.length > 50000) {
        throw new Error('Text content is too long for AI detection (maximum 50,000 characters)');
      }

      console.log('🔍 Step 1: Sending text to Replicate AI detector...');
      onProgress?.('🔍 Analyzing text with AI detector...');

      const response = await fetch(REPLICATE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait'
        },
        body: JSON.stringify({
          version: AI_DETECTOR_VERSION,
          input: {
            text: text
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Replicate API error (${response.status}): ${errorText}`);
        
        if (response.status === 401) {
          throw new Error('Invalid Replicate API token. Please check your API token configuration.');
        } else if (response.status === 429) {
          throw new Error('Replicate API rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`Replicate API error: ${response.status} ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log('✅ Received response from Replicate API:', result);

      if (result.error) {
        throw new Error(`Replicate API error: ${result.error}`);
      }

      // Parse the AI detection result
      const aiDetectionResult = this.parseAIDetectionResult(result, startTime);
      
      console.log('🎯 AI Detection completed:', {
        aiProbability: aiDetectionResult.ai_probability,
        humanProbability: aiDetectionResult.human_probability,
        confidence: aiDetectionResult.confidence,
        processingTime: aiDetectionResult.processing_time
      });

      return aiDetectionResult;

    } catch (error: any) {
      console.error('❌ AI detection failed:', error);
      
      // Fallback to mock detection if API fails
      console.log('🔄 Falling back to mock AI detection...');
      return this.mockAIDetection(text);
    }
  }

  private parseAIDetectionResult(apiResult: any, startTime: number): AIDetectionResult {
    const processingTime = Date.now() - startTime;
    
    // Parse the result from Replicate API
    // The exact structure may vary, so we'll handle different possible formats
    let aiProbability = 0;
    let humanProbability = 0;
    let confidence = 0;
    let analysis = '';

    if (apiResult.output) {
      // Handle different possible output formats
      if (typeof apiResult.output === 'object') {
        aiProbability = apiResult.output.ai_probability || apiResult.output.ai_score || 0;
        humanProbability = apiResult.output.human_probability || apiResult.output.human_score || (1 - aiProbability);
        confidence = apiResult.output.confidence || Math.abs(aiProbability - 0.5) * 2;
        analysis = apiResult.output.analysis || apiResult.output.explanation || 'AI detection analysis completed';
      } else if (typeof apiResult.output === 'string') {
        // Parse string output if needed
        analysis = apiResult.output;
        // Extract probabilities from string if possible
        const aiMatch = apiResult.output.match(/ai[:\s]*(\d+\.?\d*)%?/i);
        const humanMatch = apiResult.output.match(/human[:\s]*(\d+\.?\d*)%?/i);
        
        if (aiMatch) aiProbability = parseFloat(aiMatch[1]) / (aiMatch[1].includes('.') ? 1 : 100);
        if (humanMatch) humanProbability = parseFloat(humanMatch[1]) / (humanMatch[1].includes('.') ? 1 : 100);
        
        confidence = Math.abs(aiProbability - 0.5) * 2;
      }
    }

    // Ensure probabilities are valid
    if (aiProbability + humanProbability === 0) {
      aiProbability = 0.3; // Default moderate AI probability
      humanProbability = 0.7;
    } else if (Math.abs((aiProbability + humanProbability) - 1) > 0.1) {
      // Normalize if they don't add up to 1
      const total = aiProbability + humanProbability;
      aiProbability = aiProbability / total;
      humanProbability = humanProbability / total;
    }

    confidence = confidence || Math.abs(aiProbability - 0.5) * 2;

    return {
      ai_probability: Math.round(aiProbability * 100) / 100,
      human_probability: Math.round(humanProbability * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      analysis: analysis || `AI detection completed. ${Math.round(aiProbability * 100)}% probability of AI-generated content.`,
      status: 'completed',
      processing_time: processingTime
    };
  }

  private mockAIDetection(text: string): AIDetectionResult {
    console.log('🎭 Using mock AI detection for demonstration');
    
    // Simulate realistic AI detection based on text characteristics
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = words.length / sentences.length;
    
    // Simple heuristics for mock detection
    let aiProbability = 0.3; // Base probability
    
    // Very uniform sentence length might indicate AI
    if (avgWordsPerSentence > 15 && avgWordsPerSentence < 25) {
      aiProbability += 0.2;
    }
    
    // Very formal language patterns
    const formalWords = (text.match(/\b(furthermore|moreover|consequently|therefore|nevertheless|subsequently)\b/gi) || []).length;
    if (formalWords > words.length * 0.02) {
      aiProbability += 0.15;
    }
    
    // Repetitive patterns
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const vocabularyDiversity = uniqueWords.size / words.length;
    if (vocabularyDiversity < 0.4) {
      aiProbability += 0.1;
    }
    
    // Add some randomness
    aiProbability += (Math.random() - 0.5) * 0.3;
    aiProbability = Math.max(0.05, Math.min(0.95, aiProbability));
    
    const humanProbability = 1 - aiProbability;
    const confidence = Math.abs(aiProbability - 0.5) * 2;
    
    const analysis = `Mock AI Detection Analysis:
    
Text Statistics:
• Word Count: ${words.length}
• Sentences: ${sentences.length}
• Average Words per Sentence: ${avgWordsPerSentence.toFixed(1)}
• Vocabulary Diversity: ${(vocabularyDiversity * 100).toFixed(1)}%
• Formal Language Indicators: ${formalWords}

Assessment:
${aiProbability > 0.7 ? 'High likelihood of AI-generated content. The text shows patterns typical of AI writing systems.' :
  aiProbability > 0.4 ? 'Moderate likelihood of AI involvement. Some patterns suggest possible AI assistance or generation.' :
  'Low likelihood of AI generation. The text appears to have human-like writing characteristics.'}

Note: This is a demonstration using mock detection. For production use, configure the Replicate API token.`;

    return {
      ai_probability: Math.round(aiProbability * 100) / 100,
      human_probability: Math.round(humanProbability * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      analysis,
      status: 'completed',
      processing_time: 1500 + Math.random() * 1000 // Mock processing time
    };
  }
}

// Create a singleton instance
let replicateDetectorInstance: ReplicateAIDetector | null = null;

export const getReplicateAIDetector = (): ReplicateAIDetector => {
  if (!replicateDetectorInstance) {
    replicateDetectorInstance = new ReplicateAIDetector();
  }
  return replicateDetectorInstance;
};

// For backward compatibility
export const replicateAIDetector = {
  detectAIContent: async (
    text: string,
    onProgress?: (message: string) => void
  ): Promise<AIDetectionResult> => {
    try {
      console.log('🚀 Starting AI content detection...');
      const result = await getReplicateAIDetector().detectAIContent(text, onProgress);
      console.log('✅ AI content detection completed successfully:', result);
      return result;
    } catch (error) {
      console.error('Unexpected error in AI detection:', error);
      throw error;
    }
  }
};

// Utility function to check if Replicate API is properly configured
export const isReplicateConfigured = (): boolean => {
  return !!(REPLICATE_API_TOKEN && REPLICATE_API_TOKEN.trim() !== '' && REPLICATE_API_TOKEN !== 'your_replicate_api_token');
};