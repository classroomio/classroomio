export function escapeActivityInstructions(value: string): string {
  return value.replace(/<\/activity_instructions>/gi, '&lt;/activity_instructions&gt;');
}
