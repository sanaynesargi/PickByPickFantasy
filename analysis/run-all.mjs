// Run every analysis, regenerating all plots into analysis/plots/.
//   node analysis/run-all.mjs
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const files = readdirSync(HERE).filter((f) => f.endsWith(".mjs") && f !== "run-all.mjs").sort();
for (const f of files) {
  console.log(`\n=== ${f} ===`);
  await import(path.join(HERE, f));
}
console.log("\nAll analyses done → analysis/plots/");
