import type { CSSProperties } from 'react';

export interface ImageCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProductImage {
  url: string;
  crop?: ImageCrop;
}

/**
 * Reproduces a saved percent-based crop rect inside any fixed-aspect-ratio,
 * overflow:hidden container. The rect always shares the container's aspect
 * ratio (enforced by the crop editor), so the same width/height scale factor
 * applies on both axes regardless of container size.
 */
export function getCropStyle(crop?: ImageCrop): CSSProperties {
  if (!crop) return { width: '100%', height: '100%', objectFit: 'cover' };
  return {
    position: 'absolute',
    width: `calc(100% * 100 / ${crop.width})`,
    height: `calc(100% * 100 / ${crop.height})`,
    left: `calc(-100% * ${crop.x} / ${crop.width})`,
    top: `calc(-100% * ${crop.y} / ${crop.height})`,
  };
}
