import { render, screen } from '@testing-library/react-native';
import { content } from '../../content';
import type { Item } from '../../content/types';
import { ItemView } from '../ItemView';

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));

const allItems: Item[] = [
  ...Object.values(content.lessons).flatMap((l) => [...l.sessions.learn.items, ...l.sessions.practise.items]),
  ...Object.values(content.checkpoints ?? {}).flatMap((c) => c.items),
];

describe('ItemView', () => {
  it('a typed "translate into Turkish" exercise shows the English to translate', async () => {
    const item = allItems.find((i) => i.type === 'translate_to_tr' && i.typed)!;
    await render(<ItemView item={item} locked={false} onResult={() => {}} />);
    expect(screen.getByText(content.sentences[item.sentence!].en[0])).toBeTruthy();
  });
});
