import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
	assetsInclude: ["**/*.wasm"],
	build: {
		assetsInlineLimit: 0,
		emitAssets: true,
	},
	plugins: [cloudflare({ persistState: false })],
});
