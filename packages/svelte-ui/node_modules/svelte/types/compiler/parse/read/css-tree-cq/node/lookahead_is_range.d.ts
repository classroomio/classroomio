/**
 * Looks ahead to determine if query feature is a range query. This involves locating at least one delimiter and no
 * colon tokens.
 *
 * @returns {boolean} Is potential range query.
 */
export declare function lookahead_is_range(): boolean;
