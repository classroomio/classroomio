export default (node) => {
	const click = (evt) => {
		if (!node || node.contains(evt.target) || evt.defaultPrevented) return;
		node.dispatchEvent(new CustomEvent('blurr', node));
	};

	document.addEventListener('click', click, true);

	return {
		destroy() {
			document.removeEventListener('click', click, true);
		}
	};
};
