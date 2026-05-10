// Mirrors the agent backend's response shapes.

export type Ownership =
  | 'public'
  | 'private_nonprofit'
  | 'private_for_profit'
  | 'unknown';

export interface SchoolSummary {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  ownership: Ownership;
  size: number | null;
  net_price_year: number | null;
  admission_rate: number | null;
  grad_rate: number | null;
  url: string | null;
}

export interface SchoolProfile extends SchoolSummary {
  tuition_in_state: number | null;
  tuition_out_of_state: number | null;
  median_earnings_10yr: number | null;
  median_debt: number | null;
  source: string;
}

export interface ComparisonRow {
  metric: string;
  values: Record<string, string | number | null>;
}

export interface ComparisonFailure {
  school_id: number;
  reason: string;
}

export interface ComparisonResult {
  schools: SchoolProfile[];
  rows: ComparisonRow[];
  failures: ComparisonFailure[];
  source: string;
}

export interface SchoolListResult {
  schools: SchoolSummary[];
  total_matching: number;
  returned: number;
  applied_filters: Record<string, unknown>;
  source: string;
}

export interface ToolCallRecord {
  name: string;
  args: unknown;
  result: unknown;
  error?: string;
  duration_ms: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
  tool_calls: ToolCallRecord[];
  iterations: number;
}
