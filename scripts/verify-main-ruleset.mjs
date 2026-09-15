const REPOSITORY = "efsogu/Dragg-TR";
const REQUIRED_CHECK = "Release ready";
const REQUIRED_RULE_TYPES = [
  "pull_request",
  "deletion",
  "non_fast_forward",
];
const ACTIVE_ENFORCEMENTS = new Set(["active", "enabled"]);
const API_VERSION = "2026-03-10";

function getHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "dragg-tr-release-gate",
    "X-GitHub-Api-Version": API_VERSION,
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function fetchJson(url, label) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: getHeaders(),
        signal: AbortSignal.timeout(10_000),
      });

      if (response.ok) return await response.json();

      const body = await response.text();
      const transient = response.status === 429 || response.status >= 500;
      const error = new Error(
        `${label} request failed with HTTP ${response.status}: ${body.slice(0, 300)}`,
      );

      if (!transient || attempt === 3) throw error;
      lastError = error;
    } catch (error) {
      lastError = error;
      if (attempt === 3) throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
  }

  throw lastError;
}

function targetsMain(ruleset) {
  const include = ruleset?.conditions?.ref_name?.include;
  const exclude = ruleset?.conditions?.ref_name?.exclude ?? [];

  if (!Array.isArray(include)) return false;

  const includesMain = include.some(
    (value) => value === "~DEFAULT_BRANCH" || value === "refs/heads/main",
  );
  const excludesMain = exclude.some(
    (value) => value === "~DEFAULT_BRANCH" || value === "refs/heads/main",
  );

  return includesMain && !excludesMain;
}

function hasRequiredStatusCheck(ruleset) {
  const statusRule = ruleset.rules?.find(
    (rule) => rule.type === "required_status_checks",
  );
  const checks = statusRule?.parameters?.required_status_checks;

  return (
    Array.isArray(checks) &&
    checks.some((check) => check.context === REQUIRED_CHECK)
  );
}

function hasRequiredRuleTypes(ruleset) {
  const ruleTypes = new Set((ruleset.rules ?? []).map((rule) => rule.type));
  return REQUIRED_RULE_TYPES.every((type) => ruleTypes.has(type));
}

const listUrl = `https://api.github.com/repos/${REPOSITORY}/rulesets?includes_parents=false&targets=branch&per_page=100`;
const summaries = await fetchJson(listUrl, "Repository rulesets");

if (!Array.isArray(summaries)) {
  throw new Error("Main protection invariant failed: GitHub rulesets response was not an array.");
}

const activeSummaries = summaries.filter((ruleset) =>
  ACTIVE_ENFORCEMENTS.has(ruleset.enforcement),
);
const details = await Promise.all(
  activeSummaries.map((ruleset) =>
    fetchJson(
      `https://api.github.com/repos/${REPOSITORY}/rulesets/${ruleset.id}?includes_parents=false`,
      `Ruleset ${ruleset.id}`,
    ),
  ),
);

const qualifyingRuleset = details.find(
  (ruleset) =>
    ruleset.target === "branch" &&
    ACTIVE_ENFORCEMENTS.has(ruleset.enforcement) &&
    targetsMain(ruleset) &&
    hasRequiredStatusCheck(ruleset) &&
    hasRequiredRuleTypes(ruleset),
);

if (!qualifyingRuleset) {
  throw new Error(
    "Main protection invariant failed: create an active main/default-branch ruleset that requires the `Release ready` status check, requires pull requests, blocks branch deletion, and blocks force pushes.",
  );
}

console.log(`MAIN_RULESET_PASS=${qualifyingRuleset.id}`);
console.log(`MAIN_REQUIRED_STATUS_CHECK=${REQUIRED_CHECK}`);
console.log("MAIN_PULL_REQUEST_REQUIRED");
console.log("MAIN_DELETION_BLOCKED");
console.log("MAIN_FORCE_PUSH_BLOCKED");
