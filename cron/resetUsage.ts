import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function startResetUsageCronJob() {
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log("[CRON] Starting daily usage reset");

      try {
        await prisma.usage.updateMany({
          data: { messageCount: 0, pdfCount: 0 },
        });

        console.log("[CRON] Usage reset completed successfully");
      } catch (error) {
        console.error("[CRON] Failed to reset usage:", error);
      }
    },
    {
      timezone: "Asia/Kolkata",
    },
  );
}

startResetUsageCronJob();
