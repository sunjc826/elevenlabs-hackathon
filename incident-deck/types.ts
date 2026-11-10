import type {Point} from '@hackathon/narrated-deck'
export interface Step {
  show: string; caption: string; say: string; clip: string; duration_seconds: number; target_seconds: number;
  phase?: string; focus?: number; path_states?: string[]; time?: string; at?: number; event?: string;
}
export interface Slide {
  id: string; visual: string; title: string; steps: Step[]; source?: string; lines?: string[]; highlight_line?: number;
  metrics?: { start: string; end: string; range_seconds: number; rate_label: string; feed_label: string; counter_label: string; strategy_label: string; axis_labels: string[]; rate: Point[]; misses: Point[]; halt_seconds: number[] };
  chart?: { x_labels: string[]; x_ticks: number[]; counter_label: string; range_ms: number; finding_ms: number; series: {name: string; color: string; points: Point[]}[] };
  buffers?: {capacities: number[]; drops: number; peak_arrivals: number; note: string};
}
export interface Deck { deck: {title: string; subtitle: string; date: string; timezone: string; path_nodes: string[]; total_seconds: number}; slides: Slide[] }
