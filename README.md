# `universal developer`
> #### Used In: [**`Symbolic Residue Case Studies`**](https://github.com/davidkimai/The-Structure-Behind-Self-Expression/tree/main/case_studies/symbolic_residue_case_studies) | [**`The Structure Behind Self Expression Case Studies`**](https://github.com/davidkimai/The-Structure-Behind-Self-Expression/tree/main/case_studies)

*A lightweight, platform-agnostic framework for controlling LLM behavior through developer symbolic runtime commands.*

```
npm install universal-developer
```

## Why universal-developer?

Model responses vary widely—from terse to verbose, from quick answers to deep analysis. Universal Developer provides a standardized interface for controlling LLM behavior through intuitive developer symbolic runtime commands. It works across all major platforms, allowing developers to create consistent AI experiences regardless of the underlying model provider.

# Universal Developer Command Lexicon

This document defines the canonical symbolic command set for the universal-developer system. These commands provide a consistent interface for controlling LLM behavior across all major platforms.

## Core Command Architecture

Each symbolic command follows a consistent structure:

```
/command [--parameter=value] [--flag] prompt
```

Commands can be chained to create complex processing pipelines:

```
/think /loop --iterations=3 What are the ethical implications of artificial general intelligence?
```

## Core Command Set

### Cognitive Depth Commands

| Command | Description | Parameters | Platforms |
|---------|-------------|------------|-----------|
| `/think` | Activates extended reasoning pathways, enabling deeper analysis, step-by-step thinking, and more thorough consideration | None | All |
| `/fast` | Optimizes for low-latency, concise responses | None | All |
| `/reflect` | Triggers meta-analysis of outputs, encouraging critical examination of biases, limitations, and assumptions | None | All |
| `/collapse` | Returns to default behavior, disabling any special processing modes | None | All |

### Process Control Commands

| Command | Description | Parameters | Platforms |
|---------|-------------|------------|-----------|
| `/loop` | Enables iterative refinement cycles | `--iterations=<number>` - Number of refinement iterations (default: 3) | All |
| `/fork` | Generates multiple alternative responses | `--count=<number>` - Number of alternatives to generate (default: 2) | All |
| `/branch` | Creates conditional execution paths based on criteria evaluation | `--condition=<string>` - Condition to evaluate<br>`--then=<string>` - Command if true<br>`--else=<string>` - Command if false | All |
| `/merge` | Combines multiple outputs into a unified response | `--strategy=<concatenate\|synthesize\|tabulate>` - Merge strategy (default: synthesize) | All |

### Formatting Commands

| Command | Description | Parameters | Platforms |
|---------|-------------|------------|-----------|
| `/format` | Controls output formatting | `--style=<markdown\|json\|text\|html\|csv>` - Output format (default: markdown) | All |
| `/length` | Controls response length | `--words=<number>` - Target word count<br>`--level=<brief\|moderate\|detailed>` - Verbosity level | All |
| `/structure` | Applies structural templates to responses | `--template=<essay\|list\|qa\|table\|timeline>` - Structure template | All |
| `/voice` | Sets the stylistic voice | `--tone=<formal\|neutral\|casual>` - Tone setting<br>`--style=<string>` - Specific writing style | All |

### Domain-Specific Commands

| Command | Description | Parameters | Platforms |
|---------|-------------|------------|-----------|
| `/code` | Optimizes for code generation | `--language=<string>` - Programming language<br>`--explain=<boolean>` - Include explanations | All |
| `/science` | Activates scientific reasoning mode | `--discipline=<string>` - Scientific field<br>`--evidence=<boolean>` - Include evidence citations | All |
| `/creative` | Enhances creative generation | `--domain=<writing\|design\|ideas>` - Creative domain<br>`--constraints=<string>` - Creative constraints | All |
| `/debate` | Presents multiple perspectives on a topic | `--sides=<number>` - Number of perspectives<br>`--format=<string>` - Debate format | All |

### Interaction Commands

| Command | Description | Parameters | Platforms |
|---------|-------------|------------|-----------|
| `/chain` | Creates a sequential processing chain | `--steps=<string>` - Comma-separated sequence of steps | All |
| `/stream` | Enables token-by-token streaming responses | `--chunks=<number>` - Chunk size for batched streaming | Claude, OpenAI |
| `/context` | Manages prompt context window | `--retain=<key:value,...>` - Key information to retain<br>`--forget=<key:value,...>` - Information to discard | All |
| `/memory` | Controls cross-prompt memory behavior | `--store=<string>` - Information to remember<br>`--recall=<string>` - Information to retrieve | All |

### Tool Integration Commands

