// universal-developer/src/adapters/qwen.ts

import { ModelAdapter, TransformedPrompt } from './base';
import axios from 'axios';

interface QwenOptions {
  apiVersion?: string;
  maxTokens?: number;
  temperature?: number;
  baseURL?: string;
  model?: string;
}

export class QwenAdapter extends ModelAdapter {
  private baseURL: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(apiKey: string, options: QwenOptions = {}) {
    super(apiKey, options);
    
    this.baseURL = options.baseURL || 'https://api.qwen.ai';
    this.model = options.model || 'qwen3-30b-a3b';
    this.maxTokens = options.maxTokens || 4096;
    this.temperature = options.temperature || 0.7;
  }

  protected async transformThink(prompt: string, options: any): Promise<TransformedPrompt> {
    // Leverage Qwen3's native thinking mode
    return {
      systemPrompt: options.systemPrompt || '',
      userPrompt: prompt.trim().endsWith('/think') ? prompt : `${prompt} /think`,
      modelParameters: {
        temperature: Math.max(0.1, this.temperature - 0.2),
        enable_thinking: true
      }
    };
  }

  protected async transformFast(prompt: string, options: any): Promise<TransformedPrompt> {
    // Disable thinking mode for fast responses
    const systemPrompt = `${options.systemPrompt || ''}
Provide brief, direct responses. Focus on essential information only.`;

    return {
      systemPrompt,
      userPrompt: prompt.trim().endsWith('/no_think') ? prompt : `${prompt} /no_think`,
      modelParameters: {
        temperature: Math.min(1.0, this.temperature + 0.1),
        max_tokens: Math.min(this.maxTokens, 1024),
        enable_thinking: false
      }
    };
  }

  protected async transformLoop(prompt: string, options: any): Promise<TransformedPrompt> {
    const iterations = options.parameters.iterations || 3;
    
    const systemPrompt = `${options.systemPrompt || ''}
Please use an iterative approach with ${iterations} refinement cycles:
1. Initial response
2. Critical review
3. Improvement
4. Repeat steps 2-3 for a total of ${iterations} iterations
5. Present your final response with all iterations clearly labeled`;

    return {
      systemPrompt,
      userPrompt: prompt,
      modelParameters: {
        temperature: this.temperature,
        enable_thinking: true // Use thinking mode for deeper refinement
      }
    };
  }

  protected async transformReflect(prompt: string, options: any): Promise<TransformedPrompt> {
    const systemPrompt = `${options.systemPrompt || ''}
For this response, please:
1. Answer the query directly
2. Then reflect on your answer by analyzing:
   - Assumptions made
   - Alternative perspectives
   - Limitations in your approach
   - Potential improvements`;

    return {
      systemPrompt,
      userPrompt: `${prompt} /think`, // Use native thinking for reflection
      modelParameters: {
        temperature: Math.max(0.1, this.temperature - 0.1),
        enable_thinking: true
      }
    };
  }

  protected async transformCollapse(prompt: string, options: any): Promise<TransformedPrompt> {
    // Return to default behavior
    return {
      systemPrompt: options.systemPrompt || '',
      userPrompt: `${prompt} /no_think`, // Explicitly disable thinking
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
Please provide ${count} distinct alternative responses to this prompt, representing different approaches or perspectives. Label each alternative clearly.`;

    return {
      systemPrompt,
      userPrompt: prompt,
      modelParameters: {
        temperature: Math.min(1.0, this.temperature + 0.2),
        max_tokens: this.maxTokens,
        enable_thinking: true // Use thinking for more creative alternatives
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
          ...('enable_thinking' in (transformed.modelParameters || {}) ? 
              { enable_thinking: transformed.modelParameters?.enable_thinking } : 
              {})
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      // Extract thinking content if available
      let content = '';
      if (response.data.thinking_content) {
        content = `<thinking>\n${response.data.thinking_content}\n</thinking>\n\n`;
      }
      content += response.data.choices[0].message.content;

      return content;
    } catch (error) {
      console.error('Error executing Qwen prompt:', error);
      throw new Error(`Failed to execute Qwen prompt: ${error.message}`);
    }
  }
}
