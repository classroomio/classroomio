import type { CourseTemplateId } from '@cio/ai-assistant';
import type { AiAssistantMessage, AiAssistantMessageMetadata } from '$features/ai-assistant/utils/types';

export function isTemplateFormResolved(messages: AiAssistantMessage[], templateId: CourseTemplateId): boolean {
  return messages.some((message) => {
    if (message.role !== 'user') {
      return false;
    }

    const meta = message.metadata as AiAssistantMessageMetadata | undefined;
    const tmpl = meta?.template;

    if (!tmpl || !('action' in tmpl)) {
      return false;
    }

    return (
      (tmpl.action === 'submit_template_answers' || tmpl.action === 'skip_template_form') &&
      tmpl.templateId === templateId
    );
  });
}
