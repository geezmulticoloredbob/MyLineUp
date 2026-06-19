export const USER_ICONS = [
  { id: 'football',   label: 'Football',   emoji: '⚽' },
  { id: 'basketball', label: 'Basketball', emoji: '🏀' },
  { id: 'rugby',      label: 'Rugby/AFL',  emoji: '🏉' },
  { id: 'trophy',     label: 'Trophy',     emoji: '🏆' },
  { id: 'star',       label: 'Star',       emoji: '⭐' },
  { id: 'flame',      label: 'Flame',      emoji: '🔥' },
  { id: 'crown',      label: 'Crown',      emoji: '👑' },
  { id: 'shield',     label: 'Shield',     emoji: '🛡️' },
  { id: 'dart',       label: 'Bullseye',   emoji: '🎯' },
  { id: 'lightning',  label: 'Lightning',  emoji: '⚡' },
];

export function getIcon(iconId) {
  return USER_ICONS.find((i) => i.id === iconId) ?? USER_ICONS[0];
}
