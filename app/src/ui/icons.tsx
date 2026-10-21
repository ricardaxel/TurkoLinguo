// Our own icons for objects that have no Unicode emoji (table, cupboard, lamp).
// Drawn in the OpenMoji style (72×72 grid, 2px black outline, flat colours) so they sit well next to
// OpenMoji images. Licence: OWN (see content/media/assets.yaml).

import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';
import type { OwnIcon } from './imageModel';

const OUTLINE = { stroke: '#000', strokeWidth: 2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const WOOD = '#A57939';
const WOOD_LIGHT = '#D3A15F';

function Table() {
  return (
    <>
      <Rect x={18} y={34} width={5} height={26} fill={WOOD} {...OUTLINE} />
      <Rect x={49} y={34} width={5} height={26} fill={WOOD} {...OUTLINE} />
      <Rect x={14} y={34} width={44} height={5} fill={WOOD} {...OUTLINE} />
      <Rect x={8} y={27} width={56} height={7} rx={1} fill={WOOD_LIGHT} {...OUTLINE} />
    </>
  );
}

function Cupboard() {
  return (
    <>
      <Rect x={18} y={60} width={6} height={4} fill={WOOD} {...OUTLINE} />
      <Rect x={48} y={60} width={6} height={4} fill={WOOD} {...OUTLINE} />
      <Rect x={15} y={8} width={42} height={52} rx={1} fill={WOOD_LIGHT} {...OUTLINE} />
      <Line x1={36} y1={8} x2={36} y2={60} {...OUTLINE} />
      <Circle cx={32} cy={34} r={1.8} fill="#000" />
      <Circle cx={40} cy={34} r={1.8} fill="#000" />
    </>
  );
}

function Lamp() {
  return (
    <>
      <Ellipse cx={36} cy={63} rx={11} ry={3} fill="#9B9B9A" {...OUTLINE} />
      <Line x1={36} y1={30} x2={36} y2={61} {...OUTLINE} />
      <Path d="M25 11 H47 L54 30 H18 Z" fill="#FCEA2B" {...OUTLINE} />
    </>
  );
}

const DRAWINGS: Record<OwnIcon, () => React.JSX.Element> = { table: Table, cupboard: Cupboard, lamp: Lamp };

export function OwnIconView({ name, size }: { name: OwnIcon; size: number }) {
  const Drawing = DRAWINGS[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 72 72" accessibilityLabel={name}>
      <Drawing />
    </Svg>
  );
}
