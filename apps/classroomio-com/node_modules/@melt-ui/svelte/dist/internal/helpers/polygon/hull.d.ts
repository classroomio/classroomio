export interface Point {
    x: number;
    y: number;
}
export type Polygon = Array<Point>;
export declare function makeHull<P extends Point>(points: Readonly<Array<P>>): Array<P>;
export declare function makeHullPresorted<P extends Point>(points: Readonly<Array<P>>): Array<P>;
export declare function POINT_COMPARATOR(a: Point, b: Point): number;
