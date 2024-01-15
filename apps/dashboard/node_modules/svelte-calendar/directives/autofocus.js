export default (node, { delay = 0 }) => {
	setTimeout(node.focus.bind(node), delay);
};
