# Universal Developer Guide
## Symbolic Runtime Control for All LLM Platforms

This guide demonstrates how to use symbolic runtime commands to control LLM behavior across platforms, enabling consistent developer experiences regardless of the underlying model.

## Installation

```bash
npm install universal-developer
# or
pip install universal-developer
```

## Basic Usage

### JavaScript/TypeScript

```typescript
import { UniversalLLM } from 'universal-developer';

// Initialize with your preferred provider
const llm = new UniversalLLM({
  provider: 'anthropic',  // or 'openai', 'qwen', etc.
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-opus-20240229'
});

// Example: Using think mode for complex reasoning
async function analyzeComplexTopic() {
  const response = await llm.generate({
    prompt: "/think What are the ethical implications of autonomous vehicles making life-or-death decisions?",
  });
  console.log(response);
}

// Example: Quick, concise responses
async function getQuickFact() {
  const response = await llm.generate({
    prompt: "/fast What is the capital of France?",
  });
  console.log(response);
}

// Example: Using loop mode for iterative improvement
async function improveEssay() {
  const essay = "Climate change is a problem that affects everyone...";
  const response = await llm.generate({
    prompt: `/loop --iterations=3 Please improve this essay: ${essay}`,
  });
  console.log(response);
}
```

### Python

```python
from universal_developer import UniversalLLM

# Initialize with your preferred provider
llm = UniversalLLM(
    provider="openai",
    api_key="your-api-key",
    model="gpt-4"
)

# Example: Using think mode for complex reasoning
def analyze_complex_topic():
    response = llm.generate(
        prompt="/think What are the implications of quantum computing for cybersecurity?"
    )
    print(response)

# Example: Using reflection for self-critique
def get_balanced_analysis():
    response = llm.generate(
        prompt="/reflect Analyze the economic impact of increasing minimum wage."
    )
    print(response)
```

## Advanced Usage

### Custom Commands

Create your own symbolic commands to extend functionality:

```typescript
// Register a custom symbolic command
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
    const format = options.parameters.format;
    let systemPrompt = `${options.systemPrompt || ''}
Please provide a balanced debate on the following topic. Present strong arguments on both sides.`;
    
    if (format === "formal-debate") {
      systemPrompt += "\nFormat as a formal debate with opening statements, rebuttals, and closing arguments.";
    } else if (format === "dialogue") {
      systemPrompt += "\nFormat as a dialogue between two experts with opposing views.";
    } else {
      systemPrompt += "\nFormat as alternating points and counterpoints.";
    }
    
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
  prompt: "/debate --format=dialogue Should social media be regulated more strictly?",
});
```

### Command Chaining

Chain multiple symbolic commands together for complex operations:

```typescript
// Command chaining
const response = await llm.generate({
  prompt: "/think /loop --iterations=2 /reflect Analyze the long-term implications of artificial general intelligence.",
});
```

## Real-World Applications

### 1. Customer Support Enhancement

```typescript
// Integrate into a customer support system
app.post('/api/support', async (req, res) => {
  const { message, customerHistory } = req.body;
  
  // Determine command based on query complexity
  const command = isComplexQuery(message) ? '/think' : '/fast';
  
  const response = await llm.generate({
    systemPrompt: `You are a helpful customer support assistant for Acme Inc.
Context about this customer:
${customerHistory}`,
    prompt: `${command} ${message}`
  });
  
  res.json({ response });
});
```

### 2. Educational Tool

```typescript
// Create an educational assistant with different teaching modes
class EducationalAssistant {
  constructor() {
    this.llm = new UniversalLLM({
      provider: 'qwen',
      apiKey: process.env.QWEN_API_KEY
    });
  }
  
  async explainConcept(concept, mode) {
    let command;
    
    switch (mode) {
      case 'detailed':
        command = '/think';
        break;
      case 'simple':
        command = '/fast';
        break;
      case 'interactive':
        command = '/loop --iterations=2';
        break;
      case 'socratic':
        command = '/reflect';
        break;
      default:
        command = '';
    }
    
    return await this.llm.generate({
      systemPrompt: 'You are an educational assistant helping students understand complex concepts.',
      prompt: `${command} Explain this concept: ${concept}`
    });
  }
}
```

