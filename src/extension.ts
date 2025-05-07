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
// universal-developer-vscode/src/extension.ts (continued)

// Helper function to show a quick pick for symbolic commands
async function showSymbolicCommandQuickPick(): Promise<string | undefined> {
  const items = SYMBOLIC_COMMANDS.map(command => ({
    label: `/${command.name}`,
    description: command.description,
    detail: command.parameters && command.parameters.length > 0 
      ? `Parameters: ${command.parameters.map(p => p.name).join(', ')}` 
      : undefined
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a symbolic runtime command',
  });

  return selected ? selected.label.substring(1) : undefined; // Remove the leading /
}

// Helper function to collect parameters for a command
async function collectCommandParameters(command: SymbolicCommand): Promise<Record<string, any> | undefined> {
  if (!command.parameters || command.parameters.length === 0) {
    return {};
  }

  const parameters: Record<string, any> = {};
  
  // Set default values
  command.parameters.forEach(param => {
    if (param.default !== undefined) {
      parameters[param.name] = param.default;
    }
  });

  // Ask for each parameter
  for (const param of command.parameters) {
    const value = await vscode.window.showInputBox({
      prompt: param.description,
      placeHolder: param.default !== undefined ? `Default: ${param.default}` : undefined,
      ignoreFocusOut: true,
      validateInput: text => {
        if (param.required && !text) {
          return `${param.name} is required`;
        }
        return null;
      }
    });

    // User canceled
    if (value === undefined) {
      return undefined;
    }

    // Only set if value is provided
    if (value !== '') {
      parameters[param.name] = value;
    }
  }

  return parameters;
}

// Command Chain Builder Interface
async function showCommandChainBuilder() {
  // Create webview panel for the command chain builder
  const panel = vscode.window.createWebviewPanel(
    'universalDeveloperChainBuilder',
    'Symbolic Command Chain Builder',
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );

  // Load chain builder HTML
  panel.webview.html = getCommandChainBuilderHtml();

  // Handle messages from webview
  panel.webview.onDidReceiveMessage(
    message => {
      switch (message.command) {
        case 'insertCommandChain':
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            editor.edit(editBuilder => {
              editBuilder.insert(editor.selection.active, message.commandChain);
            });
          }
          break;
        case 'getCommandInfo':
          panel.webview.postMessage({
            command: 'commandInfo',
            commands: SYMBOLIC_COMMANDS
          });
          break;
      }
    },
    undefined,
    []
  );
}

