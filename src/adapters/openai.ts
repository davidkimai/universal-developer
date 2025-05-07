// universal-developer/src/adapters/openai.ts

import { ModelAdapter, TransformedPrompt } from './base';
import axios from 'axios';

interface OpenAIOptions {
  apiVersion?: string;
  maxTokens?: number;
  temperature?: number;
  baseURL?: string;
  model?: string;
}

export class OpenAIAdapter extends ModelAdapter {
  private baseURL: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(apiKey: string, options: OpenAIOptions = {}) {
    super(apiKey, options);
    
    this.baseURL = options.baseURL || 'https://api.openai.com';
    this.model = options.model || 'gpt-4';
    this.maxTokens = options.maxTokens || 4096;
    this.temperature = options.temperature || 0.7;
  }

  protected async transformThink(prompt: string, options: any): Promise<TransformedPrompt> {
    // For OpenAI, we'll use detailed system instructions to emulate thinking mode
    const systemPrompt = `${options.systemPrompt || ''}
When responding to this query, please use the following approach:
1. Take a deep breath and think step-by-step about the problem
2. Break down complex aspects into simpler components
3. Consider multiple perspectives and approaches
4. Identify potential misconceptions or errors in reasoning
5. Synthesize your analysis into a comprehensive response
6. Structure your thinking process visibly with clear sections:
   a. Initial Analysis
   b. Detailed Exploration
   c. Synthesis and Conclusion`;

    return {
      systemPrompt,
      userPrompt: prompt,
      modelParameters: {
        temperature: Math.max(0.1, this.temperature - 0.2),
        max_tokens: this.maxTokens
      }
    };
  }

  protected async transformFast(prompt: string, options: any): Promise<TransformedPrompt> {
    const systemPrompt = `${options.systemPrompt || ''}
Please provide a concise, direct response. Focus only on the most essential information needed to answer the query. Keep explanations minimal and prioritize brevity over comprehensiveness.`;

    return {
      systemPrompt,
      userPrompt: prompt,
      modelParameters: {
        temperature: Math.min(1.0, this.temperature + 0.1),
        max_tokens: Math.min(this.maxTokens, 1024),
        presence_penalty: 1.0, // Encourage brevity by penalizing repetition
        frequency_penalty: 1.0
      }
    };
  }

  protected async transformLoop(prompt: string, options: any): Promise<TransformedPrompt> {
    const iterations = options.parameters.iterations || 3;
    
    const systemPrompt = `${options.systemPrompt || ''}
Please approach this task using an iterative refinement process with ${iterations} cycles:

1. Initial Version: Create your first response to the query
2. Critical Review: Analyze the strengths and weaknesses of your response
3. Improved Version: Create an enhanced version addressing the identified issues
4. Repeat steps 2-3 for each iteration
5. Final Version: Provide your most refined response

Clearly label each iteration (e.g., "Iteration 1", "Critique 1", etc.) in your response.`;

    return {
      systemPrompt,
      userPrompt: prompt,
      modelParameters: {
        temperature: this.temperature,
        max_tokens: this.maxTokens
      }
    };
  }

  protected async transformReflect(prompt: string, options: any): Promise<TransformedPrompt> {
    const systemPrompt = `${options.systemPrompt || ''}
For this query, please structure your response in two distinct parts:

PART 1: DIRECT RESPONSE
Provide your primary answer to the user's query.

PART 2: META-REFLECTION
Then, engage in critical reflection on your own response by addressing:
- What assumptions did you make in your answer?
- What alternative perspectives might be valid?
- What are the limitations of your response?
- How might your response be improved?
- What cognitive biases might have influenced your thinking?

Make sure both parts are clearly labeled and distinguishable.`;

    return {
      systemPrompt,
      userPrompt: prompt,
      modelParameters: {
        temperature: Math.max(0.1, this.temperature - 0.1),
        max_tokens: this.maxTokens
      }
    };
  }

  protected async transformCollapse(prompt: string, options: any): Promise<TransformedPrompt> {
    // Return to default behavior
    return {
      systemPrompt: options.systemPrompt || '',
      userPrompt: prompt,
      modelParameters: {
        temperature: this.temperature,
        max_tokens: this.maxTokens
      }
    };
  }

  protected async transformFork(prompt: string, options: any): Promise<TransformedPrompt> {
    const count = options.parameters.count || 2;
    
    const systemPrompt = `${options.systemPrompt || ''}
Please provide ${count} substantively different responses to this prompt. Each alternative should represent a different approach, perspective, or framework. Clearly label each alternative (e.g., "Alternative 1", "Alternative 2", etc.).`;

    return {
      systemPrompt,
      userPrompt: prompt,
      modelParameters: {
        temperature: Math.min(1.0, this.temperature + 0.2), // Higher temperature for diversity
        max_tokens: this.maxTokens
      }
    };
  }

  protected async executePrompt(transformed: TransformedPrompt): Promise<string> {
    try {
      const messages = [
        // System message if provided
        ...(transformed.systemPrompt ? [{
          role: 'system',
          content: transformed.systemPrompt
        }] : []),
        // User message
        {
          role: 'user',
          content: transformed.userPrompt
        }
      ];

      const response = await axios.post(
        `${this.baseURL}/v1/chat/completions`,
        {
          model: this.model,
          messages,
          max_tokens: transformed.modelParameters?.max_tokens || this.maxTokens,
          temperature: transformed.modelParameters?.temperature || this.temperature,
          ...(transformed.modelParameters?.presence_penalty !== undefined ? 
              { presence_penalty: transformed.modelParameters.presence_penalty } : 
              {}),
          ...(transformed.modelParameters?.frequency_penalty !== undefined ? 
              { frequency_penalty: transformed.modelParameters.frequency_penalty } : 
              {})
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error executing OpenAI prompt:', error);
      throw new Error(`Failed to execute OpenAI prompt: ${error.message}`);
    }
  }
}
