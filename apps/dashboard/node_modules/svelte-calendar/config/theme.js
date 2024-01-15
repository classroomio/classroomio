const light = {
	calendar: {
		width: '700px',
		maxWidth: '100vw',
		legend: {
			height: '45px'
		},
		shadow: '0px 10px 26px rgba(0, 0, 0, 0.25)',
		colors: {
			text: {
				primary: '#333',
				highlight: '#fff'
			},
			background: {
				primary: '#fff',
				highlight: '#eb7400',
				hover: '#eee'
			},
			border: '#eee'
		},
		font: {
			regular: '1.5em',
			large: '37em'
		},
		grid: {
			disabledOpacity: '.35',
			outsiderOpacity: '.6'
		}
	}
};

const dark = {
	calendar: {
		width: '700px',
		maxWidth: '100vw',
		legend: {
			height: '45px'
		},
		shadow: '0px 10px 26px rgba(0, 0, 0, 0.25)',
		colors: {
			text: {
				primary: '#eee',
				highlight: '#fff'
			},
			background: {
				primary: '#333',
				highlight: '#5829d6',
				hover: '#222'
			},
			border: '#222'
		},
		font: {
			regular: '1.5em',
			large: '37em'
		},
		grid: {
			disabledOpacity: '.5',
			outsiderOpacity: '.7'
		}
	}
};

export { light, dark };
