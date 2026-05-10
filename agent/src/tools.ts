import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { McpClient } from './mcp-client.js';

/**
 * Build the four LangChain tools that wrap the MCP wrapper's REST endpoints.
 *
 * The descriptions are what the LLM sees when deciding which tool to call —
 * they are deliberately short and disambiguating. The Zod schemas double as:
 *   1. JSON Schema sent to the model (so it knows the argument shape)
 *   2. Runtime validation of arguments before they hit the MCP wrapper
 */
export function buildTools(mcp: McpClient) {
  const searchSchoolsTool = tool(
    async (input) => mcp.searchSchools(input),
    {
      name: 'search_schools',
      description:
        'Search U.S. colleges by (partial) name with optional filters. Use this when the user names a school or partial name. Returns up to 10 matching schools with key stats including id (needed for get_school_profile and compare_schools).',
      schema: z.object({
        query: z
          .string()
          .min(1)
          .describe('School name or partial name to search for'),
        state: z
          .string()
          .length(2)
          .optional()
          .describe('2-letter state code, e.g. CA'),
        size: z
          .enum(['small', 'medium', 'large'])
          .optional()
          .describe(
            'Student size bucket: small (<5k), medium (5k–15k), large (>15k)'
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .default(10)
          .describe('Max number of results to return'),
      }),
    }
  );

  const getSchoolProfileTool = tool(
    async (input) => mcp.getSchoolProfile(input),
    {
      name: 'get_school_profile',
      description:
        'Get the full profile of ONE school by id, including cost, tuition, admission rate, graduation rate, median earnings 10 years after entry, and median debt of completers. Requires a school_id (use search_schools first if you only have a name).',
      schema: z.object({
        school_id: z
          .number()
          .int()
          .positive()
          .describe('Scorecard school id, obtained via search_schools'),
      }),
    }
  );

  const compareSchoolsTool = tool(
    async (input) => mcp.compareSchools(input),
    {
      name: 'compare_schools',
      description:
        'Compare 2 to 4 schools side-by-side across cost, admission, graduation, earnings, and debt. Requires school_ids (resolve names via search_schools first). Returns one row per metric, plus a failures list for any ids that could not be retrieved.',
      schema: z.object({
        school_ids: z
          .array(z.number().int().positive())
          .min(2)
          .max(4)
          .describe(
            '2–4 unique Scorecard school ids; resolve names via search_schools first'
          ),
      }),
    }
  );

  const findSchoolsByCriteriaTool = tool(
    async (input) => mcp.findSchoolsByCriteria(input),
    {
      name: 'find_schools_by_criteria',
      description:
        'Discover schools matching criteria when the user has not named specific schools. ALWAYS pass degree_type:"bachelor" for general "find me a college" queries unless the user explicitly mentions trade school, associate, or graduate. At least one filter is required.',
      schema: z.object({
        state: z
          .string()
          .length(2)
          .optional()
          .describe('2-letter state code, e.g. CA'),
        max_net_price: z
          .number()
          .int()
          .nonnegative()
          .optional()
          .describe(
            'Maximum average net price (annual $ paid after aid). Use this for "under $X" queries.'
          ),
        min_grad_rate: z
          .number()
          .min(0)
          .max(1)
          .optional()
          .describe(
            'Minimum overall completion rate as a fraction (e.g. 0.8 = 80%)'
          ),
        size: z
          .enum(['small', 'medium', 'large'])
          .optional()
          .describe('small (<5k), medium (5k–15k), large (>15k) students'),
        ownership: z
          .enum(['public', 'private_nonprofit', 'private_for_profit'])
          .optional()
          .describe('Filter by school ownership type'),
        degree_type: z
          .enum(['certificate', 'associate', 'bachelor', 'graduate'])
          .optional()
          .describe(
            'Predominant degree awarded. PASS "bachelor" for typical 4-year college queries.'
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .default(10)
          .describe('Max number of results to return'),
      }),
    }
  );

  return [
    searchSchoolsTool,
    getSchoolProfileTool,
    compareSchoolsTool,
    findSchoolsByCriteriaTool,
  ];
}
