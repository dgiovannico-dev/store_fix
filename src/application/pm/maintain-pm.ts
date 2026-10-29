import { expandAllPmSeries } from "@/domain/pm/pm-series-service";
import { remindDuePmEvents } from "@/application/pm/remind-due";

/**
 * Job unico F3-05: espandi RRULE + promemoria visite imminenti.
 */
export async function maintainPmJobs(now = new Date()): Promise<{
  series: number;
  created: number;
  reminded: number;
}> {
  const expanded = await expandAllPmSeries(now);
  const reminded = await remindDuePmEvents(now);
  return {
    series: expanded.series,
    created: expanded.created,
    reminded: reminded.reminded,
  };
}
