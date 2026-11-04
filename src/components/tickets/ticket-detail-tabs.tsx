"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TicketDetailTabs(props: {
  labels: {
    overview: string;
    work: string;
    costs: string;
    timeline: string;
  };
  overview: React.ReactNode;
  work: React.ReactNode;
  costs: React.ReactNode;
  timeline: React.ReactNode;
  /** Desktop shows side-by-side columns; tabs remain for mobile. */
  desktopSplit?: {
    main: React.ReactNode;
    aside: React.ReactNode;
  };
}) {
  return (
    <div className="mt-6 space-y-6">
      {props.desktopSplit ? (
        <div className="hidden gap-6 lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.85fr)] lg:items-start">
          <div className="min-w-0 space-y-5">{props.desktopSplit.main}</div>
          <aside className="min-w-0 space-y-5 lg:sticky lg:top-20">
            {props.desktopSplit.aside}
          </aside>
        </div>
      ) : null}

      <Tabs
        defaultValue="overview"
        className={props.desktopSplit ? "lg:hidden" : undefined}
      >
        <div className="sticky top-14 z-10 -mx-1 border-b border-[var(--border)] bg-[var(--background)]/95 px-1 py-2 backdrop-blur-sm">
          <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0">
            <TabsTrigger
              value="overview"
              className="shrink-0 data-[state=active]:shadow-none"
            >
              {props.labels.overview}
            </TabsTrigger>
            <TabsTrigger
              value="work"
              className="shrink-0 data-[state=active]:shadow-none"
            >
              {props.labels.work}
            </TabsTrigger>
            <TabsTrigger
              value="costs"
              className="shrink-0 data-[state=active]:shadow-none"
            >
              {props.labels.costs}
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="shrink-0 data-[state=active]:shadow-none"
            >
              {props.labels.timeline}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview" className="mt-4 space-y-5">
          {props.overview}
        </TabsContent>
        <TabsContent value="work" className="mt-4 space-y-5">
          {props.work}
        </TabsContent>
        <TabsContent value="costs" className="mt-4 space-y-5">
          {props.costs}
        </TabsContent>
        <TabsContent value="timeline" className="mt-4 space-y-4">
          {props.timeline}
        </TabsContent>
      </Tabs>

      {props.desktopSplit ? (
        <div className="hidden space-y-5 lg:block">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <div className="min-w-0 space-y-5">{props.costs}</div>
            <div className="min-w-0 space-y-5">{props.timeline}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
