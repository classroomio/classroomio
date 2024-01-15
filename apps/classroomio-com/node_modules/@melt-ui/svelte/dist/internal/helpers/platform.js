export const isDom = () => typeof window !== 'undefined';
export function getPlatform() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agent = navigator.userAgentData;
    return agent?.platform ?? navigator.platform;
}
const pt = (v) => isDom() && v.test(getPlatform());
const ua = (v) => isDom() && v.test(navigator.userAgent);
const vn = (v) => isDom() && v.test(navigator.vendor);
export const isTouchDevice = () => isDom() && !!navigator.maxTouchPoints;
export const isMac = () => pt(/^Mac/) && !isTouchDevice();
export const isIPhone = () => pt(/^iPhone/);
export const isSafari = () => isApple() && vn(/apple/i);
export const isFirefox = () => ua(/firefox\//i);
export const isApple = () => pt(/mac|iphone|ipad|ipod/i);
export const isIos = () => isApple() && !isMac();
