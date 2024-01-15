import { get as getStoreValue, writable } from 'svelte/store';

const VALUE_TYPES = ['string', 'number', 'boolean'];

const removeQuotes = (str) => str.replace(/(^\"|\"$)/g, '');

const get = () => {
	const { subscribe, set, update } = writable({
		json: undefined,
		codeChildren: [],
		mappings: [],
		highlighted: undefined,
		focusTarget: undefined,
		newValue: undefined,
		editing: undefined
	});

	return {
		subscribe,
		updateMappings() {
			const { codeChildren } = getStoreValue({ subscribe });
			const mappings = Array.from(codeChildren)
				.reduce(({ elements = [], basePath = '', lastProperty }, el) => {
					const text = el.textContent;
					const newLastProperty = el.classList.contains('property')
						? removeQuotes(text)
						: lastProperty;
					const isPunctuation = el.classList.contains('punctuation');
					const isValue = Array.from(el.classList).find((c) => VALUE_TYPES.includes(c));

					let newBasePath = basePath;
					if (isPunctuation && text === '{' && lastProperty)
						newBasePath = `${basePath}${lastProperty}.`;
					if (isPunctuation && text === '}')
						newBasePath = `${basePath.split('.').filter(Boolean).slice(0, -1).join('.')}.`;

					return {
						lastProperty: newLastProperty,
						basePath: newBasePath,
						elements: [
							...elements,
							{
								el,
								text,
								isValue,
								path: `${basePath}${newLastProperty}`
							}
						]
					};
				}, {})
				.elements.filter(({ isValue }) => isValue);
			update((state) => ({ ...state, mappings }));
			return this;
		},
		json(json) {
			const highlighted = Prism.highlight(
				JSON.stringify(json, null, 2),
				Prism.languages.json,
				'json'
			);
			update((state) => ({ ...state, json, highlighted }));
			return this;
		},
		trackFocus(evt) {
			update((state) => {
				if (!Array.from(state.codeChildren).includes(evt.target)) return state;
				const matchingType = Array.from(evt.target.classList).find((c) => VALUE_TYPES.includes(c));
				if (!matchingType) return state;
				const focusTarget = { type: matchingType, el: evt.target };
				return { ...state, focusTarget };
			});
		},
		registerChildren(codeChildren) {
			if (!codeChildren) return this;
			update((state) => ({ ...state, codeChildren }));
			return this;
		},

		openEditor(evt) {
			if (evt) {
				evt.stopPropagation();
				evt.preventDefault();
			}
			this.updateMappings();
			update((state) => {
				if (!state.focusTarget) return state;
				const { el, type } = state.focusTarget;
				const newValue = removeQuotes(el.textContent);
				const mapping = state.mappings.find((m) => m.el === el);
				return {
					...state,
					editing: {
						mapping,
						focusTarget: state.focusTarget,
						value: newValue,
						newValue: newValue,
						type
					}
				};
			});
		},
		set(path, val) {
			const { json } = getStoreValue({ subscribe });
			const p = path.split('.');
			let target = json;
			while (p.length > 1) target = target[p.shift()];
			target[p] = val;
		},
		commit(value) {
			update(({ editing: { mapping, focusTarget }, json, ...state }) => {
				mapping.el.textContent = `"${value}"`;
				this.set(mapping.path, value);
				return { ...state, json, focusTarget };
			});
		},
		cancelEdit() {
			update(({ editing, ...state }) => state);
		},
		moveFocus(dir) {
			this.updateMappings();
			const { focusTarget: prevFocusTarget, mappings } = getStoreValue({ subscribe });
			const index = mappings.findIndex(({ el }) => prevFocusTarget?.el === el);
			const newIndex = index === -1 ? 0 : index + dir;
			const mapping = mappings[newIndex];
			if (!mapping) return;
			const focusTarget = { el: mapping.el, type: null };
			update((state) => ({ ...state, focusTarget }));
		}
	};
};

export { get };
