export const durationUnitRegex = /[a-zA-Z]/;
export const calculateRgba = (color, opacity) => {
    if (color[0] === '#') {
        color = color.slice(1);
    }
    if (color.length === 3) {
        let res = '';
        color.split('').forEach((c) => {
            res += c;
            res += c;
        });
        color = res;
    }
    const rgbValues = (color.match(/.{2}/g) || []).map((hex) => parseInt(hex, 16)).join(', ');
    return `rgba(${rgbValues}, ${opacity})`;
};
export const range = (size, startAt = 0) => [...Array(size).keys()].map((i) => i + startAt);
// export const characterRange = (startChar, endChar) =>
//   String.fromCharCode(
//     ...range(
//       endChar.charCodeAt(0) - startChar.charCodeAt(0),
//       startChar.charCodeAt(0)
//     )
//   );
// export const zip = (arr, ...arrs) =>
//   arr.map((val, i) => arrs.reduce((list, curr) => [...list, curr[i]], [val]));
