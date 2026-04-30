/**
 * __tests__/questionnaires.test.js
 *
 * Unit tests for the score() and interpret() functions of every active
 * one-time research questionnaire defined in data/questionnaires.js.
 *
 * Coverage strategy per instrument:
 *   1. score() with all items at their minimum value
 *   2. score() with all items at their maximum value
 *   3. One or more hand-verified reference cases (known answers → known score)
 *   4. interpret() returns the correct band label at every threshold boundary
 *
 * PSQI additionally tests each of the 7 component-score sub-calculations
 * in isolation before testing the global score.
 *
 * MCTQ tests the MSFsc and social-jetlag (SJL) derivations numerically,
 * and verifies that interpret() selects the right chronotype label.
 */

import { ESS, ISI, DBAS16, MEQ, PSQI, RUSATED, STOPBANG, MCTQ } from '../data/questionnaires';

// ─── ESS ──────────────────────────────────────────────────────────────────────

describe('ESS — score()', () => {
  it('returns 0 when all items are 0', () => {
    const a = {};
    [1,2,3,4,5,6,7,8].forEach((n) => { a[`ess${n}`] = 0; });
    expect(ESS.score(a)).toBe(0);
  });

  it('returns 24 when all items are 3', () => {
    const a = {};
    [1,2,3,4,5,6,7,8].forEach((n) => { a[`ess${n}`] = 3; });
    expect(ESS.score(a)).toBe(24);
  });

  it('sums item values correctly for a mixed response set', () => {
    // ess1=2, ess2=1, ess3=3, ess4=0, ess5=2, ess6=1, ess7=2, ess8=1 → 12
    const a = { ess1:2, ess2:1, ess3:3, ess4:0, ess5:2, ess6:1, ess7:2, ess8:1 };
    expect(ESS.score(a)).toBe(12);
  });

  it('treats missing items as 0', () => {
    expect(ESS.score({})).toBe(0);
  });
});

describe('ESS — interpret()', () => {
  it('Normal at score 0', ()        => expect(ESS.interpret(0).label).toBe('Normal'));
  it('Normal at score 7', ()        => expect(ESS.interpret(7).label).toBe('Normal'));
  it('Borderline at score 8', ()    => expect(ESS.interpret(8).label).toBe('Borderline'));
  it('Borderline at score 9', ()    => expect(ESS.interpret(9).label).toBe('Borderline'));
  it('Excessive at score 10', ()    => expect(ESS.interpret(10).label).toBe('Excessive'));
  it('Excessive at score 15', ()    => expect(ESS.interpret(15).label).toBe('Excessive'));
  it('Severe at score 16', ()       => expect(ESS.interpret(16).label).toBe('Severe'));
  it('Severe at score 24', ()       => expect(ESS.interpret(24).label).toBe('Severe'));
});

// ─── ISI ──────────────────────────────────────────────────────────────────────

describe('ISI — score()', () => {
  it('returns 0 when all items are 0', () => {
    const a = {};
    [1,2,3,4,5,6,7].forEach((n) => { a[`isi${n}`] = 0; });
    expect(ISI.score(a)).toBe(0);
  });

  it('returns 28 when all items are 4', () => {
    const a = {};
    [1,2,3,4,5,6,7].forEach((n) => { a[`isi${n}`] = 4; });
    expect(ISI.score(a)).toBe(28);
  });

  it('sums item values correctly for a mixed response set', () => {
    // 3+2+1+3+2+1+2 = 14
    const a = { isi1:3, isi2:2, isi3:1, isi4:3, isi5:2, isi6:1, isi7:2 };
    expect(ISI.score(a)).toBe(14);
  });

  it('treats missing items as 0', () => {
    expect(ISI.score({})).toBe(0);
  });
});

