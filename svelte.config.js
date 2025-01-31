import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html', // Enable SPA mode
			strict: false // Allow dynamic routes
		}),
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/snapgrade' : ''
		}
	}
};

export default config;
