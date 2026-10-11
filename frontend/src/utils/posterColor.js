// Deterministic fallback tint for titles without a poster image.
const TINTS = ['#8A2549', '#353A48', '#17724A', '#A8650A', '#4B3A8C', '#1F5F7A'];
export function posterTint(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}
