export const DESKTOP_MIN_WIDTH = 1024;

export function isDesktopWidth(width: number) {
  return width >= DESKTOP_MIN_WIDTH;
}
