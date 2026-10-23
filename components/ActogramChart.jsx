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
 *
 * Optional usual-sleep bands: when a `chronotypeBands` prop is passed (built
 * from the participant's MCTQ answers by utils/chronotypeBand.js), two soft
 * bands are drawn behind the grid across every row: navy for usual workday
 * sleep and orange, with dashed edges, for usual free-day sleep. Every night is
 * tested against both, so no night has to be classed as a workday or a free
 * day. A night whose sleep midpoint falls inside either band, or both, gets a
 * tinted column, a filled marker (navy = workday band, orange = free-day band,
 * navy with an orange ring = both) and a W / F / W+F tag under its day label;
 * a night in neither gets a hollow marker and a dash. If the two bands sit
 * close together they are drawn as one. The header counts the nights in view
 * that landed in a band. Without the prop the chart is unchanged.
 *
 * When an `onExpand` handler is passed, a small expand button in the top
 * corner calls it. The final report uses it (and a tap on the chart card) to
 * open the full-screen horizontal view, components/ActogramFullView.jsx. The
 * calendar, night times and time range come from utils/actogram.js, shared
 * with that view.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Circle, Line, Path, Text as SvgText, Defs, ClipPath, G } from 'react-native-svg';
import t, { locale } from '../i18n';
import { computeMetrics } from '../utils/metrics';
import { classifyMidSleep } from '../utils/chronotypeBand';
import { clamp, formatClock, formatDuration, buildCalendar, nightTimes, timeRange } from '../utils/actogram';
import { FONTS, SIZES } from '../theme/typography';

const ASLEEP_FILL   = '#2E7D3233'; // green @ 20% — matches BandBar's band alpha
const AWAKE_FILL    = '#F59E0B33'; // amber @ 20%
const WAKING_COLOR  = '#DC2626';   // solid — a marker, not a band
const WAKING_DOT_R      = 3;
const WAKING_DOT_GAP    = 7;   // preferred centre-to-centre spacing
const WAKING_ROW_OFFSET = 9;   // distance above the bar's top edge
const MIDPOINT_COLOR = '#1E3A5F';  // navy dashed trend line — sleep midpoint
const WORK_COLOR  = '#1E3A5F';   // usual workday sleep band, and markers inside it
const WORK_FILL   = '#1E3A5F17'; // navy @ ~9% — band, drawn behind the grid
const WORK_EDGE   = '#1E3A5F66'; // navy @ 40% — the band's top and bottom edge
const WORK_COLUMN = '#1E3A5F12'; // navy @ ~7% — column highlight behind a night in the band
const FREE_COLOR  = '#E07A20';   // usual free-day sleep band, and markers inside it (the app's orange)
const FREE_FILL   = '#E07A2021'; // orange @ ~13%
const FREE_EDGE   = '#E07A20B3'; // orange @ 70% — drawn dashed
const FREE_COLUMN = '#E07A201A'; // orange @ 10%
const FREE_TEXT   = '#B45309';   // darker orange for the small "F" tags (contrast on white)
const TAG_ROW     = 15;          // extra row under the day labels for the W / F tags
const GRID_COLOR    = '#E2EAF4';
const EMPTY_COLOR    = '#D8E2EC';  // placeholder line for a day with no entry
const AXIS_TEXT     = '#64748B';
const HEADER_TEXT   = '#1E3A5F';

const DAYS_PER_VIEW  = 7;
const BAR_WIDTH_RATIO = 0.5; // bar occupies half its column's width
const PX_PER_MIN = 0.5; // 30px per hour
const TOP_PAD    = 10;
const LABEL_GAP  = 20;
const AXIS_WIDTH = 58;

