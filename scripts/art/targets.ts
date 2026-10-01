// Delivery targets for the 20 files of §10.4.
export interface RasterTarget {
  id: string;
  w: number;
  h: number;
  quality: number;
}

const bg = (id: string): RasterTarget => ({ id, w: 1920, h: 1080, quality: 0.8 });
const ch = (id: string): RasterTarget => ({ id, w: 768, h: 1024, quality: 0.85 });

export const RASTER_TARGETS: RasterTarget[] = [
  { id: 'MAP01', w: 2048, h: 1536, quality: 0.8 },
  bg('BG01'),
  bg('BG02'),
  bg('BG03'),
  bg('BG04'),
  bg('BG05'),
  bg('BG06'),
  ch('CH01'),
  ch('CH02'),
  ch('CH03'),
  ch('CH04'),
  ch('CH05'),
  ch('CH06'),
  ch('CH07'),
  ch('CH08'),
  ch('CH09'),
  { id: 'FX01', w: 768, h: 768, quality: 0.85 },
];

export const VECTOR_TARGETS = ['LOGO01', 'ICONS01', 'BADGES01'];
