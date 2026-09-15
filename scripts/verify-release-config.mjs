import { readFile } from "node:fs/promises";

const vercelConfigUrl = new URL("../vercel.json", import.meta.url);
const productionWorkflowUrl = new URL(
  "../.github/workflows/vercel-production.yml",
  import.meta.url,
);
const releaseGateUrl = new URL(
  "../.github/workflows/dragg-tr-release-gate.yml",
  import.meta.url,
);
const standaloneE2EUrl = new URL(
  "../.github/workflows/e2e.yml",
  import.meta.url,
);

const [
  vercelConfigText,
  productionWorkflow,
  releaseGateWorkflow,
  standaloneE2EWorkflow,
] = await Promise.all([
  readFile(vercelConfigUrl, "utf8"),
  readFile(productionWorkflowUrl, "utf8"),
  readFile(releaseGateUrl, "utf8"),
  readFile(standaloneE2EUrl, "utf8"),
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

if (!productionWorkflow.includes("runs-on: ubuntu-24.04")) {
  throw new Error(
    "Release reproducibility invariant failed: production deploy runner must be pinned to ubuntu-24.04.",
  );
}

if (!productionWorkflow.includes("VERCEL_CLI_VERSION: 59.16.0")) {
  throw new Error(
    "Release reproducibility invariant failed: Vercel CLI must be pinned to 59.16.0.",
  );
}

if (productionWorkflow.includes("vercel@latest")) {
  throw new Error(
    "Release reproducibility invariant failed: production deploy must not install vercel@latest.",
  );
}

if (
  !productionWorkflow.includes(
    'npm install --global "vercel@${VERCEL_CLI_VERSION}"',
  )
) {
  throw new Error(
    "Release reproducibility invariant failed: production deploy must install the declared VERCEL_CLI_VERSION.",
  );
}

if (
  !productionWorkflow.includes(
    'test "$ACTUAL_VERSION" = "$VERCEL_CLI_VERSION"',
  )
) {
  throw new Error(
    "Release reproducibility invariant failed: production deploy must verify the installed Vercel CLI version before use.",
  );
}

if (productionWorkflow.includes("checks: read")) {
  throw new Error(
    "Least-privilege invariant failed: production workflow must not request unused checks:read permission.",
  );
}

function assertPinnedSupabaseCli(workflowName, workflowText) {
  if (workflowText.includes("version: latest")) {
    throw new Error(
      `CI reproducibility invariant failed: ${workflowName} must not use Supabase CLI latest.`,
    );
  }

  if (!workflowText.includes("version: 2.117.0")) {
    throw new Error(
      `CI reproducibility invariant failed: ${workflowName} must pin Supabase CLI 2.117.0.`,
    );
  }

  if (!workflowText.includes('test "$(supabase --version)" = "2.117.0"')) {
    throw new Error(
      `CI reproducibility invariant failed: ${workflowName} must verify the installed Supabase CLI version.`,
    );
  }

  if (!workflowText.includes("runs-on: ubuntu-24.04")) {
    throw new Error(
      `CI reproducibility invariant failed: ${workflowName} must use ubuntu-24.04.`,
    );
  }
}

assertPinnedSupabaseCli("Dragg-TR Release Gate", releaseGateWorkflow);
assertPinnedSupabaseCli("standalone E2E", standaloneE2EWorkflow);

console.log("VERCEL_MAIN_NATIVE_AUTODEPLOY_DISABLED");
console.log("VERCEL_PRODUCTION_PUSH_ONLY_GATE_ENFORCED");
console.log("VERCEL_PRODUCTION_TRUSTED_MAIN_SHA_MATCH_ENFORCED");
console.log("VERCEL_PRODUCTION_RUNNER_PINNED=ubuntu-24.04");
console.log("VERCEL_PRODUCTION_CLI_PINNED=59.16.0");
console.log("VERCEL_PRODUCTION_PERMISSIONS_MINIMIZED");
console.log("SUPABASE_CLI_PINNED=2.117.0");
console.log("CI_RUNNER_PINNED=ubuntu-24.04");
