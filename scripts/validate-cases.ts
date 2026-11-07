/** Checks every built-in case against the same schema AI cases must pass. Run: npm run validate */
import { CASE_BANK } from "../lib/cases";
import { caseSchema } from "../lib/schema";
import { DEVICE_IDS } from "../lib/devices";

let failed = 0;
for (const c of CASE_BANK) {
  const r = caseSchema.safeParse(c);
  if (!r.success) {
    failed++;
    console.error(`✗ ${c.id}:`, r.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; "));
  }
}
for (const d of DEVICE_IDS) {
  if (!CASE_BANK.some((c) => c.device === d)) {
    failed++;
    console.error(`✗ no bank case for device "${d}"`);
  }
}
console.log(failed ? `${failed} problem(s)` : `✓ ${CASE_BANK.length} cases valid, every device covered`);
process.exit(failed ? 1 : 0);
