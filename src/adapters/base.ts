// universal-developer/src/adapters/base.ts

export interface SymbolicCommand {
  name: string;
  description: string;
  aliases?: string[];
  parameters?: {
    name: string;
    description: string;
    required?: boolean;
    default?: any;
  }[];
  transform: (prompt: string, options: any) => Promise<TransformedPrompt>;
}

export interface TransformedPrompt {
  systemPrompt?: string;
  userPrompt: string;
  modelParameters?: Record<string, any>;
}

export abstract class ModelAdapter {
  protected commands: Map<string, SymbolicCommand> = new Map();
  protected aliasMap: Map<string, string> = new Map();
  
  constructor(protected apiKey: string, protected options: any = {}) {
    this.registerCoreCommands();
  }

  protected registerCoreCommands() {
    this.registerCommand({
      name: 'think',
      description: 'Activate extended reasoning pathways',
      transform: this.transformThink.bind(this)
    });

    this.registerCommand({
      name: 'fast',
      description: 'Optimize for low-latency responses',
      transform: this.transformFast.bind(this)
    });

    this.registerCommand({
      name: 'loop',
      description: 'Enable iterative refinement cycles',
      parameters: [
        {
          name: 'iterations',
          description: 'Number of refinement iterations',
          required: false,
          default: 3
        }
      ],
      transform: this.transformLoop.bind(this)
    });

    this.registerCommand({
      name: 'reflect',
      description: 'Trigger meta-analysis of outputs',
      transform: this.transformReflect.bind(this)
    });

    this.registerCommand({
      name: 'collapse',
      description: 'Return to default behavior',
      transform: this.transformCollapse.bind(this)
    });

    this.registerCommand({
      name: 'fork',
      description: 'Generate multiple alternative responses',
      parameters: [
        {
          name: 'count',
          description: 'Number of alternatives to generate',
          required: false,
          default: 2
        }
      ],
      transform: this.transformFork.bind(this)
    });
  }

  public registerCommand(command: SymbolicCommand) {
    this.commands.set(command.name, command);
    if (command.aliases) {
      command.aliases.forEach(alias => {
        this.aliasMap.set(alias, command.name);
      });
    }
  }

  public async generate(input: { prompt: string, systemPrompt?: string }): Promise<string> {
    const { prompt, systemPrompt = '' } = input;
    
    // Parse command from prompt
    const { command, cleanPrompt, parameters } = this.parseCommand(prompt);
    
    // Transform prompt based on command
    const transformed = command 
      ? await this.commands.get(command)?.transform(cleanPrompt, { 
          systemPrompt, 
          parameters,
          options: this.options
        })
      : { systemPrompt, userPrompt: prompt };
    
    // Execute the transformed prompt with the provider's API
    return this.executePrompt(transformed);
  }

  protected parseCommand(prompt: string): { command: string | null, cleanPrompt: string, parameters: Record<string, any> } {
    const commandRegex = /^\/([a-zA-Z0-9_]+)(?:\s+([^\n]*))?/;
    const match = prompt.match(commandRegex);
    
    if (!match) {
      return { command: null, cleanPrompt: prompt, parameters: {} };
    }
    
    const [fullMatch, command, rest] = match;
    const commandName = this.aliasMap.get(command) || command;
    
    if (!this.commands.has(commandName)) {
      return { command: null, cleanPrompt: prompt, parameters: {} };
    }
    
    // Parse parameters if any
    const parameters = this.parseParameters(commandName, rest || '');
    const cleanPrompt = prompt.replace(fullMatch, '').trim();
    
    return { command: commandName, cleanPrompt, parameters };
  }

  protected parseParameters(command: string, paramString: string): Record<string, any> {
    // Default simple implementation - override in specific adapters as needed
    const params: Record<string, any> = {};
    const cmd = this.commands.get(command);
    
    // If no parameters defined for command, return empty object
    if (!cmd?.parameters || cmd.parameters.length === 0) {
      return params;
    }
    
    // Set defaults
    cmd.parameters.forEach(param => {
      if (param.default !== undefined) {
        params[param.name] = param.default;
      }
    });
    
    // Simple parsing - can be enhanced for more complex parameter syntax
    const paramRegex = /--([a-zA-Z0-9_]+)(?:=([^\s]+))?/g;
    let match;
    
    while ((match = paramRegex.exec(paramString)) !== null) {
      const [_, paramName, paramValue = true] = match;
      params[paramName] = paramValue;
    }
    
    return params;
  }

  /* 
   * These transformation methods must be implemented by specific adapters
   * to account for platform-specific behavior
   */
  protected abstract transformThink(prompt: string, options: any): Promise<TransformedPrompt>;
  protected abstract transformFast(prompt: string, options: any): Promise<TransformedPrompt>;
  protected abstract transformLoop(prompt: string, options: any): Promise<TransformedPrompt>;
  protected abstract transformReflect(prompt: string, options: any): Promise<TransformedPrompt>;
  protected abstract transformCollapse(prompt: string, options: any): Promise<TransformedPrompt>;
  protected abstract transformFork(prompt: string, options: any): Promise<TransformedPrompt>;
  
  // Method to execute the transformed prompt with the provider's API
  protected abstract executePrompt(transformed: TransformedPrompt): Promise<string>;
}