describe('ISI — interpret()', () => {
  it('No clinically significant insomnia at score 0', ()  => expect(ISI.interpret(0).label).toBe('No clinically significant insomnia'));
  it('No clinically significant insomnia at score 7', ()  => expect(ISI.interpret(7).label).toBe('No clinically significant insomnia'));
  it('Subthreshold insomnia at score 8', ()               => expect(ISI.interpret(8).label).toBe('Subthreshold insomnia'));
  it('Subthreshold insomnia at score 14', ()              => expect(ISI.interpret(14).label).toBe('Subthreshold insomnia'));
  it('Clinical insomnia (moderate) at score 15', ()       => expect(ISI.interpret(15).label).toBe('Clinical insomnia (moderate)'));
  it('Clinical insomnia (moderate) at score 21', ()       => expect(ISI.interpret(21).label).toBe('Clinical insomnia (moderate)'));
  it('Clinical insomnia (severe) at score 22', ()         => expect(ISI.interpret(22).label).toBe('Clinical insomnia (severe)'));
  it('Clinical insomnia (severe) at score 28', ()         => expect(ISI.interpret(28).label).toBe('Clinical insomnia (severe)'));
});

// ─── DBAS-16 ──────────────────────────────────────────────────────────────────

describe('DBAS-16 — score()', () => {
  it('returns 0.0 when all items are 0', () => {
    const a = {};
    for (let n = 1; n <= 16; n++) a[`dbas${n}`] = 0;
    expect(DBAS16.score(a)).toBe(0);
  });

  it('returns 10.0 when all items are 10', () => {
    const a = {};
    for (let n = 1; n <= 16; n++) a[`dbas${n}`] = 10;
    expect(DBAS16.score(a)).toBe(10);
  });

  it('computes mean item score to 1 decimal place', () => {
    // All items = 5 → mean = 5.0
    const a = {};
    for (let n = 1; n <= 16; n++) a[`dbas${n}`] = 5;
    expect(DBAS16.score(a)).toBe(5.0);
  });

  it('rounds correctly for a non-integer mean', () => {
    // sum = 16 items × varied values totalling 72 → mean = 4.5
    const a = {};
    for (let n = 1; n <= 16; n++) a[`dbas${n}`] = n <= 8 ? 4 : 5; // 8×4 + 8×5 = 72
    expect(DBAS16.score(a)).toBe(4.5);
  });

  it('treats missing items as 0 in mean', () => {
    // Only dbas1 = 8, rest missing (treated as 0) → 8/16 = 0.5
    expect(DBAS16.score({ dbas1: 8 })).toBe(0.5);
  });
});

describe('DBAS-16 — interpret()', () => {
  it('Within normal range at score 0',           () => expect(DBAS16.interpret(0).label).toBe('Within normal range'));
  it('Within normal range at score 4',           () => expect(DBAS16.interpret(4).label).toBe('Within normal range'));
  it('Clinically relevant at score 4.1',         () => expect(DBAS16.interpret(4.1).label).toBe('Clinically relevant'));
  it('Clinically relevant at score 10',          () => expect(DBAS16.interpret(10).label).toBe('Clinically relevant'));
});

// ─── MEQ ──────────────────────────────────────────────────────────────────────

describe('MEQ — score()', () => {
  it('sums all item values correctly', () => {
    // Build a known-score response: all items at their minimum option value
    // meq1–18 vary; meq19 minimum = 0. Minimum possible total = 18 (items 1–18 each
    // contribute their lowest available option) + 0 (meq19) = depends on item options.
    // Use a flat answer of 1 for items 1–18 and 0 for meq19 → sum = 18
    const a = {};
    for (let n = 1; n <= 18; n++) a[`meq${n}`] = 1;
    a['meq19'] = 0;
    expect(MEQ.score(a)).toBe(18);
  });

  it('treats missing items as 0', () => {
    expect(MEQ.score({})).toBe(0);
  });

  it('returns 86 for a fully morning-type response (max options per item)', () => {
    // Published MEQ maximum is 86 (Horne & Östberg, 1976).
    // NOTE: this test currently fails — the implementation scores 83 because
    // some item option weights deviate from the original instrument.
    // This test is intentionally left failing to flag the discrepancy.
    const maxA = {
      meq1: 5, meq2: 5, meq3: 4, meq4: 4, meq5: 4,
      meq6: 4, meq7: 4, meq8: 4, meq9: 4, meq10: 5,
      meq11: 4, meq12: 4, meq13: 4, meq14: 4, meq15: 4,
      meq16: 4, meq17: 5, meq18: 5, meq19: 6,
    };
    expect(MEQ.score(maxA)).toBe(86);
  });
});

