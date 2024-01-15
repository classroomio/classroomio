import Renderer from '../Renderer';
import Block from '../Block';
import Comment from '../../nodes/Comment';
import Wrapper from './shared/Wrapper';
import { Identifier } from 'estree';
export default class CommentWrapper extends Wrapper {
    node: Comment;
    var: Identifier;
    constructor(renderer: Renderer, block: Block, parent: Wrapper, node: Comment);
    render(block: Block, parent_node: Identifier, parent_nodes: Identifier): void;
}
