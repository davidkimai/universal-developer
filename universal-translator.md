# Universal Developer Command Translation Matrix

This document provides a comprehensive translation table for mapping universal symbolic commands to platform-specific implementations. The matrix shows how each command is transformed for different LLM providers, ensuring consistent behavior across all platforms.

## Translation Architecture

Each symbolic command follows this translation flow:

```
User Input → Command Parser → Platform Adapter → Provider-Specific API → Response
```

The platform adapter handles the transformation of universal commands into provider-specific API calls, system prompts, and parameters.

## Core Command Translations

### `/think` Command

| Provider | Implementation Method | Parameters | System Prompt Transformation |
|----------|----------------------|------------|------------------------------|
| **Claude** | Native thinking mode | `enable_thinking: true`<br>`temperature: -0.2` | "Please think step-by-step through this problem, considering multiple perspectives and potential approaches. Take your time to develop a comprehensive understanding before providing your final answer." |
| **OpenAI** | System prompt engineering | `temperature: -0.2`<br>`top_p: 0.8` | "When responding to this query, please use the following approach:<br>1. Take a deep breath and think step-by-step<br>2. Break down complex aspects into simpler components<br>3. Consider multiple perspectives and approaches<br>4. Identify potential misconceptions or errors<br>5. Synthesize your analysis into a comprehensive response<br>6. Structure your thinking visibly" |
| **Gemini** | System prompt + parameters | `temperature: -0.2`<br>`top_k: 40` | "Think carefully and methodically about this question. Break it down into components, consider different angles, and work through the logical implications of each part before synthesizing a complete answer." |
| **Qwen3** | Native thinking mode | append `/think` to prompt | "Please provide a thorough, step-by-step analysis of this question, considering multiple perspectives and weighing the evidence carefully." |
| **Ollama** | System prompt | `temperature: -0.2` | "Think carefully and methodically. Break down the problem into steps, consider multiple perspectives, and be thorough in your analysis." |
| **vLLM** | System prompt | `temperature: -0.2` | "Please employ an analytical, step-by-step approach to this question. Examine different perspectives before reaching a conclusion." |
| **LMStudio** | System prompt | `temperature: -0.2`<br>`top_p: 0.8` | "Take your time to analyze this thoroughly. Break down complex aspects, consider multiple viewpoints, and show your reasoning process." |

### `/fast` Command

| Provider | Implementation Method | Parameters | System Prompt Transformation |
|----------|----------------------|------------|------------------------------|
| **Claude** | Disable thinking + system prompt | `enable_thinking: false`<br>`temperature: +0.1`<br>`max_tokens: 1024` | "Please provide a brief, direct response to this question. Focus on the most important information and keep your answer concise and to the point." |
| **OpenAI** | System prompt + parameters | `temperature: +0.1`<br>`max_tokens: 1024`<br>`presence_penalty: 1.0`<br>`frequency_penalty: 1.0` | "Please provide a concise, direct response. Focus only on the most essential information needed to answer the query. Keep explanations minimal and prioritize brevity over comprehensiveness." |
| **Gemini** | System prompt + parameters | `temperature: +0.1`<br>`max_tokens: 1024` | "Keep your response brief and to the point. Focus only on the most essential information, avoiding unnecessary details or elaboration." |
| **Qwen3** | Native fast mode | append `/no_think` to prompt | "Provide a brief, straightforward answer. Focus only on the key information without elaboration." |
| **Ollama** | System prompt + parameters | `temperature: +0.1`<br>`max_tokens: 1024` | "Be brief and direct. Provide only the essential information without elaboration." |
| **vLLM** | System prompt + parameters | `temperature: +0.1`<br>`max_tokens: 1024` | "Give a concise, direct answer focusing only on the key information requested." |
| **LMStudio** | System prompt + parameters | `temperature: +0.1`<br>`max_tokens: 1024` | "Be concise and direct. Provide only the essential information to answer the question." |

