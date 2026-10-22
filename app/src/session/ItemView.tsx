import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { content, sentence, word } from '../content';
import type { Item } from '../content/types';
import { normalize } from '../engine/check';
import { Inline } from '../ui/Markdown';
import { Button, Chip, TurkishInput } from '../ui/controls';
import { Picture, SpeakButton } from '../ui/media';
import { colors, radius, space } from '../ui/theme';
import { acceptedFor, explicitFeedback, gradeChoice, gradeTyped, type ItemResult } from './grade';

export interface ItemProps {
  item: Item;
  locked: boolean;
  onResult: (r: ItemResult) => void;
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Instruction({ children }: { children: string }) {
  return <Text style={styles.instruction}>{children}</Text>;
}

function Big({ children }: { children: string }) {
  return <Inline text={children} style={styles.big} />;
}

const audioFor = (sentenceId: string) => content.sentences[sentenceId]?.audio ?? sentenceId;

// ---------- multiple choice ----------

function ChoiceItem({ item, locked, onResult }: ItemProps) {
  const [options] = useState(() => shuffled(item.options!));
  const [chosen, setChosen] = useState<string>();
  const choose = (o: string) => {
    setChosen(o);
    onResult(gradeChoice(item, o));
  };

  let header: React.ReactNode = null;
  if (item.type === 'pick_suffix') {
    const form = content.suffixes[item.suffix!].form;
    header = (
      <>
        <Instruction>{`Add the ending -${form}`}</Instruction>
        <Big>{`**${word(item.base!).lemma}** + ?`}</Big>
      </>
    );
  } else if (item.type === 'picture_choose') {
    header = (
      <>
        <Instruction>Choose the right word</Instruction>
        {item.images?.map((id) => <Picture key={id} id={id} size={96} />)}
        <Big>{item.prompt!}</Big>
      </>
    );
  } else if (item.type === 'meaning_choice') {
    const w = word(item.base!);
    header = (
      <>
        <Instruction>What does it mean?</Instruction>
        <View style={styles.rowCenter}>
          <SpeakButton audio={w.lemma} />
          <Big>{`**${w.lemma}**`}</Big>
        </View>
      </>
    );
  } else if (item.type === 'listen_choose') {
    header = (
      <>
        <Instruction>{options.some((o) => o.startsWith('img.')) ? 'Listen and choose the picture' : 'Listen and choose the meaning'}</Instruction>
        <SpeakButton audio={audioFor(item.sentence!)} label="🔊  Play" />
      </>
    );
  } else if (item.type === 'contrast_pair') {
    header = (
      <>
        <Instruction>Which one means…</Instruction>
        <Big>{`“${item.prompt}”`}</Big>
      </>
    );
  }

  const isPicture = (o: string) => o.startsWith('img.');
  // contrast_pair options are sentence IDs: show their Turkish text
  const label = (o: string) => content.sentences[o]?.tr ?? o;
  return (
    <View style={styles.gap}>
      {header}
      <View style={[styles.options, options.some(isPicture) && styles.pictureOptions]}>
        {options.map((o) => {
          const state = locked ? (o === item.answer ? 'correct' : o === chosen ? 'wrong' : undefined) : undefined;
          return isPicture(o) ? (
            <Pressable
              key={o}
              accessibilityRole="button"
              accessibilityLabel={o.split('.').pop()!.replace(/_/g, ' ')}
              disabled={locked}
              onPress={() => choose(o)}
              style={[
                styles.pictureOption,
                state === 'correct' && { borderColor: colors.correct, backgroundColor: colors.correctBg },
                state === 'wrong' && { borderColor: colors.wrong, backgroundColor: colors.wrongBg },
              ]}
            >
              <Picture id={o} size={48} />
            </Pressable>
          ) : (
            <Chip key={o} label={label(o)} onPress={() => choose(o)} disabled={locked} state={state} />
          );
        })}
      </View>
    </View>
  );
}

// ---------- typed answers ----------

function TypedItem({ item, locked, onResult }: ItemProps) {
  const [value, setValue] = useState('');
  const { accepted, lang } = acceptedFor(item);
  const check = () => value.trim() && onResult(gradeTyped(item, value, accepted, lang));

  let header: React.ReactNode = null;
  switch (item.type) {
    case 'type_form':
      header = (
        <>
          <Instruction>Write in Turkish</Instruction>
          <Big>{`“${item.prompt}”`}</Big>
          <Text style={styles.hint}>{`${word(item.base!).lemma} + ${item.suffixes!.map((s) => '-' + content.suffixes[s].form).join(' ')}`}</Text>
        </>
      );
      break;
    case 'translate_to_tr':
      header = (
        <>
          <Instruction>Translate into Turkish</Instruction>
          {item.images?.map((id) => <Picture key={id} id={id} size={72} />)}
          <Big>{sentence(item.sentence!).en[0]}</Big>
        </>
      );
      break;
    case 'translate_to_en': {
      const s = sentence(item.sentence!);
      header = (
        <>
          <Instruction>Translate into English</Instruction>
          <View style={styles.rowCenter}>
            <SpeakButton audio={audioFor(s.id)} />
            <Big>{s.tr}</Big>
          </View>
        </>
      );
      break;
    }
    case 'dictation':
      header = (
        <>
          <Instruction>Type what you hear</Instruction>
          <View style={styles.row}>
            <SpeakButton audio={audioFor(item.sentence!)} label="🔊  Play" />
            <SpeakButton audio={audioFor(item.sentence!)} label="🐢  Slow" slow />
          </View>
        </>
      );
      break;
    case 'word_recall':
      header = (
        <>
          <Instruction>Write it in Turkish</Instruction>
          {item.images?.slice(0, 1).map((id) => <Picture key={id} id={id} size={80} />)}
          <Big>{`“${item.prompt}”`}</Big>
        </>
      );
      break;
    case 'qa': {
      const q = sentence(item.question!);
      header = (
        <>
          <Instruction>Answer the question</Instruction>
          {item.images?.map((id) => <Picture key={id} id={id} size={88} />)}
          <View style={styles.rowCenter}>
            <SpeakButton audio={audioFor(q.id)} />
            <Big>{q.tr}</Big>
          </View>
        </>
      );
      break;
    }
  }

  return (
    <View style={styles.gap}>
      {header}
      <TurkishInput value={value} onChange={setValue} onSubmit={check} disabled={locked} lang={lang} />
      {!locked && <Button title="Check" onPress={check} disabled={!value.trim()} />}
    </View>
  );
}

// ---------- assembling tiles ----------

function TileItem({ item, locked, onResult }: ItemProps) {
  const source = item.type === 'build_word' ? item.tiles! : item.word_bank!;
  const [bank] = useState(() => shuffled(source.map((t, i) => ({ t, i }))));
  const [picked, setPicked] = useState<number[]>([]);
  const joiner = item.type === 'build_word' ? '·' : ' ';
  const answer = picked.map((i) => source[i]).join(joiner);

  const check = () => {
    if (item.type === 'build_word') {
      if (answer === item.answer) onResult({ status: 'correct' });
      else {
        onResult({ status: 'wrong', message: explicitFeedback(item, answer), expected: item.answer });
      }
    } else {
      const { accepted } = acceptedFor(item);
      onResult(gradeTyped(item, answer, accepted));
    }
  };

  const s = item.sentence ? sentence(item.sentence) : undefined;
  return (
    <View style={styles.gap}>
      {item.type === 'build_word' ? (
        <Instruction>Build the word: tap the pieces in order</Instruction>
      ) : (
        <>
          <Instruction>Translate into Turkish</Instruction>
          <Big>{s!.en[0]}</Big>
        </>
      )}
      <View style={styles.answerLine}>
        {picked.map((i) => (
          <Chip key={i} label={source[i]} disabled={locked} onPress={() => setPicked(picked.filter((p) => p !== i))} />
        ))}
      </View>
      <View style={styles.options}>
        {bank.map(({ t, i }) => (
          <View key={i} style={{ opacity: picked.includes(i) ? 0.25 : 1 }}>
            <Chip label={t} disabled={locked || picked.includes(i)} onPress={() => setPicked([...picked, i])} />
          </View>
        ))}
      </View>
      {!locked && <Button title="Check" onPress={check} disabled={!picked.length} />}
    </View>
  );
}

// ---------- spot the error ----------

function SpotErrorItem({ item, locked, onResult }: ItemProps) {
  const tokens = item.text!.split(' ');
  const [found, setFound] = useState(false);
  const [value, setValue] = useState(item.error!);

  const tap = (tok: string) => {
    if (normalize(tok) === normalize(item.error!)) setFound(true);
    else onResult({ status: 'wrong', message: `The mistake is in **${item.error}**.`, expected: sentence(item.sentence!).tr });
  };
  const check = () => onResult(gradeTyped(item, value, [item.answer!]));

  return (
    <View style={styles.gap}>
      <Instruction>{found ? 'Correct the word' : 'Tap the mistake'}</Instruction>
      <View style={styles.options}>
        {tokens.map((t, i) => (
          <Chip key={i} label={t} disabled={locked || found} selected={found && normalize(t) === normalize(item.error!)} onPress={() => tap(t)} />
        ))}
      </View>
      {found && (
        <>
          <TurkishInput value={value} onChange={setValue} onSubmit={check} disabled={locked} />
          {!locked && <Button title="Check" onPress={check} />}
        </>
      )}
    </View>
  );
}

// ---------- mini dialogue ----------

function DialogueItem({ item, locked, onResult }: ItemProps) {
  const [value, setValue] = useState('');
  const blank = item.turns!.find((t) => t.blank)!;
  const check = () => value.trim() && onResult(gradeTyped(item, value, blank.answers!, 'tr', blank.spoken ?? item.spoken));

  return (
    <View style={styles.gap}>
      <Instruction>Complete the dialogue</Instruction>
      {item.images?.map((id) => <Picture key={id} id={id} size={72} />)}
      {item.turns!.map((t, i) => (
        <View key={i} style={[styles.bubble, t.speaker === 'B' && styles.bubbleB]}>
          <Text style={styles.speaker}>{t.speaker}</Text>
          {t.sentence ? (
            <View style={styles.rowCenter}>
              <SpeakButton audio={audioFor(t.sentence)} />
              <Inline text={sentence(t.sentence).tr} />
            </View>
          ) : (
            <TurkishInput value={value} onChange={setValue} onSubmit={check} disabled={locked} placeholder="Your answer…" />
          )}
        </View>
      ))}
      {!locked && <Button title="Check" onPress={check} disabled={!value.trim()} />}
    </View>
  );
}

export function ItemView(props: ItemProps) {
  switch (props.item.type) {
    case 'pick_suffix':
    case 'picture_choose':
    case 'listen_choose':
    case 'contrast_pair':
    case 'meaning_choice':
      return <ChoiceItem {...props} />;
    case 'build_word':
    case 'translate_to_tr':
      return props.item.typed ? <TypedItem {...props} /> : <TileItem {...props} />;
    case 'spot_error':
      return <SpotErrorItem {...props} />;
    case 'mini_dialogue':
      return <DialogueItem {...props} />;
    default:
      return <TypedItem {...props} />;
  }
}

const styles = StyleSheet.create({
  gap: { gap: space(4) },
  instruction: { fontSize: 15, fontWeight: '600', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  big: { fontSize: 24, lineHeight: 32 },
  hint: { fontSize: 15, color: colors.muted },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  pictureOptions: { justifyContent: 'space-between' },
  pictureOption: { width: '31%', minHeight: 96, borderWidth: 2, borderColor: colors.border, borderRadius: radius, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: space(2) },
  row: { flexDirection: 'row', gap: space(2) },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: space(3), flexWrap: 'wrap' },
  answerLine: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2), minHeight: 60, borderBottomWidth: 2, borderColor: colors.border, paddingBottom: space(2) },
  bubble: { backgroundColor: colors.surface, borderRadius: radius, padding: space(3), gap: space(2), borderWidth: 1, borderColor: colors.border, marginRight: space(8) },
  bubbleB: { marginRight: 0, marginLeft: space(8), backgroundColor: '#EEF4FA' },
  speaker: { fontSize: 12, fontWeight: '700', color: colors.muted },
});
