import * as fs from "fs";
import { findUpSync } from "find-up";
import { getEntry } from "./entry";
import { logger } from "./logger";
import type { Config } from "./config";
import type { CfWorkerInit } from "./worker";

// Currently includes bindings & rules for declaring modules
export type PartialConfigToDTS = CfWorkerInit["bindings"] & {
	rules: Config["rules"];
};
export async function generateTypes(
	configToDTS: PartialConfigToDTS,
	config: Config
) {
	const entry = await getEntry({}, config, "types");
	const envTypeStructure: string[] = [];

	if (configToDTS.kv_namespaces) {
		for (const kvNamespace of configToDTS.kv_namespaces) {
			envTypeStructure.push(`	${kvNamespace.binding}: KVNamespace;`);
		}
	}

	if (configToDTS.vars) {
		for (const varName in configToDTS.vars) {
			const varValue = configToDTS.vars[varName];
			if (
				typeof varValue === "string" ||
				typeof varValue === "number" ||
				typeof varValue === "boolean"
			) {
				envTypeStructure.push(`	${varName}: ${varValue};`);
			}
			if (typeof varValue === "object" && varValue !== null) {
				envTypeStructure.push(`	${varName}: ${JSON.stringify(varValue)};`);
			}
		}
	}

	if (configToDTS.durable_objects?.bindings) {
		for (const durableObject of configToDTS.durable_objects.bindings) {
			envTypeStructure.push(`	${durableObject.name}: DurableObjectNamespace;`);
		}
	}

	if (configToDTS.r2_buckets) {
		for (const R2Bucket of configToDTS.r2_buckets) {
			envTypeStructure.push(`	${R2Bucket.binding}: R2Bucket;`);
		}
	}

	if (configToDTS.d1_databases) {
		for (const d1 of configToDTS.d1_databases) {
			envTypeStructure.push(`	${d1.binding}: D1Database;`);
		}
	}

	if (configToDTS.services) {
		for (const service of configToDTS.services) {
			envTypeStructure.push(`	${service.binding}: Fetcher;`);
		}
	}

	if (configToDTS.dispatch_namespaces) {
		for (const namespace of configToDTS.dispatch_namespaces) {
			envTypeStructure.push(`	${namespace.binding}: any;`);
		}
	}

	if (configToDTS.logfwdr?.schema) {
		envTypeStructure.push(`	LOGFWDR_SCHEMA: any;`);
	}

	if (configToDTS.data_blobs) {
		for (const dataBlobs in configToDTS.data_blobs) {
			envTypeStructure.push(`	${dataBlobs}: ArrayBuffer;`);
		}
	}

	if (configToDTS.text_blobs) {
		for (const textBlobs in configToDTS.text_blobs) {
			envTypeStructure.push(`	${textBlobs}: string;`);
		}
	}

	if (configToDTS.unsafe) {
		for (const unsafe of configToDTS.unsafe) {
			envTypeStructure.push(`	${unsafe.name}: any;`);
		}
	}

	const modulesTypeStructure: string[] = [];
	if (configToDTS.rules) {
		const moduleTypeMap = {
			Text: "string",
			Data: "ArrayBuffer",
			CompiledWasm: "WebAssembly.Module",
		};
		for (const ruleObject of configToDTS.rules) {
			const typeScriptType =
				moduleTypeMap[ruleObject.type as keyof typeof moduleTypeMap];
			if (typeScriptType !== undefined) {
				ruleObject.globs.forEach((glob) => {
					modulesTypeStructure.push(`declare module "*.${glob
						.split(".")
						.at(-1)}" {
	const value: ${typeScriptType};
	export default value;
}`);
				});
			}
		}
	}

	function writeDTSFile(
		typesString: string[],
		formatType: "modules" | "service-worker"
	) {
		const wranglerOverrideDTSPath = findUpSync("worker-configuration.d.ts");
		try {
			if (
				wranglerOverrideDTSPath !== undefined &&
				!fs
					.readFileSync(wranglerOverrideDTSPath, "utf8")
					.includes("***AUTO GENERATED BY WORKERS CLI WRANGLER***")
			) {
				throw new Error(
					"A non-wrangler worker-configuration.d.ts already exists, please rename and try again."
				);
			}
		} catch (error) {
			if (error instanceof Error && !error.message.includes("not found")) {
				throw error;
			}
		}

		let combinedTypeStrings = "";
		if (formatType === "modules") {
			combinedTypeStrings = `interface Env {\n${typesString.join(
				"\n"
			)} \n}\n${modulesTypeStructure.join("\n")}`;
		} else {
			combinedTypeStrings = `declare global {\n${typesString.join(
				"\n"
			)} \n}\n${modulesTypeStructure.join("\n")}`;
		}

		if (envTypeStructure.length || modulesTypeStructure.length) {
			fs.writeFileSync(
				"worker-configuration.d.ts",
				`// Generated by Wrangler on ${new Date()}` + "\n" + combinedTypeStrings
			);
			logger.log(combinedTypeStrings);
		}
	}

	writeDTSFile(envTypeStructure, entry.format);
}
