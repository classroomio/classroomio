// iOS cannot present a modal while another is still dismissing, so wait for the option sheet to close.
const SHEET_DISMISS_MS = 350;

export function afterSheetCloses(action: () => void) {
  setTimeout(action, SHEET_DISMISS_MS);
}
