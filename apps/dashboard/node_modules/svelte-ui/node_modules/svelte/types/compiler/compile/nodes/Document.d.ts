import Node from './shared/Node';
import Binding from './Binding';
import EventHandler from './EventHandler';
import Action from './Action';
import Component from '../Component';
import TemplateScope from './shared/TemplateScope';
import { Element } from '../../interfaces';
export default class Document extends Node {
    type: 'Document';
    handlers: EventHandler[];
    bindings: Binding[];
    actions: Action[];
    constructor(component: Component, parent: Node, scope: TemplateScope, info: Element);
    private validate;
}
