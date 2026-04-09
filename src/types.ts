// 游戏类型定义

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface Pos {
  x: number;
  y: number;
}

export interface Tetromino {
  type: TetrominoType;
  blocks: Pos[];
  pos: Pos;
  rotation: number;
}

export type Grid = (TetrominoType | null)[][];

export interface GameState {
  grid: Grid;
  currentTetromino: Tetromino;
  nextTetromino: Tetromino;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
  isPaused: boolean;
  tickRate: number;
}

export interface GameConfig {
  width: number;
  height: number;
  initialTickRate: number;
}