describe('MEQ — interpret()', () => {
  it('Definite evening type at score 16',   () => expect(MEQ.interpret(16).label).toBe('Definite evening type'));
  it('Definite evening type at score 30',   () => expect(MEQ.interpret(30).label).toBe('Definite evening type'));
  it('Moderate evening type at score 31',   () => expect(MEQ.interpret(31).label).toBe('Moderate evening type'));
  it('Moderate evening type at score 41',   () => expect(MEQ.interpret(41).label).toBe('Moderate evening type'));
  it('Intermediate type at score 42',       () => expect(MEQ.interpret(42).label).toBe('Intermediate type'));
  it('Intermediate type at score 58',       () => expect(MEQ.interpret(58).label).toBe('Intermediate type'));
  it('Moderate morning type at score 59',   () => expect(MEQ.interpret(59).label).toBe('Moderate morning type'));
  it('Moderate morning type at score 69',   () => expect(MEQ.interpret(69).label).toBe('Moderate morning type'));
  it('Definite morning type at score 70',   () => expect(MEQ.interpret(70).label).toBe('Definite morning type'));
  it('Definite morning type at score 86',   () => expect(MEQ.interpret(86).label).toBe('Definite morning type'));
});

// ─── PSQI ─────────────────────────────────────────────────────────────────────

/**
 * PSQI scoring reference:
 *   C1 — Subjective sleep quality (psqi9, 0–3)
 *   C2 — Sleep latency (psqi2 minutes + psqi5a, combined 0–3)
 *   C3 — Sleep duration (psqi4 hours, 0–3)
 *   C4 — Habitual sleep efficiency (derived from psqi1, psqi3, psqi4, 0–3)
 *   C5 — Sleep disturbance (sum of psqi5b–5i, 0–3)
 *   C6 — Use of sleeping medication (psqi6, 0–3)
 *   C7 — Daytime dysfunction (psqi7 + psqi8, combined 0–3)
 *   Global = C1+C2+C3+C4+C5+C6+C7 (0–21)
 */

const psqiAllGood = {
  psqi1: { hour: 23, minute: 0 },  // bedtime 23:00
  psqi2: 10,                        // SOL 10 min → solScore 0
  psqi3: { hour: 7, minute: 0 },   // rise 07:00
  psqi4: 7.5,                       // 7.5 h sleep → C3=0
  psqi5a: 0, psqi5b: 0, psqi5c: 0, psqi5d: 0,
  psqi5e: 0, psqi5f: 0, psqi5g: 0, psqi5h: 0, psqi5i: 0,
  psqi6: 0,
  psqi7: 0,
  psqi8: 0,
  psqi9: 0,  // "Very good"
};

