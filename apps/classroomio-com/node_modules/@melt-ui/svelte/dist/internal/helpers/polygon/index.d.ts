export * from './hull.js';
import { type Point, type Polygon } from './hull.js';
export declare function getPointsFromEl(el: HTMLElement): Array<Point>;
export declare function makeHullFromElements(els: Array<HTMLElement>): Array<Point>;
export declare function pointInPolygon(point: Point, polygon: Polygon): boolean;
