import { TemplateNode } from '../interfaces';
import { INode } from '../compile/nodes/interfaces';
export declare function extract_svelte_ignore(text: string): string[];
export declare function extract_svelte_ignore_from_comments<Node extends {
    leadingComments?: Array<{
        value: string;
    }>;
}>(node: Node): string[];
export declare function extract_ignores_above_position(position: number, template_nodes: TemplateNode[]): string[];
export declare function extract_ignores_above_node(node: INode): string[];
