import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const PRESENTATION_ID = import.meta.env.VITE_GOOGLE_SLIDES_PRESENTATION_ID || '178Ew3mhPWUgj6QwGDJcG_veuyd7hXle-SQj_6D7aQCk';
const SLIDE_DURATION = 5000; // 5 seconds per slide

function GoogleSlidePage({ title = 'Station Information' }) {
	const [slides, setSlides] = useState([]);
	const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Fetch slides from Supabase Edge Function
	useEffect(() => {
		async function fetchSlides() {
			try {
				console.log('Fetching slides for presentation:', PRESENTATION_ID);
				console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
				console.log('Supabase client:', supabase);
				
				// Test direct function call with more options
				console.log('Calling function with presentationId:', PRESENTATION_ID);
				
				const { data, error } = await supabase.functions.invoke('google-slides', {
					body: { presentationId: PRESENTATION_ID }
				});

				console.log('Edge function response:', { data, error });

				if (error) {
					console.error('Edge function error details:', {
						name: error.name,
						message: error.message,
						status: error.status,
						statusText: error.statusText,
						context: error.context,
						stack: error.stack
					});
					
					// Check if it's a 401 specifically
					if (error.message && error.message.includes('401')) {
						throw new Error(`Authentication Error (401): Edge function missing authorization. Check: 1) Function deployed correctly, 2) Supabase URL/keys correct, 3) RLS policies allow access`);
					}
					
					throw new Error(`Edge Function Error: ${error.message || JSON.stringify(error)}`);
				}

				if (data?.error) {
					console.error('API error in response:', data.error);
					throw new Error(`API Error: ${data.error}`);
				}

				if (data?.slides && data.slides.length > 0) {
					console.log(`Successfully loaded ${data.slides.length} slides`);
					setSlides(data.slides);
					setLoading(false);
				} else {
					throw new Error('No slides returned from API - check edge function logs in Supabase');
				}
			} catch (err) {
				console.error('Error fetching slides:', err);
				setError(err.message || 'Unknown error occurred');
				setLoading(false);
			}
		}

		fetchSlides();
	}, []);

	// Auto-advance slides
	useEffect(() => {
		if (slides.length === 0) return;

		const interval = setInterval(() => {
			setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
		}, SLIDE_DURATION);

		return () => clearInterval(interval);
	}, [slides.length]);

	if (loading) {
		return (
			<div className="google-slide-page" style={{ 
				width: '100%', 
				height: '100%', 
				display: 'flex', 
				alignItems: 'center', 
				justifyContent: 'center',
				color: '#fff',
				fontSize: '1.5rem'
			}}>
				Loading presentation...
			</div>
		);
	}

	if (error) {
		return (
			<div className="google-slide-page" style={{ 
				width: '100%', 
				height: '100%', 
				display: 'flex', 
				flexDirection: 'column',
				alignItems: 'center', 
				justifyContent: 'center',
				color: '#ff6b6b',
				padding: '2rem',
				textAlign: 'center'
			}}>
				<h2 style={{ marginBottom: '1rem' }}>Unable to load presentation</h2>
				<p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#ffaa66' }}>{error}</p>
				
				<div style={{ 
					marginTop: '2rem', 
					padding: '1.5rem', 
					backgroundColor: 'rgba(0,0,0,0.3)', 
					borderRadius: '8px',
					maxWidth: '600px',
					textAlign: 'left',
					fontSize: '0.85rem'
				}}>
					<h3 style={{ color: '#fff', marginBottom: '1rem' }}>Common causes:</h3>
					<ol style={{ color: '#ccc', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
						<li>Edge function not deployed to Supabase</li>
						<li>Database table <code style={{ color: '#ffaa66' }}>google_service_account</code> doesn't exist</li>
						<li>No service account credentials in database</li>
						<li>Service account doesn't have access to presentation</li>
					</ol>
					<p style={{ marginTop: '1rem', color: '#999' }}>
						See <strong>SETUP_CHECKLIST.md</strong> or <strong>docs/GOOGLE_SLIDES_SETUP.md</strong>
					</p>
				</div>

				<p style={{ fontSize: '0.75rem', marginTop: '1.5rem', color: '#666' }}>
					Press F12 to open console for detailed error logs
				</p>
			</div>
		);
	}

	if (slides.length === 0) {
		return (
			<div className="google-slide-page" style={{ 
				width: '100%', 
				height: '100%', 
				display: 'flex', 
				alignItems: 'center', 
				justifyContent: 'center',
				color: '#fff'
			}}>
				No slides available
			</div>
		);
	}

	const currentSlide = slides[currentSlideIndex];

	return (
		<div className="google-slide-page" style={{ 
			width: '100%', 
			height: '100%',
			position: 'relative',
			backgroundColor: '#000'
		}}>
			{/* Current Slide */}
			<img
				src={currentSlide.imageUrl}
				alt={`Slide ${currentSlide.pageNumber}`}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'contain',
					display: 'block'
				}}
			/>

			{/* Slide Counter */}
			<div style={{
				position: 'absolute',
				bottom: '1rem',
				right: '1rem',
				backgroundColor: 'rgba(0, 0, 0, 0.7)',
				color: '#fff',
				padding: '0.5rem 1rem',
				borderRadius: '0.5rem',
				fontSize: '0.9rem',
				fontFamily: 'monospace'
			}}>
				{currentSlide.pageNumber} / {slides.length}
			</div>

			{/* Navigation Dots */}
			<div style={{
				position: 'absolute',
				bottom: '1rem',
				left: '50%',
				transform: 'translateX(-50%)',
				display: 'flex',
				gap: '0.5rem'
			}}>
				{slides.map((_, index) => (
					<div
						key={index}
						style={{
							width: '0.5rem',
							height: '0.5rem',
							borderRadius: '50%',
							backgroundColor: index === currentSlideIndex ? '#fff' : 'rgba(255, 255, 255, 0.3)',
							transition: 'all 0.3s ease'
						}}
					/>
				))}
			</div>
		</div>
	);
}

export default GoogleSlidePage;

