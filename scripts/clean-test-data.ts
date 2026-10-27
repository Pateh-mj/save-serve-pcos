/**
 * Removes smoke-test data from the database (see scripts/test-data.ts).
 *
 *   npm run db:clean                 smoke-test patients and everything they touched
 *   npm run db:clean -- --metrics    also clears all recorded request timings
 */
import { PrismaClient } from "@prisma/client";
import { cleanTestData } from "./test-data";

const prisma = new PrismaClient();

cleanTestData(prisma, { metricsSince: process.argv.includes("--metrics") ? new Date(0) : undefined })
  .then((r) =>
    console.log(
      `Removed ${r.users} test user(s), ${r.ledger} ledger entr(ies), ${r.sms} SMS, ${r.sessions} USSD session(s), ${r.metrics} timing(s). NGO pools re-reconciled.`
    )
  )
  .finally(() => prisma.$disconnect());
