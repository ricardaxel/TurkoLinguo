import { content } from '../../content';
import { missingParts, resolveImage } from '../imageModel';

/** Every image ID referenced by lessons, cards and the lexicon. */
function usedImages(): string[] {
  const ids = new Set<string>();
  const scan = (v: unknown) => {
    if (typeof v === 'string') { if (v.startsWith('img.')) ids.add(v); }
    else if (Array.isArray(v)) v.forEach(scan);
    else if (v && typeof v === 'object') Object.values(v).forEach(scan);
  };
  scan(content.lessons);
  scan(content.lexicon);
  return [...ids];
}

describe('images', () => {
  it('every image used in the content can be drawn (no text-label fallbacks)', () => {
    const broken = usedImages()
      .map((id) => [id, missingParts(resolveImage(id))] as const)
      .filter(([, missing]) => missing.length);
    expect(broken).toEqual([]);
  });

  it('table, cupboard and lamp are our own icons', () => {
    expect(resolveImage('img.own.table')).toEqual({ kind: 'icon', name: 'table' });
    expect(resolveImage('img.own.lamp').kind).toBe('icon');
  });

  it('cat on table: the cat sits on top of the table', () => {
    const n = resolveImage('img.own.cat_on_table');
    expect(n).toMatchObject({ kind: 'compose', layout: 'on_top', items: [{ kind: 'emoji' }, { kind: 'icon', name: 'table' }] });
  });

  it('phone in bag uses the "in" layout', () => {
    expect(resolveImage('img.own.phone_in_bag')).toMatchObject({ kind: 'compose', layout: 'in' });
  });

  it('nested arrangements resolve (room scene)', () => {
    const n = resolveImage('img.own.room_scene');
    expect(n).toMatchObject({ kind: 'compose', layout: 'row' });
    expect(n.kind === 'compose' && n.items.map((i) => (i.kind === 'compose' ? i.layout : i.kind))).toEqual(['on_top', 'on_top', 'in', 'icon']);
  });

  it('flag emoji (two code points) resolve', () => {
    expect(resolveImage('img.openmoji.flag_uk')).toEqual({ kind: 'emoji', char: '🇬🇧' });
  });
});