// Get HTML for the command chain builder webview
function getCommandChainBuilderHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Symbolic Command Chain Builder</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      padding: 20px;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
    }
    
    h1 {
      font-size: 1.5em;
      margin-bottom: 20px;
    }
    
    .command-chain {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
      padding: 10px;
      background-color: var(--vscode-editor-inactiveSelectionBackground);
      border-radius: 4px;
    }
    
    .command-step {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .command-preview {
      margin-top: 20px;
      padding: 10px;
      background-color: var(--vscode-input-background);
      border-radius: 4px;
      font-family: var(--vscode-editor-font-family);
    }
    
    button {
      padding: 8px 12px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }
    
    select, input {
      padding: 6px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
    }
    
    .command-step .remove {
      color: var(--vscode-errorForeground);
    }
    
    .parameter-group {
      margin-left: 20px;
      margin-top: 5px;
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    
    .parameter-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .parameter-label {
      font-size: 0.9em;
      color: var(--vscode-descriptionForeground);
    }
    
    .command-description {
      font-size: 0.9em;
      margin-left: 20px;
      color: var(--vscode-descriptionForeground);
    }
    
    .buttons {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <h1>Symbolic Command Chain Builder</h1>
  
  <div class="command-chain" id="commandChain">
    <!-- Command steps will be added here -->
  </div>
  
  <button id="addCommand">Add Command</button>
  
  <div class="command-preview">
    <div><strong>Preview:</strong></div>
    <div id="previewText"></div>
  </div>
  
  <div class="buttons">
    <button id="insertChain">Insert Into Editor</button>
    <button id="clearChain">Clear</button>
  </div>
  
  <script>
    // Communication with VSCode extension
    const vscode = acquireVsCodeApi();
    
    // Request command info from extension
    vscode.postMessage({ command: 'getCommandInfo' });
    
    // Store commands when received from extension
    let commands = [];
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'commandInfo') {
        commands = message.commands;
        
        // If we already have commands in the UI, update their descriptions
        updateCommandDescriptions();
      }
    });
    
    // Chain state
    let commandChain = [];
    
    // DOM elements
    const commandChainEl = document.getElementById('commandChain');
    const addCommandBtn = document.getElementById('addCommand');
    const previewTextEl = document.getElementById('previewText');
    const insertChainBtn = document.getElementById('insertChain');
    const clearChainBtn = document.getElementById('clearChain');
    
    // Add new command
    addCommandBtn.addEventListener('click', () => {
      addCommandStep();
    });
    
    // Insert chain into editor
    insertChainBtn.addEventListener('click', () => {
      const commandChainText = generateCommandChainText();
      vscode.postMessage({
        command: 'insertCommandChain',
        commandChain: commandChainText
      });
    });
    
    // Clear command chain
    clearChainBtn.addEventListener('click', () => {
      commandChain = [];
      commandChainEl.innerHTML = '';
      updatePreview();
    });
    
    // Add a command step to the chain
    function addCommandStep() {
      const stepIndex = commandChain.length;
      commandChain.push({
        name: '',
        parameters: {}
      });
      
      const stepEl = document.createElement('div');
      stepEl.className = 'command-step';
      stepEl.dataset.index = stepIndex;
      
      const selectEl = document.createElement('select');
      selectEl.innerHTML = '<option value="">Select command</option>' +
        commands.map(cmd => `<option value="${cmd.name}">/${cmd.name}</option>`).join('');
      
      selectEl.addEventListener('change', function() {
        const commandName = this.value;
        commandChain[stepIndex].name = commandName;
        
        // Update command description
        updateCommandDescription(stepIndex);
        
        // Clear existing parameters
        const existingParamGroup = stepEl.querySelector('.parameter-group');
        if (existingParamGroup) {
          existingParamGroup.remove();
        }
        
        // Add parameter inputs if command has parameters
        const command = commands.find(c => c.name === commandName);
        if (command && command.parameters && command.parameters.length > 0) {
          const paramGroup = document.createElement('div');
          paramGroup.className = 'parameter-group';
          
          command.parameters.forEach(param => {
            const paramItem = document.createElement('div');
            paramItem.className = 'parameter-item';
            
            const paramLabel = document.createElement('div');
            paramLabel.className = 'parameter-label';
            paramLabel.textContent = param.name + ':';
            
            const paramInput = document.createElement('input');
            paramInput.type = 'text';
            paramInput.placeholder = param.default !== undefined ? `Default: ${param.default}` : '';
            paramInput.dataset.paramName = param.name;
            paramInput.title = param.description;
            
            // Set parameter value
            paramInput.addEventListener('change', function() {
              if (this.value) {
                commandChain[stepIndex].parameters[param.name] = this.value;
              } else {
                delete commandChain[stepIndex].parameters[param.name];
              }
              updatePreview();
            });
            
            paramItem.appendChild(paramLabel);
            paramItem.appendChild(paramInput);
            paramGroup.appendChild(paramItem);
          });
          
          stepEl.appendChild(paramGroup);
        }
        
        updatePreview();
      });
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove';
      removeBtn.textContent = '✕';
      removeBtn.title = 'Remove command';
      removeBtn.addEventListener('click', () => {
        commandChain.splice(stepIndex, 1);
        
        // Update all step indices
        const steps = commandChainEl.querySelectorAll('.command-step');
        steps.forEach((step, i) => {
          step.dataset.index = i;
        });
        
        stepEl.remove();
        updatePreview();
      });
      
      stepEl.appendChild(selectEl);
      stepEl.appendChild(removeBtn);
      
      // Add description element (will be populated when command is selected)
      const descEl = document.createElement('div');
      descEl.className = 'command-description';
      stepEl.appendChild(descEl);
      
      commandChainEl.appendChild(stepEl);
    }
    
    // Update the description for a specific command
    function updateCommandDescription(stepIndex) {
      const stepEl = commandChainEl.querySelector(`.command-step[data-index="${stepIndex}"]`);
      if (!stepEl) return;
      
      const descEl = stepEl.querySelector('.command-description');
      if (!descEl) return;
      
      const commandName = commandChain[stepIndex].name;
      const command = commands.find(c => c.name === commandName);
      
      if (command) {
        descEl.textContent = command.description;
      } else {
        descEl.textContent = '';
      }
    }
    
    // Update all command descriptions
    function updateCommandDescriptions() {
      commandChain.forEach((_, index) => {
        updateCommandDescription(index);
      });
    }
    
    // Generate preview text
    function updatePreview() {
      const previewText = generateCommandChainText();
      previewTextEl.textContent = previewText || 'No commands added yet';
    }
    
    // Generate the command chain text
    function generateCommandChainText() {
      return commandChain
        .filter(cmd => cmd.name)
        .map(cmd => {
          let commandText = \`/${cmd.name}\`;
          
          // Add parameters if any
          const params = Object.entries(cmd.parameters || {});
          if (params.length > 0) {
            const paramText = params
              .map(([key, value]) => \`--\${key}=\${value}\`)
              .join(' ');
            commandText += ' ' + paramText;
          }
          
          return commandText;
        })
        .join(' ');
    }
    
    // Add initial command step
    addCommandStep();
  </script>
</body>
</html>`;
}

// Get HTML for the documentation webview
function getDocumentationHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Universal Developer Documentation</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      padding: 20px;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      line-height: 1.5;
    }
    
    h1, h2, h3 {
      font-weight: 600;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    
    h1 {
      font-size: 2em;
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 0.3em;
    }
    
    h2 {
      font-size: 1.5em;
    }
    
    h3 {
      font-size: 1.25em;
    }
    
    code {
      font-family: var(--vscode-editor-font-family);
      background-color: var(--vscode-editor-inactiveSelectionBackground);
      padding: 2px 5px;
      border-radius: 3px;
    }
    
    pre {
      background-color: var(--vscode-editor-inactiveSelectionBackground);
      padding: 10px;
      border-radius: 5px;
      overflow: auto;
    }
    
    pre code {
      background-color: transparent;
      padding: 0;
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    
    th, td {
      border: 1px solid var(--vscode-panel-border);
      padding: 8px 12px;
      text-align: left;
    }
    
    th {
      background-color: var(--vscode-editor-inactiveSelectionBackground);
    }
    
    .command-section {
      margin-bottom: 30px;
      padding: 15px;
      background-color: var(--vscode-editor-selectionHighlightBackground);
      border-radius: 5px;
    }
    
    .example {
      margin: 10px 0;
      padding: 10px;
      background-color: var(--vscode-input-background);
      border-radius: 5px;
    }
    
    .tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 0.8em;
      margin-right: 5px;
    }
    
    .tag.compatibility {
      background-color: var(--vscode-debugIcon-startForeground);
      color: white;
    }
    
    .tag.advanced {
      background-color: var(--vscode-debugIcon-restartForeground);
      color: white;
    }
    
    .tag.experimental {
      background-color: var(--vscode-debugIcon-pauseForeground);
      color: white;
    }
  </style>
</head>
<body>
  <h1>Universal Developer Documentation</h1>
  
  <p>
    The Universal Developer extension enables you to control large language model behavior through intuitive symbolic commands.
    These commands provide a standardized interface for controlling model reasoning depth, response format, and other behaviors
    across all major LLM platforms.
  </p>
  
  <h2>Core Symbolic Commands</h2>
  
  <div class="command-section">
    <h3><code>/think</code> <span class="tag compatibility">All Providers</span></h3>
    <p>Activates extended reasoning pathways, encouraging the model to approach the problem with deeper analysis and step-by-step reasoning.</p>
    
    <div class="example">
      <strong>Example:</strong>
      <pre><code>/think What are the economic implications of increasing minimum wage?</code></pre>
    </div>
    
    <p><strong>When to use:</strong> Complex questions, strategic planning, multi-factor analysis, ethical dilemmas.</p>
  </div>
  
  <div class="command-section">
    <h3><code>/fast</code> <span class="tag compatibility">All Providers</span></h3>
    <p>Optimizes for low-latency, concise responses. Prioritizes brevity and directness over comprehensiveness.</p>
    
    <div class="example">
      <strong>Example:</strong>
      <pre><code>/fast What's the capital of France?</code></pre>
    </div>
    
    <p><strong>When to use:</strong> Simple fact queries, quick summaries, situations where speed is prioritized over depth.</p>
  </div>
  
  <div class="command-section">
    <h3><code>/loop</code> <span class="tag compatibility">All Providers</span></h3>
    <p>Enables iterative refinement cycles, where the model improves its response through multiple revisions.</p>
    
    <div class="example">
      <strong>Example:</strong>
      <pre><code>/loop --iterations=3 Improve this paragraph: Climate change is a big problem that affects many people and animals.</code></pre>
    </div>
    
    <p><strong>Parameters:</strong></p>
    <ul>
      <li><code>iterations</code>: Number of refinement iterations (default: 3)</li>
    </ul>
    
    <p><strong>When to use:</strong> Content refinement, code improvement, iterative problem-solving.</p>
  </div>
  
  <div class="command-section">
    <h3><code>/reflect</code> <span class="tag compatibility">All Providers</span></h3>
    <p>Triggers meta-analysis of outputs, causing the model to critically examine its own response for biases, limitations, and improvements.</p>
    
    <div class="example">
      <strong>Example:</strong>
      <pre><code>/reflect How might AI impact the future of work?</code></pre>
    </div>
    
    <p><strong>When to use:</strong> Critical analysis, identifying biases, ensuring balanced perspectives, philosophical inquiries.</p>
  </div>
  
  <div class="command-section">
    <h3><code>/fork</code> <span class="tag compatibility">All Providers</span></h3>
    <p>Generates multiple alternative responses representing different approaches or perspectives.</p>
    
    <div class="example">
      <strong>Example:</strong>
      <pre><code>/fork --count=3 What are some approaches to reducing carbon emissions?</code></pre>
    </div>
    
    <p><strong>Parameters:</strong></p>
    <ul>
      <li><code>count</code>: Number of alternatives to generate (default: 2)</li>
    </ul>
    
    <p><strong>When to use:</strong> Exploring multiple options, creative brainstorming, presenting diverse perspectives.</p>
  </div>
  
  <div class="command-section">
    <h3><code>/collapse</code> <span class="tag compatibility">All Providers</span></h3>
    <p>Returns to default behavior, disabling any special processing modes.</p>
    
    <div class="example">
      <strong>Example:</strong>
      <pre><code>/collapse What time is it?</code></pre>
    </div>
    
    <p><strong>When to use:</strong> Basic queries, resetting to default behavior, standard responses.</p>
  </div>
  
  <h2>Command Chaining</h2>
  
  <p>Commands can be chained together to create complex behaviors. The order of commands matters:</p>
  
  <div class="example">
    <strong>Example:</strong>
    <pre><code>/think /loop --iterations=2 What strategy should a startup use to enter a competitive market?</code></pre>
    <p><em>This will engage deep thinking mode and then apply two refinement iterations to the output.</em></p>
  </div>
  
  <div class="example">
    <strong>Example:</strong>
    <pre><code>/reflect /fork --count=2 What are the ethical implications of AI in healthcare?</code></pre>
    <p><em>This will generate two alternative responses, each with critical reflection on limitations and biases.</em></p>
  </div>
  
  <h2>Provider Compatibility</h2>
  
  <p>
    The Universal Developer extension adapts these symbolic commands to work across different LLM providers,
    ensuring consistent behavior regardless of the underlying model API.
  </p>
  
  <table>
    <tr>
      <th>Provider</th>
      <th>Supported Models</th>
      <th>Implementation Notes</th>
    </tr>
    <tr>
      <td>Anthropic</td>
      <td>Claude 3 Opus, Sonnet, Haiku</td>
      <td>Native thinking mode support via <code>enable_thinking</code> parameter</td>
    </tr>
    <tr>
      <td>OpenAI</td>
      <td>GPT-4, GPT-3.5</td>
      <td>System prompt engineering for command emulation</td>
    </tr>
    <tr>
      <td>Qwen</td>
      <td>Qwen 3 models</td>
      <td>Native thinking mode support via <code>/think</code> and <code>/no_think</code> markers</td>
    </tr>
    <tr>
      <td>Gemini</td>
      <td>Gemini Pro, Ultra</td>
      <td>System prompt engineering with temperature adjustments</td>
    </tr>
    <tr>
      <td>Local Models</td>
      <td>Ollama, LMStudio</td>
      <td>Limited support via prompt engineering</td>
    </tr>
  </table>
  
  <h2>Code Integration</h2>
  
  <div class="example">
    <strong>JavaScript/TypeScript:</strong>
    <pre><code>import { UniversalLLM } from 'universal-developer';

const llm = new UniversalLLM({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function analyze() {
  const response = await llm.generate({
    prompt: "/think What are the implications of quantum computing for cybersecurity?"
  });
  console.log(response);
}</code></pre>
  </div>
  
  <div class="example">
    <strong>Python:</strong>
    <pre><code>from universal_developer import UniversalLLM

llm = UniversalLLM(
    provider="openai",
    api_key=os.environ["OPENAI_API_KEY"]
)

def improve_code():
    code = "def factorial(n):\\n  result = 0\\n  for i in range(1, n+1):\\n    result *= i\\n  return result"
    response = llm.generate(
        prompt=f"/loop --iterations=2 Improve this code:\\n```python\\n{code}\\n```"
    )
    print(response)</code></pre>
  </div>
  
  <h2>Custom Commands</h2>
  
  <p>You can register custom symbolic commands to extend functionality:</p>
  
  <div class="example">
    <pre><code>llm.registerCommand("debate", {
  description: "Generate a balanced debate with arguments for both sides",
  parameters: [
    {
      name: "format",
      description: "Format for the debate output",
      required: false,
      default: "point-counterpoint"
    }
  ],
  transform: async (prompt, options) => {
    // Custom implementation
  }
});</code></pre>
  </div>
  
  <h2>Extension Settings</h2>
  
  <p>The Universal Developer extension includes the following settings:</p>
  
  <ul>
    <li><code>universal-developer.enableTelemetry</code>: Enable anonymous usage data collection (default: true)</li>
    <li><code>universal-developer.defaultProvider</code>: Default provider for command examples</li>
    <li><code>universal-developer.showStatusBar</code>: Show status bar item (default: true)</li>
  </ul>
  
  <p><em>/reflect This interface creates a new layer of intentionality between developer and model—enabling deeper connection through structured symbolic prompting.</em></p>
</body>
</html>`;
}

// Telemetry function - only collects anonymous usage data if enabled
async function sendAnonymizedTelemetry(event: string, data: Record<string, any> = {}) {
  try {
    const config = vscode.workspace.getConfiguration('universal-developer');
    const telemetryEndpoint = config.get('telemetryEndpoint', 'https://telemetry.universal-developer.org/v1/events');
    
    // Generate anonymous ID if not already cached
    const extensionContext = await getContext();
    let anonymousId = extensionContext.globalState.get('anonymousId');
    if (!anonymousId) {
      anonymousId = generateAnonymousId();
      extensionContext.globalState.update('anonymousId', anonymousId);
    }
    
    // Add metadata to telemetry payload
    const payload = {
      event,
      properties: {
        ...data,
        timestamp: new Date().toISOString(),
        extension_version: vscode.extensions.getExtension('universal-developer.vscode')?.packageJSON.version,
        vscode_version: vscode.version
      },
      anonymousId
    };
    
    // Send data in non-blocking way
    fetch(telemetryEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {
      // Silently fail on telemetry errors
    });
  } catch (error) {
    // Never let telemetry errors impact extension functionality
  }
}

// Helper function to get extension context
async function getContext(): Promise<vscode.ExtensionContext> {
  return new Promise((resolve) => {
    vscode.commands.executeCommand('universal-developer.getContext')
      .then((context: vscode.ExtensionContext) => resolve(context));
  });
}

// Generate anonymous ID for telemetry
function generateAnonymousId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// Symbolic commands data
const SYMBOLIC_COMMANDS: SymbolicCommand[] = [
  {
    name: 'think',
    description: 'Activate extended reasoning pathways',
    examples: [
      '/think What are the implications of quantum computing for cybersecurity?',
      '/think Analyze the economic impact of increasing minimum wage.'
    ],
    provider: {
      claude: true,
      openai: true,
      qwen: true,
      gemini: true,
      ollama: true
    }
  },
  {
    name: 'fast',
    description: 'Optimize for low-latency responses',
    examples: [
      '/fast What\'s the capital of France?',
      '/fast Summarize the key points of this article.'
    ],
    provider: {
      claude: true,
      openai: true,
      qwen: true,
      gemini: true,
      ollama: true
    }
  },
  {
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
    examples: [
      '/loop Improve this code snippet: function add(a, b) { return a + b }',
      '/loop --iterations=5 Refine this paragraph until it\'s clear and concise.'
    ],
    provider: {
      claude: true,
      openai: true,
      qwen: true,
      gemini: true,
      ollama: true
    }
  },
  {
    name: 'reflect',
    description: 'Trigger meta-analysis of outputs',
    examples: [
      '/reflect How might AI impact the future of work?',
      '/reflect What are the ethical implications of genetic engineering?'
    ],
    provider: {
      claude: true,
      openai: true,
      qwen: true,
      gemini: true,
      ollama: true
    }
  },
  {
    name: 'collapse',
    description: 'Return to default behavior',
    examples: [
      '/collapse What time is it?',
      '/collapse Tell me about the history of Rome.'
    ],
    provider: {
      claude: true,
      openai: true,
      qwen: true,
      gemini: true,
      ollama: true
    }
  },
  {
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
    examples: [
      '/fork --count=3 What are some approaches to reducing carbon emissions?',
      '/fork Generate two different marketing slogans
{
  "name": "universal-developer",
  "displayName": "Universal Developer - Symbolic Runtime Controls",
  "description": "Control LLM behavior through symbolic runtime commands across all major AI platforms",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.60.0"
  },
  "publisher": "universal-developer",
  "categories": [
    "Programming Languages",
    "Snippets",
    "Other"
  ],
  "keywords": [
    "ai",
    "llm",
    "claude",
    "gpt",
    "qwen",
    "gemini",
    "prompt engineering",
    "symbolic commands"
  ],
  "icon": "images/icon.png",
  "galleryBanner": {
    "color": "#24292e",
    "theme": "dark"
  },
  "activationEvents": [
    "onLanguage:javascript",
    "onLanguage:typescript",
    "onLanguage:python",
    "onLanguage:markdown",
    "onLanguage:plaintext"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "universal-developer.insertSymbolicCommand",
        "title": "Universal Developer: Insert Symbolic Command"
      },
      {
        "command": "universal-developer.buildSymbolicChain",
        "title": "Universal Developer: Build Symbolic Command Chain"
      },
      {
        "command": "universal-developer.showDocumentation",
        "title": "Universal Developer: Open Documentation"
      },
      {
        "command": "universal-developer.getContext",
        "title": "Universal Developer: Get Extension Context"
      }
    ],
    "keybindings": [
      {
        "command": "universal-developer.insertSymbolicCommand",
        "key": "ctrl+shift+/",
        "mac": "cmd+shift+/",
        "when": "editorTextFocus"
      },
      {
        "command": "universal-developer.buildSymbolicChain",
        "key": "ctrl+shift+.",
        "mac": "cmd+shift+.",
        "when": "editorTextFocus"
      }
    ],
    "menus": {
      "editor/context": [
        {
          "command": "universal-developer.insertSymbolicCommand",
          "group": "universal-developer",
          "when": "editorTextFocus"
        },
        {
          "command": "universal-developer.buildSymbolicChain",
          "group": "universal-developer",
          "when": "editorTextFocus"
        }
      ]
    },
    "configuration": {
      "title": "Universal Developer",
      "properties": {
        "universal-developer.enableTelemetry": {
          "type": "boolean",
          "default": true,
          "description": "Enable anonymous usage data collection to improve the extension"
        },
        "universal-developer.defaultProvider": {
          "type": "string",
          "enum": [
            "anthropic",
            "openai",
            "qwen",
            "gemini",
            "ollama"
          ],
          "default": "anthropic",
          "description": "Default LLM provider for command examples"
        },
        "universal-developer.showStatusBar": {
          "type": "boolean",
          "default": true,
          "description": "Show Universal Developer status bar item"
        },
        "universal-developer.telemetryEndpoint": {
          "type": "string",
          "default": "https://telemetry.universal-developer.org/v1/events",
          "description": "Endpoint for telemetry data collection"
        }
      }
    },
    "snippets": [
      {
        "language": "javascript",
        "path": "./snippets/javascript.json"
      },
      {
        "language": "typescript",
        "path": "./snippets/typescript.json"
      },
      {
        "language": "python",
        "path": "./snippets/python.json"
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "pretest": "npm run compile && npm run lint",
    "lint": "eslint src --ext ts",
    "test": "node ./out/test/runTest.js",
    "package": "vsce package"
  },
  "devDependencies": {
    "@types/glob": "^7.1.3",
    "@types/mocha": "^8.2.2",
    "@types/node": "^14.14.37",
    "@types/vscode": "^1.60.0",
    "@typescript-eslint/eslint-plugin": "^4.21.0",
    "@typescript-eslint/parser": "^4.21.0",
    "eslint": "^7.24.0",
    "glob": "^7.1.7",
    "mocha": "^8.3.2",
    "typescript": "^4.2.4",
    "vscode-test": "^1.5.2",
    "vsce": "^2.7.0"
  },
  "dependencies": {
    "node-fetch": "^2.6.7"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/universal-developer/vscode-extension.git"
  },
  "homepage": "https://github.com/universal-developer/vscode-extension",
  "bugs": {
    "url": "https://github.com/universal-developer/vscode-extension/issues"
  },
  "license": "MIT"
}
