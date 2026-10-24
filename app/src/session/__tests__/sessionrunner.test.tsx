import { fireEvent, render, screen } from '@testing-library/react-native';
import { content } from '../../content';
import type { SessionResult } from '../../progress/model';
import { SessionRunner, type Step } from '../SessionRunner';

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});

const [first, second] = content.lessons.L10.sessions.learn.cards;
const choice = content.lessons.L10.sessions.learn.items.find((i) => i.type === 'pick_suffix')!;
const steps: Step[] = [
  { kind: 'card', card: first },
  { kind: 'card', card: second },
  { kind: 'item', item: choice },
];

const renderRunner = (onComplete = jest.fn()) =>
  render(<SessionRunner steps={steps} onExit={() => {}} onComplete={onComplete} summaryTitle="Done" summaryActions={[]} />);

describe('SessionRunner: Previous', () => {
  it('has no Previous button on the first step', async () => {
    await renderRunner();
    expect(screen.queryByRole('button', { name: 'Previous' })).toBeNull();
  });

  it('goes back to the previous card', async () => {
    await renderRunner();
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText(second.title!)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.queryByText(second.title!)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Previous' })).toBeNull();
  });

  it('can go back from an exercise before answering it', async () => {
    await renderRunner();
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByText(second.title!)).toBeTruthy();
  });

  it('keeps an answer when you go back and forward, and counts it once', async () => {
    const onComplete = jest.fn<void, [SessionResult[]]>();
    await renderRunner(onComplete);
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    await fireEvent.press(screen.getByRole('button', { name: choice.answer as string }));
    expect(screen.getByText('Correct!')).toBeTruthy();
    // back to the card, then forward again: the exercise is still answered
    await fireEvent.press(screen.getAllByRole('button', { name: 'Previous' })[0]);
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('Correct!')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toHaveLength(1);
    expect(onComplete.mock.calls[0][0][0].status).toBe('correct');
  });
});