### `/loop` Command

| Provider | Implementation Method | Parameters | System Prompt Transformation |
|----------|----------------------|------------|------------------------------|
| **Claude** | System prompt with iteration instructions | Default iterations: 3<br>Custom: `iterations=n` | "Please approach this task using an iterative process. Follow these steps:<br>1. Develop an initial response to the prompt.<br>2. Critically review your response, identifying areas for improvement.<br>3. Create an improved version based on your critique.<br>4. Repeat steps 2-3 for a total of {iterations} iterations.<br>5. Present your final response, which should reflect the accumulated improvements.<br>Show all iterations in your response, clearly labeled." |
| **OpenAI** | System prompt with iteration instructions | Default iterations: 3<br>Custom: `iterations=n` | "Please approach this task using an iterative refinement process with {iterations} cycles:<br>1. Initial Version: Create your first response<br>2. Critical Review: Analyze the strengths and weaknesses<br>3. Improved Version: Create an enhanced version<br>4. Repeat steps 2-3 for each iteration<br>5. Final Version: Provide your most refined response<br>Clearly label each iteration." |
| **Gemini** | System prompt with iteration instructions | Default iterations: 3<br>Custom: `iterations=n` | "Use an iterative improvement process with {iterations} rounds of refinement. For each round: (1) Review your previous work, (2) Identify areas for improvement, (3) Create an enhanced version. Show all iterations, clearly labeled." |
| **Qwen3** | System prompt with iteration instructions | Default iterations: 3<br>Custom: `iterations=n` | "Please use an iterative approach with {iterations} refinement cycles:<br>1. Initial response<br>2. Critical review<br>3. Improvement<br>4. Repeat steps 2-3 for a total of {iterations} iterations<br>5. Present your final response with all iterations clearly labeled" |
| **Ollama** | System prompt with iteration instructions | Default iterations: 3<br>Custom: `iterations=n` | "Use an iterative approach with {iterations} cycles. For each cycle: review your work, identify improvements, then create a better version. Show all iterations." |
| **vLLM** | System prompt with iteration instructions | Default iterations: 3<br>Custom: `iterations=n` | "Follow an iterative improvement process with {iterations} cycles. For each cycle, review your previous work and create an improved version." |
| **LMStudio** | System prompt with iteration instructions | Default iterations: 3<br>Custom: `iterations=n` | "Use an iterative approach with {iterations} rounds of improvement. For each round, critique your work and create a better version. Show all iterations." |

### `/reflect` Command

| Provider | Implementation Method | Parameters | System Prompt Transformation |
|----------|----------------------|------------|------------------------------|
| **Claude** | Thinking mode + system prompt | `enable_thinking: true`<br>`temperature: -0.1` | "For this response, I'd like you to engage in two distinct phases:<br>1. First, respond to the user's query directly.<br>2. Then, reflect on your own response by considering:<br>   - What assumptions did you make in your answer?<br>   - What perspectives or viewpoints might be underrepresented?<br>   - What limitations exist in your approach or knowledge?<br>   - How might your response be improved or expanded?<br>Clearly separate these two phases in your response." |
| **OpenAI** | System prompt | `temperature: -0.1` | "For this query, please structure your response in two distinct parts:<br><br>PART 1: DIRECT RESPONSE<br>Provide your primary answer to the user's query.<br><br>PART 2: META-REFLECTION<br>Then, engage in critical reflection on your own response by addressing:<br>- What assumptions did you make in your answer?<br>- What alternative perspectives might be valid?<br>- What are the limitations of your response?<br>- How might your response be improved?<br>- What cognitive biases might have influenced your thinking?<br><br>Make sure both parts are clearly labeled and distinguishable." |
| **Gemini** | System prompt | `temperature: -0.1` | "Please provide your response in two parts: First, directly answer the question. Then, in a separate section labeled 'Meta-Reflection,' critically analyze your own response by examining assumptions, considering alternative viewpoints, acknowledging limitations, and suggesting potential improvements." |
| **Qwen3** | Native thinking + system prompt | append `/think` to prompt | "For this response, please:<br>1. Answer the query directly<br>2. Then reflect on your answer by analyzing:<br>   - Assumptions made<br>   - Alternative perspectives<br>   - Limitations in your approach<br>   - Potential improvements" |
| **Ollama** | System prompt | `temperature: -0.1` | "Provide a two-part response: 1) Answer the question directly, 2) Reflect critically on your own answer, examining assumptions, biases, limitations, and potential improvements." |
| **vLLM** | System prompt | `temperature: -0.1` | "Give your response in two sections: (1) Your direct answer, and (2) A reflection on your answer that examines assumptions, limitations, and alternative viewpoints." |
| **LMStudio** | System prompt | `temperature: -0.1` | "Please answer in two parts: First, directly address the question. Second, reflect on your own answer by examining your assumptions, biases, and the limitations of your response." |

