export const copyTextToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
    }
    catch {
        throw new Error('Not able to copy');
    }
};
export const pxToPt = (px) => isNaN(Number(px)) ? null : (parseInt(px, 10) * 3) / 4;
export const withMargin = (props) => [
    withSpace(props.m, ['margin']),
    withSpace(props.mx, ['marginLeft', 'marginRight']),
    withSpace(props.my, ['marginTop', 'marginBottom']),
    withSpace(props.mt, ['marginTop']),
    withSpace(props.mr, ['marginRight']),
    withSpace(props.mb, ['marginBottom']),
    withSpace(props.ml, ['marginLeft'])
].filter((s) => Object.keys(s).length)[0];
const withSpace = (value, properties) => {
    return properties.reduce((styles, property) => {
        if (value) {
            return { ...styles, [property]: `${value}px` };
        }
        return styles;
    }, {});
};
// https://stackoverflow.com/a/61410824
export const styleToString = (style) => {
    return Object.keys(style).reduce((acc, key) => acc +
        key
            .split(/(?=[A-Z])/)
            .join('-')
            .toLowerCase() +
        ':' +
        style[key] +
        ';', '');
};
export const unreachable = (condition, message = `Entered unreachable code. Received '${condition}'.`) => {
    throw new TypeError(message);
};
