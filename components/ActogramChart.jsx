/**
 * components/ActogramChart.jsx — Weekly sleep pattern chart
 *
 * Renders exactly 7 day-columns at a time (like Apple Health's weekly sleep
 * chart) — column width scales to fill the available space, rather than
 * being a fixed pixel size, so the number of visible days never depends on
 * screen width. Each column is one vertical bar from bedtime (mq1) to
 * out-of-bed time (mq7).
 *
 * The chart is built from a full contiguous calendar range (the first diary
 * entry's date through the last), not just the entries that exist — a day
 * with no diary entry still gets its own column (empty, with just the day
 * label and a faint placeholder line), so a missed entry shows up as a gap
 * rather than silently compressing the timeline.
 *
 * Colours reuse the same green/amber/red semantics as the other Final
 * Report metric bars (durationColor, latencyColor, wasoColor in
 * app/final-report.jsx), but softened with the same alpha treatment those
 * bars already use for their reference bands (see BandBar's `color + '33'`):
 *   - soft green (#2E7D32 @ 20%) — asleep
 *   - soft amber (#F59E0B @ 20%) — awake in bed (before falling asleep /
 *                                  after final waking, and the brief
 *                                  falling-asleep window)
 *   - solid red  (#DC2626)       — night waking markers, in a row just above
 *                                  the bar (illustrative only — the diary
 *                                  records a count and total duration, not
 *                                  exact times)
 *
 * Each day's bar is clipped to a single stadium (fully rounded) shape so the
 * colour transitions inside it read as one continuous rounded bar.
 *
 * The Y axis is fixed on the left. Chevrons page by exactly one week (one
 * viewport width); because column width is always viewportWidth / 7, paging
 * can never land on a partial column — there's nothing to align, by
 * construction. Free dragging still works for finer navigation, and the
 * header — including the average sleep duration for the visible week, also
 * Apple-Health-style — updates as you scroll either way.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Circle, Line, Path, Text as SvgText, Defs, ClipPath, G } from 'react-native-svg';
import t, { locale } from '../i18n';
import { computeMetrics } from '../utils/metrics';
import { FONTS, SIZES } from '../theme/typography';

const ASLEEP_FILL   = '#2E7D3233'; // green @ 20% — matches BandBar's band alpha
const AWAKE_FILL    = '#F59E0B33'; // amber @ 20%
const WAKING_COLOR  = '#DC2626';   // solid — a marker, not a band
const WAKING_DOT_R      = 3;
const WAKING_DOT_GAP    = 7;   // preferred centre-to-centre spacing
const WAKING_ROW_OFFSET = 9;   // distance above the bar's top edge
const MIDPOINT_COLOR = '#1E3A5F';  // navy dashed trend line — sleep midpoint
const GRID_COLOR    = '#E2EAF4';
const EMPTY_COLOR    = '#D8E2EC';  // placeholder line for a day with no entry
const AXIS_TEXT     = '#94A3B8';
const HEADER_TEXT   = '#1E3A5F';

const DAYS_PER_VIEW  = 7;
const BAR_WIDTH_RATIO = 0.5; // bar occupies half its column's width
const PX_PER_MIN = 0.5; // 30px per hour
const TOP_PAD    = 10;
const LABEL_GAP  = 20;
const AXIS_WIDTH = 58;

// Shifts a clock time so hours before noon count as "the next day" — lets us
// compare/plot bedtime and wake time on one continuous scale across midnight.
const shiftedMinutes = (time) => {
  if (!time) return null;
  const h = time.hour < 12 ? time.hour + 24 : time.hour;
  return h * 60 + time.minute;
};

const floorTo = (mins, step) => Math.floor(mins / step) * step;
const ceilTo  = (mins, step) => Math.ceil(mins / step) * step;
const clamp   = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

const formatClock = (mins) => {
  const h = Math.floor(mins / 60) % 24;
  const m = Math.round(mins % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const formatDuration = (mins) => {
  if (mins === null || mins === undefined || isNaN(mins)) return '\u2014';
  const h = Math.floor(Math.abs(mins) / 60);
  const m = Math.round(Math.abs(mins) % 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
};

// 'YYYY-MM-DD' + 1 day, as a 'YYYY-MM-DD' string — avoids timezone drift by
// anchoring at noon before doing the date arithmetic.
const nextDateStr = (dateStr) => {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

export default function ActogramChart({ entries }) {
  const scrollRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [scrollX, setScrollX] = useState(0);

  const realEntries = entries
    .filter((e) => e.type === 'morning' && e.answers?.mq1 && e.answers?.mq7)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Build the full contiguous calendar range so a missed diary entry shows
  // up as an empty column rather than silently disappearing from the
  // timeline. { date, entry } — entry is null for a day with nothing logged.
  const calendarDays = [];
  if (realEntries.length > 0) {
    const byDate = new Map(realEntries.map((e) => [e.date, e]));
    let cursor = realEntries[0].date;
    const last = realEntries[realEntries.length - 1].date;
    while (cursor <= last) {
      calendarDays.push({ date: cursor, entry: byDate.get(cursor) ?? null });
      cursor = nextDateStr(cursor);
    }
  }

  const rangeCalc = (() => {
    if (realEntries.length === 0) return { rangeStart: 20 * 60, rangeEnd: 36 * 60 };
    let min = Infinity;
    let max = -Infinity;
    for (const e of realEntries) {
      const bed = shiftedMinutes(e.answers.mq1);
      const out = shiftedMinutes(e.answers.mq7);
      if (bed !== null) min = Math.min(min, bed);
      if (out !== null) max = Math.max(max, out);
    }
    return {
      rangeStart: floorTo(min - 30, 120),
      rangeEnd:   ceilTo(max + 30, 120),
    };
  })();
  const { rangeStart, rangeEnd } = rangeCalc;

  const chartHeight = (rangeEnd - rangeStart) * PX_PER_MIN;
  const yFor = (mins) => (mins - rangeStart) * PX_PER_MIN;

  const gridTimes = [];
  for (let m = rangeStart; m <= rangeEnd; m += 120) gridTimes.push(m);

  // Column width always fills the viewport into exactly DAYS_PER_VIEW slots —
  // this is what guarantees a fixed 7-day window regardless of screen size,
  // and it's also why paging can never produce a partial column: a "week" of
  // scroll distance is by definition exactly the viewport width.
  const colStep   = viewportWidth > 0 ? viewportWidth / DAYS_PER_VIEW : 50;
  const barWidth  = colStep * BAR_WIDTH_RATIO;
  const barRadius = barWidth / 2;

  const plotWidth  = Math.max(calendarDays.length * colStep, viewportWidth);
  const maxScrollX = Math.max(0, calendarDays.length * colStep - viewportWidth);

  useEffect(() => {
    if (viewportWidth === 0) return;
    scrollRef.current?.scrollTo({ x: maxScrollX, animated: false });
    setScrollX(maxScrollX);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarDays.length, viewportWidth]);

  const handleScroll = useCallback((e) => {
    setScrollX(e.nativeEvent.contentOffset.x);
  }, []);

  const goToWeek = (direction) => {
    const next = clamp(scrollX + direction * viewportWidth, 0, maxScrollX);
    scrollRef.current?.scrollTo({ x: next, animated: true });
    setScrollX(next);
  };

  if (calendarDays.length === 0) return null;

  const totalHeight = chartHeight + TOP_PAD * 2 + LABEL_GAP;

  // Date range + average currently in view, for the header — mirrors Apple
  // Health's big "avg time asleep" stat with a "18 – 24 May" range beneath it.
  const leftIndex  = clamp(Math.round(scrollX / colStep), 0, calendarDays.length - 1);
  const rightIndex = clamp(Math.round((scrollX + viewportWidth) / colStep) - 1, leftIndex, calendarDays.length - 1);
  const visible    = calendarDays.slice(leftIndex, rightIndex + 1).map((d) => d.entry).filter(Boolean);
  const avgSleepDuration = computeMetrics(visible).avgSleepDuration;

  const startDate  = new Date(`${calendarDays[leftIndex].date}T12:00:00`);
  const endDate    = new Date(`${calendarDays[rightIndex].date}T12:00:00`);
  // Always include the month on both ends, even within the same month —
  // a bare day number next to a full "Jul 13, 2026" reads as a typo rather
  // than a range, since Intl puts the month before the day in this locale.
  const rangeLabel = `${startDate.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} \u2013 ${endDate.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const atStart = scrollX <= 0;
  const atEnd   = scrollX >= maxScrollX - 1;

  // Sleep-midpoint trend line: the centre of each night's asleep segment,
  // connected day to day like a small time series — reveals circadian phase
  // drift over the study (e.g. weekend shifts) the way a real actogram would.
  // A missing day is simply a null here, which breaks the run automatically
  // (see the loop below) — so we never draw a line across a missed night.
  const midpoints = calendarDays.map((day, i) => {
    const entry = day.entry;
    if (!entry) return null;
    const a = entry.answers;
    const tried    = shiftedMinutes(a.mq2) ?? shiftedMinutes(a.mq1);
    const solMin   = a.mq3 ? a.mq3.hours * 60 + a.mq3.minutes : 0;
    const onset    = tried !== null ? tried + solMin : null;
    const finalWake = shiftedMinutes(a.mq6) ?? shiftedMinutes(a.mq7);
    if (onset === null || finalWake === null) return null;
    return {
      x: i * colStep + colStep / 2,
      y: yFor((onset + finalWake) / 2) + TOP_PAD,
      date: day.date,
    };
  });

  const midpointRuns = [];
  let currentRun = [];
  for (const p of midpoints) {
    if (!p) {
      if (currentRun.length) midpointRuns.push(currentRun);
      currentRun = [];
      continue;
    }
    currentRun.push(p);
  }
  if (currentRun.length) midpointRuns.push(currentRun);

  return (
    <View>
      <Text style={[styles.statLabel, { fontFamily: FONTS.bodyMedium }]}>{t('report.avgSleepDuration')}</Text>
      <Text style={[styles.statValue, { fontFamily: FONTS.heading }]}>{formatDuration(avgSleepDuration)}</Text>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => goToWeek(-1)} disabled={atStart} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={atStart ? '#C8D5E0' : HEADER_TEXT} />
        </TouchableOpacity>
        <Text style={[styles.headerLabel, { fontFamily: FONTS.bodyMedium }]}>{rangeLabel}</Text>
        <TouchableOpacity onPress={() => goToWeek(1)} disabled={atEnd} hitSlop={8}>
          <Ionicons name="chevron-forward" size={20} color={atEnd ? '#C8D5E0' : HEADER_TEXT} />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <Svg width={AXIS_WIDTH} height={totalHeight}>
          {gridTimes.map((m) => (
            <SvgText
              key={m}
              x={0}
              y={yFor(m) + TOP_PAD + 4}
              fontFamily={FONTS.bodyMedium}
              fontSize={12}
              fill={AXIS_TEXT}
            >
              {formatClock(m)}
            </SvgText>
          ))}
        </Svg>

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={calendarDays.length > DAYS_PER_VIEW}
          onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <Svg width={plotWidth} height={totalHeight}>
            <Defs>
              {calendarDays.map((day) => {
                const entry = day.entry;
                if (!entry) return null;
                const a = entry.answers;
                const bed      = shiftedMinutes(a.mq1);
                const outOfBed = shiftedMinutes(a.mq7);
                if (bed === null || outOfBed === null) return null;
                const yBed = yFor(bed) + TOP_PAD;
                const yOut = yFor(outOfBed) + TOP_PAD;
                return (
                  <ClipPath id={`clip-${day.date}`} key={day.date}>
                    <Rect x={0} y={yBed} width={barWidth} height={Math.max(0, yOut - yBed)} rx={barRadius} />
                  </ClipPath>
                );
              })}
            </Defs>

            {gridTimes.map((m) => (
              <Line
                key={m}
                x1={0} y1={yFor(m) + TOP_PAD}
                x2={plotWidth} y2={yFor(m) + TOP_PAD}
                stroke={GRID_COLOR}
                strokeDasharray="3,4"
              />
            ))}

            {calendarDays.map((day, i) => {
              const colCenter = i * colStep + colStep / 2;
              const dayLabel  = new Date(`${day.date}T12:00:00`).toLocaleDateString(locale, { weekday: 'short' });
              const entry = day.entry;

              if (!entry) {
                // Missed entry — keep the column's place with just a faint
                // placeholder and the day label, instead of compressing the
                // timeline as if the day never happened.
                return (
                  <React.Fragment key={day.date}>
                    <Line
                      x1={colCenter} y1={TOP_PAD}
                      x2={colCenter} y2={chartHeight + TOP_PAD}
                      stroke={EMPTY_COLOR}
                      strokeWidth={1}
                      strokeDasharray="2,3"
                    />
                    <SvgText
                      x={colCenter}
                      y={chartHeight + TOP_PAD * 2 + LABEL_GAP - 6}
                      fontFamily={FONTS.bodyMedium}
                      fontSize={12}
                      fill={AXIS_TEXT}
                      textAnchor="middle"
                    >
                      {dayLabel}
                    </SvgText>
                  </React.Fragment>
                );
              }

              const a = entry.answers;
              const x = colCenter - barWidth / 2;

              const bed      = shiftedMinutes(a.mq1);
              const tried    = shiftedMinutes(a.mq2) ?? bed;
              const solMin   = a.mq3 ? a.mq3.hours * 60 + a.mq3.minutes : 0;
              const onset    = tried + solMin;
              const outOfBed = shiftedMinutes(a.mq7);
              const finalWake = shiftedMinutes(a.mq6) ?? outOfBed;
              if (bed === null || outOfBed === null) return null;

              const yBed   = yFor(bed) + TOP_PAD;
              const yTried = yFor(tried) + TOP_PAD;
              const yOnset = yFor(onset) + TOP_PAD;
              const yWake  = yFor(finalWake) + TOP_PAD;
              const yOut   = yFor(outOfBed) + TOP_PAD;

              const wakings = a.mq4 === 'yes' ? (a.mq4b ?? 0) : 0;
              // Dots sit in a row just above the bar rather than inside it —
              // exact within-night timing isn't recorded, so a count of
              // markers reads more honestly than scattering them through the
              // asleep segment. Spacing tightens for higher counts so the
              // row never spills wider than the bar itself.
              const dotY = Math.max(WAKING_DOT_R + 1, yBed - WAKING_ROW_OFFSET);
              const dotSpacing = wakings > 1
                ? Math.min(WAKING_DOT_GAP, (barWidth - WAKING_DOT_R * 2) / (wakings - 1))
                : 0;
              const dotXs = Array.from({ length: wakings }, (_, k) =>
                colCenter - ((wakings - 1) * dotSpacing) / 2 + k * dotSpacing,
              );

              return (
                <React.Fragment key={day.date}>
                  <G transform={`translate(${x}, 0)`} clipPath={`url(#clip-${day.date})`}>
                    <Rect x={0} y={yBed}   width={barWidth} height={Math.max(0, yTried - yBed)} fill={AWAKE_FILL} />
                    <Rect x={0} y={yTried} width={barWidth} height={Math.max(0, yOnset - yTried)} fill={AWAKE_FILL} />
                    <Rect x={0} y={yOnset} width={barWidth} height={Math.max(0, yWake - yOnset)} fill={ASLEEP_FILL} />
                    <Rect x={0} y={yWake}  width={barWidth} height={Math.max(0, yOut - yWake)} fill={AWAKE_FILL} />
                  </G>
                  {dotXs.map((dx, idx) => (
                    <Circle key={idx} cx={dx} cy={dotY} r={WAKING_DOT_R} fill={WAKING_COLOR} />
                  ))}
                  <SvgText
                    x={colCenter}
                    y={chartHeight + TOP_PAD * 2 + LABEL_GAP - 6}
                    fontFamily={FONTS.bodyMedium}
                    fontSize={12}
                    fill={AXIS_TEXT}
                    textAnchor="middle"
                  >
                    {dayLabel}
                  </SvgText>
                </React.Fragment>
              );
            })}

            {midpointRuns.map((run, idx) => (
              <React.Fragment key={idx}>
                {run.length > 1 && (
                  <Path
                    d={`M ${run.map((p) => `${p.x},${p.y}`).join(' L ')}`}
                    stroke={MIDPOINT_COLOR}
                    strokeWidth={1.5}
                    strokeDasharray="4,3"
                    fill="none"
                  />
                )}
                {run.map((p) => (
                  <Circle key={p.date} cx={p.x} cy={p.y} r={3} fill={MIDPOINT_COLOR} stroke="#fff" strokeWidth={1} />
                ))}
              </React.Fragment>
            ))}
          </Svg>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row:         { flexDirection: 'row' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 8 },
  headerLabel: { fontSize: SIZES.caption, color: '#1E3A5F' },
  statLabel:   { fontSize: SIZES.caption, color: '#94A3B8', paddingHorizontal: 4 },
  statValue:   { fontSize: SIZES.sectionTitle, color: '#1E3A5F', paddingHorizontal: 4, marginBottom: 8 },
});
