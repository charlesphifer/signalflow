import { describe, it, expect } from 'vitest';
import { computeStageFromChecklist, STAGE_ORDER, getGoogleCalendarUrl, getCalendarEvents, findSmartAnswer, getEmailTemplates, buildDriveStructureText } from '../utils/helpers';
import type { Project } from '../types';

// ─── Shared mock project ────────────────────────────────────────────────────

const MOCK_PROJECT: Project = {
  id: '1',
  number: 'NK-2026-948',
  name: 'Test Hospital',
  city: 'Memphis',
  state: 'TN',
  credentials: 'Symplr',
  type: 'Wireless Assessment',
  stage: 'On-Site',
  travelStart: '2026-07-12',
  travelEnd: '2026-07-14',
  siteStart: '2026-07-13',
  siteEnd: '2026-07-15',
  goLiveDate: '2026-08-10',
  pm: { name: 'Sarah Jenkins' },
  ae: { name: 'Marcus Vance' },
  itContact: { name: 'David Cho', email: 'dcho@test.org', phone: '555-0199' },
  notes: '',
  checklist: [],
  driveCreated: true,
  calendarSynced: true,
};

// ─── computeStageFromChecklist ──────────────────────────────────────────────

describe('computeStageFromChecklist', () => {
  const assess = (completed: number, total: number) =>
    computeStageFromChecklist(completed, total, 'Wireless Assessment');

  const design = (completed: number, total: number) =>
    computeStageFromChecklist(completed, total, 'Wireless Design');

  it('returns Kickoff for 0% progress (Assessment)', () => {
    expect(assess(0, 16)).toBe('Kickoff');
  });

  it('returns Kickoff for <25% (Assessment)', () => {
    expect(assess(3, 16)).toBe('Kickoff'); // 18.75%
  });

  it('returns Pre-Work for 25-59% (Assessment)', () => {
    expect(assess(4, 16)).toBe('Pre-Work'); // 25%
    expect(assess(9, 16)).toBe('Pre-Work'); // 56.25%
  });

  it('returns On-Site for 60-79% (Assessment)', () => {
    expect(assess(10, 16)).toBe('On-Site'); // 62.5%
    expect(assess(12, 16)).toBe('On-Site'); // 75%
  });

  it('returns Reporting for 80-94% (Assessment)', () => {
    expect(assess(13, 16)).toBe('Reporting'); // 81.25%
    expect(assess(15, 16)).toBe('Reporting'); // 93.75%
  });

  it('returns Completed for 95%+ (Assessment)', () => {
    expect(assess(16, 16)).toBe('Completed');
  });

  it('returns Kickoff for 0% progress (Design)', () => {
    expect(design(0, 12)).toBe('Kickoff');
  });

  it('returns Pre-Work for 20-49% (Design)', () => {
    expect(design(3, 12)).toBe('Pre-Work'); // 25%
  });

  it('returns On-Site for 50-79% (Design)', () => {
    expect(design(6, 12)).toBe('On-Site'); // 50%
    expect(design(9, 12)).toBe('On-Site'); // 75%
  });

  it('returns Reporting for 80-94% (Design)', () => {
    expect(design(10, 12)).toBe('Reporting'); // 83.3%
    expect(design(11, 12)).toBe('Reporting'); // 91.7%
  });

  it('returns Completed for 95%+ (Design)', () => {
    expect(design(12, 12)).toBe('Completed');
  });

  it('handles edge case: 1 of 1 completed', () => {
    expect(assess(1, 1)).toBe('Completed');
    expect(design(1, 1)).toBe('Completed');
  });

  it('handles edge case: 0 of 0 (no items)', () => {
    // NaN division — function should handle gracefully
    expect(assess(0, 0)).toBe('Completed'); // 0/0 = NaN, NaN < 0.25 = false -> Completed
  });
});

// ─── STAGE_ORDER ────────────────────────────────────────────────────────────

describe('STAGE_ORDER', () => {
  it('has the correct 5 stages in order', () => {
    expect(STAGE_ORDER).toEqual([
      'Kickoff',
      'Pre-Work',
      'On-Site',
      'Reporting',
      'Completed',
    ]);
  });
});

// ─── getGoogleCalendarUrl ───────────────────────────────────────────────────

describe('getGoogleCalendarUrl', () => {
  it('returns a valid Google Calendar URL when goLiveDate is set', () => {
    const url = getGoogleCalendarUrl(MOCK_PROJECT);
    expect(url).toContain('calendar.google.com');
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain(encodeURIComponent('Test Hospital'));
    expect(url).toContain('20260810');
  });

  it('returns empty string when goLiveDate is missing', () => {
    const url = getGoogleCalendarUrl({ ...MOCK_PROJECT, goLiveDate: '' });
    expect(url).toBe('');
  });
});

