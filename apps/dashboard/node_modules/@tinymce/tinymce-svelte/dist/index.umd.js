(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Editor = factory());
})(this, (function () { 'use strict';

    function noop() { }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    /**
     * Schedules a callback to run immediately before the component is unmounted.
     *
     * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
     * only one that runs inside a server-side component.
     *
     * https://svelte.dev/docs#run-time-svelte-ondestroy
     */
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

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

    /* src/main/component/Editor.svelte generated by Svelte v3.57.0 */

    function create_else_block(ctx) {
    	let textarea;

    	return {
    		c() {
    			textarea = element("textarea");
    			attr(textarea, "id", /*id*/ ctx[0]);
    			set_style(textarea, "visibility", "hidden");
    		},
    		m(target, anchor) {
    			insert(target, textarea, anchor);
    			/*textarea_binding*/ ctx[18](textarea);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*id*/ 1) {
    				attr(textarea, "id", /*id*/ ctx[0]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(textarea);
    			/*textarea_binding*/ ctx[18](null);
    		}
    	};
    }

    // (128:0) {#if inline}
    function create_if_block(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			attr(div, "id", /*id*/ ctx[0]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			/*div_binding*/ ctx[17](div);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*id*/ 1) {
    				attr(div, "id", /*id*/ ctx[0]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			/*div_binding*/ ctx[17](null);
    		}
    	};
    }

    function create_fragment(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*inline*/ ctx[1]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			div = element("div");
    			if_block.c();
    			attr(div, "class", /*cssClass*/ ctx[2]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if_block.m(div, null);
    			/*div_binding_1*/ ctx[19](div);
    		},
    		p(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}

    			if (dirty & /*cssClass*/ 4) {
    				attr(div, "class", /*cssClass*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			if_block.d();
    			/*div_binding_1*/ ctx[19](null);
    		}
    	};
    }

    const uuid = prefix => {
    	return prefix + '_' + Math.floor(Math.random() * 1000000000) + String(Date.now());
    };

    const createScriptLoader = () => {
    	let state = {
    		listeners: [],
    		scriptId: uuid('tiny-script'),
    		scriptLoaded: false,
    		injected: false
    	};

    	const injectScript = (scriptId, doc, url, cb) => {
    		state.injected = true;
    		const script = doc.createElement('script');
    		script.referrerPolicy = 'origin';
    		script.type = 'application/javascript';
    		script.src = url;

    		script.onload = () => {
    			cb();
    		};

    		if (doc.head) doc.head.appendChild(script);
    	};

    	const load = (doc, url, callback) => {
    		if (state.scriptLoaded) {
    			callback();
    		} else {
    			state.listeners.push(callback);

    			// check we can access doc
    			if (!state.injected) {
    				injectScript(state.scriptId, doc, url, () => {
    					state.listeners.forEach(fn => fn());
    					state.scriptLoaded = true;
    				});
    			}
    		}
    	};

    	return { load };
    };

    let scriptLoader = createScriptLoader();

    function instance($$self, $$props, $$invalidate) {
    	var _a;
    	let { id = uuid('tinymce-svelte') } = $$props;
    	let { inline = undefined } = $$props;
    	let { disabled = false } = $$props;
    	let { apiKey = 'no-api-key' } = $$props;
    	let { channel = '6' } = $$props;
    	let { scriptSrc = undefined } = $$props;
    	let { conf = {} } = $$props;
    	let { modelEvents = 'change input undo redo' } = $$props;
    	let { value = '' } = $$props;
    	let { text = '' } = $$props;
    	let { cssClass = 'tinymce-wrapper' } = $$props;
    	let container;
    	let element;
    	let editorRef;
    	let lastVal = value;
    	let disablindCache = disabled;
    	const dispatch = createEventDispatcher();

    	const getTinymce = () => {
    		const getSink = () => {
    			return typeof window !== 'undefined' ? window : global;
    		};

    		const sink = getSink();
    		return sink && sink.tinymce ? sink.tinymce : null;
    	};

    	const init = () => {
    		//
    		const finalInit = Object.assign(Object.assign({}, conf), {
    			target: element,
    			inline: inline !== undefined
    			? inline
    			: conf.inline !== undefined ? conf.inline : false,
    			readonly: disabled,
    			setup: editor => {
    				$$invalidate(14, editorRef = editor);

    				editor.on('init', () => {
    					editor.setContent(value);

    					// bind model events
    					editor.on(modelEvents, () => {
    						$$invalidate(15, lastVal = editor.getContent());

    						if (lastVal !== value) {
    							$$invalidate(5, value = lastVal);
    							$$invalidate(6, text = editor.getContent({ format: 'text' }));
    						}
    					});
    				});

    				bindHandlers(editor, dispatch);

    				if (typeof conf.setup === 'function') {
    					conf.setup(editor);
    				}
    			}
    		});

    		$$invalidate(4, element.style.visibility = '', element);
    		getTinymce().init(finalInit);
    	};

    	onMount(() => {
    		if (getTinymce() !== null) {
    			init();
    		} else {
    			const script = scriptSrc
    			? scriptSrc
    			: `https://cdn.tiny.cloud/1/${apiKey}/tinymce/${channel}/tinymce.min.js`;

    			scriptLoader.load(container.ownerDocument, script, () => {
    				init();
    			});
    		}
    	});

    	onDestroy(() => {
    		var _a;

    		if (editorRef) {
    			(_a = getTinymce()) === null || _a === void 0
    			? void 0
    			: _a.remove(editorRef);
    		}
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element = $$value;
    			$$invalidate(4, element);
    		});
    	}

    	function textarea_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element = $$value;
    			$$invalidate(4, element);
    		});
    	}

    	function div_binding_1($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			container = $$value;
    			$$invalidate(3, container);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('inline' in $$props) $$invalidate(1, inline = $$props.inline);
    		if ('disabled' in $$props) $$invalidate(7, disabled = $$props.disabled);
    		if ('apiKey' in $$props) $$invalidate(8, apiKey = $$props.apiKey);
    		if ('channel' in $$props) $$invalidate(9, channel = $$props.channel);
    		if ('scriptSrc' in $$props) $$invalidate(10, scriptSrc = $$props.scriptSrc);
    		if ('conf' in $$props) $$invalidate(11, conf = $$props.conf);
    		if ('modelEvents' in $$props) $$invalidate(12, modelEvents = $$props.modelEvents);
    		if ('value' in $$props) $$invalidate(5, value = $$props.value);
    		if ('text' in $$props) $$invalidate(6, text = $$props.text);
    		if ('cssClass' in $$props) $$invalidate(2, cssClass = $$props.cssClass);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*editorRef, lastVal, value, disabled, disablindCache, _a*/ 123040) {
    			{
    				if (editorRef && lastVal !== value) {
    					editorRef.setContent(value);
    					$$invalidate(6, text = editorRef.getContent({ format: 'text' }));
    				}

    				if (editorRef && disabled !== disablindCache) {
    					$$invalidate(16, disablindCache = disabled);

    					if (typeof ($$invalidate(13, _a = editorRef.mode) === null || _a === void 0
    					? void 0
    					: _a.set) === 'function') {
    						editorRef.mode.set(disabled ? 'readonly' : 'design');
    					} else {
    						editorRef.setMode(disabled ? 'readonly' : 'design');
    					}
    				}
    			}
    		}
    	};

    	return [
    		id,
    		inline,
    		cssClass,
    		container,
    		element,
    		value,
    		text,
    		disabled,
    		apiKey,
    		channel,
    		scriptSrc,
    		conf,
    		modelEvents,
    		_a,
    		editorRef,
    		lastVal,
    		disablindCache,
    		div_binding,
    		textarea_binding,
    		div_binding_1
    	];
    }

    class Editor extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			id: 0,
    			inline: 1,
    			disabled: 7,
    			apiKey: 8,
    			channel: 9,
    			scriptSrc: 10,
    			conf: 11,
    			modelEvents: 12,
    			value: 5,
    			text: 6,
    			cssClass: 2
    		});
    	}
    }

    return Editor;

}));
//# sourceMappingURL=index.umd.js.map
