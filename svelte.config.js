import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			strict: false
		}),
		paths: {
			base: '/snapgrade' // necessary for deploying to github pages,
		}
	}
};

export default config;

// The configuration you have looks correct for GitHub Pages deployment. Here's why each part is important:

// The base: '/snapgrade' setting tells SvelteKit that all assets and routes should be prefixed with /snapgrade. This is crucial because your site will be hosted at yourusername.github.io/snapgrade/ rather than at the root domain.