describe('PSQI — score() component verification', () => {
  it('C1: psqi9=0 contributes 0 to global', () => {
    const a = { ...psqiAllGood, psqi9: 0 };
    // With all else at best values → global should be 0
    expect(PSQI.score(a)).toBe(0);
  });

  it('C1: psqi9=3 contributes 3 to global', () => {
    const a = { ...psqiAllGood, psqi9: 3 };
    expect(PSQI.score(a)).toBe(3);
  });

  it('C2: SOL 16–30 min + psqi5a=0 → C2=1', () => {
    // solScore=1, q5a=0, c2raw=1 → c2=1
    const a = { ...psqiAllGood, psqi2: 20, psqi5a: 0 };
    expect(PSQI.score(a)).toBe(1);
  });

  it('C2: SOL >60 min + psqi5a=3 → C2=3', () => {
    // solScore=3, q5a=3, c2raw=6 → c2=3
    const a = { ...psqiAllGood, psqi2: 90, psqi5a: 3 };
    expect(PSQI.score(a)).toBe(3);
  });

  it('C3: 7.5 h → C3=0', () => {
    const a = { ...psqiAllGood, psqi4: 7.5 };
    expect(PSQI.score(a)).toBe(0);
  });

  it('C3: 6 h → C3=1 (global=2 because C4 also degrades)', () => {
    // psqi4=6: C3=1, but HSE=(6*60/480)*100=75% also drops C4 to 1 → global=2
    const a = { ...psqiAllGood, psqi4: 6 };
    expect(PSQI.score(a)).toBe(2);
  });

  it('C3: 4.9 h → C3=3 (global=6 because C4 also degrades)', () => {
    // psqi4=4.9: C3=3, HSE=61.25% → C4=3 → global=6
    const a = { ...psqiAllGood, psqi4: 4.9 };
    expect(PSQI.score(a)).toBe(6);
  });

  it('C4: TIB=480 min, sleep=7.5h (450 min) → HSE=93.75% → C4=0', () => {
    // bedtime 23:00, rise 07:00, TIB=480 min, psqi4=7.5h
    // HSE = (7.5*60)/480 * 100 = 93.75 → C4=0
    const a = { ...psqiAllGood }; // defaults already satisfy this
    expect(PSQI.score(a)).toBe(0);
  });

  it('C4: TIB=480 min, sleep=3h → HSE=37.5% → C4=3 (global=6)', () => {
    // psqi4=3: C3=3 (<5h) and HSE=37.5% → C4=3 → global=6
    const a = { ...psqiAllGood, psqi4: 3 };
    expect(PSQI.score(a)).toBe(6);
  });

  it('C5: all disturbance items=0 → C5=0', () => {
    expect(PSQI.score(psqiAllGood)).toBe(0);
  });

  it('C5: all 8 disturbance items=3 → distSum=24 → C5=3', () => {
    const a = {
      ...psqiAllGood,
      psqi5b:3, psqi5c:3, psqi5d:3, psqi5e:3,
      psqi5f:3, psqi5g:3, psqi5h:3, psqi5i:3,
    };
    expect(PSQI.score(a)).toBe(3);
  });

  it('C6: psqi6=2 contributes 2 to global', () => {
    const a = { ...psqiAllGood, psqi6: 2 };
    expect(PSQI.score(a)).toBe(2);
  });

  it('C7: psqi7=2, psqi8=2 → c7raw=4 → C7=2', () => {
    const a = { ...psqiAllGood, psqi7: 2, psqi8: 2 };
    expect(PSQI.score(a)).toBe(2);
  });

  it('C7: psqi7=3, psqi8=3 → c7raw=6 → C7=3', () => {
    const a = { ...psqiAllGood, psqi7: 3, psqi8: 3 };
    expect(PSQI.score(a)).toBe(3);
  });
});

describe('PSQI — score() global reference cases', () => {
  it('returns 0 for a best-case "very good sleeper" response', () => {
    expect(PSQI.score(psqiAllGood)).toBe(0);
  });

  it('returns 21 for a worst-case response', () => {
    // C1=3, C2=3 (sol>60+5a=3), C3=3 (<5h), C4=3 (<65%), C5=3 (dist=24),
    // C6=3, C7=3 (7+8=6)
    const worst = {
      psqi1: { hour: 23, minute: 0 },
      psqi2: 90,      // SOL >60 min → solScore=3
      psqi3: { hour: 7, minute: 0 },
      psqi4: 3,       // <5h → C3=3
      psqi5a: 3,
      psqi5b: 3, psqi5c: 3, psqi5d: 3, psqi5e: 3,
      psqi5f: 3, psqi5g: 3, psqi5h: 3, psqi5i: 3,
      psqi6: 3,
      psqi7: 3,
      psqi8: 3,
      psqi9: 3,
    };
    expect(PSQI.score(worst)).toBe(21);
  });
});

describe('PSQI — interpret()', () => {
  it('Good sleep quality at score 0',          () => expect(PSQI.interpret(0).label).toBe('Good sleep quality'));
  it('Good sleep quality at score 4',          () => expect(PSQI.interpret(4).label).toBe('Good sleep quality'));
  it('Poor sleep quality at score 5',          () => expect(PSQI.interpret(5).label).toBe('Poor sleep quality'));
  it('Poor sleep quality at score 10',         () => expect(PSQI.interpret(10).label).toBe('Poor sleep quality'));
  it('Severe sleep difficulties at score 11',  () => expect(PSQI.interpret(11).label).toBe('Severe sleep difficulties'));
  it('Severe sleep difficulties at score 21',  () => expect(PSQI.interpret(21).label).toBe('Severe sleep difficulties'));
});

// ─── RU-SATED ─────────────────────────────────────────────────────────────────

