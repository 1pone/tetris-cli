import {
  GameState,
  GameConfig,
  Grid,
  Pos,
} from './types.js';
import {
  createTetromino,
  getRandomTetromino,
  rotateTetromino,
  getTetrominoBlocks,
  moveTetromino,
} from './tetromino.js';

const DEFAULT_CONFIG: GameConfig = {
  width: 10,
  height: 20,
  initialTickRate: 500,
};

export function initializeGame(config: Partial<GameConfig> = {}): GameState {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const grid: Grid = Array(finalConfig.height)
    .fill(null)
    .map(() => Array(finalConfig.width).fill(null));

  const currentTetromino = getRandomTetromino();
  const nextTetromino = getRandomTetromino();

  return {
    grid,
    currentTetromino,
    nextTetromino,
    score: 0,
    level: 1,
    lines: 0,
    gameOver: false,
    isPaused: false,
    tickRate: finalConfig.initialTickRate,
  };
}

export function isValidPosition(
  grid: Grid,
  tetrominoBlocks: Pos[],
  width: number,
  height: number
): boolean {
  return tetrominoBlocks.every(block => {
    // 检查边界
    if (block.x < 0 || block.x >= width || block.y >= height) {
      return false;
    }
    // 检查与已放置的方块是否冲突
    if (block.y >= 0 && grid[block.y] && grid[block.y][block.x] !== null) {
      return false;
    }
    return true;
  });
}

export function movePiece(
  state: GameState,
  dx: number,
  dy: number
): GameState {
  if (state.isPaused || state.gameOver) return state;

  const newTetromino = moveTetromino(state.currentTetromino, dx, dy);
  const newBlocks = getTetrominoBlocks(newTetromino);

  if (
    isValidPosition(
      state.grid,
      newBlocks,
      state.grid[0].length,
      state.grid.length
    )
  ) {
    return {
      ...state,
      currentTetromino: newTetromino,
    };
  }

  return state;
}

export function rotatePiece(state: GameState): GameState {
  if (state.isPaused || state.gameOver) return state;

  const rotated = rotateTetromino(state.currentTetromino);
  const newBlocks = getTetrominoBlocks(rotated);

  if (
    isValidPosition(
      state.grid,
      newBlocks,
      state.grid[0].length,
      state.grid.length
    )
  ) {
    return {
      ...state,
      currentTetromino: rotated,
    };
  }

  return state;
}

export function placeTetromino(state: GameState): GameState {
  const blocks = getTetrominoBlocks(state.currentTetromino);
  const newGrid = state.grid.map(row => [...row]);

  // 放置方块到网格
  for (const block of blocks) {
    if (block.y >= 0 && block.y < newGrid.length) {
      newGrid[block.y][block.x] = state.currentTetromino.type;
    }
  }

  // 清除完整的行
  let clearedLines = 0;
  let completedGrid = newGrid.filter(row => {
    const isComplete = row.every(cell => cell !== null);
    if (isComplete) clearedLines++;
    return !isComplete;
  });

  // 在顶部添加空行
  while (completedGrid.length < state.grid.length) {
    completedGrid.unshift(Array(state.grid[0].length).fill(null));
  }

  // 计算分数 (标准俄罗斯方块计分规则)
  const lineScores = [0, 40, 100, 300, 1200]; // 0, 1, 2, 3, 4行
  const scoreIncrease = lineScores[clearedLines] * (state.level + 1);

  const nextTetromino = state.nextTetromino;
  const newNextTetromino = getRandomTetromino();
  const newLevel = Math.floor((state.lines + clearedLines) / 10) + 1;

  const newState = {
    ...state,
    grid: completedGrid,
    currentTetromino: nextTetromino,
    nextTetromino: newNextTetromino,
    score: state.score + scoreIncrease,
    lines: state.lines + clearedLines,
    level: newLevel,
    tickRate: Math.max(100, DEFAULT_CONFIG.initialTickRate - newLevel * 50),
  };

  // 检查新方块是否能放置 (游戏结束条件)
  const newBlocks = getTetrominoBlocks(newState.currentTetromino);
  if (
    !isValidPosition(
      newState.grid,
      newBlocks,
      newState.grid[0].length,
      newState.grid.length
    )
  ) {
    return {
      ...newState,
      gameOver: true,
    };
  }

  return newState;
}

export function dropPiece(state: GameState): GameState {
  if (state.isPaused || state.gameOver) return state;

  let newState = state;

  // 一直向下移动直到不能移动
  while (true) {
    const moved = movePiece(newState, 0, 1);
    if (moved === newState) {
      // 不能继续移动，放置方块
      return placeTetromino(newState);
    }
    newState = moved;
  }
}

export function tick(state: GameState): GameState {
  if (state.isPaused || state.gameOver) return state;

  const moved = movePiece(state, 0, 1);

  // 如果不能移动，放置方块
  if (moved === state) {
    return placeTetromino(state);
  }

  return moved;
}

export function togglePause(state: GameState): GameState {
  return {
    ...state,
    isPaused: !state.isPaused,
  };
}

export function reset(state: GameState): GameState {
  return initializeGame({
    width: state.grid[0].length,
    height: state.grid.length,
  });
}
