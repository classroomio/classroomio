"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// prompts/index.ts
var prompts_exports = {};
__export(prompts_exports, {
  experimental_buildLlama2Prompt: () => experimental_buildLlama2Prompt,
  experimental_buildOpenAssistantPrompt: () => experimental_buildOpenAssistantPrompt,
  experimental_buildStarChatBetaPrompt: () => experimental_buildStarChatBetaPrompt
});
module.exports = __toCommonJS(prompts_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  experimental_buildLlama2Prompt,
  experimental_buildOpenAssistantPrompt,
  experimental_buildStarChatBetaPrompt
});