describe('RU-SATED — score()', () => {
  it('returns 0 when all items are 0', () => {
    const a = {};
    for (let n = 1; n <= 7; n++) a[`rus${n}`] = 0;
    expect(RUSATED.score(a)).toBe(0);
  });

  it('returns 14 when all items are 2', () => {
    const a = {};
    for (let n = 1; n <= 7; n++) a[`rus${n}`] = 2;
    expect(RUSATED.score(a)).toBe(14);
  });

  it('sums item values correctly', () => {
    // 0+1+2+0+1+2+1 = 7
    const a = { rus1:0, rus2:1, rus3:2, rus4:0, rus5:1, rus6:2, rus7:1 };
    expect(RUSATED.score(a)).toBe(7);
  });

  it('treats missing items as 0', () => {
    expect(RUSATED.score({})).toBe(0);
  });
});

describe('RU-SATED — interpret()', () => {
  it('Poor sleep health at score 0',     () => expect(RUSATED.interpret(0).label).toBe('Poor sleep health'));
  it('Poor sleep health at score 4',     () => expect(RUSATED.interpret(4).label).toBe('Poor sleep health'));
  it('Moderate sleep health at score 5', () => expect(RUSATED.interpret(5).label).toBe('Moderate sleep health'));
  it('Moderate sleep health at score 9', () => expect(RUSATED.interpret(9).label).toBe('Moderate sleep health'));
  it('Good sleep health at score 10',    () => expect(RUSATED.interpret(10).label).toBe('Good sleep health'));
  it('Good sleep health at score 14',    () => expect(RUSATED.interpret(14).label).toBe('Good sleep health'));
});

// ─── STOP-BANG ────────────────────────────────────────────────────────────────

describe('STOP-BANG — score()', () => {
  it('returns 0 when all answers are "no"', () => {
    const a = { sb_s:'no', sb_t:'no', sb_o:'no', sb_p:'no', sb_b:'no', sb_a:'no', sb_n:'no', sb_g:'no' };
    expect(STOPBANG.score(a)).toBe(0);
  });

  it('returns 8 when all answers are "yes"', () => {
    const a = { sb_s:'yes', sb_t:'yes', sb_o:'yes', sb_p:'yes', sb_b:'yes', sb_a:'yes', sb_n:'yes', sb_g:'yes' };
    expect(STOPBANG.score(a)).toBe(8);
  });

  it('counts only "yes" answers', () => {
    // 3 yes, 5 no
    const a = { sb_s:'yes', sb_t:'no', sb_o:'yes', sb_p:'no', sb_b:'yes', sb_a:'no', sb_n:'no', sb_g:'no' };
    expect(STOPBANG.score(a)).toBe(3);
  });

  it('treats missing or non-yes values as 0', () => {
    expect(STOPBANG.score({})).toBe(0);
    expect(STOPBANG.score({ sb_s: undefined, sb_t: null })).toBe(0);
  });
});

describe('STOP-BANG — interpret()', () => {
  it('Low OSA risk at score 0',          () => expect(STOPBANG.interpret(0).label).toBe('Low OSA risk'));
  it('Low OSA risk at score 2',          () => expect(STOPBANG.interpret(2).label).toBe('Low OSA risk'));
  it('Intermediate OSA risk at score 3', () => expect(STOPBANG.interpret(3).label).toBe('Intermediate OSA risk'));
  it('Intermediate OSA risk at score 4', () => expect(STOPBANG.interpret(4).label).toBe('Intermediate OSA risk'));
  it('High OSA risk at score 5',         () => expect(STOPBANG.interpret(5).label).toBe('High OSA risk'));
  it('High OSA risk at score 8',         () => expect(STOPBANG.interpret(8).label).toBe('High OSA risk'));
});

// ─── MCTQ ─────────────────────────────────────────────────────────────────────

