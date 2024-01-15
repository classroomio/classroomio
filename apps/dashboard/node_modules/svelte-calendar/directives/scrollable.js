import { scrollStep } from '../config/scroll';

export default (node, opts) => {
	let { y: yi = 0, step = scrollStep } = opts;
	let lastTouch = 0;
	let y = yi;

	const updateY = (val) => {
		const { maxSteps = Infinity } = opts;
		y = Math.max(0, Math.min(maxSteps * step, val));
	};

	const emitY = () => {
		if (Math.round(y / step) === Math.round(yi / step)) return;
		yi = y;
		node.dispatchEvent(
			new CustomEvent('y', {
				detail: {
					y,
					step: Math.round(y / step)
				}
			})
		);
	};

	const wheelListener = ({ deltaY }) => {
		updateY(y + deltaY);
		emitY();
	};
	const touchstartListener = ({ touches: [{ pageY }] }) => {
		lastTouch = pageY;
		emitY();
	};
	const touchmoveListener = ({ touches: [{ pageY }] }) => {
		updateY(y - (pageY - lastTouch));
		lastTouch = pageY;
		emitY();
	};

	node.addEventListener('wheel', wheelListener);
	node.addEventListener('touchstart', touchstartListener);
	node.addEventListener('touchmove', touchmoveListener);
	node.style.touchAction = 'none';

	return {
		destroy() {
			node.removeEventListener('wheel', wheelListener);
			node.removeEventListener('touchstart', touchstartListener);
			node.removeEventListener('touchmove', touchmoveListener);
		}
	};
};
