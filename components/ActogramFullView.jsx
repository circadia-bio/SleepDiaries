/**
 * components/ActogramFullView.jsx — Full-screen horizontal sleep pattern
 *
 * Opened by tapping the weekly chart in the final report. The weekly chart
 * shows seven nights as columns; this view turns it on its side, the way a
 * classic actogram is drawn: time runs left to right and each night is a row,
 * oldest at the top, so a month or more can be read at a glance.
 *
 * Rows fill the screen. The view measures the space below the time axis and
 * sets the row height to fit every night, between 14 px and 36 px (the
 * minimum grows with the system font size). The report unlocks after 14
 * mornings, so a short study gets taller rows rather than a mostly empty
 * screen; a long study that would need rows below the minimum scrolls
 * vertically instead, opening at the newest night. See
 * utils/actogram.js for the sizing rules.
 *
 * It draws the same things as the weekly chart, from the same helpers:
 *   - one stadium bar per night from bedtime to out-of-bed time, soft green
 *     while asleep and soft amber while awake in bed
 *   - night wakings as red dots to the left of the bar (the diary records a
 *     count, not a time)
 *   - the dashed sleep-midpoint line, broken at days with no entry
 *   - optional usual-sleep bands (utils/chronotypeBand.js) as vertical
 *     stripes, with nights whose midpoint falls in a band highlighted by a
 *     tinted row, a filled marker and a W / F / W+F tag
 * Counts here cover every night in the study, not just a week.
 *
 * Props:
 *   visible          whether the modal is open
 *   onClose          called by the close button and the Android back button
 *   entries          diary entries (morning entries are used)
 *   chronotypeBands  result of getChronotypeBands(), or null
 *
 * The app is locked to portrait (app.json), so on phones this is a portrait
 * view; the modal allows both orientations for the web build and for any
 * future change to the lock.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, PixelRatio } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Circle, Line, Path, Text as SvgText, Defs, ClipPath, G } from 'react-native-svg';
import t, { locale } from '../i18n';
import { computeMetrics } from '../utils/metrics';
import { classifyMidSleep } from '../utils/chronotypeBand';
import {
  buildCalendar, nightTimes, timeRange, formatClock, formatDuration,
  fullViewRowHeight, fullViewMetrics, FULL_VIEW_PAD, ACTOGRAM_COLORS as C,
} from '../utils/actogram';
import ActogramLegend from './ActogramLegend';
import { FONTS, SIZES } from '../theme/typography';

const AXIS_HEIGHT_WITH_TAGS = 34; // room for the W / F tags above the time labels
const AXIS_HEIGHT           = 20;

const dayLabel = (dateStr, withMonth) => {
  const d = new Date(`${dateStr}T12:00:00`);
  const weekday = d.toLocaleDateString(locale, { weekday: 'short' });
  const month   = d.toLocaleDateString(locale, { month: 'short' });
  return `${weekday} ${d.getDate()}${withMonth ? ` ${month}` : ''}`;
};

// Text next to each night, so the band it fell in never depends on colour.
const tagText = (kind) => (
  kind === 'both' ? t('report.tagBoth')
    : kind === 'work' ? t('report.tagWork')
    : kind === 'free' ? t('report.tagFree')
    : kind === 'in'   ? '\u2713'
    : '\u2013'
);
const tagColor = (kind) => (kind === 'free' ? C.freeText : kind === 'none' ? C.axisText : C.headerText);

export default function ActogramFullView({ visible, onClose, entries, chronotypeBands = null }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const pendingEnd = useRef(true);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const fontScale = PixelRatio.getFontScale();

  // Each time the view opens, start at the newest night again.
  useEffect(() => { if (visible) pendingEnd.current = true; }, [visible]);

  const { realEntries, calendarDays } = buildCalendar(entries);
  if (calendarDays.length === 0) return null;

  const n = calendarDays.length;
  const { rangeStart, rangeEnd } = timeRange(realEntries, chronotypeBands);
  const showPills  = !!chronotypeBands && !chronotypeBands.merged;
  const axisHeight = showPills ? AXIS_HEIGHT_WITH_TAGS : AXIS_HEIGHT;

  // Measured space for the rows, then the row height that fits them.
  const fit = fullViewRowHeight(area.height - axisHeight, n, fontScale);
  const RH  = fit.rowHeight;
  const m   = fullViewMetrics(RH, fontScale);
  const W   = area.width;
  const LBL = m.labelWidth;
  const H   = fit.contentHeight;
  const ready = W > LBL + 40 && area.height > axisHeight;
  // 20 px kept free at the right so the last time label is not clipped.
  const ppm = ready ? (W - LBL - 20) / (rangeEnd - rangeStart) : 0;
  const x   = (mins) => LBL + (mins - rangeStart) * ppm;
  const rowY = (i) => FULL_VIEW_PAD / 2 + i * RH;

  const gridTimes = [];
  for (let g = rangeStart; g <= rangeEnd; g += 120) gridTimes.push(g);

  const rows = calendarDays.map((day, i) => {
    const night = day.entry ? nightTimes(day.entry) : null;
    return {
      day, i, night,
      kind: night && chronotypeBands ? classifyMidSleep(night.mid, chronotypeBands) : null,
    };
  });

  const logged       = rows.filter((r) => r.night).length;
  const countKind    = (k) => rows.filter((r) => r.kind === k).length;
  const nightsInBand = rows.filter((r) => r.kind && r.kind !== 'none').length;
  const twoBands     = !!chronotypeBands && !chronotypeBands.merged && !!chronotypeBands.work && !!chronotypeBands.free;
  const avgSleepDuration = computeMetrics(calendarDays.map((d) => d.entry).filter(Boolean)).avgSleepDuration;

  const startDate  = new Date(`${calendarDays[0].date}T12:00:00`);
  const endDate    = new Date(`${calendarDays[n - 1].date}T12:00:00`);
  const rangeLabel = `${startDate.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} \u2013 ${endDate.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;

  // Midpoint line, broken at days with no entry so it never crosses a missed night.
  const runs = [];
  let current = [];
  rows.forEach(({ night, i, kind, day }) => {
    if (!night) {
      if (current.length) runs.push(current);
      current = [];
      return;
    }
    current.push({ x: x(night.mid), y: rowY(i) + RH / 2, kind, date: day.date });
  });
  if (current.length) runs.push(current);

  const verticalBand = (key, lo, hi, fill, edge, dash) => (
    <React.Fragment key={key}>
      <Rect x={x(lo)} y={0} width={(hi - lo) * ppm} height={H} fill={fill} />
      <Line x1={x(lo)} y1={0} x2={x(lo)} y2={H} stroke={edge} strokeWidth={1} strokeDasharray={dash} />
      <Line x1={x(hi)} y1={0} x2={x(hi)} y2={H} stroke={edge} strokeWidth={1} strokeDasharray={dash} />
    </React.Fragment>
  );

  const summary = chronotypeBands
    ? t('report.bandSummary', { inBand: nightsInBand, count: logged })
    : t('report.morningEntries', { count: logged });
  const breakdown = twoBands
    ? t('report.bandBreakdown', { work: countKind('work'), free: countKind('free'), both: countKind('both'), none: countKind('none') })
    : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('report.closeFullView')}
          >
            <Ionicons name="close" size={28} color={C.headerText} />
          </TouchableOpacity>
          <Text style={[styles.title, { fontFamily: FONTS.heading }]}>{t('report.sleepPattern')}</Text>
          <Text style={[styles.range, { fontFamily: FONTS.bodyMedium }]}>{rangeLabel}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { fontFamily: FONTS.bodyMedium }]}>{t('report.avgSleepDuration')}</Text>
            <Text style={[styles.statValue, { fontFamily: FONTS.heading }]}>{formatDuration(avgSleepDuration)}</Text>
          </View>
          <Text style={[styles.summary, !breakdown && { marginBottom: 6 }, { fontFamily: FONTS.bodyMedium }]}>{summary}</Text>
          {breakdown && <Text style={[styles.breakdown, { fontFamily: FONTS.bodyMedium }]}>{breakdown}</Text>}

          <View
            style={styles.chartArea}
            onLayout={(e) => setArea({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
            accessible
            accessibilityLabel={`${t('report.sleepPattern')}. ${summary}${breakdown ? `. ${breakdown}` : ''}`}
          >
            {ready && (
              <>
                <Svg width={W} height={axisHeight}>
                  {showPills && chronotypeBands.work && (
                    <>
                      <Rect x={x(chronotypeBands.work.centre) - 8} y={1} width={16} height={14} rx={4} fill={C.work} />
                      <SvgText x={x(chronotypeBands.work.centre)} y={12} fontFamily={FONTS.bodyMedium} fontSize={10} fill="#fff" textAnchor="middle">{t('report.tagWork')}</SvgText>
                    </>
                  )}
                  {showPills && chronotypeBands.free && (
                    <>
                      <Rect x={x(chronotypeBands.free.centre) - 8} y={1} width={16} height={14} rx={4} fill={C.free} />
                      <SvgText x={x(chronotypeBands.free.centre)} y={12} fontFamily={FONTS.bodyMedium} fontSize={10} fill="#fff" textAnchor="middle">{t('report.tagFree')}</SvgText>
                    </>
                  )}
                  {gridTimes.map((g) => (
                    <SvgText
                      key={g}
                      x={x(g)}
                      y={axisHeight - 4}
                      fontFamily={FONTS.bodyMedium}
                      fontSize={11}
                      fill={C.axisText}
                      textAnchor="middle"
                    >
                      {formatClock(g)}
                    </SvgText>
                  ))}
                </Svg>

                <ScrollView
                  ref={scrollRef}
                  style={styles.plotScroll}
                  scrollEnabled={!fit.fits}
                  showsVerticalScrollIndicator={!fit.fits}
                  onContentSizeChange={() => {
                    if (pendingEnd.current && !fit.fits) {
                      scrollRef.current?.scrollToEnd({ animated: false });
                      pendingEnd.current = false;
                    }
                  }}
                >
                  <Svg width={W} height={H}>
                    <Defs>
                      {rows.map(({ day, i, night }) => {
                        if (!night) return null;
                        const cy = rowY(i) + RH / 2;
                        return (
                          <ClipPath id={`fv-${day.date}`} key={day.date}>
                            <Rect
                              x={x(night.bed)} y={cy - m.barHeight / 2}
                              width={Math.max(0, (night.outOfBed - night.bed) * ppm)} height={m.barHeight}
                              rx={m.barHeight / 2}
                            />
                          </ClipPath>
                        );
                      })}
                    </Defs>

                    {chronotypeBands && (chronotypeBands.merged
                      ? verticalBand('merged', chronotypeBands.single.lo, chronotypeBands.single.hi, C.workFill, C.workEdge)
                      : [
                          chronotypeBands.work && verticalBand('work', chronotypeBands.work.lo, chronotypeBands.work.hi, C.workFill, C.workEdge),
                          chronotypeBands.free && verticalBand('free', chronotypeBands.free.lo, chronotypeBands.free.hi, C.freeFill, C.freeEdge, '4,3'),
                        ])}

                    {gridTimes.map((g) => (
                      <Line key={g} x1={x(g)} y1={0} x2={x(g)} y2={H} stroke={C.grid} strokeDasharray="3,4" />
                    ))}

                    {rows.map(({ day, i, night, kind }) => {
                      const y0 = rowY(i);
                      const cy = y0 + RH / 2;
                      const d = new Date(`${day.date}T12:00:00`);
                      const withMonth = i === 0 || d.getDate() === 1;
                      const label = dayLabel(day.date, withMonth);
                      // A thin line at the start of each week (Monday) keeps weeks countable.
                      const weekStart = d.getDay() === 1 && i > 0;

                      if (!night) {
                        return (
                          <React.Fragment key={day.date}>
                            {weekStart && <Line x1={2} y1={y0} x2={W - 2} y2={y0} stroke={C.grid} strokeWidth={1} />}
                            <Line
                              x1={x(rangeStart + 20)} y1={cy} x2={x(rangeEnd - 20)} y2={cy}
                              stroke={C.empty} strokeWidth={1} strokeDasharray="2,3"
                            />
                            <SvgText x={4} y={cy + m.labelSize * 0.35} fontFamily={FONTS.bodyMedium} fontSize={m.labelSize} fill={C.axisText} fillOpacity={0.6}>
                              {label}
                            </SvgText>
                          </React.Fragment>
                        );
                      }

                      const dotStep = m.dotRadius * 2 + 2;
                      return (
                        <React.Fragment key={day.date}>
                          {weekStart && <Line x1={2} y1={y0} x2={W - 2} y2={y0} stroke={C.grid} strokeWidth={1} />}
                          {(kind === 'work' || kind === 'both' || kind === 'in') && (
                            <Rect x={2} y={y0 + 0.5} width={W - 4} height={RH - 1} rx={5} fill={C.workRow} />
                          )}
                          {(kind === 'free' || kind === 'both') && (
                            <Rect x={2} y={y0 + 0.5} width={W - 4} height={RH - 1} rx={5} fill={C.freeRow} />
                          )}
                          <SvgText x={4} y={cy + m.labelSize * 0.35} fontFamily={FONTS.bodyMedium} fontSize={m.labelSize} fill={C.axisText}>
                            {label}
                          </SvgText>
                          {chronotypeBands && (
                            <SvgText
                              x={LBL - 5} y={cy + m.labelSize * 0.35}
                              fontFamily={FONTS.bodyMedium} fontSize={m.labelSize}
                              fill={tagColor(kind)} textAnchor="end"
                            >
                              {tagText(kind)}
                            </SvgText>
                          )}
                          <G clipPath={`url(#fv-${day.date})`}>
                            <Rect x={x(night.bed)}       y={cy - m.barHeight / 2} width={Math.max(0, (night.onset - night.bed) * ppm)}      height={m.barHeight} fill={C.awake} />
                            <Rect x={x(night.onset)}     y={cy - m.barHeight / 2} width={Math.max(0, (night.finalWake - night.onset) * ppm)} height={m.barHeight} fill={C.asleep} />
                            <Rect x={x(night.finalWake)} y={cy - m.barHeight / 2} width={Math.max(0, (night.outOfBed - night.finalWake) * ppm)} height={m.barHeight} fill={C.awake} />
                          </G>
                          {Array.from({ length: night.wakings }, (_, k) => (
                            <Circle key={k} cx={x(night.bed) - 6 - k * dotStep} cy={cy} r={m.dotRadius} fill={C.waking} />
                          ))}
                        </React.Fragment>
                      );
                    })}

                    {runs.map((run, idx) => (
                      <React.Fragment key={idx}>
                        {run.length > 1 && (
                          <Path
                            d={`M ${run.map((p) => `${p.x},${p.y}`).join(' L ')}`}
                            stroke={C.midpoint} strokeWidth={1.5} strokeDasharray="4,3" fill="none"
                          />
                        )}
                        {run.map((p) => {
                          // Hollow = in no band. The fill says which band; a ring marks both.
                          const hollow = p.kind === 'none';
                          const free   = p.kind === 'free';
                          const both   = p.kind === 'both';
                          return (
                            <Circle
                              key={p.date} cx={p.x} cy={p.y} r={both ? m.markerRadius + 1 : m.markerRadius}
                              fill={hollow ? '#fff' : free ? C.free : C.midpoint}
                              stroke={hollow ? C.midpoint : both ? C.free : '#fff'}
                              strokeWidth={hollow ? 1.5 : both ? 2 : 1}
                            />
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </Svg>
                </ScrollView>
              </>
            )}
          </View>

          <View style={styles.legend}>
            <ActogramLegend chronotypeBands={chronotypeBands} compact />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#EEF5FF', paddingHorizontal: 16 },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 10 },
  title:      { fontSize: SIZES.cardTitle, color: C.headerText, flex: 1 },
  range:      { fontSize: SIZES.caption, color: C.headerText },
  card:       { flex: 1, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', padding: 10 },
  // The header block and legend are kept compact: every line of them is a line
  // taken from the rows, and the rows are what a month has to fit into.
  statRow:    { flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingHorizontal: 4 },
  statLabel:  { fontSize: 13, color: '#64748B' },
  statValue:  { fontSize: SIZES.body, color: C.headerText },
  summary:    { fontSize: 13, color: C.headerText, paddingHorizontal: 4 },
  breakdown:  { fontSize: 12, color: '#64748B', paddingHorizontal: 4, marginBottom: 6 },
  chartArea:  { flex: 1 },
  plotScroll: { flex: 1 },
  legend:     { paddingTop: 6 },
});
