import type { Stats, Task, TagCount, TimelineEntry } from '@/lib/types';

export function OverviewPage({
  stats,
  inflight,
  tags,
  timeline,
  loading,
}: {
  stats?: Stats;
  inflight: Task[];
  tags: TagCount[];
  timeline: TimelineEntry[];
  loading: boolean;
}) {
  return <div>Overview placeholder</div>;
}
