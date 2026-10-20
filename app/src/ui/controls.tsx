import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';
import { colors, radius, space } from './theme';

export function Button({
  title, onPress, disabled, variant = 'primary', style,
}: { title: string; onPress: () => void; disabled?: boolean; variant?: 'primary' | 'secondary'; style?: ViewStyle }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondary,
        disabled && styles.disabled,
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      <Text style={[styles.buttonText, variant === 'secondary' && { color: colors.text }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({
  label, onPress, selected, state, disabled,
}: { label: string; onPress?: () => void; selected?: boolean; state?: 'correct' | 'wrong'; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        state === 'correct' && { borderColor: colors.correct, backgroundColor: colors.correctBg },
        state === 'wrong' && { borderColor: colors.wrong, backgroundColor: colors.wrongBg },
      ]}
    >
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

const LETTERS = ['ç', 'ğ', 'ı', 'ö', 'ş', 'ü', 'İ'];

/** Text input with the Turkish letter bar (CURRICULUM.md §5). */
export function TurkishInput({
  value, onChange, onSubmit, placeholder, disabled, lang = 'tr',
}: { value: string; onChange: (v: string) => void; onSubmit?: () => void; placeholder?: string; disabled?: boolean; lang?: 'tr' | 'en' }) {
  const [sel, setSel] = useState({ start: value.length, end: value.length });
  const ref = useRef<ComponentRef<typeof TextInput>>(null);

  const insert = (ch: string) => {
    const next = value.slice(0, sel.start) + ch + value.slice(sel.end);
    onChange(next);
    const pos = sel.start + ch.length;
    setSel({ start: pos, end: pos });
    ref.current?.focus();
  };

  return (
    <View style={{ gap: space(2) }}>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(v) => {
          // not every platform reports the cursor after typing; assume it's at the end
          onChange(v);
          setSel({ start: v.length, end: v.length });
        }}
        onSelectionChange={(e) => setSel(e.nativeEvent.selection)}
        onSubmitEditing={onSubmit}
        placeholder={placeholder ?? (lang === 'tr' ? 'Type in Turkish…' : 'Type in English…')}
        placeholderTextColor={colors.muted}
        editable={!disabled}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        style={styles.input}
        returnKeyType="done"
      />
      {lang === 'tr' && !disabled && (
        <View style={styles.letterBar}>
          {LETTERS.map((l) => (
            <Pressable key={l} onPress={() => insert(l)} style={styles.letter} accessibilityRole="button" accessibilityLabel={`Insert ${l}`}>
              <Text style={styles.letterText}>{l}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: colors.primary, borderRadius: radius, paddingVertical: space(4), alignItems: 'center' },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.4 },
  buttonText: { color: colors.primaryText, fontSize: 17, fontWeight: '700' },
  chip: { borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius, paddingHorizontal: space(4), paddingVertical: space(3), minWidth: 56, alignItems: 'center' },
  chipSelected: { borderColor: colors.accent, backgroundColor: '#E8F1FA' },
  chipText: { fontSize: 18, color: colors.text },
  input: { borderWidth: 2, borderColor: colors.border, borderRadius: radius, backgroundColor: colors.surface, fontSize: 19, paddingHorizontal: space(4), paddingVertical: space(3), color: colors.text },
  letterBar: { flexDirection: 'row', justifyContent: 'space-between', gap: space(1) },
  letter: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: space(2), alignItems: 'center' },
  letterText: { fontSize: 18, fontWeight: '600', color: colors.text },
});
