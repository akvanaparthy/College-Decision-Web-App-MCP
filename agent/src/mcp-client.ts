import type {
  SchoolListResult,
  SchoolProfile,
  ComparisonResult,
} from './types.js';

export interface McpClientOptions {
  baseUrl: string;
  timeoutMs?: number;
}

export interface McpErrorBody {
  error?: { code?: string; message?: string; fields?: unknown };
}

export class McpClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(opts: McpClientOptions) {
    if (!opts.baseUrl) {
      throw new Error('McpClient requires a baseUrl (set MCP_BASE_URL in .env).');
    }
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this.timeoutMs = opts.timeoutMs ?? 12_000;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      // Strip null fields before forwarding. Tool schemas use .nullable()
      // (required for OpenAI strict mode), so the model passes null to mean
      // "no preference" — but the wrapper's Zod schemas treat absence (not null)
      // as the canonical "not provided." Stripping nulls reconciles the two.
      const cleaned = stripNulls(body);
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleaned),
        signal: controller.signal,
      });
      if (!res.ok) {
        let errBody: McpErrorBody = {};
        try {
          errBody = (await res.json()) as McpErrorBody;
        } catch {
          // body wasn't JSON; ignore
        }
        const detail = errBody.error?.message ?? res.statusText;
        throw new Error(`MCP wrapper ${path} → ${res.status}: ${detail}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`MCP wrapper ${path} timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  searchSchools(input: {
    query: string;
    state?: string | null;
    size?: 'small' | 'medium' | 'large' | null;
    limit?: number | null;
  }): Promise<SchoolListResult> {
    return this.post('/tools/search_schools', input);
  }

  getSchoolProfile(input: { school_id: number }): Promise<SchoolProfile> {
    return this.post('/tools/get_school_profile', input);
  }

  compareSchools(input: { school_ids: number[] }): Promise<ComparisonResult> {
    return this.post('/tools/compare_schools', input);
  }

  findSchoolsByCriteria(input: {
    state?: string | null;
    max_net_price?: number | null;
    min_grad_rate?: number | null;
    size?: 'small' | 'medium' | 'large' | null;
    ownership?: 'public' | 'private_nonprofit' | 'private_for_profit' | null;
    degree_type?: 'certificate' | 'associate' | 'bachelor' | 'graduate' | null;
    limit?: number | null;
  }): Promise<SchoolListResult> {
    return this.post('/tools/find_schools_by_criteria', input);
  }
}

/**
 * Recursively remove `null`-valued keys from an object. Plain values, arrays,
 * and nested objects are walked; non-null primitives pass through unchanged.
 */
function stripNulls(value: unknown): unknown {
  if (value === null) return undefined;
  if (Array.isArray(value)) {
    return value
      .map((item) => stripNulls(item))
      .filter((item) => item !== undefined);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = stripNulls(v);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return out;
  }
  return value;
}