export default function ActogramChart({ entries, chronotypeBands = null, onExpand = null }) {
  const scrollRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [scrollX, setScrollX] = useState(0);

  // The drawable entries, and the full contiguous calendar range so a missed
  // diary entry shows up as an empty column rather than silently disappearing
  // from the timeline. { date, entry } — entry is null for a day with nothing
  // logged. Shared with the full-screen view (utils/actogram.js).
  const { realEntries, calendarDays } = buildCalendar(entries);
  const { rangeStart, rangeEnd } = timeRange(realEntries, chronotypeBands);

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

  const totalHeight = chartHeight + TOP_PAD * 2 + LABEL_GAP + (chronotypeBands ? TAG_ROW : 0);

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
    const night = day.entry ? nightTimes(day.entry) : null;
    if (!night) return null;
    return {
      x: i * colStep + colStep / 2,
      y: yFor(night.mid) + TOP_PAD,
      date: day.date,
      // null when there are no bands, so nothing is marked or counted.
      kind: chronotypeBands ? classifyMidSleep(night.mid, chronotypeBands) : null,
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

  // Nights in view with a midpoint, and where each one falls.
  const visibleMids  = midpoints.slice(leftIndex, rightIndex + 1).filter(Boolean);
  const countKind    = (k) => visibleMids.filter((p) => p.kind === k).length;
  const nightsInBand = visibleMids.filter((p) => p.kind && p.kind !== 'none').length;
  // The workday / free-day breakdown only makes sense with two separate bands.
  const twoBands     = !!chronotypeBands && !chronotypeBands.merged && !!chronotypeBands.work && !!chronotypeBands.free;

  const renderBand = (key, lo, hi, fill, edge, dash) => (
    <React.Fragment key={key}>
      <Rect x={0} y={yFor(lo) + TOP_PAD} width={plotWidth} height={(hi - lo) * PX_PER_MIN} fill={fill} />
      <Line x1={0} y1={yFor(lo) + TOP_PAD} x2={plotWidth} y2={yFor(lo) + TOP_PAD} stroke={edge} strokeWidth={1} strokeDasharray={dash} />
      <Line x1={0} y1={yFor(hi) + TOP_PAD} x2={plotWidth} y2={yFor(hi) + TOP_PAD} stroke={edge} strokeWidth={1} strokeDasharray={dash} />
    </React.Fragment>
  );

  // Text under each day label, so the band a night fell in never depends on colour.
  const tagText  = (kind) => (
    kind === 'both' ? t('report.tagBoth')
      : kind === 'work' ? t('report.tagWork')
      : kind === 'free' ? t('report.tagFree')
      : kind === 'in'   ? '\u2713'
      : '\u2013'
  );
  const tagColor = (kind) => (kind === 'free' ? FREE_TEXT : kind === 'none' ? AXIS_TEXT : HEADER_TEXT);

  return (
    <View>
      {onExpand && (
        <TouchableOpacity
          style={styles.expandBtn}
          onPress={onExpand}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('report.openFullView')}
        >
          <Ionicons name="expand-outline" size={20} color={HEADER_TEXT} />
        </TouchableOpacity>
      )}
      <Text style={[styles.statLabel, { fontFamily: FONTS.bodyMedium }]}>{t('report.avgSleepDuration')}</Text>
      <Text style={[styles.statValue, { fontFamily: FONTS.heading }]}>{formatDuration(avgSleepDuration)}</Text>
      {chronotypeBands && visibleMids.length > 0 && (
        <>
          <Text style={[styles.bandSummary, !twoBands && { marginBottom: 8 }, { fontFamily: FONTS.bodyMedium }]}>
            {t('report.bandSummary', { inBand: nightsInBand, count: visibleMids.length })}
          </Text>
          {twoBands && (
            <Text style={[styles.bandBreakdown, { fontFamily: FONTS.bodyMedium }]}>
              {t('report.bandBreakdown', { work: countKind('work'), free: countKind('free'), both: countKind('both'), none: countKind('none') })}
            </Text>
          )}
        </>
      )}

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
        <View style={styles.axis}>
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
            {chronotypeBands && !chronotypeBands.merged && chronotypeBands.work && (
              <>
                <Rect x={AXIS_WIDTH - 18} y={yFor(chronotypeBands.work.centre) + TOP_PAD - 7} width={16} height={14} rx={4} fill={WORK_COLOR} />
                <SvgText x={AXIS_WIDTH - 10} y={yFor(chronotypeBands.work.centre) + TOP_PAD + 4} fontFamily={FONTS.bodyMedium} fontSize={10} fill="#fff" textAnchor="middle">{t('report.tagWork')}</SvgText>
              </>
            )}
            {chronotypeBands && !chronotypeBands.merged && chronotypeBands.free && (
              <>
                <Rect x={AXIS_WIDTH - 18} y={yFor(chronotypeBands.free.centre) + TOP_PAD - 7} width={16} height={14} rx={4} fill={FREE_COLOR} />
                <SvgText x={AXIS_WIDTH - 10} y={yFor(chronotypeBands.free.centre) + TOP_PAD + 4} fontFamily={FONTS.bodyMedium} fontSize={10} fill="#fff" textAnchor="middle">{t('report.tagFree')}</SvgText>
              </>
            )}
          </Svg>
        </View>

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
                const night = day.entry ? nightTimes(day.entry) : null;
                if (!night) return null;
                const { bed, outOfBed } = night;
                const yBed = yFor(bed) + TOP_PAD;
                const yOut = yFor(outOfBed) + TOP_PAD;
                return (
                  <ClipPath id={`clip-${day.date}`} key={day.date}>
                    <Rect x={0} y={yBed} width={barWidth} height={Math.max(0, yOut - yBed)} rx={barRadius} />
                  </ClipPath>
                );
              })}
            </Defs>

            {chronotypeBands && (chronotypeBands.merged
              ? renderBand('merged', chronotypeBands.single.lo, chronotypeBands.single.hi, WORK_FILL, WORK_EDGE)
              : [
                  chronotypeBands.work && renderBand('work', chronotypeBands.work.lo, chronotypeBands.work.hi, WORK_FILL, WORK_EDGE),
                  chronotypeBands.free && renderBand('free', chronotypeBands.free.lo, chronotypeBands.free.hi, FREE_FILL, FREE_EDGE, '4,3'),
                ])}

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

              const x = colCenter - barWidth / 2;

              const night = nightTimes(entry);
              if (!night) return null;
              const { bed, tried, onset, finalWake, outOfBed, wakings } = night;

              const yBed   = yFor(bed) + TOP_PAD;
              const yTried = yFor(tried) + TOP_PAD;
              const yOnset = yFor(onset) + TOP_PAD;
              const yWake  = yFor(finalWake) + TOP_PAD;
              const yOut   = yFor(outOfBed) + TOP_PAD;
              const kind   = chronotypeBands ? classifyMidSleep(night.mid, chronotypeBands) : null;

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
                  {(kind === 'work' || kind === 'both' || kind === 'in') && (
                    <Rect x={colCenter - colStep * 0.42} y={TOP_PAD} width={colStep * 0.84} height={chartHeight} rx={8} fill={WORK_COLUMN} />
                  )}
                  {(kind === 'free' || kind === 'both') && (
                    <Rect x={colCenter - colStep * 0.42} y={TOP_PAD} width={colStep * 0.84} height={chartHeight} rx={8} fill={FREE_COLUMN} />
                  )}
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
                  {chronotypeBands && (
                    <SvgText
                      x={colCenter}
                      y={chartHeight + TOP_PAD * 2 + LABEL_GAP - 6 + TAG_ROW}
                      fontFamily={FONTS.bodyMedium}
                      fontSize={11}
                      fill={tagColor(kind)}
                      textAnchor="middle"
                    >
                      {tagText(kind)}
                    </SvgText>
                  )}
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
                {run.map((p) => {
                  // Hollow = in no band. The fill says which band; a ring marks both.
                  const hollow = p.kind === 'none';
                  const free   = p.kind === 'free';
                  const both   = p.kind === 'both';
                  return (
                    <Circle
                      key={p.date} cx={p.x} cy={p.y} r={both ? 4 : 3}
                      fill={hollow ? '#fff' : free ? FREE_COLOR : MIDPOINT_COLOR}
                      stroke={hollow ? MIDPOINT_COLOR : both ? FREE_COLOR : '#fff'}
                      strokeWidth={hollow ? 1.5 : both ? 2 : 1}
                    />
                  );
                })}
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
  // Fixed-width Y axis. flexShrink: 0 stops browsers squeezing it (and clipping
  // the time labels) when the scrolling plot beside it is wider than the screen.
  axis:        { width: AXIS_WIDTH, flexShrink: 0 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 8 },
  headerLabel: { fontSize: SIZES.caption, color: '#1E3A5F' },
  statLabel:   { fontSize: SIZES.caption, color: '#64748B', paddingHorizontal: 4 },
  statValue:   { fontSize: SIZES.sectionTitle, color: '#1E3A5F', paddingHorizontal: 4, marginBottom: 8 },
  bandSummary: { fontSize: SIZES.caption, color: '#1E3A5F', paddingHorizontal: 4 },
  bandBreakdown: { fontSize: SIZES.caption, color: '#64748B', paddingHorizontal: 4, marginBottom: 8 },
  expandBtn:   { position: 'absolute', top: 0, right: 4, zIndex: 1 },
});