### `/fork` Command

| Provider | Implementation Method | Parameters | System Prompt Transformation |
|----------|----------------------|------------|------------------------------|
| **Claude** | System prompt for alternatives | Default count: 2<br>Custom: `count=n`<br>`temperature: +0.2` | "Please provide {count} distinct alternative responses to this prompt. These alternatives should represent fundamentally different approaches or perspectives, not minor variations. Label each alternative clearly." |
| **OpenAI** | System prompt for alternatives | Default count: 2<br>Custom: `count=n`<br>`temperature: +0.2` | "Please provide {count} substantively different responses to this prompt. Each alternative should represent a different approach, perspective, or framework. Clearly label each alternative (e.g., \"Alternative 1\", \"Alternative 2\", etc.)." |
| **Gemini** | System prompt for alternatives | Default count: 2<br>Custom: `count=n`<br>`temperature: +0.2` | "Generate {count} distinctly different approaches or perspectives on this prompt. Each alternative should represent a substantially different way of thinking about the question. Label each alternative clearly." |
| **Qwen3** | System prompt for alternatives | Default count: 2<br>Custom: `count=n`<br>`temperature: +0.2` | "Please provide {count} distinct alternative responses to this prompt, representing different approaches or perspectives. Label each alternative clearly." |
| **Ollama** | System prompt for alternatives | Default count: 2<br>Custom: `count=n`<br>`temperature: +0.2` | "Generate {count} different approaches to this prompt. Make each approach genuinely distinct, not just minor variations. Label each approach clearly." |
| **vLLM** | System prompt for alternatives | Default count: 2<br>Custom: `count=n`<br>`temperature: +0.2` | "Provide {count} different perspectives or approaches to this prompt. Label each alternative clearly." |
| **LMStudio** | System prompt for alternatives | Default count: 2<br>Custom: `count=n`<br>`temperature: +0.2` | "Generate {count} distinctly different responses to this prompt. Each should take a different approach or perspective. Label each alternative clearly." |

### `/collapse` Command

| Provider | Implementation Method | Parameters | System Prompt Transformation |
|----------|----------------------|------------|------------------------------|
| **Claude** | Return to default behavior | Reset all parameters to defaults | Original system prompt or empty if none provided |
| **OpenAI** | Return to default behavior | Reset all parameters to defaults | Original system prompt or empty if none provided |
| **Gemini** | Return to default behavior | Reset all parameters to defaults | Original system prompt or empty if none provided |
| **Qwen3** | Return to default behavior | append `/no_think` to prompt | Original system prompt or empty if none provided |
| **Ollama** | Return to default behavior | Reset all parameters to defaults | Original system prompt or empty if none provided |
| **vLLM** | Return to default behavior | Reset all parameters to defaults | Original system prompt or empty if none provided |
| **LMStudio** | Return to default behavior | Reset all parameters to defaults | Original system prompt or empty if none provided |