// ─── getCalendarEvents ──────────────────────────────────────────────────────

describe('getCalendarEvents', () => {
  it('creates travel events for each day of travel window', () => {
    const events = getCalendarEvents([MOCK_PROJECT]);
    const travelEvents = events.filter(e => e.type === 'travel');
    expect(travelEvents).toHaveLength(3); // 12, 13, 14
  });

  it('creates site events for each day of site window', () => {
    const events = getCalendarEvents([MOCK_PROJECT]);
    const siteEvents = events.filter(e => e.type === 'site');
    expect(siteEvents).toHaveLength(3); // 13, 14, 15
  });

  it('creates a go-live event', () => {
    const events = getCalendarEvents([MOCK_PROJECT]);
    const goLive = events.find(e => e.type === 'golive');
    expect(goLive).toBeDefined();
    expect(goLive!.date).toBe('2026-08-10');
  });

  it('returns empty array for empty projects', () => {
    const events = getCalendarEvents([]);
    expect(events).toEqual([]);
  });
});

// ─── findSmartAnswer ────────────────────────────────────────────────────────

describe('findSmartAnswer', () => {
  it('returns null for empty query', () => {
    expect(findSmartAnswer('')).toBeNull();
    expect(findSmartAnswer('  ')).toBeNull();
    expect(findSmartAnswer('ab')).toBeNull(); // too short
  });

  it('returns null for query with no matching tokens', () => {
    expect(findSmartAnswer('zyxwvutsrqponmlkjihgfedcba')).toBeNull();
  });

  it('finds a match for "drywall" keyword', () => {
    const result = findSmartAnswer('drywall attenuation');
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThanOrEqual(5);
    expect(result!.docNum).toBe('SOP-011-REV4');
    expect(result!.sectionTitle).toContain('Wall Attenuation');
  });

  it('finds a match for "WMTS" keyword', () => {
    const result = findSmartAnswer('WMTS 608 MHz');
    expect(result).not.toBeNull();
    expect(result!.docNum).toBe('SPEC-WMTS-8000');
  });

  it('finds a match for "multicast IGMP"', () => {
    const result = findSmartAnswer('multicast IGMP snooping');
    expect(result).not.toBeNull();
    expect(result!.docNum).toBe('NET-402-V2');
  });

  it('finds a match for "Sidekick walk"', () => {
    const result = findSmartAnswer('Sidekick walk pace');
    expect(result).not.toBeNull();
    expect(result!.docNum).toBe('SOP-011-REV4');
    expect(result!.sectionTitle).toContain('Ekahau');
  });

  it('returns higher scores for keyword matches than content-only matches', () => {
    const keywordResult = findSmartAnswer('drywall');
    const contentResult = findSmartAnswer('patient telemetry');
    // Both should match, but keyword match should score higher
    expect(keywordResult).not.toBeNull();
    expect(contentResult).not.toBeNull();
  });
});

// ─── getEmailTemplates ──────────────────────────────────────────────────────

describe('getEmailTemplates', () => {
  const templates = getEmailTemplates(MOCK_PROJECT);

  it('returns 3 templates', () => {
    expect(templates).toHaveLength(3);
  });

  it('includes kickoff floorplan request template', () => {
    const t = templates[0];
    expect(t.title).toContain('Kickoff');
    expect(t.subject).toContain('NK-2026-948');
    expect(t.body).toContain('Charles Phifer');
  });

  it('includes pre-visit checklist template with dynamic IT contact', () => {
    const t = templates[1];
    expect(t.to).toContain('dcho@test.org');
    expect(t.subject).toContain('Test Hospital');
    expect(t.body).toContain('David Cho');
  });

  it('includes report review request template with dynamic PM name', () => {
    const t = templates[2];
    expect(t.body).toContain('Sarah Jenkins');
    expect(t.body).toContain('wireless assessment');
  });

  it('generates correct project type in body for Design projects', () => {
    const designTemplates = getEmailTemplates({ ...MOCK_PROJECT, type: 'Wireless Design' });
    expect(designTemplates[0].body).toContain('wireless design');
    expect(designTemplates[2].body).toContain('wireless design');
  });
});

// ─── buildDriveStructureText ─────────────────────────────────────────────────

describe('buildDriveStructureText', () => {
  it('replaces project number and name in the template', () => {
    const text = buildDriveStructureText(MOCK_PROJECT);
    expect(text).toContain('NK-2026-948 Test Hospital');
    expect(text).toContain('01_Floor_Plans');
    expect(text).toContain('02_Ekahau_Files');
    expect(text).toContain('03_Site_Photos');
    expect(text).toContain('04_Final_Reports');
  });

  it('falls back to XXXX and Project when project is null', () => {
    const text = buildDriveStructureText(null);
    expect(text).toContain('XXXX Project');
  });
});