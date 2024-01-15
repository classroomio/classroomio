// prompts/huggingface.ts
function experimental_buildStarChatBetaPrompt(messages) {
  return messages.map(({ content, role }) => {
    if (role === "user") {
      return `<|user|>
${content}<|end|>
`;
    } else if (role === "assistant") {
      return `<|assistant|>
${content}<|end|>
`;
    } else if (role === "system") {
      return `<|system|>
${content}<|end|>
`;
    } else if (role === "function") {
      throw new Error("StarChat Beta does not support function calls.");
    }
  }).join("") + "<|assistant|>";
}
function experimental_buildOpenAssistantPrompt(messages) {
  return messages.map(({ content, role }) => {
    if (role === "user") {
      return `<|prompter|>${content}<|endoftext|>`;
    } else if (role === "function") {
      throw new Error("OpenAssistant does not support function calls.");
    } else if (role === "system") {
      throw new Error("OpenAssistant does not support system messages.");
    } else {
      return `<|assistant|>${content}<|endoftext|>`;
    }
  }).join("") + "<|assistant|>";
}
function experimental_buildLlama2Prompt(messages) {
  const startPrompt = `<s>[INST] `;
  const endPrompt = ` [/INST]`;
  const conversation = messages.map(({ content, role }, index) => {
    if (role === "user") {
      return content.trim();
    } else if (role === "assistant") {
      return ` [/INST] ${content}</s><s>[INST] `;
    } else if (role === "function") {
      throw new Error("Llama 2 does not support function calls.");
    } else if (role === "system" && index === 0) {
      return `<<SYS>>
${content}
<</SYS>>

`;
    } else {
      throw new Error(`Invalid message role: ${role}`);
    }
  });
  return startPrompt + conversation.join("") + endPrompt;
}
export {
  experimental_buildLlama2Prompt,
  experimental_buildOpenAssistantPrompt,
  experimental_buildStarChatBetaPrompt
};
