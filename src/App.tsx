import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useInput } from 'ink';
import chalk from 'chalk';
import {
  GameState,
  Tetromino,
  Pos,
} from './types.js';
import {
  initializeGame,
  movePiece,
  rotatePiece,
  dropPiece,
  tick,
  togglePause,
  reset,
} from './game.js';
import { getTetrominoBlocks } from './tetromino.js';

interface AppProps {
  width?: number;
  height?: number;
}

const BLOCK = '██';
const EMPTY = '  ';
const SHADOW = '▒▒';

const TETROMINO_COLORS: Record<string, (text: string) => string> = {
  I: chalk.cyan,
  O: chalk.yellow,
  T: chalk.magenta,
  S: chalk.green,
  Z: chalk.red,
  J: chalk.blue,
  L: chalk.yellow,
  default: chalk.white,
};

function getTetrominoColor(type: string): (text: string) => string {
  return TETROMINO_COLORS[type] || TETROMINO_COLORS.default;
}

function renderGrid(state: GameState): React.ReactElement {
  const grid = state.grid;
  const width = grid[0].length;
  const tetrominoBlocks = new Set<string>();
  const currentBlocks = getTetrominoBlocks(state.currentTetromino);

  currentBlocks.forEach(block => {
    tetrominoBlocks.add(`${block.x},${block.y}`);
  });

  const lines: React.ReactElement[] = [];

  // 顶部边界
  lines.push(
    <Text key="top-border">
      {chalk.white('╔' + '═'.repeat(width * 2) + '╗')}
    </Text>
  );

  // 游戏网格
  for (let y = 0; y < grid.length; y++) {
    let rowContent = chalk.white('║');

    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      const isCurrentBlock = tetrominoBlocks.has(key);
      const placedBlockType = grid[y][x];

      if (isCurrentBlock) {
        const color = getTetrominoColor(state.currentTetromino.type);
        rowContent += color(BLOCK);
      } else if (placedBlockType) {
        const color = getTetrominoColor(placedBlockType);
        rowContent += color(BLOCK);
      } else {
        rowContent += EMPTY;
      }
    }

    rowContent += chalk.white('║');
    lines.push(<Text key={`row-${y}`}>{rowContent}</Text>);
  }

  // 底部边界
  lines.push(
    <Text key="bottom-border">
      {chalk.white('╚' + '═'.repeat(width * 2) + '╝')}
    </Text>
  );

  return <Box flexDirection="column">{lines}</Box>;
}

function renderNextPiece(nextTetromino: Tetromino): React.ReactElement {
  const preview: boolean[][] = Array(4)
    .fill(null)
    .map(() => Array(4).fill(false));

  const blocks = nextTetromino.blocks;
  blocks.forEach(block => {
    if (block.y >= 0 && block.y < 4) {
      preview[block.y][block.x] = true;
    }
  });

  const lines: React.ReactElement[] = [
    <Text key="next-title">{chalk.white('NEXT:')}</Text>,
  ];

  for (let y = 0; y < 4; y++) {
    let rowContent = '';
    for (let x = 0; x < 4; x++) {
      if (preview[y][x]) {
        const color = getTetrominoColor(nextTetromino.type);
        rowContent += color(BLOCK);
      } else {
        rowContent += EMPTY;
      }
    }
    lines.push(<Text key={`next-row-${y}`}>{rowContent}</Text>);
  }

  return <Box flexDirection="column">{lines}</Box>;
}

function renderStats(state: GameState): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Text>{chalk.white('SCORE:  ' + String(state.score).padStart(6, '0'))}</Text>
      <Text>{chalk.white('LINES:  ' + String(state.lines).padStart(6, '0'))}</Text>
      <Text>{chalk.white('LEVEL:  ' + String(state.level).padStart(6, '0'))}</Text>
    </Box>
  );
}

function renderControls(): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Text>{chalk.gray('CONTROLS:')}</Text>
      <Text>{chalk.gray('← → / A D : Move')}</Text>
      <Text>{chalk.gray('↑ / W     : Rotate')}</Text>
      <Text>{chalk.gray('↓ / S     : Soft Drop')}</Text>
      <Text>{chalk.gray('Space     : Hard Drop')}</Text>
      <Text>{chalk.gray('P         : Pause')}</Text>
      <Text>{chalk.gray('Q         : Quit')}</Text>
    </Box>
  );
}

function renderGameOver(): React.ReactElement {
  return (
    <Box flexDirection="column" borderStyle="double" borderColor="red" padding={1}>
      <Text>{chalk.red.bold('GAME OVER')}</Text>
      <Text>{chalk.gray('Press R to restart or Q to quit')}</Text>
    </Box>
  );
}

export function App({ width = 10, height = 20 }: AppProps) {
  const [gameState, setGameState] = useState<GameState>(() =>
    initializeGame({ width, height })
  );

  const [tickCounter, setTickCounter] = useState(0);

  // 定时器 tick
  useEffect(() => {
    if (gameState.isPaused || gameState.gameOver) return;

    const tickInterval = setInterval(() => {
      setGameState(prevState => tick(prevState));
    }, gameState.tickRate);

    return () => clearInterval(tickInterval);
  }, [gameState.tickRate, gameState.isPaused, gameState.gameOver]);

  // 键盘输入处理
  useInput((input, key) => {
    if (input === 'q' || input === 'Q') {
      process.exit(0);
    }

    if (input === 'r' || input === 'R') {
      setGameState(prevState => reset(prevState));
      return;
    }

    if (input === 'p' || input === 'P') {
      setGameState(prevState => togglePause(prevState));
      return;
    }

    if (gameState.isPaused || gameState.gameOver) return;

    // 方向键和 WSAD 键控制
    if (key.leftArrow || input === 'a' || input === 'A') {
      setGameState(prevState => movePiece(prevState, -1, 0));
    } else if (key.rightArrow || input === 'd' || input === 'D') {
      setGameState(prevState => movePiece(prevState, 1, 0));
    } else if (key.upArrow || input === 'w' || input === 'W') {
      setGameState(prevState => rotatePiece(prevState));
    } else if (key.downArrow || input === 's' || input === 'S') {
      setGameState(prevState => movePiece(prevState, 0, 1));
    } else if (input === ' ') {
      setGameState(prevState => dropPiece(prevState));
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text>{chalk.cyan.bold('TETRIS')}</Text>
      <Box marginBottom={1} />

      <Box>
        <Box flexDirection="column" marginRight={2}>
          {renderGrid(gameState)}
        </Box>

        <Box flexDirection="column">
          <Box flexDirection="column" marginBottom={2}>
            {renderNextPiece(gameState.nextTetromino)}
          </Box>

          <Box flexDirection="column" marginBottom={2}>
            {renderStats(gameState)}
          </Box>

          <Box flexDirection="column">
            {renderControls()}
          </Box>
        </Box>
      </Box>

      <Box marginTop={1} />

      {gameState.isPaused && (
        <Text>{chalk.yellow.bold('PAUSED - Press P to resume')}</Text>
      )}

      {gameState.gameOver && (
        <Box marginTop={1}>{renderGameOver()}</Box>
      )}
    </Box>
  );
}
