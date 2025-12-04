import React from 'react';

const DEFAULT_SLIDE =
	'https://docs.google.com/presentation/d/e/2PACX-1vQ_example_embed?start=false&loop=false&delayms=3000';

export function GoogleSlidePage({ src, title = 'Google Slide' }) {
	const iframeSrc = src || DEFAULT_SLIDE;

	return (
		<div className="google-slide-page" style={{ width: '100%', height: '100%' }}>
			<iframe
				title={title}
				src={iframeSrc}
				style={{ width: '100%', height: '100%', border: 0 }}
				allowFullScreen
				loading="lazy"
			/>
		</div>
	);
}

export default GoogleSlidePage;

