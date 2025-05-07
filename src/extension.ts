// universal-developer-vscode/src/extension.ts

import * as vscode from 'vscode';

/**
 * Symbolic command definition
 */
interface SymbolicCommand {
  name: string;
  description: string;
  parameters?: {
    name: string;
    description: string;
    required?: boolean;
    default?: any;
  }[];
  examples: string[];
  provider?: {
    claude?: boolean;
    openai?: boolean;
    qwen?: boolean;
    gemini?: boolean;
    ollama?: boolean;
  };
}

/**
 * Universal developer extension activation function
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Universal Developer extension is now active');

  // Register command palette commands
  const insertSymbolicCommand = vscode.commands.registerCommand(
    'universal-developer.insertSymbolicCommand',
    async () => {
      const commandName = await showSymbolicCommandQuickPick();
      if (!commandName) return;

      const command = SYMBOLIC_COMMANDS.find(cmd => cmd.name === commandName);
      if (!command) return;

      // Check if command has parameters
      let commandString = `/${command.name}`;
      
      if (command.parameters && command.parameters.length > 0) {
        const parameters = await collectCommandParameters(command);
        if (parameters) {
          Object.entries(parameters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              commandString += ` --${key}=${value}`;
            }
          });
        }
      }

      // Insert command at cursor position
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        editor.edit(editBuilder => {
          editBuilder.insert(editor.selection.active, commandString + ' ');
        });
      }
    }
  );

  // Register the symbolic command chain builder
  const buildSymbolicChain = vscode.commands.registerCommand(
    'universal-developer.buildSymbolicChain', 
    async () => {
      await showCommandChainBuilder();
    }
  );

  // Register symbolic command hover provider
  const hoverProvider = vscode.languages.registerHoverProvider(
    ['javascript', 'typescript', 'python', 'markdown', 'plaintext'],
    {
      provideHover(document, position, token) {
        const range = document.getWordRangeAtPosition(position, /\/[a-zA-Z0-9_]+/);
        if (!range) return;

        const commandText = document.getText(range);
        const commandName = commandText.substring(1); // Remove the leading /
        
        const command = SYMBOLIC_COMMANDS.find(cmd => cmd.name === commandName);
        if (!command) return;

        // Create hover markdown
        const hoverContent = new vscode.MarkdownString();
        hoverContent.appendMarkdown(`**/${command.name}**\n\n`);
        hoverContent.appendMarkdown(`${command.description}\n\n`);
        
        if (command.parameters && command.parameters.length > 0) {
          hoverContent.appendMarkdown('**Parameters:**\n\n');
          command.parameters.forEach(param => {
            const required = param.required ? ' (required)' : '';
            const defaultValue = param.default !== undefined ? ` (default: ${param.default})` : '';
            hoverContent.appendMarkdown(`- \`--${param.name}\`${required}${defaultValue}: ${param.description}\n`);
          });
          hoverContent.appendMarkdown('\n');
        }

        if (command.examples && command.examples.length > 0) {
          hoverContent.appendMarkdown('**Examples:**\n\n');
          command.examples.forEach(example => {
            hoverContent.appendCodeBlock(example, 'markdown');
          });
        }

        // Show provider compatibility
        if (command.provider) {
          hoverContent.appendMarkdown('\n**Compatible with:**\n\n');
          const supported = Object.entries(command.provider)
            .filter(([_, isSupported]) => isSupported)
            .map(([provider]) => provider);
          hoverContent.appendMarkdown(supported.join(', '));
        }

        return new vscode.Hover(hoverContent, range);
      }
    }
  );

  // Register completion provider for symbolic commands
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    ['javascript', 'typescript', 'python', 'markdown', 'plaintext'],
    {
      provideCompletionItems(document, position) {
        const linePrefix = document.lineAt(position).text.substring(0, position.character);
        
        // Check if we're at the start of a potential symbolic command
        if (!linePrefix.endsWith('/')) {
          return undefined;
        }

        const completionItems = SYMBOLIC_COMMANDS.map(command => {
          const item = new vscode.CompletionItem(
            command.name,
            vscode.CompletionItemKind.Keyword
          );
          item.insertText = command.name;
          item.detail = command.description;
          item.documentation = new vscode.MarkdownString(command.description);
          return item;
        });

        return completionItems;
      }
    },
    '/' // Only trigger after the / character
  );

  // Register parameter completion provider
  const parameterCompletionProvider = vscode.languages.registerCompletionItemProvider(
    ['javascript', 'typescript', 'python', 'markdown', 'plaintext'],
    {
      provideCompletionItems(document, position) {
        const linePrefix = document.lineAt(position).text.substring(0, position.character);
        
        // Match a symbolic command with a potential parameter start
        const commandMatch = linePrefix.match(/\/([a-zA-Z0-9_]+)(?:\s+(?:[^\s]+\s+)*)?--$/);
        if (!commandMatch) {
          return undefined;
        }

        const commandName = commandMatch[1];
        const command = SYMBOLIC_COMMANDS.find(cmd => cmd.name === commandName);
        
        if (!command || !command.parameters || command.parameters.length === 0) {
          return undefined;
        }

        // Offer parameter completions
        const completionItems = command.parameters.map(param => {
          const item = new vscode.CompletionItem(
            param.name,
            vscode.CompletionItemKind.Property
          );
          item.insertText = `${param.name}=`;
          item.detail = param.description;
          
          if (param.default !== undefined) {
            item.documentation = new vscode.MarkdownString(
              `${param.description}\n\nDefault: \`${param.default}\``
            );
          } else {
            item.documentation = new vscode.MarkdownString(param.description);
          }
          
          return item;
        });

        return completionItems;
      }
    },
    '-' // Trigger after - (the second dash in --)
  );

  // Register code actions provider for symbolic command suggestions
  const codeActionsProvider = vscode.languages.registerCodeActionsProvider(
    ['javascript', 'typescript', 'python'],
    {
      provideCodeActions(document, range, context, token) {
        // Check if there's any LLM API call in the current line
        const line = document.lineAt(range.start.line).text;
        
        const llmApiPatterns = [
          /\.generate\(\s*{/,              // UniversalLLM.generate()
          /\.createCompletion\(/,          // OpenAI
          /\.createChatCompletion\(/,      // OpenAI
          /\.chat\.completions\.create\(/,  // OpenAI v2
          /\.messages\.create\(/,           // Anthropic/Claude
          /\.generateContent\(/            // Google Gemini
        ];

        if (!llmApiPatterns.some(pattern => pattern.test(line))) {
          return;
        }

        // Create code actions for adding symbolic commands
        const actions: vscode.CodeAction[] = [];
        
        // Find the prompt parameter
        const promptMatch = line.match(/(prompt|messages|content)\s*:/);
        if (!promptMatch) return;

        // Add actions for common symbolic commands
        ['think', 'fast', 'reflect', 'loop'].forEach(commandName => {
          const command = SYMBOLIC_COMMANDS.find(cmd => cmd.name === commandName);
          if (!command) return;
          
          const action = new vscode.CodeAction(
            `Add /${commandName} command`,
            vscode.CodeActionKind.RefactorRewrite
          );
          
          action.command = {
            title: `Insert /${commandName}`,
            command: 'universal-developer.insertSymbolicCommandAtPrompt',
            arguments: [range.start.line, command]
          };
          
          actions.push(action);
        });

        return actions;
      }
    }
  );

  // Register command to insert symbolic command at prompt
  const insertSymbolicCommandAtPrompt = vscode.commands.registerCommand(
    'universal-developer.insertSymbolicCommandAtPrompt',
    async (line: number, command: SymbolicCommand) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      
      const document = editor.document;
      const lineText = document.lineAt(line).text;
      
      // Find where the prompt string starts
      const promptMatch = lineText.match(/(prompt|messages|content)\s*:\s*['"]/);
      if (!promptMatch) return;
      
      const promptStartIdx = promptMatch.index! + promptMatch[0].length;
      const position = new vscode.Position(line, promptStartIdx);
      
      editor.edit(editBuilder => {
        editBuilder.insert(position, `/${command.name} `);
      });
    }
  );

  // Register status bar item for active symbolic context
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = "$(symbol-keyword) Symbolic";
  statusBarItem.tooltip = "Universal Developer: Click to insert symbolic command";
  statusBarItem.command = 'universal-developer.insertSymbolicCommand';
  statusBarItem.show();

  // Register documentation webview
  const showDocumentation = vscode.commands.registerCommand(
    'universal-developer.showDocumentation',
    () => {
      const panel = vscode.window.createWebviewPanel(
        'universalDeveloperDocs',
        'Universal Developer Documentation',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      
      panel.webview.html = getDocumentationHtml();
    }
  );

  // Register commands for the extension
  context.subscriptions.push(
    insertSymbolicCommand,
    buildSymbolicChain,
    hoverProvider,
    completionProvider,
    parameterCompletionProvider,
    codeActionsProvider,
    insertSymbolicCommandAtPrompt,
    statusBarItem,
    showDocumentation
  );

  // Telemetry for command usage (anonymized)
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'universal-developer.trackCommandUsage',
      (commandName: string) => {
        // Only track if user has opted in to telemetry
        const config = vscode.workspace.getConfiguration('universal-developer');
        if (config.get('enableTelemetry', true)) {
          sendAnonymizedTelemetry('command_used', { command: commandName });
        }
      }
    )
  );
}

// Helper function to show a quick pick for symbolic commands
async function showSymbolicCommandQuickPick(): Promise<string | undefined> {
  const items = SYMBOLIC_COMMANDS.map(command => ({
    label: `/${command.name}`,
    description: command.description,
    detail: command.parameters && command.parameters.length > 0 
      ? `Parameters: ${command.parameters.map(p => p.name).join(', ')}` 
      : undefined
  }));

  const selected = await vscode
