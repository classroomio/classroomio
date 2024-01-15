import Attribute from '../nodes/Attribute';
import Element from '../nodes/Element';
export declare const CONTENTEDITABLE_BINDINGS: string[];
/**
 * Check if any of a node's attributes are 'contentenditable'.
 * @param {Element} node The element to be checked
 */
export declare function has_contenteditable_attr(node: Element): boolean;
/**
 * Returns true if node is not textarea or input, but has 'contenteditable' attribute.
 * @param {Element} node The element to be tested
 */
export declare function is_contenteditable(node: Element): boolean;
/**
 * Returns true if a given binding/node is contenteditable.
 * @param {string} name A binding or node name to be checked
 */
export declare function is_name_contenteditable(name: string): boolean;
/**
 * Returns the contenteditable attribute from the node (if it exists).
 * @param {Element} node The element to get the attribute from
 */
export declare function get_contenteditable_attr(node: Element): Attribute | undefined;
