// universal-developer/src/adapters/claude.ts

import { ModelAdapter, TransformedPrompt } from './base';
import axios from 'axios';

interface ClaudeOptions {
  apiVersion?: string;
  maxTokens?: number;
  temperature?: number;
  baseURL?: string;
  model?: string;
}

export class ClaudeAdapter extends ModelAdapter {
  private baseURL: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(apiKey: string, options: ClaudeOptions = {}) {
    super(apiKey, options);
    
    this.baseURL = options.baseURL || 'https://api.anthropic.com';
    this.model = options.model || 'claude-3-opus-20240229';
    this.maxTokens = options.maxTokens || 4096;
    this.temperature = options.temperature || 0.7;
  }

  protected async transformThink(prompt: string, options: any): Promise<TransformedPrompt> {
    // Claude has built-in thinking capabilities we can leverage
    const systemPrompt = `${options.systemPrompt || ''}
For this response, I'd like you to engage your deepest analytical capabilities. Please think step by step through this problem, considering multiple perspectives and potential approaches. Take your time to develop a comprehensive, nuanced understanding before providing your final answer.`;

    return {
      systemPrompt,
      userPrompt: prompt,
      modelParameters: {
        temperature: Math.max(0.1, this.temperature - 0.2), // Slightly lower temperature for more deterministic thinking
        enable_thinking: true
      }
    };
  }

  protected async transformFast(prompt: string, options: any): Promise<TransformedPrompt> {
    const systemPrompt = `${options.systemPrompt || ''}
Please provide a brief, direct response to this question. Focus on the most important information and keep your answer concise and to the point.`;

    return {
      systemPrompt,
      userPrompt: prompt,
      modelParameters: {
        temperature: Math.min(1.0, this.temperature + 0.1), // Slightly higher temperature for more fluent responses
        max_tokens: Math.min(this.maxTokens, 1024), // Limit token count for faster responses
        enable_thinking: false
      }
    };
  }

  protected async transformLoop(prompt: string, options: any): Promise<TransformedPrompt> {
    const iterations = options.parameters.iterations || 3;
    
    const systemPrompt = `${options.systemPrompt || ''}
Please approach this task using an iterative process. Follow these steps:

1. Develop an initial response to the prompt.
2. Critically review your response, identifying areas for improvement.
3. Create an improved version based on your critique.
4. Repeat steps 2-3 for a total of ${iterations} iterations.
5. Present your final response, which should reflect the accumulated improvements.

Show all iterations in your response, clearly labeled.`;

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
For this response, I'd like you to engage in two distinct phases:

1. First, respond to the user's query directly.
2. Then, reflect on your own response by considering:
   - What assumptions did you make in your answer?
   - What perspectives or viewpoints might be underrepresented?
   - What limitations exist in your approach or knowledge?
   - How might your response be improved or expanded?

Clearly separate these two phases in your response.`;

    return {
      systemPrompt,
      userPrompt: prompt,
      modelParameters: {
        temperature: Math.max(0.1, this.temperature - 0.1),
        enable_thinking: true
      }
    };
  }

  protected async transformCollapse(prompt: string, options: any): Promise<TransformedPrompt> {
    // Return to default behavior - use the original system prompt
    return {
      systemPrompt: options.systemPrompt || '',
      userPrompt: prompt,
      modelParameters: {
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        enable_thinking: false
      }
    };
  }

  protected async transformFork(prompt: string, options: any): Promise<TransformedPrompt> {
    const count = options.parameters.count || 2;
    
    const systemPrompt = `${options.systemPrompt || ''}
Please provide ${count} distinct alternative responses to this prompt. These alternatives should represent fundamentally different approaches or perspectives, not minor variations. Label each alternative clearly.`;

    return {
      systemPrompt,
      userPrompt: prompt,
      modelParameters: {
        temperature: Math.min(1.0, this.temperature + 0.2), // Higher temperature to encourage diversity
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
        `${this.baseURL}/v1/messages`,
        {
          model: this.model,
          messages,
          max_tokens: transformed.modelParameters?.max_tokens || this.maxTokens,
          temperature: transformed.modelParameters?.temperature || this.temperature,
          ...('enable_thinking' in (transformed.modelParameters || {}) ? 
              { enable_thinking: transformed.modelParameters?.enable_thinking } : 
              {})
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      return response.data.content[0].text;
    } catch (error) {
      console.error('Error executing Claude prompt:', error);
      throw new Error(`Failed to execute Claude prompt: ${error.message}`);
    }
  }
}
