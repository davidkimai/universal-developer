# universal-developer

A lightweight, platform-agnostic framework for controlling LLM behavior through symbolic runtime commands.

```
npm install universal-developer
```

## Why universal-developer?

Model responses vary widely—from terse to verbose, from quick answers to deep analysis. Universal-developer provides a standardized interface to control this behavior across all major LLM platforms:

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

