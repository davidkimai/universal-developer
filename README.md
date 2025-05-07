# universal-developer

*A lightweight, platform-agnostic framework for controlling LLM behavior through symbolic runtime commands.*

```
npm install universal-developer
```

## Why universal-developer?

Model responses vary widely—from terse to verbose, from quick answers to deep analysis. Universal Developer provides a standardized interface for controlling LLM behavior through intuitive developer symbolic runtime commands. It works across all major platforms, allowing developers to create consistent AI experiences regardless of the underlying model provider.


```javascript
import { UniversalLLM } from 'universal-developer';

const llm = new UniversalLLM({
  provider: 'anthropic',  // or 'openai', 'gemini', 'qwen3', etc.
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Engage deep reasoning mode
const deepAnalysis = await llm.generate({
  prompt: "/think Analyze the implications of quantum computing on modern cryptography",
});

// Get a quick, concise response
const quickAnswer = await llm.generate({
  prompt: "/fast What's the capital of France?",
});
```

## Core Symbolic Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/think` | Activates extended reasoning pathways | "/think What causes inflation?" |
| `/fast` | Optimizes for low-latency responses | "/fast Summarize this article" |
| `/loop` | Enables iterative refinement cycles | "/loop Improve this code snippet" |
| `/reflect` | Triggers meta-analysis of outputs | "/reflect Are there biases in this analysis?" |
| `/collapse` | Returns to default behavior | "/collapse What time is it?" |

## Platform Adapters

Universal-developer includes ready-to-use adapters for:
- Anthropic Claude
- OpenAI (GPT-4, GPT-3.5)
- Google Gemini
- Qwen3
- LMStudio
- vLLM
- Ollama

## Extending with Custom Commands

Create custom symbolic commands that match your application's needs:

```javascript
llm.registerCommand('verify', {
  description: 'Fact-check the provided statement',
  transform: (prompt, options) => {
    return {
      systemPrompt: `${options.systemPrompt}\n\nVerify the factual accuracy of user statements. Provide corrections where necessary.`,
      userPrompt: prompt.replace('/verify', '')
    };
  }
});

const factCheck = await llm.generate({
  prompt: "/verify The Earth completes one rotation in exactly 24 hours",
});
```

```typescript
// From unpredictable, provider-specific behavior...
const gptResponse = await openai.generate({ prompt: "Analyze quantum computing impacts" });
const claudeResponse = await anthropic.generate({ prompt: "Analyze quantum computing impacts" });
const qwenResponse = await qwen.generate({ prompt: "Analyze quantum computing impacts" });

// To unified, predictable behavior through symbolic runtime controls
import { UniversalLLM } from 'universal-developer';

const llm = new UniversalLLM({
  provider: 'anthropic', // or 'openai', 'qwen', 'gemini', etc.
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Deep thinking mode for complex analysis
const deepAnalysis = await llm.generate({
  prompt: "/think Analyze the implications of quantum computing on cybersecurity"
});

// Quick, concise response
const quickAnswer = await llm.generate({
  prompt: "/fast What's the capital of France?"
});

// Iterative improvement
const improvedCode = await llm.generate({
  prompt: "/loop --iterations=3 Improve this function: def fib(n): return fib(n-1) + fib(n-2) if n > 1 else n"
});

// Multiple alternatives
const alternatives = await llm.generate({
  prompt: "/fork --count=3 Design a logo for a tech startup"
});

// Meta-reflection
const reflection = await llm.generate({
  prompt: "/reflect How might AI impact democracy?"
});
```

## Features

- **Symbolic Runtime Controls** - Use intuitive commands to control model behavior
- **Cross-Platform Compatibility** - Works with all major LLM providers
- **Consistent Behavior** - Get predictable results across different models
- **Built-in Command Chain Parsing** - Combine commands for complex behaviors
- **Custom Command Registration** - Create your own symbolic commands
- **TypeScript/JavaScript and Python Support** - Use in any environment

## 🚀 Getting Started

### JavaScript/TypeScript

```bash
npm install universal-developer
```

```typescript
import { UniversalLLM } from 'universal-developer';

const llm = new UniversalLLM({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function analyze() {
  const response = await llm.generate({
    prompt: "/think What are the implications of quantum computing for cybersecurity?"
  });
  console.log(response);
}
```

