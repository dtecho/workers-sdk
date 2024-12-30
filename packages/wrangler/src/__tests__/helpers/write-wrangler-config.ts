import * as fs from "fs";
import { formatConfigSnippet } from "../../../../wrangler-shared/src/config";
import type { RawConfig } from "../../../../wrangler-shared/src/config";

/** Write a mock wrangler config file to disk. */
export function writeWranglerConfig(
	config: RawConfig = {},
	path = "./wrangler.toml"
) {
	fs.writeFileSync(
		path,
		formatConfigSnippet(
			{
				compatibility_date: "2022-01-12",
				name: "test-name",
				...config,
			},
			path
		),
		"utf-8"
	);
}
