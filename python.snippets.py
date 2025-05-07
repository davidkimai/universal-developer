{
  "Universal LLM Initialization": {
    "prefix": "ud-init",
    "body": [
      "from universal_developer import UniversalLLM",
      "",
      "llm = UniversalLLM(",
      "    provider=\"${1|anthropic,openai,qwen,gemini,ollama|}\",",
      "    api_key=\"${2:your_api_key}\"",
      ")"
    ],
    "description": "Initialize a Universal Developer LLM instance"
  },
  "Thinking Mode Generator": {
    "prefix": "ud-think",
    "body": [
      "response = llm.generate(",
      "    ${1:system_prompt=\"${2:You are a helpful assistant.}\",}",
      "    prompt=\"/think ${3:What are the implications of ${4:technology} on ${5:domain}?}\"",
      ")"
    ],
    "description": "Generate response using thinking mode"
  },
  "Fast Mode Generator": {
    "prefix": "ud-fast",
    "body": [
      "response = llm.generate(",
      "    ${1:system_prompt=\"${2:You are a helpful assistant.}\",}",
      "    prompt=\"/fast ${3:${4:Summarize} ${5:this information}}\"",
      ")"
    ],
    "description": "Generate concise response using fast mode"
  },
  "Loop Mode Generator": {
    "prefix": "ud-loop",
    "body": [
      "response = llm.generate(",
      "    ${1:system_prompt=\"${2:You are a helpful assistant.}\",}",
      "    prompt=\"/loop --iterations=${3:3} ${4:Improve this ${5:text}: ${6:content}}\"",
      ")"
    ],
    "description": "Generate iteratively refined response using loop mode"
  },
  "Reflection Mode Generator": {
    "prefix": "ud-reflect",
    "body": [
      "response = llm.generate(",
      "    ${1:system_prompt=\"${2:You are a helpful assistant.}\",}",
      "    prompt=\"/reflect ${3:${4:Analyze} the ${5:implications} of ${6:topic}}\"",
      ")"
    ],
    "description": "Generate self-reflective response using reflection mode"
  },
  "Fork Mode Generator": {
    "prefix": "ud-fork",
    "body": [
      "response = llm.generate(",
      "    ${1:system_prompt=\"${2:You are a helpful assistant.}\",}",
      "    prompt=\"/fork --count=${3:2} ${4:Generate different ${5:approaches} to ${6:problem}}\"",
      ")"
    ],
    "description": "Generate multiple alternative responses using fork mode"
  },
  "Chain Commands": {
    "prefix": "ud-chain",
    "body": [
      "response = llm.generate(",
      "    ${1:system_prompt=\"${2:You are a helpful assistant.}\",}",
      "    prompt=\"/${3|think,loop,reflect,fork|} /${4|think,loop,reflect,fork|} ${5:Prompt text}\"",
      ")"
    ],
    "description": "Generate response using chained symbolic commands"
  },
  "Custom Command Registration": {
    "prefix": "ud-custom",
    "body": [
      "def transform_custom_command(prompt, options):",
      "    \"\"\"Custom command transformation function\"\"\"",
      "    system_prompt = options.get('system_prompt', '') + \"\"\"",
      "${1:Custom system prompt instructions}",
      "\"\"\"",
      "    ",
      "    return {",
      "        \"system_prompt\": system_prompt,",
      "        \"user_prompt\": prompt,",
      "        \"model_parameters\": {",
      "            \"${2:temperature}\": ${3:0.7}",
      "        }",
      "    }",
      "",
      "llm.register_command(",
      "    \"${4:command_name}\",",
      "    description=\"${5:Command description}\",",
      "    parameters=[",
      "        {",
      "            \"name\": \"${6:param_name}\",",
      "            \"description\": \"${7:Parameter description}\",",
      "            \"required\": ${8:False},",
      "            \"default\": ${9:\"default_value\"}",
      "        }",
      "    ],",
      "    transform=transform_custom_command",
      ")"
    ],
    "description": "Register a custom symbolic command"
  },
  "Flask API Integration": {
    "prefix": "ud-flask",
    "body": [
      "from flask import Flask, request, jsonify",
      "from universal_developer import UniversalLLM",
      "import os",
      "",
      "app = Flask(__name__)",
      "",
      "llm = UniversalLLM(",
      "    provider=\"${1|anthropic,openai,qwen,gemini,ollama|}\",",
      "    api_key=os.environ.get(\"${2:${1/(anthropic|openai|qwen|gemini)/${1:/upcase}_API_KEY/}}\")",
      ")",
      "",
      "@app.route('/api/generate', methods=['POST'])",
      "def generate():",
      "    data = request.json",
      "    prompt = data.get('prompt')",
      "    system_prompt = data.get('system_prompt', '')",
      "    ",
      "    # Get command from query param or default to /think",
      "    command = request.args.get('command', 'think')",
      "    ",
      "    try:",
      "        response = llm.generate(",
      "            system_prompt=system_prompt,",
      "            prompt=f\"/{command} {prompt}\"",
      "        )",
      "        return jsonify({'response': response})",
      "    except Exception as e:",
      "        return jsonify({'error': str(e)}), 500",
      "",
      "if __name__ == '__main__':",
      "    app.run(debug=True)"
    ],
    "description": "Flask API integration with Universal Developer"
  },
  "FastAPI Integration": {
    "prefix": "ud-fastapi",
    "body": [
      "from fastapi import FastAPI, HTTPException, Query",
      "from pydantic import BaseModel",
      "from typing import Optional",
      "from universal_developer import UniversalLLM",
      "import os",
      "",
      "app = FastAPI()",
      "",
      "llm = UniversalLLM(",
      "    provider=\"${1|anthropic,openai,qwen,gemini,ollama|}\",",
      "    api_key=os.environ.get(\"${2:${1/(anthropic|openai|qwen|gemini)/${1:/upcase}_API_KEY/}}\")",
      ")",
      "",
      "class GenerateRequest(BaseModel):",
      "    prompt: str",
      "    system_prompt: Optional[str] = \"\"",
      "",
      "@app.post(\"/api/generate\")",
      "async def generate(",
      "    request: GenerateRequest,",
      "    command: str = Query(\"think\", description=\"Symbolic command to use\")",
      "):",
      "    try:",
      "        response = llm.generate(",
      "            system_prompt=request.system_prompt,",
      "            prompt=f\"/{command} {request.prompt}\"",
      "        )",
      "        return {\"response\": response}",
      "    except Exception as e:",
      "        raise HTTPException(status_code=500, detail=str(e))"
    ],
    "description": "FastAPI integration with Universal Developer"
  },
  "Streamlit Integration": {
    "prefix": "ud-streamlit",
    "body": [
      "import streamlit as st",
      "from universal_developer import UniversalLLM",
      "import os",
      "",
      "# Initialize LLM",
      "@st.cache_resource",
      "def get_llm():",
      "    return UniversalLLM(",
      "        provider=\"${1|anthropic,openai,qwen,gemini,ollama|}\",",
      "        api_key=os.environ.get(\"${2:${1/(anthropic|openai|qwen|gemini)/${1:/upcase}_API_KEY/}}\")",
      "    )",
      "",
      "llm = get_llm()",
      "",
      "st.title(\"Universal Developer Demo\")",
      "",
      "# Command selection",
      "command = st.selectbox(",
      "    \"Select symbolic command\",",
      "    [\"think\", \"fast\", \"loop\", \"reflect\", \"fork\", \"collapse\"]",
      ")",
      "",
      "# Command parameters",
      "if command == \"loop\":",
      "    iterations = st.slider(\"Iterations\", 1, 5, 3)",
      "    command_str = f\"/loop --iterations={iterations}\"",
      "elif command == \"fork\":",
      "    count = st.slider(\"Alternative count\", 2, 5, 2)",
      "    command_str = f\"/fork --count={count}\"",
      "else:",
      "    command_str = f\"/{command}\"",
      "",
      "# User input",
      "prompt = st.text_area(\"Enter your prompt\", \"\")",
      "",
      "if st.button(\"Generate\") and prompt:",
      "    with st.spinner(\"Generating response...\"):",
      "        response = llm.generate(",
      "            prompt=f\"{command_str} {prompt}\"",
      "        )",
      "        st.markdown(response)"
    ],
    "description": "Streamlit integration with Universal Developer"
  }
}
