import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useEffect, useRef } from 'react';

/**
 * Presents and dismisses a gorhom modal from an `open` flag. Call `markDismissed` from the modal's `onDismiss`.
 * Dismissing a modal that isn't showing leaves it stuck mid-dismiss, so it never presents again.
 */
export function useModalPresentation(open: boolean) {
  const modal = useRef<BottomSheetModal>(null);
  const showing = useRef(false);

  useEffect(() => {
    if (open === showing.current) return;

    showing.current = open;
    if (open) modal.current?.present();
    else modal.current?.dismiss();
  }, [open]);

  const markDismissed = () => {
    showing.current = false;
  };

  return { modal, markDismissed };
}
