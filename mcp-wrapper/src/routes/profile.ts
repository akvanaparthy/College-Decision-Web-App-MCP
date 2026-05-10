import type { Request, Response } from 'express';
import { ScorecardClient } from '../scorecard-client.js';
import {
  GetSchoolProfileInputSchema,
  SchoolProfileSchema,
} from '../schemas.js';
import { toProfile } from '../transform.js';
import { badRequest, upstreamError, asyncHandler } from '../http-helpers.js';

export function getSchoolProfileHandler(client: ScorecardClient) {
  return asyncHandler(async (req: Request, res: Response) => {
    const parsed = GetSchoolProfileInputSchema.safeParse(req.body);
    if (!parsed.success) {
      badRequest(res, parsed.error);
      return;
    }
    const { school_id } = parsed.data;

    try {
      const raw = await client.query({
        id: school_id,
        fields: ScorecardClient.PROFILE_FIELDS,
      });
      const first = raw.results[0];
      if (!first) {
        res.status(404).json({
          error: {
            code: 'not_found',
            message: `No school with id ${school_id}`,
          },
        });
        return;
      }
      const profile = SchoolProfileSchema.parse(toProfile(first));
      res.json(profile);
    } catch (err) {
      upstreamError(res, err);
    }
  });
}
