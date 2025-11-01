import { scores, changeToComputer } from './store';

let activateComp = false;

changeToComputer.subscribe((value) => {
  if (value && value.change === true) {
    activateComp = true;
  } else {
    activateComp = false;
  }
});

export function TicTacToe({ onWin, onTie }: { onWin: (winner: any) => void, onTie: () => void }) {
  const board = [
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
  ];

  let turn = 'X';
  let done = false;

  return {
    board,

    click(rowIndex:number, columnIndex:number) {
      if (!done && !board[rowIndex][columnIndex]) {
        board[rowIndex][columnIndex] = turn;
        turn = turn === 'X' ? 'O' : 'X';

        const winner = getWinner(board);

        if (winner) {
          onWin(winner);
          done = true;
        } else if (isBoardFull(board)) {
          onTie();
          scores.update((currentScores) => {
            return { ...currentScores, draw: currentScores.draw + 1 };
          });
          done = true;
        } else {
          if (activateComp) {
            const aiMove = getBestMove(board);
            if (aiMove) {
                board[aiMove.row][aiMove.column] = 'O';
                turn = 'X';
        
                const aiWinner = getWinner(board);
                if (aiWinner) {
                    onWin(aiWinner);
                    done = true;
                } else if (isBoardFull(board)) {
                    onTie();
                    scores.update((currentScores) => {
                        return { ...currentScores, draw: currentScores.draw + 1 };
                    });
                    done = true;
                }
            } else {
                console.error("AI could not find a valid move.");
            }
        }
        
        }
      }

      return this;
    }
  };
}

function getWinner(board: string[][]) {
  // check rows
  for (let row = 0; row < 3; row++) {
    if (board[row][0] === board[row][1] && board[row][0] === board[row][2] && board[row][0]) {
      return { symbol: board[row][0], direction: 'horizontal', row };
    }
  }

  // check columns
  for (let column = 0; column < 3; column++) {
    if (
      board[0][column] === board[1][column] &&
      board[0][column] === board[2][column] &&
      board[0][column]
    ) {
      return { symbol: board[0][column], direction: 'vertical', column };
    }
  }

  // check diagonals
  if (board[0][0] === board[1][1] && board[0][0] == board[2][2] && board[0][0]) {
    return { symbol: board[0][0], direction: 'diagonal', diagonal: 'top-left-to-bottom-right' };
  }

  if (board[0][2] === board[1][1] && board[0][2] == board[2][0] && board[0][2]) {
    return { symbol: board[0][2], direction: 'diagonal', diagonal: 'top-right-to-bottom-left' };
  }

  // no winner
  return null;
}

function isBoardFull(board: string[][]) {
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 3; column++) {
      if (!board[row][column]) {
        return false;
      }
    }
  }

  return true;
}

function getBestMove(board: string[][]) {
  let bestScore = -Infinity;
  let move;

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      // check if cell is empty
      if (board[i][j] === '') {
        board[i][j] = 'O'; // make the move
        let score = minimax(board, 0, false); // call minimax on the new board
        board[i][j] = ''; // undo the move
        if (score > bestScore) {
          bestScore = score;
          move = { row: i, column: j };
        }
      }
    }
  }

  return move;
}

function minimax(board: string[][], depth: number, isMaximizing: boolean) {
  const result = getWinner(board);
  if (result !== null) {
    if (result.symbol === 'O') {
      return 10 - depth; // ai wins
    } else if (result.symbol === 'X') {
      return depth - 10; // player wins
    } else {
      return 0; // draw
    }
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === '') {
          board[i][j] = 'O';
          let score = minimax(board, depth + 1, false);
          board[i][j] = '';
          bestScore = Math.max(score, bestScore);
        }
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === '') {
          board[i][j] = 'X';
          let score = minimax(board, depth + 1, true);
          board[i][j] = '';
          bestScore = Math.min(score, bestScore);
        }
      }
    }
    return bestScore;
  }
}
