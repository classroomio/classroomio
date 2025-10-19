import { Editor, Extension } from '@tiptap/core';
import Suggestion, { type SuggestionProps, type SuggestionKeyDownProps } from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import { computePosition, flip, offset, autoUpdate, type Placement } from '@floating-ui/dom';

import { GROUPS } from './groups.js';
import SvelteRenderer from '../../svelte-renderer.js';

import type { Component } from 'svelte';

const extensionName = 'slashCommand';

interface PopupState {
	element: HTMLElement | null;
	cleanup: (() => void) | null;
	isVisible: boolean;
}

const popup: PopupState = {
	element: null,
	cleanup: null,
	isVisible: false
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (menuList: Component<any, any, ''>): Extension =>
	Extension.create({
		name: extensionName,

		priority: 200,

		onCreate() {
			// Create popup container
			popup.element = document.createElement('div');
			popup.element.style.position = 'fixed';
			popup.element.style.zIndex = '9999';
			popup.element.style.maxWidth = '16rem';
			popup.element.style.visibility = 'hidden';
			popup.element.style.pointerEvents = 'none';
			popup.element.className = 'slash-command-popup';
			document.body.appendChild(popup.element);
		},

		addProseMirrorPlugins() {
			return [
				Suggestion({
					editor: this.editor,
					char: '/',
					allowSpaces: true,
					pluginKey: new PluginKey(extensionName),
					allow: ({ state, range }) => {
						const $from = state.doc.resolve(range.from);
						const afterContent = $from.parent.textContent?.substring(
							$from.parent.textContent?.indexOf('/')
						);
						const isValidAfterContent = !afterContent?.endsWith('  ');

						return isValidAfterContent;
					},
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					command: ({ editor, props }: { editor: Editor; props: any }) => {
						const { view, state } = editor;
						const { $head, $from } = view.state.selection;

						try {
							const end = $from.pos;
							const from = $head?.nodeBefore
								? end -
									($head.nodeBefore.text?.substring($head.nodeBefore.text?.indexOf('/')).length ??
										0)
								: $from.start();

							const tr = state.tr.deleteRange(from, end);
							view.dispatch(tr);
						} catch (error) {
							console.error(error);
						}

						props.onClick(editor);
						view.focus();
					},
					items: ({ query }: { query: string }) => {
						const withFilteredCommands = GROUPS.map((group) => ({
							...group,
							commands: group.actions.filter((item) => {
								const labelNormalized = item.tooltip!.toLowerCase().trim();
								const queryNormalized = query.toLowerCase().trim();
								return labelNormalized.includes(queryNormalized);
							})
						}));

						const withoutEmptyGroups = withFilteredCommands.filter((group) => {
							if (group.commands.length > 0) {
								return true;
							}

							return false;
						});

						const withEnabledSettings = withoutEmptyGroups.map((group) => ({
							...group,
							commands: group.commands.map((command) => ({
								...command,
								isEnabled: true
							}))
						}));

						return withEnabledSettings;
					},
					render: () => {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						let component: any;

						let scrollHandler: (() => void) | null = null;

						return {
							onStart: (props: SuggestionProps) => {
								component = new SvelteRenderer(menuList, {
									props,
									editor: props.editor
								});

								const { view } = props.editor;

								if (popup.element) {
									popup.element.appendChild(component.element);
									popup.element.style.visibility = 'visible';
									popup.element.style.pointerEvents = 'auto';
									popup.isVisible = true;

									const updatePosition = () => {
										if (!popup.element || !props.clientRect) return;

										const rect = props.clientRect();
										if (!rect) return;

										const referenceElement = {
											getBoundingClientRect: () => rect
										};

										computePosition(referenceElement, popup.element, {
											placement: 'bottom-start' as Placement,
											middleware: [
												offset({ mainAxis: 8, crossAxis: 16 }),
												flip({ fallbackPlacements: ['top-start', 'bottom-start'] })
											]
										}).then(({ x, y }) => {
											if (popup.element) {
												popup.element.style.left = `${x}px`;
												popup.element.style.top = `${y}px`;
											}
										});
									};

									updatePosition();

									// Set up auto-update for scroll events
									if (props.clientRect) {
										const referenceElement = {
											getBoundingClientRect: () => props.clientRect?.() || new DOMRect()
										};
										popup.cleanup = autoUpdate(referenceElement, popup.element, updatePosition);
									}

									scrollHandler = updatePosition;
									view.dom.parentElement?.addEventListener('scroll', scrollHandler);
								}
							},

							onUpdate(props: SuggestionProps) {
								component.updateProps(props);

								if (popup.element && popup.isVisible && props.clientRect) {
									const rect = props.clientRect();
									if (rect) {
										const referenceElement = {
											getBoundingClientRect: () => rect
										};

										computePosition(referenceElement, popup.element, {
											placement: 'bottom-start' as Placement,
											middleware: [
												offset({ mainAxis: 8, crossAxis: 16 }),
												flip({ fallbackPlacements: ['top-start', 'bottom-start'] })
											]
										}).then(({ x, y }) => {
											if (popup.element) {
												popup.element.style.left = `${x}px`;
												popup.element.style.top = `${y}px`;
											}
										});

										props.editor.storage[extensionName].rect = rect;
									}
								}
							},

							onKeyDown(props: SuggestionKeyDownProps) {
								if (props.event.key === 'Escape') {
									if (popup.element) {
										popup.element.style.visibility = 'hidden';
										popup.element.style.pointerEvents = 'none';
										popup.isVisible = false;
									}
									return true;
								}

								if (!popup.isVisible && popup.element) {
									popup.element.style.visibility = 'visible';
									popup.element.style.pointerEvents = 'auto';
									popup.isVisible = true;
								}

								if (props.event.key === 'Enter') return true;

								// return component.ref?.onKeyDown(props);
								return false;
							},

							onExit(props) {
								if (popup.element) {
									popup.element.style.visibility = 'hidden';
									popup.element.style.pointerEvents = 'none';
									popup.element.innerHTML = '';
									popup.isVisible = false;
								}

								if (popup.cleanup) {
									popup.cleanup();
									popup.cleanup = null;
								}

								if (scrollHandler) {
									const { view } = props.editor;
									view.dom.parentElement?.removeEventListener('scroll', scrollHandler);
									scrollHandler = null;
								}

								component.destroy();
							}
						};
					}
				})
			];
		},

		addStorage() {
			return {
				rect: {
					width: 0,
					height: 0,
					left: 0,
					top: 0,
					right: 0,
					bottom: 0
				}
			};
		}
	});
