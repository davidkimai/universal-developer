#!/usr/bin/env node

// universal-developer/src/cli.ts

import { program } from 'commander';
import { UniversalLLM } from './index';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import * as dotenv from 'dotenv';
import * as os from 'os';
import * as readline from 'readline';
import { createSpinner } from 'nanospinner';

// Load environment variables
dotenv.config();

// Load package.json for version info
const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')
);

// Check for config file in user's home directory
const configDir = path.join(os.homedir(), '.universal-developer');
const configPath = path.join(configDir, 'config.json');
let config: any = {
  defaultProvider: 'anthropic',
  enableTelemetry: true,
  apiKeys: {}
};

// Create config directory if it doesn't exist
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Load config if it exists
if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (error) {
    console.error('Error loading config file:', error);
  }
}

// Save config function
function saveConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

// Configure CLI
program
  .name('ud')
  .description('Universal Developer CLI - Control LLMs with symbolic runtime commands')
  .version(packageJson.version);

// Configure command
program
  .command('config')
  .description('Configure Universal Developer CLI')
  .option('-p, --provider <provider>', 'Set default provider (anthropic, openai, qwen, gemini, ollama)')
  .option('-k, --key <key>', 'Set API key for the default provider')
  .option('--anthropic-key <key>', 'Set API key for Anthropic/Claude')
  .option('--openai-key <key>', 'Set API key for OpenAI')
  .option('--qwen-key <key>', 'Set API key for Qwen')
  .option('--gemini-key <key>', 'Set API key for Google Gemini')
  .option('--telemetry <boolean>', 'Enable or disable anonymous telemetry')
  .option('-l, --list', 'List current configuration')
  .action((options) => {
    if (options.list) {
      console.log(chalk.bold('\nCurrent Configuration:'));
      console.log(`Default Provider: ${chalk.green(config.defaultProvider)}`);
      console.log(`Telemetry: ${config.enableTelemetry ? chalk.green('Enabled') : chalk.yellow('Disabled')}`);
      console.log('\nAPI Keys:');
      for (const [provider, key] of Object.entries(config.apiKeys)) {
        console.log(`${provider}: ${key ? chalk.green('Configured') : chalk.red('Not configured')}`);
      }
      return;
    }

    let changed = false;

    if (options.provider) {
      const validProviders = ['anthropic', 'openai', 'qwen', 'gemini', 'ollama'];
      if (validProviders.includes(options.provider)) {
        config.defaultProvider = options.provider;
        changed = true;
        console.log(`Default provider set to ${chalk.green(options.provider)}`);
      } else {
        console.error(`Invalid provider: ${options.provider}. Valid options are: ${validProviders.join(', ')}`);
      }
    }

    if (options.key) {
      if (!config.apiKeys) config.apiKeys = {};
      config.apiKeys[config.defaultProvider] = options.key;
      changed = true;
      console.log(`API key for ${chalk.green(config.defaultProvider)} has been set`);
    }

    // Provider-specific keys
    const providerKeys = {
      'anthropic': options.anthropicKey,
      'openai': options.openaiKey,
      'qwen': options.qwenKey,
      'gemini': options.geminiKey
    };

    for (const [provider, key] of Object.entries(providerKeys)) {
      if (key) {
        if (!config.apiKeys) config.apiKeys = {};
        config.apiKeys[provider] = key;
        changed = true;
        console.log(`API key for ${chalk.green(provider)} has been set`);
      }
    }

    if (options.telemetry !== undefined) {
      const enableTelemetry = options.telemetry === 'true';
      config.enableTelemetry = enableTelemetry;
      changed = true;
      console.log(`Telemetry ${enableTelemetry ? chalk.green('enabled') : chalk.yellow('disabled')}`);
    }

    if (changed) {
      saveConfig();
      console.log(chalk.bold('\nConfiguration saved!'));
    } else {
      console.log('No changes made. Use --help to see available options.');
    }
  });

// Helper function to handle piped input
async function getPipedInput(): Promise<string | null> {
  if (process.stdin.isTTY) {
    return null;
  }

  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('readable', () => {
      const chunk = process.stdin.read();
      if (chunk !== null) {
        data += chunk;
      }
    });

    process.stdin.on('end', () => {
      resolve(data);
    });
  });
}

// Helper to get API key for a provider
function getApiKey(provider: string): string {
  // First check config
  if (config.apiKeys && config.apiKeys[provider]) {
    return config.apiKeys[provider];
  }

  // Then check environment variables
  const envVarName = `${provider.toUpperCase()}_API_KEY`;
  const apiKey = process.env[envVarName];
  
  if (!apiKey) {
    console.error(chalk.red(`Error: No API key found for ${provider}.`));
    console.log(`Please set your API key using: ud config --${provider}-key <your-api-key>`);
    console.log(`Or set the ${envVarName} environment variable.`);
    process.exit(1);
  }

  return apiKey;
}

