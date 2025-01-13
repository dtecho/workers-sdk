import { runFrameworkGenerator } from "frameworks/index";
import type { TemplateConfig } from "../../src/templates";
import type { C3Context } from "types";

const generate = async (ctx: C3Context) => {
	await runFrameworkGenerator(ctx, [ctx.project.name, "classic"]);
};

const config: TemplateConfig = {
	configVersion: 1,
	id: "docusaurus",
	frameworkCli: "create-docusaurus",
	platform: "workers",
	displayName: "Docusaurus",
	copyFiles: {
		path: "./templates",
	},
	path: "templates-experimental/docusaurus",
	generate,
	transformPackageJson: async (_, ctx) => ({
		scripts: {
			deploy: `${ctx.packageManager.npm} run build && wrangler deploy`,
			preview: `${ctx.packageManager.npm} run build && wrangler dev`,
		},
	}),
	devScript: "start",
	deployScript: "deploy",
};
export default config;
