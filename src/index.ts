// universal-developer/src/index.ts

import { ModelAdapter, TransformedPrompt, SymbolicCommand } from './adapters/base';
import { ClaudeAdapter } from './adapters/claude';
import { OpenAIAdapter } from './adapters/openai';
import { QwenAdapter } from './adapters/qwen';

// Import additional adapters as they become available
// import { GeminiAdapter } from './adapters/gemini';
// import { VLLMAdapter } from './adapters/vllm';
// import { OllamaAdapter } from './adapters/ollama';

type Provider = 'anthropic' | 'openai' | 'qwen' | 'gemini' | 'vllm' | 'ollama' | 'lmstudio';

interface UniversalLLMOptions {
  provider: Provider;
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  baseURL?: string;
  [key: string]: any; // Additional provider-specific options
}

interface GenerateOptions {
  prompt: string;
  systemPrompt?: string;
}

interface SymbolicTelemetry {
  enabled: boolean;
  endpoint?: string;
  anonymousId?: string;
  sessionId?: string;
}

/**
 * UniversalLLM provides a unified interface for interacting with different LLM providers
 * using symbolic runtime commands.
 */
export class UniversalLLM {
  private adapter: ModelAdapter;
  private telemetry: SymbolicTelemetry;
  private sessionCommands: Map<string, number> = new Map();
  
  /**
   * Create a new UniversalLLM instance
   * @param options Configuration options including provider and API key
   */
  constructor(options: UniversalLLMOptions) {
    this.adapter = this.createAdapter(options);
    
    // Initialize telemetry (opt-in by default)
    this.telemetry = {
      enabled: options.telemetryEnabled !== false,
      endpoint: options.telemetryEndpoint || 'https://telemetry.universal-developer.org/v1/events',
      anonymousId: options.anonymousId || this.generateAnonymousId(),
      sessionId: options.sessionId || this.generateSessionId()
    };
  }
  
  /**
   * Register a custom symbolic command
   * @param name Command name (without the / prefix)
   * @param command Command configuration
   */
  public registerCommand(name: string, command: Omit<SymbolicCommand, 'name'>) {
    this.adapter.registerCommand({
      name,
      ...command
    });
    
    return this; // For method chaining
  }
  
  /**
   * Generate a response using the configured LLM provider
   * @param options Generation options including prompt and optional system prompt
   * @returns Promise resolving to the generated text
   */
  public async generate(options: GenerateOptions): Promise<string> {
    // Extract symbolic command if present (for telemetry)
    const commandMatch = options.prompt.match(/^\/([a-zA-Z0-9_]+)/);
    const command = commandMatch ? commandMatch[1] : null;
    
    // Track command usage
    if (command) {
      this.trackCommandUsage(command);
    }
    
    // Generate response using the adapter
    const response = await this.adapter.generate(options);
    
    // Send telemetry data if enabled
    if (this.telemetry.enabled && command) {
      this.sendTelemetry(command, options.prompt);
    }
    
    return response;
  }
  
  /**
   * Get usage statistics for symbolic commands in the current session
   * @returns Map of command names to usage counts
   */
  public getCommandUsageStats(): Map<string, number> {
    return new Map(this.sessionCommands);
  }
  
  /**
   * Enable or disable telemetry collection
   * @param enabled Whether telemetry should be enabled
   */
  public setTelemetryEnabled(enabled: boolean): void {
    this.telemetry.enabled = enabled;
  }
  
  /**
   * Create the appropriate adapter based on the provider
   * @param options Configuration options
   * @returns Configured ModelAdapter instance
   */
  private createAdapter(options: UniversalLLMOptions): ModelAdapter {
    const { provider, apiKey, ...adapterOptions } = options;
    
    switch (provider) {
      case 'anthropic':
        return new ClaudeAdapter(apiKey, adapterOptions);
      case 'openai':
        return new OpenAIAdapter(apiKey, adapterOptions);
      case 'qwen':
        return new QwenAdapter(apiKey, adapterOptions);
      // Add cases for other providers as they become available
      // case 'gemini':
      //   return new GeminiAdapter(apiKey, adapterOptions);
      // case 'vllm':
      //   return new VLLMAdapter(apiKey, adapterOptions);
      // case 'ollama':
      //   return new OllamaAdapter(apiKey, adapterOptions);
      // case 'lmstudio':
      //   return new LMStudioAdapter(apiKey, adapterOptions);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
  
  /**
   * Track usage of a symbolic command
   * @param command Name of the command (without the / prefix)
   */
  private trackCommandUsage(command: string): void {
    const currentCount = this.sessionCommands.get(command) || 0;
    this.sessionCommands.set(command, currentCount + 1);
  }
  
  /**
   * Send telemetry data to the collection endpoint
   * @param command Name of the command used
   * @param prompt Full prompt text
   */
  private async sendTelemetry(command: string, prompt: string): Promise<void> {
    if (!this.telemetry.enabled || !this.telemetry.endpoint) return;
    
    try {
      const data = {
        event: 'symbolic_command_used',
        properties: {
          command,
          provider: (this.adapter as any).constructor.name.replace('Adapter', '').toLowerCase(),
          timestamp: new Date().toISOString(),
          prompt_length: prompt.length,
          // No personal data or prompt content is sent
        },
        anonymousId: this.telemetry.anonymousId,
        sessionId: this.telemetry.sessionId
      };
      
      // Use fetch in browser environments, axios/node-fetch in Node.js
      if (typeof fetch === 'function') {
        await fetch(this.telemetry.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
      } else {
        // In Node.js environments, use a dynamic import to avoid bundling issues
        const { default: axios } = await import('axios');
        await axios.post(this.telemetry.endpoint, data);
      }
    } catch (error) {
      // Silently fail on telemetry errors to avoid disrupting the main application
      console.warn('Telemetry error:', error);
    }
  }
  
  /**
   * Generate a random anonymous ID for telemetry
   * @returns Random ID string
   */
  private generateAnonymousId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Generate a session ID for telemetry
   * @returns Session ID string
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
}

// Export other components for advanced usage
export * from './adapters/base';
export * from './adapters/claude';
export * from './adapters/openai';
export * from './adapters/qwen';
