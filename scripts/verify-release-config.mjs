import { readFile } from "node:fs/promises";

const configUrl = new URL("../vercel.json", import.meta.url);
const config = JSON.parse(await readFile(configUrl, "utf8"));
const deploymentEnabled = config?.git?.deploymentEnabled;

if (
  !deploymentEnabled ||
  typeof deploymentEnabled !== "object" ||
  deploymentEnabled.main !== false
) {
  throw new Error(
    "Release safety invariant failed: vercel.json must set git.deploymentEnabled.main=false so native Git production deploys cannot bypass the GitHub Release Gate.",
  );
}

console.log("VERCEL_MAIN_NATIVE_AUTODEPLOY_DISABLED");
