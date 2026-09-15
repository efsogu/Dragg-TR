import { readFile } from "node:fs/promises";

const releaseGateUrl = new URL(
  "../.github/workflows/dragg-tr-release-gate.yml",
  import.meta.url,
);
const releaseGateWorkflow = await readFile(releaseGateUrl, "utf8");

const rulesetJobMarker = "\n  repository-ruleset-preflight:";
const releaseReadyJobMarker = "\n  release-ready:";
const rulesetJobIndex = releaseGateWorkflow.indexOf(rulesetJobMarker);
const releaseReadyJobIndex = releaseGateWorkflow.indexOf(releaseReadyJobMarker);

if (rulesetJobIndex < 0) {
  throw new Error(
    "Main protection invariant failed: Dragg-TR Release Gate must define repository-ruleset-preflight.",
  );
}

if (!releaseGateWorkflow.includes("node scripts/verify-main-ruleset.mjs")) {
  throw new Error(
    "Main protection invariant failed: Release Gate must run verify-main-ruleset.mjs.",
  );
}

if (releaseReadyJobIndex < 0) {
  throw new Error(
    "Main protection invariant failed: Dragg-TR Release Gate must define release-ready.",
  );
}

const releaseReadySection = releaseGateWorkflow.slice(releaseReadyJobIndex);
if (!releaseReadySection.includes("- repository-ruleset-preflight")) {
  throw new Error(
    "Main protection invariant failed: release-ready must depend on repository-ruleset-preflight.",
  );
}

console.log("MAIN_RULESET_PREFLIGHT_ENFORCED");
