function replaceTailwindClassesWithInlineStyles(element: Element) {
	if (element.hasAttribute('class')) {
		// Convert classes to inline styles
		let inlineStyles = '';
		element.classList.forEach((cls) => {
			if (cls.startsWith('fill-')) {
				const colorName = cls.replace('fill-', '');
				const color = getComputedStyle(document.documentElement).getPropertyValue(
					`--color-${colorName}`
				);
				if (color) {
					inlineStyles += `fill: ${color};`;
				}
			} else if (cls.startsWith('stroke-')) {
				const colorName = cls.replace('stroke-', '');
				const color = getComputedStyle(document.documentElement).getPropertyValue(
					`--color-${colorName}`
				);
				if (color) {
					inlineStyles += `stroke: ${color};`;
				}
			}
		});

		// Set inline styles
		if (inlineStyles) {
			const existingStyle = element.getAttribute('style') || '';
			element.setAttribute('style', existingStyle + inlineStyles);
		}

		// Remove class attribute
		element.removeAttribute('class');
	}

	// Recursively process child elements
	element.childNodes.forEach((child) => {
		if (child.nodeType === Node.ELEMENT_NODE) {
			replaceTailwindClassesWithInlineStyles(child as Element);
		}
	});
}

export function exportAsSVG(svgElement: SVGSVGElement, filename: string) {
	const serializer = new XMLSerializer();

	// Recursively replace all tailwind classes with inline styles in a clone of the SVG
	const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
	replaceTailwindClassesWithInlineStyles(svgClone);

	// Serialize the modified SVG
	const svgString = serializer.serializeToString(svgClone);
	const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
	const url = URL.createObjectURL(blob);

	// Create a link element to download the SVG
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	// Release the object URL
	URL.revokeObjectURL(url);
}
