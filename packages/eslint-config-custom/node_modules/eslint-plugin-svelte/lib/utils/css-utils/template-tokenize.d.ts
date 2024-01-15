import type { Tokenizer } from 'postcss/lib/tokenize';
import tokenize from 'postcss/lib/tokenize';
type Tokenize = typeof tokenize;
declare function templateTokenize(...args: Parameters<Tokenize>): Tokenizer;
export default templateTokenize;
