export type Screen = 'landing' | 'intro' | 'creator' | 'game'
export interface Appearance { skin: string; hair: string; outfit: string }
export interface Position { x: number; y: number }
export interface SaveData {
  version: 1; name: string; appearance: Appearance; health: number; mana: number; xp: number;
  level: number; coins: number; crystalRestored: boolean; enemyDefeated: boolean; position: Position;
}
