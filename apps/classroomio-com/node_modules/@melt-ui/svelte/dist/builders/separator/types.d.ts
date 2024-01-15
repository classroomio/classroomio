import type { BuilderReturn, Orientation } from '../../internal/types.js';
import type { createSeparator } from './create.js';
export type CreateSeparatorProps = {
    orientation?: Orientation;
    decorative?: boolean;
};
export type Separator = BuilderReturn<typeof createSeparator>;
export type SeparatorElements = Separator['elements'];
export type SeparatorOptions = Separator['options'];
