export default {
	async fetch(request, env) {
		return await env.WORKER_B.fetch(request);
	},
};
