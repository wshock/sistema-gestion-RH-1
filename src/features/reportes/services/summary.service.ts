import * as summaryData from "@/features/reportes/data/summary";
import type { ReportTotals } from "@/features/reportes/types";
import { ok, unexpected, type Result } from "@/lib/result";

export async function getReportTotals(): Promise<Result<ReportTotals>> {
  try {
    return ok(await summaryData.getReportTotals());
  } catch (error) {
    return unexpected("getReportTotals", error);
  }
}
