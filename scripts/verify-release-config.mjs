import { readdir, readFile } from "node:fs/promises";

const vercelConfigUrl = new URL("../vercel.json", import.meta.url);
const workflowsDirUrl = new URL("../.github/workflows/", import.meta.url);
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
  workflowFileNames,
] = await Promise.all([
  readFile(vercelConfigUrl, "utf8"),
  readFile(productionWorkflowUrl, "utf8"),
  readFile(releaseGateUrl, "utf8"),
  readFile(standaloneE2EUrl, "utf8"),
  readdir(workflowsDirUrl),
]);

const workflowFiles = await Promise.all(
  workflowFileNames
    .filter((name) => /\.ya?ml$/i.test(name))
    .map(async (name) => [name, await readFile(new URL(name, workflowsDirUrl), "utf8")]),
);

const config = JSON.parse(vercelConfigText);
const deploymentEnabled = config?.git?.deploymentEnabled;

const actionPins = {
  checkout: "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
  setupNode: "actions/setup-node@820762786026740c76f36085b0efc47a31fe5020",
  uploadArtifact:
    "actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a",
};

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

const hostedAuthJobMarker = "\n  hosted-auth-preflight:";
const releaseReadyJobMarker = "\n  release-ready:";
const hostedAuthJobIndex = releaseGateWorkflow.indexOf(hostedAuthJobMarker);
const releaseReadyJobIndex = releaseGateWorkflow.indexOf(releaseReadyJobMarker);

if (hostedAuthJobIndex < 0) {
  throw new Error(
    "Hosted auth invariant failed: Dragg-TR Release Gate must define a hosted-auth-preflight job.",
  );
}

if (
  !releaseGateWorkflow.includes(
    "node scripts/verify-hosted-auth-provider.mjs",
  )
) {
  throw new Error(
    "Hosted auth invariant failed: Release Gate must run verify-hosted-auth-provider.mjs.",
  );
}

if (releaseReadyJobIndex < 0) {
  throw new Error(
    "Release safety invariant failed: Dragg-TR Release Gate must define release-ready.",
  );
}

const releaseReadySection = releaseGateWorkflow.slice(releaseReadyJobIndex);
if (!releaseReadySection.includes("- hosted-auth-preflight")) {
  throw new Error(
    "Hosted auth invariant failed: release-ready must depend on hosted-auth-preflight.",
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

function assertNode24ActionPins(workflowName, workflowText, requireUpload) {
  if (!workflowText.includes(actionPins.checkout)) {
    throw new Error(
      `Action runtime invariant failed: ${workflowName} must use SHA-pinned actions/checkout v7.0.1 (Node 24).`,
    );
  }

  if (!workflowText.includes(actionPins.setupNode)) {
    throw new Error(
      `Action runtime invariant failed: ${workflowName} must use SHA-pinned actions/setup-node v7.0.0 (Node 24).`,
    );
  }

  if (requireUpload && !workflowText.includes(actionPins.uploadArtifact)) {
    throw new Error(
      `Action runtime invariant failed: ${workflowName} must use SHA-pinned actions/upload-artifact v7.0.1 (Node 24).`,
    );
  }
}

function getExternalActions(workflowText) {
  const actions = [];

  for (const line of workflowText.split("\n")) {
    const trimmed = line.trimStart();
    let marker = null;

    if (trimmed.startsWith("- uses:")) {
      marker = "- uses:";
    } else if (trimmed.startsWith("uses:")) {
      marker = "uses:";
    }

    if (!marker) continue;

    const valueWithComment = trimmed.slice(marker.length).trim();
    const commentIndex = valueWithComment.indexOf(" #");
    const action = (
      commentIndex >= 0
        ? valueWithComment.slice(0, commentIndex)
        : valueWithComment
    ).trim();

    if (action && !action.startsWith("./")) actions.push(action);
  }

  return actions;
}

function assertWorkflowSupplyChain(workflowName, workflowText) {
  if (workflowText.includes("runs-on: ubuntu-latest")) {
    throw new Error(
      `CI reproducibility invariant failed: ${workflowName} must not use ubuntu-latest.`,
    );
  }

  const externalActions = getExternalActions(workflowText);
  for (const action of externalActions) {
    if (!/@[0-9a-f]{40}$/i.test(action)) {
      throw new Error(
        `Supply-chain invariant failed: ${workflowName} action ${action} must be pinned to a full 40-character commit SHA.`,
      );
    }
  }

  const expectedByPrefix = [
    ["actions/checkout@", actionPins.checkout],
    ["actions/setup-node@", actionPins.setupNode],
    ["actions/upload-artifact@", actionPins.uploadArtifact],
  ];

  for (const [prefix, expected] of expectedByPrefix) {
    const referenced = externalActions.filter((action) => action.startsWith(prefix));

    if (referenced.some((action) => action !== expected)) {
      throw new Error(
        `Action runtime invariant failed: ${workflowName} must use approved Node 24 pin ${expected}.`,
      );
    }
  }
}

assertPinnedSupabaseCli("Dragg-TR Release Gate", releaseGateWorkflow);
assertPinnedSupabaseCli("standalone E2E", standaloneE2EWorkflow);
assertNode24ActionPins("production deploy", productionWorkflow, false);
assertNode24ActionPins("Dragg-TR Release Gate", releaseGateWorkflow, true);
assertNode24ActionPins("standalone E2E", standaloneE2EWorkflow, true);

for (const [workflowName, workflowText] of workflowFiles) {
  assertWorkflowSupplyChain(workflowName, workflowText);
}

console.log("VERCEL_MAIN_NATIVE_AUTODEPLOY_DISABLED");
console.log("VERCEL_PRODUCTION_PUSH_ONLY_GATE_ENFORCED");
console.log("VERCEL_PRODUCTION_TRUSTED_MAIN_SHA_MATCH_ENFORCED");
console.log("VERCEL_PRODUCTION_RUNNER_PINNED=ubuntu-24.04");
console.log("VERCEL_PRODUCTION_CLI_PINNED=59.16.0");
console.log("VERCEL_PRODUCTION_PERMISSIONS_MINIMIZED");
console.log("HOSTED_AUTH_PREFLIGHT_ENFORCED");
console.log("SUPABASE_CLI_PINNED=2.117.0");
console.log("CI_RUNNER_PINNED=ubuntu-24.04");
console.log("GITHUB_ACTION_RUNTIME_PINS_NODE24_ENFORCED");
console.log(`WORKFLOW_SUPPLY_CHAIN_SCAN_PASS=${workflowFiles.length}`);
