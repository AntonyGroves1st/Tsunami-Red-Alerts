import { useWindowDimensions } from 'react-native';
import { useMemo } from 'react';

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const sw = width / BASE_WIDTH;
    const sh = height / BASE_HEIGHT;
    const isSmall = width < 360;
    const isMedium = width >= 360 && width < 414;
    const isLarge = width >= 414;
    const isShort = height < 700;
    const isTall = height >= 812;
    const isWeb = width > 500;

    const sp = (size: number) => Math.round(size * sw);
    const vs = (size: number) => Math.round(size * sh);
    const fs = (size: number) => Math.round(size * Math.min(sw, 1.3));
    const hp = (percent: number) => Math.round((width * percent) / 100);
    const vp = (percent: number) => Math.round((height * percent) / 100);

    const axisWidth = Math.max(40, Math.min(56, Math.round(width * 0.14)));

    return {
      width,
      height,
      sw,
      sh,
      isSmall,
      isMedium,
      isLarge,
      isShort,
      isTall,
      isWeb,
      sp,
      vs,
      fs,
      hp,
      vp,
      axisWidth,
    };
  }, [width, height]);
}
