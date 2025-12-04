import type { CropArea } from 'svelte-easy-crop';

export const getFileFromUrl = async (url: string, fileName = 'cropped.png'): Promise<File> => {
	// Fetch the file data from the URL
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch resource: ${response.status} ${response.statusText}`);
	}

	// Convert the response into a Blob
	const blob = await response.blob();

	// Create and return a File. You can set a custom type if needed.
	return new File([blob], fileName, { type: blob.type });
};

const createImage = (url: string): Promise<HTMLImageElement> => {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		image.addEventListener('load', () => resolve(image));
		image.addEventListener('error', (error) => reject(error));
		image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid cross-origin issues on CodeSandbox
		image.src = url;
	});
};

const getRadianAngle = (degreeValue: number) => {
	return (degreeValue * Math.PI) / 180;
};

/** Gets the cropped image from the src using the cropped area
 *
 * @param imageSrc
 * @param pixelCrop
 * @param rotation
 * @returns
 */
export const getCroppedImg = async (
	imageSrc: string,
	pixelCrop: CropArea,
	rotation = 0
): Promise<string> => {
	const image = await createImage(imageSrc);
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	if (!ctx) {
		throw new Error('Error getting 2d rendering context');
	}

	const maxSize = Math.max(image.width, image.height);
	const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

	// set each dimensions to double largest dimension to allow for a safe area for the
	// image to rotate in without being clipped by canvas context
	canvas.width = safeArea;
	canvas.height = safeArea;

	// translate canvas context to a central location on image to allow rotating around the center.
	ctx.translate(safeArea / 2, safeArea / 2);
	ctx.rotate(getRadianAngle(rotation));
	ctx.translate(-safeArea / 2, -safeArea / 2);

	// draw rotated image and store data.
	ctx.drawImage(image, safeArea / 2 - image.width * 0.5, safeArea / 2 - image.height * 0.5);
	const data = ctx.getImageData(0, 0, safeArea, safeArea);

	// set canvas width to final desired crop size - this will clear existing context
	canvas.width = pixelCrop.width;
	canvas.height = pixelCrop.height;

	// paste generated rotate image with correct offsets for x,y crop values.
	ctx.putImageData(
		data,
		Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
		Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
	);

	return new Promise((resolve) => {
		canvas.toBlob((file) => {
			resolve(URL.createObjectURL(file!));
		}, 'image/png');
	});
};
