import Block from '../Block';
import Wrapper from './shared/Wrapper';
import Document from '../../nodes/Document';
import { Identifier } from 'estree';
import EventHandler from './Element/EventHandler';
import { TemplateNode } from '../../../interfaces';
import Renderer from '../Renderer';
export default class DocumentWrapper extends Wrapper {
    node: Document;
    handlers: EventHandler[];
    constructor(renderer: Renderer, block: Block, parent: Wrapper, node: TemplateNode);
    render(block: Block, _parent_node: Identifier, _parent_nodes: Identifier): void;
}
