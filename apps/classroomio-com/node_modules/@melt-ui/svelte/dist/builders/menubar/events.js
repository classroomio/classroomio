import { menuEvents } from '../menu/events.js';
export const menubarEvents = {
    ...menuEvents,
    menu: ['keydown'],
    trigger: ['click', 'keydown', 'pointerenter'],
};