// Interactive mode
program
  .command('interactive')
  .alias('i')
  .description('Start an interactive session')
  .option('-p, --provider <provider>', 'LLM provider to use')
  .option('-m, --model <model>', 'Model to use')
  .action(async (options) => {
    const provider = options.provider || config.defaultProvider;
    const apiKey = getApiKey(provider);
    
    const llm = new UniversalLLM({
      provider,
      apiKey,
      model: options.model,
      telemetryEnabled: config.enableTelemetry
    });

    console.log(chalk.bold('\nUniversal Developer Interactive Mode'));
    console.log(chalk.dim(`Using provider: ${provider}`));
    console.log(chalk.dim('Type /exit or Ctrl+C to quit'));
    console.log(chalk.dim('Available commands: /think, /fast, /loop, /reflect, /fork, /collapse\n'));
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    let conversationHistory: { role: string, content: string }[] = [];
    
    const promptUser = () => {
      rl.question('> ', async (input) => {
        if (input.toLowerCase() === '/exit') {
          rl.close();
          return;
        }

        // Store user message
        conversationHistory.push({
          role: 'user',
          content: input
        });

        const spinner = createSpinner('Generating response...').start();
        
        try {
          const response = await llm.generate({
            messages: conversationHistory
          });
          
          spinner.success();
          console.log(`\n${chalk.blue('Assistant:')} ${response}\n`);
          
          // Store assistant response
          conversationHistory.push({
            role: 'assistant',
            content: response
          });
        } catch (error) {
          spinner.error();
          console.error(`Error: ${error.message}`);
        }
        
        promptUser();
      });
    };
    
    console.log(chalk.blue('Assistant:') + ' Hello! How can I help you today?\n');
    conversationHistory.push({
      role: 'assistant',
      content: 'Hello! How can I help you today?'
    });
    
    promptUser();
  });

// Command for each symbolic operation
const symbolicCommands = [
  { name: 'think', description: 'Generate response using deep reasoning' },
  { name: 'fast', description: 'Generate quick, concise response' },
  { name: 'loop', description: 'Generate iteratively refined response' },
  { name: 'reflect', description: 'Generate response with self-reflection' },
  { name: 'fork', description: 'Generate multiple alternative responses' },
  { name: 'collapse', description: 'Generate response using default behavior' }
];

symbolicCommands.forEach(cmd => {
  program
    .command(cmd.name)
    .description(cmd.description)
    .argument('[prompt]', 'The prompt to send to the LLM')
    .option('-p, --provider <provider>', 'LLM provider to use')
    .option('-m, --model <model>', 'Model to use')
    .option('-s, --system <prompt>', 'System prompt to use')
    .option('-i, --iterations <number>', 'Number of iterations (for loop command)')
    .option('-c, --count <number>', 'Number of alternatives (for fork command)')
    .action(async (promptArg, options) => {
      // Get provider from options or config
      const provider = options.provider || config.defaultProvider;
      const apiKey = getApiKey(provider);

      // Initialize LLM
      const llm = new UniversalLLM({
        provider,
        apiKey,
        model: options.model,
        telemetryEnabled: config.enableTelemetry
      });

      // Check for piped input
      const pipedInput = await getPipedInput();
      
      // Combine prompt argument and piped input
      let prompt = promptArg || '';
      if (pipedInput) {
        prompt = prompt ? `${prompt}\n\n${pipedInput}` : pipedInput;
      }
      
      // If no prompt provided, show help
      if (!prompt) {
        console.error('Error: Prompt is required.');
        console.log(`Usage: ud ${cmd.name} "Your prompt here"`);
        console.log('Or pipe content: cat file.txt | ud ${cmd.name}');
        process.exit(1);
      }

      // Build command string
      let commandString = `/${cmd.name}`;
      
      // Add command-specific parameters
      if (cmd.name === 'loop' && options.iterations) {
        commandString += ` --iterations=${options.iterations}`;
      } else if (cmd.name === 'fork' && options.count) {
        commandString += ` --count=${options.count}`;
      }
      
      // Add the prompt
      const fullPrompt = `${commandString} ${prompt}`;
      
      // Show what's happening
      console.log(chalk.dim(`Using provider: ${provider}`));
      const spinner = createSpinner('Generating response...').start();
      
      try {
        const response = await llm.generate({
          systemPrompt: options.system,
          prompt: fullPrompt
        });
        
        spinner.success();
        console.log('\n' + response + '\n');
      } catch (error) {
        spinner.error();
        console.error(`Error: ${error.message}`);
        process.exit(1);
      }
    });
});

// Default command (no subcommand specified)
program
  .arguments('[prompt]')
  .option('-p, --provider <provider>', 'LLM provider to use')
  .option('-m, --model <model>', 'Model to use')
  .option('-s, --system <prompt>', 'System prompt to use')
  .option('-c, --command <command>', 'Symbolic command to use')
  .action(async (promptArg, options) => {
    if (!promptArg && !process.stdin.isTTY) {
      // No prompt argument but has piped input
      const pipedInput = await getPipedInput();
      if (pipedInput) {
        promptArg = pipedInput;
      }
    }

    if (!promptArg) {
      // No prompt provided, show interactive mode
      program.commands.find(cmd => cmd.name() === 'interactive').action(options);
      return;
    }

    // Get provider from options or config
    const provider = options.provider || config.defaultProvider;
    const apiKey = getApiKey(provider);

    // Initialize LLM
    const llm = new UniversalLLM({
      provider,
      apiKey,
      model: options.model,
      telemetryEnabled: config.enableTelemetry
    });

    // Default to think command if none specified
    const command = options.command || 'think';
    
    // Format prompt with command
    const fullPrompt = `/${command} ${promptArg}`;
    
    // Show what's happening
    console.log(chalk.dim(`Using provider: ${provider}`));
    const spinner = createSpinner('Generating response...').start();
    
    try {
      const response = await llm.generate({
        systemPrompt: options.system,
        prompt: fullPrompt
      });
      
      spinner.success();
      console.log('\n' + response + '\n');
    } catch (error) {
      spinner.error();
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

// Parse arguments
program.parse();
