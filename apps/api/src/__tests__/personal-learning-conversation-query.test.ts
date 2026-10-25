import { describe, expect, it, vi } from 'vitest';

const { db, conversation, lockForUpdate } = vi.hoisted(() => {
  const conversation = {
    id: 'conversation-1',
    ownerUserId: 'owner-1',
    messages: [{ role: 'user' as const, content: 'First question' }],
    offerId: null,
    offerPayload: null,
    offerStatus: 'active'
  };
  const selectConversation = vi.fn(async () => [conversation]);
  const lockForUpdate = vi.fn(() => ({ limit: selectConversation }));
  const selectBuilder = {
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        for: lockForUpdate,
        limit: selectConversation
      }))
    }))
  };
  const updateBuilder = {
    set: vi.fn((values: Partial<typeof conversation>) => {
      Object.assign(conversation, values);
      return {
        where: vi.fn(() => ({ returning: vi.fn(async () => [conversation]) }))
      };
    })
  };
  const transactionClient = {
    select: vi.fn(() => selectBuilder),
    update: vi.fn(() => updateBuilder)
  };

  return {
    conversation,
    lockForUpdate,
    db: {
      ...transactionClient,
      transaction: vi.fn(async (callback: (client: typeof transactionClient) => unknown) => callback(transactionClient))
    }
  };
});

vi.mock('@db/drizzle', () => ({ db }));

import { savePersonalLearningConversation } from '@cio/db/queries/personal-learning';

describe('savePersonalLearningConversation', () => {
  it('locks an existing conversation before appending a turn', async () => {
    const result = await savePersonalLearningConversation({
      ownerUserId: conversation.ownerUserId,
      conversationId: conversation.id,
      userMessage: 'Second question',
      assistantMessage: 'Second answer'
    });

    expect(db.transaction).toHaveBeenCalledOnce();
    expect(lockForUpdate).toHaveBeenCalledWith('update');
    expect(result?.messages).toEqual([
      { role: 'user', content: 'First question' },
      { role: 'user', content: 'Second question' },
      { role: 'assistant', content: 'Second answer' }
    ]);
  });
});