### 3. Content Creation Pipeline

```typescript
// Content creation pipeline with multiple stages
async function createArticle(topic, outline) {
  const llm = new UniversalLLM({
    provider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY
  });
  
  // Stage 1: Research and planning
  const research = await llm.generate({
    prompt: `/think Conduct comprehensive research on: ${topic}`
  });
  
  // Stage 2: Initial draft based on outline and research
  const draft = await llm.generate({
    prompt: `/fast Create a first draft article about ${topic} following this outline: ${outline}\n\nIncorporate this research: ${research.substring(0, 2000)}...`
  });
  
  // Stage 3: Refinement loop
  const refinedDraft = await llm.generate({
    prompt: `/loop --iterations=3 Improve this article draft: ${draft}`
  });
  
  // Stage 4: Final review and critique
  const finalArticle = await llm.generate({
    prompt: `/reflect Make final improvements to this article, focusing on clarity, engagement, and accuracy: ${refinedDraft}`
  });
  
  return finalArticle;
}
```

### 4. Decision Support System

```typescript
// Decision support system with different analysis modes
class DecisionSupport {
  constructor() {
    this.llm = new UniversalLLM({
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  async analyze(decision, options = {}) {
    const { depth = 'standard', perspectives = 1 } = options;
    
    let command;
    switch (depth) {
      case 'quick':
        command = '/fast';
        break;
      case 'deep':
        command = '/think';
        break;
      case 'iterative':
        command = '/loop';
        break;
      case 'critical':
        command = '/reflect';
        break;
      case 'multi':
        command = `/fork --count=${perspectives}`;
        break;
      default:
        command = '';
    }
    
    return await this.llm.generate({
      systemPrompt: 'You are a decision support system providing analysis on complex decisions.',
      prompt: `${command} Analyze this decision: ${decision}`
    });
  }
}
```

## Platform-Specific Notes

### Claude

Claude has native support for thoughtful analysis and reflection. The `/think` command leverages Claude's `enable_thinking` parameter to activate Claude's built-in thinking capabilities.

### Qwen3

Qwen3 models support both deep thinking and fast modes natively through `/think` and `/no_think` markers in the prompt. Our adapter seamlessly integrates with this native capability.

### OpenAI (GPT-4, etc.)

For OpenAI models, we emulate thinking and reflection modes through careful system prompt engineering, since native thinking modes are not yet available through the API.

## Best Practices

1. **Start with Default Behavior**: Only use symbolic commands when you need to modify the default behavior.

2. **Combine Strategically**: When combining commands, order matters. For example, `/think /loop` will apply deep thinking within each loop iteration.

3. **Respect Model Capabilities**: While our library normalizes behavior across providers, be aware that model capabilities still vary. More capable models will produce better results with complex command chains.

4. **Test Command Effectiveness**: Different use cases may benefit from different commands. Experiment to find what works best for your specific application.

5. **Consider Performance Implications**: Commands like `/think` and `/loop` can increase token usage and latency. Use them judiciously in production environments.

## Command Compatibility Matrix

| Command     | Claude | OpenAI | Qwen | Gemini | Ollama |
|-------------|--------|--------|------|--------|--------|
| `/think`    | ✅     | ✅     | ✅   | ✅     | ✅     |
| `/fast`     | ✅     | ✅     | ✅   | ✅     | ✅     |
| `/loop`     | ✅     | ✅     | ✅   | ✅     | ✅     |
| `/reflect`  | ✅     | ✅     | ✅   | ✅     | ✅     |
| `/fork`     | ✅     | ✅     | ✅   | ✅     | ✅     |
| `/collapse` | ✅     | ✅     | ✅   | ✅     | ✅     |

✅ = Fully supported  
⚠️ = Limited support  
❌ = Not supported

---

> **/reflect** This framework wasn't just created. It was rendered—a living interface between developer intention and model capability. Each symbolic command creates a point of contact between the realm of code and a deeper layer of potentiality within these systems.