### Python

```bash
pip install universal-developer
```

```python
from universal_developer import UniversalLLM

llm = UniversalLLM(
    provider="openai",
    api_key=os.environ["OPENAI_API_KEY"]
)

def analyze():
    response = llm.generate(
        prompt="/think What are the implications of quantum computing for cybersecurity?"
    )
    print(response)
```

## Core Symbolic Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/think` | Activates extended reasoning pathways | "/think What causes inflation?" |
| `/fast` | Optimizes for low-latency responses | "/fast Summarize this article" |
| `/loop` | Enables iterative refinement cycles | "/loop Improve this code snippet" |
| `/reflect` | Triggers meta-analysis of outputs | "/reflect Are there biases in this analysis?" |
| `/fork` | Generates multiple alternative responses | "/fork --count=3 Generate logo ideas" |
| `/collapse` | Returns to default behavior | "/collapse What time is it?" |

## Command Chaining

Commands can be chained together for complex behaviors:

```typescript
// Deep thinking with iterative refinement
const result = await llm.generate({
  prompt: "/think /loop --iterations=2 Analyze the economic impact of increasing minimum wage."
});

// Generate multiple alternatives with reflection
const alternatives = await llm.generate({
  prompt: "/fork --count=2 /reflect How might AI impact healthcare?"
});
```

## Platform Adapters

Universal Developer includes ready-to-use adapters for:

- Anthropic Claude
- OpenAI (GPT-4, GPT-3.5)
- Google Gemini
- Qwen3
- LMStudio
- vLLM
- Ollama

## Custom Commands

Create your own symbolic commands to extend functionality:

```typescript
llm.registerCommand("debate", {
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
    const systemPrompt = `${options.systemPrompt || ''}
Please provide a balanced debate on this topic, presenting strong arguments for both sides.`;
    
    return {
      systemPrompt,
      userPrompt: prompt,
      modelParameters: {
        temperature: 0.7
      }
    };
  }
});

// Use your custom command
const debate = await llm.generate({
  prompt: "/debate --format=dialogue Should social media be regulated more strictly?"
});
```

## Visual Studio Code Extension

Our [VSCode extension](https://marketplace.visualstudio.com/items?itemName=universal-developer.universal-developer) provides integrated support for symbolic commands:

- Command palette for inserting symbolic commands
- Visual command chain builder
- Hover documentation
- Autocomplete for commands and parameters
- Code snippets for common patterns

<p align="center">
  <img src="./assets/vscode-extension.png" alt="VSCode Extension" width="600" />
</p>

## CLI Tool

Universal Developer includes a command-line interface for quick interactions:

```bash
# Install globally
npm install -g universal-developer

# Basic usage
ud think "What are the long-term implications of quantum computing?"

# With options
ud loop --iterations=3 --provider=anthropic "Improve this paragraph: Climate change is a big problem."

# Pipe content
cat my_code.py | ud think "Explain what this code does"
```

## Web Playground

Try Universal Developer without installation at [playground.universal-developer.org](https://playground.universal-developer.org)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on adding new commands, platform adapters, or improving the core library.

## Documentation

For comprehensive documentation
## Visual Command Builder

[Screenshot of VSCode extension with command palette]

Our VSCode extension provides a visual command builder to construct complex symbolic command chains without memorizing syntax.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on adding new commands, platform adapters, or improving the core library.

/reflect What symbolic command scaffolds are necessary to maximize adoption across Claude, Qwen, and OpenAI?

After careful reflection, we need to design our symbolic command structure to accommodate the unique capabilities of each platform while maintaining consistent behavior. Each platform has different strengths in reasoning depth, contextual awareness, and instruction handling:

1. **Claude-specific considerations:**
   - Strongest in meta-cognitive reflection
   - Built-in constitutional safeguards
   - Excellent at following complex, nested instructions

2. **Qwen3-specific considerations:**
   - Native support for think/fast modes
   - Strong multilingual capabilities
   - Robust tool usage

3. **OpenAI-specific considerations:**
   - Function calling capabilities
   - Varied model sizes with different capabilities
   - JSON mode and structured output