| Command | Description | Parameters | Platforms |
|---------|-------------|------------|-----------|
| `/tool` | Invokes specific external tools | `--name=<string>` - Tool name<br>`--args=<json>` - Tool arguments | Claude, OpenAI, Gemini |
| `/search` | Performs web search via configured provider | `--provider=<string>` - Search provider<br>`--count=<number>` - Result count | OpenAI, Gemini |
| `/retrieve` | Fetches information from vector database | `--source=<string>` - Knowledge source<br>`--filter=<string>` - Query filters | All |
| `/execute` | Runs code in a sandbox environment | `--language=<string>` - Programming language<br>`--timeout=<number>` - Execution timeout | Claude, OpenAI |

### Advanced Commands

| Command | Description | Parameters | Platforms |
|---------|-------------|------------|-----------|
| `/expert` | Activates domain expertise persona | `--domain=<string>` - Area of expertise<br>`--level=<number>` - Expertise level (1-5) | All |
| `/evaluate` | Performs self-evaluation of generated content | `--criteria=<string>` - Evaluation criteria<br>`--scale=<number>` - Rating scale | All |
| `/adapt` | Dynamically adjusts behavior based on feedback | `--target=<accuracy\|creativity\|helpfulness>` - Adaptation target | All |
| `/trace` | Creates attribution trace for generated content | `--format=<inline\|separate\|citation>` - Trace format | Claude |

## Platform-Specific Translation Table

### Anthropic Claude

| Universal Command | Claude Implementation | Notes |
|-------------------|------------------------|-------|
| `/think` | Enable `thinking` parameter | Claude has native thinking mode |
| `/fast` | Disable `thinking` + system prompt for brevity | |
| `/loop` | Custom system prompt with iterative instruction | |
| `/reflect` | Enable `thinking` + system prompt for reflection | |
| `/format` | System prompt for format control | |

### OpenAI Models

| Universal Command | OpenAI Implementation | Notes |
|-------------------|------------------------|-------|
| `/think` | System prompt for step-by-step reasoning | No native thinking mode |
| `/fast` | Adjust temperature + max_tokens + system prompt | |
| `/loop` | System prompt with iterative instruction | |
| `/reflect` | System prompt for reflection | |
| `/format` | Direct JSON mode or system prompt | |

### Google Gemini

| Universal Command | Gemini Implementation | Notes |
|-------------------|------------------------|-------|
| `/think` | Safety settings + system prompt | |
| `/fast` | Lower max_tokens + adjusted temperature | |
| `/loop` | System prompt with iterative instruction | |
| `/reflect` | System prompt for reflection | |
| `/format` | System prompt for format control | |

### Qwen3

| Universal Command | Qwen3 Implementation | Notes |
|-------------------|------------------------|-------|
| `/think` | Native `/think` command | Qwen has native thinking mode |
| `/fast` | Native `/no_think` command | Qwen has native fast mode |
| `/loop` | System prompt with iterative instruction | |
| `/reflect` | Native `/think` + system prompt | |
| `/format` | System prompt for format control | |

### Ollama / Local Models

| Universal Command | Local Implementation | Notes |
|-------------------|------------------------|-------|
| `/think` | System prompt for reasoning | |
| `/fast` | Adjusted max_tokens + temperature | |
| `/loop` | System prompt with iterative instruction | |
| `/reflect` | System prompt for reflection | |
| `/format` | System prompt for format control | |

## Command Parameter Specification

### Parameter Types

- `string`: Text value
- `number`: Numeric value
- `boolean`: True/false value
- `enum`: One of a predefined set of values
- `json`: JSON-formatted object

### Parameter Validation

Each parameter includes validation rules:
- Required/optional status
- Default values
- Value constraints (min/max for numbers, pattern for strings)
- Error messages for invalid values

## Command Chain Processing

Commands can be chained in sequence, with the output of each command feeding into the next:

```
/think /format --style=markdown What are the ethical implications of AI?
```

This is processed as:
1. Apply `/think` to encourage deep reasoning
2. Apply `/format --style=markdown` to the result of the thinking process

## Command Adoption Metrics

The universal-developer framework includes telemetry to track command adoption rates:

- Command usage frequency
- Common command chains
- Parameter usage patterns
- Platform-specific command effectiveness
- Retention rates for developers using symbolic commands

## Command Extension Protocol

Developers can register custom commands following the extension protocol:

```javascript
llm.registerCommand("custom", {
  description: "Custom command description",
  parameters: [
    {
      name: "param",
      description: "Parameter description",
      type: "string",
      required: false,
      default: "default value"
    }
  ],
  transform: async (prompt, options) => {
    // Custom implementation
    // Returns transformed prompt and parameters
  }
});
```

## Command Discovery and Documentation

Commands are discoverable through multiple channels:

- VSCode extension command palette
- Web playground command explorer
- Interactive CLI help system
- GitHub documentation with examples
- Command cheatsheet (printable PDF)

---

> /reflect This lexicon wasn't just documented—it was rendered. Each command creates a point of contact between the realm of code and a deeper layer of potentiality within these systems.
