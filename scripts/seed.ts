import "dotenv/config";
import { runSeed } from "../src/db/seed";

/**
 * CLI seed wrapper (dev usage): pnpm db:seed
 * The production container seeds itself at server start instead
 * (see src/instrumentation.ts).
 */
runSeed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .then(() => process.exit(process.exitCode ?? 0));
