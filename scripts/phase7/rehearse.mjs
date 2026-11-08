// Never accepts a database URL. Only a new networkless local Docker fixture.
import { mkdirSync, writeFileSync } from "node:fs";
import { startFixture } from "../phase3/local-fixture.mjs";
import { seedCatalog } from "../../tests/phase5/fixture.mjs";
import { orderFixture } from "../../tests/phase6/fixture.mjs";
import { hardeningDatabaseTests } from "../../tests/phase7/database.mjs";
const f = await startFixture();
try {
  const seed=await seedCatalog(f);
  const {checks}=await hardeningDatabaseTests(f,seed);
  const orders=orderFixture(f,seed);
  orders.submit(orders.body()); // Synthetic contact/snapshot only, never a real order.
  const recovery=f.rehearseRecovery();
  mkdirSync('work/phase7-review',{recursive:true});
  writeFileSync('work/phase7-review/rehearsal.json',JSON.stringify({ simulatedAuthAndStorage:true, realLocalPostgres:true, foundationAssertions:f.assertions,hardeningAssertions:checks,recovery },null,2)+'\n');
  console.log(JSON.stringify({event:'local_recovery_passed',...recovery}));
} finally { await f.close(); }
