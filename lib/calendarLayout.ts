/**
 * Lay out a single day's timed events into side-by-side lanes so overlapping
 * events don't cover each other. Pure — no DOM, no React.
 */

export interface Interval {
  start: string; // ISO
  end: string; // ISO
}

export interface Placed<T> {
  e: T;
  lane: number; // 0-based column within its overlap cluster
  lanes: number; // total columns in that cluster
}

/**
 * Greedy lane assignment, one independent set of lanes per connected overlap
 * cluster (so a busy morning doesn't shrink an unrelated afternoon event).
 */
export function layoutDay<T extends Interval>(events: T[]): Placed<T>[] {
  const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start));
  const out: Placed<T>[] = [];
  let cluster: Placed<T>[] = [];
  let clusterEnd = "";

  const flush = () => {
    const laneEnds: string[] = [];
    for (const item of cluster) {
      let lane = laneEnds.findIndex((end) => end <= item.e.start);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = item.e.end;
      item.lane = lane;
    }
    for (const item of cluster) {
      item.lanes = laneEnds.length;
      out.push(item);
    }
    cluster = [];
    clusterEnd = "";
  };

  for (const e of sorted) {
    if (cluster.length && e.start >= clusterEnd) flush();
    cluster.push({ e, lane: 0, lanes: 1 });
    if (e.end > clusterEnd) clusterEnd = e.end;
  }
  flush();
  return out;
}
