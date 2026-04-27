import {
  listChatConversations,
  getChatConversation,
  createChatConversation,
  saveChatMessages,
  deleteChatConversation,
  updateConversationTitle,
  getChatHistory,
  saveChatHistory,
  deleteChatHistory
} from '@cio/db/queries/agent';

export {
  listChatConversations,
  getChatConversation,
  createChatConversation,
  saveChatMessages,
  deleteChatConversation,
  updateConversationTitle,
  // Legacy compat
  getChatHistory as fetchChatHistory,
  saveChatHistory as persistChatHistory,
  deleteChatHistory as clearChatHistory
};
