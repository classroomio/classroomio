export default (node, { fn, duration }) => {
	const interval = setInterval(fn, duration);
	return () => {
		clearInterval(interval);
	};
};
