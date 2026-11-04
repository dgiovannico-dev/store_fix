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
}) {
  return (
    <Tabs defaultValue="overview" className="mt-6">
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="overview">{props.labels.overview}</TabsTrigger>
        <TabsTrigger value="work">{props.labels.work}</TabsTrigger>
        <TabsTrigger value="costs">{props.labels.costs}</TabsTrigger>
        <TabsTrigger value="timeline">{props.labels.timeline}</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-6">
        {props.overview}
      </TabsContent>
      <TabsContent value="work" className="space-y-6">
        {props.work}
      </TabsContent>
      <TabsContent value="costs" className="space-y-6">
        {props.costs}
      </TabsContent>
      <TabsContent value="timeline" className="space-y-4">
        {props.timeline}
      </TabsContent>
    </Tabs>
  );
}
