// How an image ID becomes something drawable (pure: no React, testable).
//   OpenMoji asset          → system emoji for its code point (until the OpenMoji SVGs are bundled)
//   own icon (icons.tsx)    → our SVG drawing
//   asset with `compose`    → an arrangement of other images (on / in / at / row / panels)
//   anything else           → a text label (counts as missing: see the test)

import { content } from '../content';
import type { Compose } from '../content/types';

export const OWN_ICONS = ['table', 'cupboard', 'lamp'] as const;
export type OwnIcon = (typeof OWN_ICONS)[number];

export type ImageNode =
  | { kind: 'emoji'; char: string }
  | { kind: 'icon'; name: OwnIcon }
  | { kind: 'compose'; layout: Compose['layout']; items: ImageNode[] }
  | { kind: 'missing'; label: string };

function fromCompose(c: Compose): ImageNode {
  return { kind: 'compose', layout: c.layout, items: c.items.map((i) => (typeof i === 'string' ? resolveImage(i) : fromCompose(i))) };
}

export function resolveImage(id: string): ImageNode {
  const asset = content.assets[id];
  const label = id.split('.').pop()!.replace(/_/g, ' ');
  if (!asset) return { kind: 'missing', label };
  if (asset.compose) return fromCompose(asset.compose);
  const icon = /^img\.own\.(.+)$/.exec(id)?.[1];
  if (icon && (OWN_ICONS as readonly string[]).includes(icon)) return { kind: 'icon', name: icon as OwnIcon };
  const hex = asset.source === 'openmoji' ? /([0-9A-F]{4,6}(?:-[0-9A-F]{4,6})*)\.svg$/i.exec(asset.file ?? '')?.[1] : undefined;
  if (hex) return { kind: 'emoji', char: String.fromCodePoint(...hex.split('-').map((h) => parseInt(h, 16))) };
  if (asset.derived_from?.length) return { kind: 'compose', layout: 'row', items: asset.derived_from.map(resolveImage) };
  return { kind: 'missing', label };
}

/** Labels of every part that can't be drawn (empty = fully drawable). */
export function missingParts(node: ImageNode): string[] {
  if (node.kind === 'missing') return [node.label];
  if (node.kind === 'compose') return node.items.flatMap(missingParts);
  return [];
}