## Advanced Command Translations

### `/format` Command

| Provider | Implementation Method | Parameters | Example Translation |
|----------|----------------------|------------|---------------------|
| **Claude** | System prompt | Default style: markdown<br>Options: json, html, csv, text | **JSON format**: "Please format your entire response as a valid JSON object. Do not include any explanatory text outside of the JSON structure." |
| **OpenAI** | Response format parameter + system prompt | Default style: markdown<br>Options: json, html, csv, text | **JSON format**: Set `response_format: { "type": "json_object" }` + system prompt guidance |
| **Gemini** | System prompt | Default style: markdown<br>Options: json, html, csv, text | **JSON format**: "Format your entire response as a valid JSON object without any text outside the JSON structure." |
| **Qwen3** | System prompt | Default style: markdown<br>Options: json, html, csv, text | **JSON format**: "Please provide your entire response as a valid JSON object. Do not include any text outside the JSON structure." |
| **Ollama** | System prompt | Default style: markdown<br>Options: json, html, csv, text | **JSON format**: "Format your entire response as valid JSON without any additional text." |
| **vLLM** | System prompt | Default style: markdown<br>Options: json, html, csv, text | **JSON format**: "Format your response exclusively as a JSON object with no additional explanation." |
| **LMStudio** | System prompt | Default style: markdown<br>Options: json, html, csv, text | **JSON format**: "Return your entire response as a valid JSON object. Do not include any text outside of the JSON." |

### `/expert` Command

| Provider | Implementation Method | Parameters | Example Translation |
|----------|----------------------|------------|---------------------|
| **Claude** | System prompt | `domain=string`<br>`level=1-5` | "Please respond as an expert in {domain} with a deep level of knowledge and experience (level {level}/5). Use appropriate terminology, frameworks, and approaches that would be expected of someone with significant expertise in this field." |
| **OpenAI** | System prompt | `domain=string`<br>`level=1-5` | "You are an expert in {domain} with a proficiency level of {level} out of 5. Respond using appropriate domain-specific terminology, recognized frameworks, and expert insights that demonstrate your deep understanding of the field." |
| **Gemini** | System prompt | `domain=string`<br>`level=1-5` | "Respond as a {level}/5 level expert in {domain}. Use domain-specific terminology, frameworks, and approaches that demonstrate expertise in this field." |
| **Qwen3** | System prompt | `domain=string`<br>`level=1-5` | "Please respond as an expert in {domain} (level {level}/5). Use appropriate terminology and expert approaches to address this question." |
| **Ollama** | System prompt | `domain=string`<br>`level=1-5` | "You are a level {level}/5 expert in {domain}. Respond using appropriate terminology and expert knowledge." |
| **vLLM** | System prompt | `domain=string`<br>`level=1-5` | "Respond as an expert in {domain} with level {level}/5 expertise. Use appropriate technical terminology and insights." |
| **LMStudio** | System prompt | `domain=string`<br>`level=1-5` | "You are an expert in {domain} (level {level}/5). Respond with depth and precision appropriate to your expertise level." |

## Command Implementation Details

### System Prompt Pre-Processing

For each command, the system prompt is constructed using this algorithm:

```javascript
function buildSystemPrompt(command, parameters, originalSystemPrompt) {
  const basePrompt = commands[command].getSystemPrompt(parameters);
  
  if (!originalSystemPrompt) {
    return basePrompt;
  }
  
  // For some commands like /collapse, we want to preserve only the original prompt
  if (command === 'collapse') {
    return originalSystemPrompt;
  }
  
  // For others, we combine both with the command-specific prompt taking precedence
  return `${originalSystemPrompt}\n\n${basePrompt}`;
}
```

### Parameter Transformation

Parameters are transformed to match provider-specific APIs:

