import { describe, it, expect } from 'vitest';
import { SYSTEM_PROMPT } from './prompts.js';

describe('SYSTEM_PROMPT', () => {
  it('mentions all four tools by name', () => {
    expect(SYSTEM_PROMPT).toContain('search_schools');
    expect(SYSTEM_PROMPT).toContain('get_school_profile');
    expect(SYSTEM_PROMPT).toContain('compare_schools');
    expect(SYSTEM_PROMPT).toContain('find_schools_by_criteria');
  });

  it('instructs the model to default degree_type to bachelor for general queries', () => {
    expect(SYSTEM_PROMPT).toMatch(/degree_type:\s*"bachelor"/);
  });

  it('includes a citation directive', () => {
    expect(SYSTEM_PROMPT.toLowerCase()).toContain('scorecard');
  });

  it('discourages hallucination', () => {
    expect(SYSTEM_PROMPT.toLowerCase()).toMatch(/never invent|don'?t guess|honest/i);
  });

  it('addresses the USC disambiguation case', () => {
    expect(SYSTEM_PROMPT).toContain('USC');
  });
});
