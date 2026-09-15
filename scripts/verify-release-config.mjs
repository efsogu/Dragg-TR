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

const gatedCheckout = "ref: ${{ github.event.workflow_run.head_sha }}";
if (!productionWorkflow.includes(gatedCheckout)) {
  throw new Error(
    "Release safety invariant failed: production deploy must checkout github.event.workflow_run.head_sha, not a moving branch ref.",
  );
}

if (/\bref:\s*main\b/.test(productionWorkflow)) {
  throw new Error(
    "Release safety invariant failed: production deploy still contains a moving ref: main checkout.",
  );
}

if (!productionWorkflow.includes('test "$ACTUAL_SHA" = "$GATED_SHA"')) {
  throw new Error(
    "Release safety invariant failed: production deploy must assert the checked-out SHA matches the gated SHA.",
  );
}

console.log("VERCEL_MAIN_NATIVE_AUTODEPLOY_DISABLED");
console.log("VERCEL_PRODUCTION_EXACT_GATED_SHA_ENFORCED");
