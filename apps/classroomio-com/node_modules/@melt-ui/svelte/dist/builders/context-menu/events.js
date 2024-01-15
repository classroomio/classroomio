import { menuEvents } from '../menu/events.js';
export const contextMenuEvents = {
    ...menuEvents,
    menu: ['keydown'],
    trigger: ['contextmenu', 'pointerdown', 'pointermove', 'pointercancel', 'pointerup'],
};
