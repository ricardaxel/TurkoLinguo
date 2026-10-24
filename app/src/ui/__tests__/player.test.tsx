import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import { SpeakButton, utterancesFor } from '../media';
import { NORMAL_RATE, player, SLOW_RATE } from '../player';

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));

const speakMock = Speech.speak as jest.Mock;
/** Finish the utterance the voice is saying now. */
const finishCurrent = () => act(async () => speakMock.mock.calls.at(-1)[1].onDone());
const said = () => speakMock.mock.calls.map(([text, opts]) => `${text}@${opts.rate}`);

beforeEach(() => {
  player.stop();
  speakMock.mockClear();
});

describe('player', () => {
  it('plays a queue one utterance at a time', () => {
    player.play('a', [{ text: 'bir', rate: 1 }, { text: 'iki', rate: 1 }]);
    expect(said()).toEqual(['bir@1']);
    speakMock.mock.calls[0][1].onDone();
    expect(said()).toEqual(['bir@1', 'iki@1']);
    speakMock.mock.calls[1][1].onDone();
    expect(player.getState().status).toBe('idle');
  });

  it('pause stops the voice; resume says the current utterance again and goes on', () => {
    player.play('a', [{ text: 'bir', rate: 1 }, { text: 'iki', rate: 1 }]);
    speakMock.mock.calls[0][1].onDone();
    player.pause();
    expect(player.getState()).toEqual({ owner: 'a', status: 'paused' });
    expect(Speech.stop).toHaveBeenCalled();
    // a late callback from the stopped utterance changes nothing
    speakMock.mock.calls[1][1].onDone();
    expect(player.getState().status).toBe('paused');
    player.resume();
    expect(said()).toEqual(['bir@1', 'iki@1', 'iki@1']);
    expect(player.getState().status).toBe('playing');
  });

  it('a new play takes over from the previous button', () => {
    player.play('a', [{ text: 'bir', rate: 1 }]);
    player.play('b', [{ text: 'iki', rate: 1 }]);
    expect(player.getState()).toEqual({ owner: 'b', status: 'playing' });
    speakMock.mock.calls[0][1].onDone(); // stale
    expect(player.getState().owner).toBe('b');
  });

  it('"slow, then normal" audio is said twice normally and once on the slow button', () => {
    expect(utterancesFor('aud.own.fistikci_sahap', NORMAL_RATE).map((u) => u.rate)).toEqual([SLOW_RATE, NORMAL_RATE]);
    expect(utterancesFor('aud.own.fistikci_sahap', SLOW_RATE).map((u) => u.rate)).toEqual([SLOW_RATE]);
  });
});

describe('SpeakButton', () => {
  it('offers play and slow, then pause and resume', async () => {
    await render(<SpeakButton audio="kitap" caption="kitap" />);
    await fireEvent.press(screen.getByRole('button', { name: 'Play: kitap' }));
    expect(said()).toEqual([`kitap@${NORMAL_RATE}`]);
    await fireEvent.press(screen.getByRole('button', { name: 'Pause: kitap' }));
    expect(player.getState().status).toBe('paused');
    await fireEvent.press(screen.getByRole('button', { name: 'Resume: kitap' }));
    expect(said()).toEqual([`kitap@${NORMAL_RATE}`, `kitap@${NORMAL_RATE}`]);
    await finishCurrent();
    expect(screen.getByRole('button', { name: 'Play: kitap' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Play slowly: kitap' }));
    expect(said().at(-1)).toBe(`kitap@${SLOW_RATE}`);
  });

  it('only the button that plays shows pause', async () => {
    await render(
      <>
        <SpeakButton audio="ev" caption="ev" />
        <SpeakButton audio="okul" caption="okul" />
      </>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Play: ev' }));
    expect(screen.getByRole('button', { name: 'Pause: ev' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Play: okul' })).toBeTruthy();
  });
});
