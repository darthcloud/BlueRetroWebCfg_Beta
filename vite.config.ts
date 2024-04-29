import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(), 
		mkcert() 
	], 
	server: {
		proxy: {},
	},
});