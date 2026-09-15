import { readFile } from "node:fs/promises";

const vercelConfigUrl = new URL("../vercel.json", import.meta.url);
const productionWorkflowUrl = new URL(
  "../.github/workflows/vercel-production.yml",
  import.meta.url,
);

const [vercelConfigText, productionWorkflow] = await Promise.all([
  readFile(vercelConfigUrl, "utf8"),
  readFile(productionWorkflowUrl, "utf8"),
]);

const config = JSON.parse(vercelConfigText);
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

if (!productionWorkflow.includes("github.event.workflow_run.event == 'push'")) {
  throw new Error(
    "Release safety invariant failed: production deploy must only consume Release Gate runs triggered by a main push.",
  );
}

if (!/\bref:\s*main\b/.test(productionWorkflow)) {
  throw new Error(
    "Release safety invariant failed: privileged workflow_run deploy must checkout the trusted main branch, not an event-controlled ref.",
  );
}

if (productionWorkflow.includes("ref: ${{ github.event.workflow_run.head_sha }}")) {
  throw new Error(
    "Release safety invariant failed: privileged workflow_run deploy must not checkout event-controlled head_sha directly.",
  );
}

if (!productionWorkflow.includes('test "$ACTUAL_SHA" = "$GATED_SHA"')) {
  throw new Error(
    "Release safety invariant failed: production deploy must assert trusted main exactly matches the commit that passed the gate.",
  );
}

console.log("VERCEL_MAIN_NATIVE_AUTODEPLOY_DISABLED");
console.log("VERCEL_PRODUCTION_PUSH_ONLY_GATE_ENFORCED");
console.log("VERCEL_PRODUCTION_TRUSTED_MAIN_SHA_MATCH_ENFORCED");
