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
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
    state?: string;
    size?: 'small' | 'medium' | 'large';
    limit?: number;
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
    state?: string;
    max_net_price?: number;
    min_grad_rate?: number;
    size?: 'small' | 'medium' | 'large';
    ownership?: 'public' | 'private_nonprofit' | 'private_for_profit';
    degree_type?: 'certificate' | 'associate' | 'bachelor' | 'graduate';
    limit?: number;
  }): Promise<SchoolListResult> {
    return this.post('/tools/find_schools_by_criteria', input);
  }
}
