import fs from "node:fs";

const expected = {
  next: "16.3.5",
  eslintConfigNext: "16.3.5",
  sharp: "0.35.4",
};

function fail(message) {
  console.error(`SECURITY_VERSION_CHECK_FAIL: ${message}`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const workspace = fs.readFileSync("pnpm-workspace.yaml", "utf8");
const lockfile = fs.readFileSync("pnpm-lock.yaml", "utf8");

if (pkg.dependencies?.next !== expected.next) {
  fail(`package.json next=${pkg.dependencies?.next ?? "missing"}`);
}

if (pkg.devDependencies?.["eslint-config-next"] !== expected.eslintConfigNext) {
  fail(
    `package.json eslint-config-next=${pkg.devDependencies?.["eslint-config-next"] ?? "missing"}`,
  );
}

if (pkg.overrides?.sharp !== expected.sharp) {
  fail(`package.json sharp override=${pkg.overrides?.sharp ?? "missing"}`);
}

if (!/^ {2}sharp: 0\.35\.4$/m.test(workspace)) {
  fail("pnpm-workspace.yaml sharp override is not exactly 0.35.4");
}

const lockHeader = lockfile.slice(0, 1500);
if (!/^ {2}sharp: 0\.35\.4$/m.test(lockHeader)) {
  fail("pnpm-lock.yaml sharp override header is not exactly 0.35.4");
}

if (!/next:\n\s+specifier: 16\.3\.5\n\s+version: 16\.3\.5/m.test(lockfile)) {
  fail("pnpm-lock.yaml does not resolve next 16.3.5");
}

if (!/eslint-config-next:\n\s+specifier: 16\.3\.5\n\s+version: 16\.3\.5/m.test(lockfile)) {
  fail("pnpm-lock.yaml does not resolve eslint-config-next 16.3.5");
}

if (!/["']?sharp@0\.35\.4["']?:/m.test(lockfile)) {
  fail("pnpm-lock.yaml does not contain sharp@0.35.4");
}

console.log(
  `SECURITY_VERSION_CHECK_PASS next=${expected.next} eslint-config-next=${expected.eslintConfigNext} sharp=${expected.sharp}`,
);
