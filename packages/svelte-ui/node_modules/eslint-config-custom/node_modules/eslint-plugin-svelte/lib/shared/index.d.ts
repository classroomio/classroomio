import { CommentDirectives } from './comment-directives';
export declare class Shared {
    readonly commentDirectives: CommentDirectives[];
    newCommentDirectives(options: ConstructorParameters<typeof CommentDirectives>[0]): CommentDirectives;
}
export declare function beginShared(filename: string): void;
export declare function terminateShared(filename: string): Shared | null;
export declare function getShared(filename: string): Shared | null;