/**
 * Reference computation for a canonical intermediate-chronotype participant:
 *   Workdays (5/7):
 *     Bedtime  23:00, SOL 15 min → sleep onset 23:15
 *     Wake     07:00            → SD_w = 7h 45m = 7.75h, MSW = 23.25 + 7.75/2 = 27.125 → 3.125 h
 *   Free days (2/7):
 *     Bedtime  00:30 (post-midnight) → stored as hour:0, minute:30 → treated as 24.5
 *     SOL      15 min → sleep onset 24.75
 *     Wake     08:30 → 32.5 (+ 24 because <12 on raw) → SD_f = 32.5 - 24.75 = 7.75h
 *     MSF = 24.75 + 7.75/2 = 28.625 → 4.625 h
 *   SD_week = (7.75*5 + 7.75*2)/7 = 7.75, deficit = 7.75 - 7.75 = 0 → MSFsc = MSF = 4.625
 *   SJL = |MSF - MSW| = |4.625 - 3.125| = 1.5 h
 */

const mctqIntermediate = {
  mctq_wd:   5,
  mctq_bt_w: { hour: 23, minute: 0  },
  mctq_sl_w: 15,
  mctq_wt_w: { hour: 7,  minute: 0  },
  mctq_bt_f: { hour: 0,  minute: 30 },
  mctq_sl_f: 15,
  mctq_wt_f: { hour: 8,  minute: 30 },
};

describe('MCTQ — score()', () => {
  it('returns an object with msf_sc and sjl keys', () => {
    const result = MCTQ.score(mctqIntermediate);
    expect(result).toHaveProperty('msf_sc');
    expect(result).toHaveProperty('sjl');
  });

  it('computes MSFsc ≈ 4.63 for the intermediate reference case', () => {
    const { msf_sc } = MCTQ.score(mctqIntermediate);
    expect(msf_sc).toBeCloseTo(4.63, 1);
  });

  it('computes SJL ≈ 1.5 h for the intermediate reference case', () => {
    const { sjl } = MCTQ.score(mctqIntermediate);
    expect(sjl).toBeCloseTo(1.5, 1);
  });

  it('returns zero SJL when workday and free-day schedules are identical', () => {
    const a = {
      mctq_wd:   5,
      mctq_bt_w: { hour: 23, minute: 0 },
      mctq_sl_w: 15,
      mctq_wt_w: { hour: 7,  minute: 0 },
      mctq_bt_f: { hour: 23, minute: 0 },
      mctq_sl_f: 15,
      mctq_wt_f: { hour: 7,  minute: 0 },
    };
    // Both schedules identical → SJL should be 0
    expect(MCTQ.score(a).sjl).toBeCloseTo(0, 2);
  });

  it('handles 0 workdays (only free days) without crashing', () => {
    const a = { ...mctqIntermediate, mctq_wd: 0 };
    expect(() => MCTQ.score(a)).not.toThrow();
  });

  it('handles 7 workdays (no free days) without crashing', () => {
    const a = { ...mctqIntermediate, mctq_wd: 7 };
    expect(() => MCTQ.score(a)).not.toThrow();
  });

  it('MSFsc is within the 0–24 clock range', () => {
    const { msf_sc } = MCTQ.score(mctqIntermediate);
    expect(msf_sc).toBeGreaterThanOrEqual(0);
    expect(msf_sc).toBeLessThan(24);
  });
});

describe('MCTQ — interpret()', () => {
  // interpret receives the score object { msf_sc, sjl }
  it('Extremely early chronotype when msf_sc < 0.5', () => {
    expect(MCTQ.interpret({ msf_sc: 0.3, sjl: 0 }).label).toBe('Extremely early chronotype');
  });

  it('Early chronotype when msf_sc = 1.5', () => {
    expect(MCTQ.interpret({ msf_sc: 1.5, sjl: 0 }).label).toBe('Early chronotype');
  });

  it('Intermediate chronotype when msf_sc = 3.0', () => {
    expect(MCTQ.interpret({ msf_sc: 3.0, sjl: 0 }).label).toBe('Intermediate chronotype');
  });

  it('Late chronotype when msf_sc = 4.63 (reference case)', () => {
    expect(MCTQ.interpret({ msf_sc: 4.63, sjl: 1.5 }).label).toBe('Late chronotype');
  });

  it('Extremely late chronotype when msf_sc = 6.0', () => {
    expect(MCTQ.interpret({ msf_sc: 6.0, sjl: 2 }).label).toBe('Extremely late chronotype');
  });

  it('description mentions social jetlag value', () => {
    const { description } = MCTQ.interpret({ msf_sc: 3.0, sjl: 2.5 });
    expect(description).toContain('2.5');
  });
});