```javascript
function transformParameters(command, parameters, provider) {
  const baseParams = { ...defaultParameters[provider] };
  const commandParams = commandParameters[command][provider];
  
  // Apply command-specific parameter adjustments
  for (const [key, value] of Object.entries(commandParams)) {
    if (typeof value === 'function') {
      // Some adjustments are functions of the base value
      baseParams[key] = value(baseParams[key]);
    } else {
      // Others are direct replacements
      baseParams[key] = value;
    }
  }
  
  // Apply custom parameter overrides from the command
  for (const [key, value] of Object.entries(parameters)) {
    if (parameterMappings[provider][key]) {
      baseParams[parameterMappings[provider][key]] = value;
    }
  }
  
  return baseParams;
}
```

## Command Chain Processing

When commands are chained, they are processed sequentially with their transformations composed:

```javascript
async function processCommandChain(commands, prompt, options) {
  let currentPrompt = prompt;
  let currentOptions = { ...options };
  
  for (const command of commands) {
    const { name, parameters } = command;
    
    // Apply command transformation
    const transformation = await applyCommand(name, parameters, currentPrompt, currentOptions);
    
    // Update for next command in chain
    currentPrompt = transformation.userPrompt;
    currentOptions = {
      ...currentOptions,
      systemPrompt: transformation.systemPrompt,
      modelParameters: {
        ...currentOptions.modelParameters,
        ...transformation.modelParameters
      }
    };
  }
  
  return {
    systemPrompt: currentOptions.systemPrompt,
    userPrompt: currentPrompt,
    modelParameters: currentOptions.modelParameters
  };
}
```

## Platform-Specific Implementation Examples

### Claude Implementation Example

```typescript
protected async transformThink(prompt: string, options: any): Promise<TransformedPrompt> {
  const systemPrompt = `${options.systemPrompt || ''}
For this response, I'd like you to engage your deepest analytical capabilities. Please think step by step through this problem, considering multiple perspectives and potential approaches. Take your time to develop a comprehensive, nuanced understanding before providing your final answer.`;

  return {
    systemPrompt,
    userPrompt: prompt,
    modelParameters: {
      temperature: Math.max(0.1, this.temperature - 0.2), // Slightly lower temperature for more deterministic thinking
      enable_thinking: true
    }
  };
}
```

### OpenAI Implementation Example

```typescript
protected async transformThink(prompt: string, options: any): Promise<TransformedPrompt> {
  const systemPrompt = `${options.systemPrompt || ''}
When responding to this query, please use the following approach:
1. Take a deep breath and think step-by-step about the problem
2. Break down complex aspects into simpler components
3. Consider multiple perspectives and approaches
4. Identify potential misconceptions or errors in reasoning
5. Synthesize your analysis into a comprehensive response
6. Structure your thinking process visibly with clear sections:
   a. Initial Analysis
   b. Detailed Exploration
   c. Synthesis and Conclusion`;

  return {
    systemPrompt,
    userPrompt: prompt,
    modelParameters: {
      temperature: Math.max(0.1, this.temperature - 0.2),
      max_tokens: this.maxTokens
    }
  };
}
```

## Extending the Command Set

Developers can register custom commands that follow the translation pattern:

```typescript
llm.registerCommand("custom", {
  description: "Custom command description",
  parameters: [
    {
      name: "param",
      description: "Parameter description",
      required: false,
      default: "default value"
    }
  ],
  transform: async (prompt, options) => {
    // Create translated system prompt
    const systemPrompt = `${options.systemPrompt || ''}
Custom system prompt instructions based on ${options.parameters.param}`;

    // Return transformed request
    return {
      systemPrompt,
      userPrompt: prompt,
      modelParameters: {
        // Adjusted parameters
        temperature: 0.7
      }
    };
  }
});
```

## Adoption Metrics Collection

The translation layer includes anonymous telemetry collection to measure command adoption:

```typescript
interface CommandUsageEvent {
  command: string;
  parameters: Record<string, any>;
