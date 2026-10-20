// Minimal Markdown for lesson cards: paragraphs, line breaks, tables, **bold**, *italic*, ~~strike~~.
// Enough for the card bodies in content/lessons; avoids a third-party renderer.

import { StyleSheet, Text, View, type TextStyle } from 'react-native';
import { colors, space } from './theme';

const INLINE = /(\*\*[^*]+\*\*|~~[^~]+~~|\*[^*\s][^*]*\*)/g;

export function Inline({ text, style }: { text: string; style?: TextStyle }) {
  const parts = text.split(INLINE).filter((p) => p !== '');
  return (
    <Text style={[styles.text, style]}>
      {parts.map((p, i) => {
        if (p.startsWith('**')) return <Text key={i} style={styles.bold}>{p.slice(2, -2)}</Text>;
        if (p.startsWith('~~')) return <Text key={i} style={styles.strike}>{p.slice(2, -2)}</Text>;
        if (p.startsWith('*') && p.endsWith('*') && p.length > 2)
          return <Text key={i} style={styles.italic}>{p.slice(1, -1)}</Text>;
        return p;
      })}
    </Text>
  );
}

function Table({ lines }: { lines: string[] }) {
  const rows = lines
    .filter((l) => !/^\|\s*-/.test(l))
    .map((l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  return (
    <View style={styles.table}>
      {rows.map((cells, r) => (
        <View key={r} style={[styles.row, r === 0 && styles.headRow]}>
          {cells.map((c, k) => (
            <View key={k} style={styles.cell}>
              <Inline text={c} style={r === 0 ? styles.headText : styles.cellText} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function Markdown({ body }: { body: string }) {
  const blocks = body.trim().split(/\n\s*\n/);
  return (
    <View style={{ gap: space(3) }}>
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        if (lines.every((l) => l.trim().startsWith('|'))) return <Table key={i} lines={lines} />;
        return <Inline key={i} text={lines.join('\n')} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 17, lineHeight: 25, color: colors.text },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  strike: { textDecorationLine: 'line-through', color: colors.wrong },
  table: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden' },
  row: { flexDirection: 'row', borderTopWidth: 1, borderColor: colors.border },
  headRow: { borderTopWidth: 0, backgroundColor: '#EFEFEA' },
  cell: { flex: 1, padding: space(2) },
  headText: { fontSize: 13, fontWeight: '700', color: colors.muted },
  cellText: { fontSize: 15, lineHeight: 21 },
});
