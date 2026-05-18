import { getCourseTemplate, type CourseTemplateId, type TemplateFormField } from '@cio/ai-assistant';

/**
 * The agent occasionally produces `ask_template_questions` payloads where a select field
 * has lost options, fewer options than the registry, or different option labels. The
 * registry is the source of truth for what the teacher should see; merge over agent output
 * so the form always matches our pedagogy + UI expectations.
 */
export function mergeTemplateFieldsWithRegistry(
  templateId: CourseTemplateId,
  agentFields: TemplateFormField[] | undefined
): TemplateFormField[] {
  const registry = getCourseTemplate(templateId);
  const registryFields = registry?.fields ?? [];

  if (!agentFields || agentFields.length === 0) {
    return registryFields;
  }

  const registryById = new Map(registryFields.map((field) => [field.id, field]));

  // Agent occasionally emits fields with missing/empty id, or duplicates; clean both so {#each} keying stays unique.
  const seenIds = new Set<string>();
  const validAgentFields = agentFields.filter((field): field is TemplateFormField => {
    if (typeof field?.id !== 'string' || field.id.length === 0) return false;
    if (seenIds.has(field.id)) return false;
    seenIds.add(field.id);

    return true;
  });

  return validAgentFields.map((agentField) => {
    const canonical = registryById.get(agentField.id);

    if (!canonical) {
      return agentField;
    }

    if (canonical.type === 'select') {
      return {
        ...agentField,
        type: 'select',
        label: canonical.label,
        required: canonical.required,
        placeholder: canonical.placeholder,
        options: canonical.options
      } as TemplateFormField;
    }

    return {
      ...agentField,
      type: canonical.type,
      label: canonical.label,
      required: canonical.required,
      placeholder: canonical.placeholder
    } as TemplateFormField;
  });
}
