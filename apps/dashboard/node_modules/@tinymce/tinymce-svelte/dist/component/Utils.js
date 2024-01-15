const validEvents = [
    'Activate',
    'AddUndo',
    'BeforeAddUndo',
    'BeforeExecCommand',
    'BeforeGetContent',
    'BeforeRenderUI',
    'BeforeSetContent',
    'BeforePaste',
    'Blur',
    'Change',
    'ClearUndos',
    'Click',
    'ContextMenu',
    'Copy',
    'Cut',
    'Dblclick',
    'Deactivate',
    'Dirty',
    'Drag',
    'DragDrop',
    'DragEnd',
    'DragGesture',
    'DragOver',
    'Drop',
    'ExecCommand',
    'Focus',
    'FocusIn',
    'FocusOut',
    'GetContent',
    'Hide',
    'Init',
    'KeyDown',
    'KeyPress',
    'KeyUp',
    'LoadContent',
    'MouseDown',
    'MouseEnter',
    'MouseLeave',
    'MouseMove',
    'MouseOut',
    'MouseOver',
    'MouseUp',
    'NodeChange',
    'ObjectResizeStart',
    'ObjectResized',
    'ObjectSelected',
    'Paste',
    'PostProcess',
    'PostRender',
    'PreProcess',
    'ProgressState',
    'Redo',
    'Remove',
    'Reset',
    'ResizeEditor',
    'SaveContent',
    'SelectionChange',
    'SetAttrib',
    'SetContent',
    'Show',
    'Submit',
    'Undo',
    'VisualAid'
];
const bindHandlers = (editor, dispatch) => {
    validEvents.forEach((eventName) => {
        editor.on(eventName, (e) => {
            dispatch(eventName.toLowerCase(), {
                eventName,
                event: e,
                editor
            });
        });
    });
};
const injectTiny = (doc, url, cb) => {
    const script = doc.createElement('script');
    script.referrerPolicy = 'origin';
    script.type = 'application/javascript';
    script.src = url;
    script.onload = cb;
    if (doc.head) {
        doc.head.appendChild(script);
    }
};
export { bindHandlers, injectTiny };
//# sourceMappingURL=Utils.js.map