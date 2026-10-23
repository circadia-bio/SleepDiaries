/**
 * components/ActogramLegend.jsx — Legend for the sleep pattern actogram
 *
 * Shared by the final report and the full-screen view. The base items (asleep,
 * awake in bed, night waking, sleep midpoint) always show; when usual-sleep
 * bands are passed, the band and marker items for them are added:
 *   - two bands: workday band, free-day band, in each, in both, in neither
 *   - one band (7 or 0 work days): that band, in it, outside it
 *   - merged bands: one "usual sleep" band, in it, outside it
 *
 * Props:
 *   chronotypeBands  result of getChronotypeBands(), or null
 *   compact          smaller text and tighter spacing, for the full-screen view
 *                    where every line of legend is a line taken from the rows
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import t from '../i18n';
import { formatBandClock } from '../utils/chronotypeBand';
import { ACTOGRAM_COLORS as C } from '../utils/actogram';
import { FONTS, SIZES } from '../theme/typography';

const range = (band) => ({ start: formatBandClock(band.lo), end: formatBandClock(band.hi) });

export default function ActogramLegend({ chronotypeBands = null, compact = false }) {
  const bands = chronotypeBands;
  const two = !!bands && !bands.merged && !!bands.work && !!bands.free;

  const Item = ({ marker, label }) => (
    <View style={styles.item}>
      {marker}
      <Text style={[compact ? styles.labelCompact : styles.label, { fontFamily: FONTS.bodyMedium }]}>{label}</Text>
    </View>
  );

  return (
    <View style={compact ? styles.rowCompact : styles.row}>
      <Item marker={<View style={[styles.swatch, { backgroundColor: C.asleep, borderWidth: 1, borderColor: '#2E7D3255' }]} />} label={t('report.legendAsleep')} />
      <Item marker={<View style={[styles.swatch, { backgroundColor: C.awake, borderWidth: 1, borderColor: '#F59E0B55' }]} />} label={t('report.legendAwake')} />
      <Item marker={<View style={[styles.dot, { backgroundColor: C.waking }]} />} label={t('report.legendWaking')} />
      <Item marker={<View style={styles.dash} />} label={t('report.legendMidpoint')} />

      {bands && bands.merged && (
        <>
          <Item marker={<View style={styles.band} />} label={t('report.legendUsualBand', range(bands.single))} />
          <Item marker={<View style={[styles.dot, { backgroundColor: C.midpoint }]} />} label={t('report.legendInBand')} />
        </>
      )}

      {bands && !bands.merged && bands.work && (
        <>
          <Item marker={<View style={styles.band} />} label={t('report.legendWorkBand', range(bands.work))} />
          <Item marker={<View style={[styles.dot, { backgroundColor: C.work }]} />} label={t('report.legendInWork')} />
        </>
      )}

      {bands && !bands.merged && bands.free && (
        <>
          <Item marker={<View style={styles.bandFree} />} label={t('report.legendFreeBand', range(bands.free))} />
          <Item marker={<View style={[styles.dot, { backgroundColor: C.free }]} />} label={t('report.legendInFree')} />
        </>
      )}

      {two && (
        <Item marker={<View style={[styles.dot, { backgroundColor: C.work, borderWidth: 2, borderColor: C.free }]} />} label={t('report.legendInBoth')} />
      )}

      {bands && (
        <Item
          marker={<View style={[styles.dot, { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: C.midpoint }]} />}
          label={two ? t('report.legendNeither') : t('report.legendOutside')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row:          { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingHorizontal: 2 },
  rowCompact:   { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 4, paddingHorizontal: 2 },
  item:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch:       { width: 12, height: 12, borderRadius: 3 },
  dot:          { width: 10, height: 10, borderRadius: 5 },
  dash:         { width: 16, height: 0, borderTopWidth: 2, borderStyle: 'dashed', borderColor: C.midpoint },
  band:         { width: 14, height: 10, backgroundColor: C.workFill, borderWidth: 1, borderColor: C.workEdge },
  bandFree:     { width: 14, height: 10, backgroundColor: C.freeFill, borderWidth: 1, borderStyle: 'dashed', borderColor: C.free },
  label:        { fontSize: SIZES.caption, color: '#5B7089' },
  labelCompact: { fontSize: 12, color: '#5B7089' },
});
