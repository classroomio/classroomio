export default class RageClick {
    clicks: {
        x: number;
        y: number;
        timestamp: number;
    }[];
    enabled: boolean;
    constructor(enabled: boolean);
    isRageClick(x: number, y: number, timestamp: number): boolean;
}
