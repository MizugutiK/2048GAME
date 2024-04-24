// InputManager クラスの定義
function KeyboardInputManager() {
  this.events = {};

  // キーボードイベントのリスナーを登録
  this.listen();
}

// KeyboardInputManager クラスのプロトタイプ定義
KeyboardInputManager.prototype = {
  // 指定されたイベントに対するコールバックを登録
  on: function (event, callback) {
      if (!this.events[event]) {
          this.events[event] = [];
      }
      this.events[event].push(callback);
  },

  // イベントを発行するメソッド
  emit: function (event, data) {
      var callbacks = this.events[event];
      if (callbacks) {
          callbacks.forEach(function (callback) {
              callback(data);
          });
      }
  },

     // キーボード入力のリスナーを登録するメソッド
     listen: function () {
      var self = this;

      // キーボードのキーが押されたときの処理
      var map = {
          ArrowUp: 0,    // 上キー
          ArrowRight: 1, // 右キー
          ArrowDown: 2,  // 下キー
          ArrowLeft: 3   // 左キー
      };

      // キーボードイベントのリスナーを登録
      document.addEventListener("keydown", function (event) {
          var mapped = map[event.key];
          if (mapped !== undefined) {
              event.preventDefault();
              self.emit("move", mapped);
          }
      });
  }
};

// KeyboardInputManager インスタンスを作成
var inputManager = new KeyboardInputManager();

// move イベントのリスナーを登録して、ログに記録
inputManager.on("move", function (data) {
  console.log("Move event triggered with data:", data);
});

// HTML要素を操作するクラスの定義
function HTMLActuator() {
  this.tileContainer = document.querySelector(".tile-container");
  this.scoreContainer = document.querySelector(".score-container");
  this.bestContainer = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");
  this.score = 0;
}

// HTMLActuator クラスのプロトタイプ定義
HTMLActuator.prototype = {
  // タイルを追加
  addTile: function (tile) {
      var self = this;

      var wrapper = document.createElement("div");
      var inner = document.createElement("div");
      var position = tile.previousPosition || { x: tile.x, y: tile.y };
      var positionClass = this.positionClass(position);

      // タイルがマージされたかどうかを判定
      var classes = ["tile", "tile-" + tile.value, positionClass];

      // マージされた場合の処理
      if (tile.value > 2048) classes.push("tile-super");

      this.applyClasses(wrapper, classes);

      inner.classList.add("tile-inner");
      inner.textContent = tile.value;

      // タイルを削除する前の処理
      if (tile.previousPosition) {
          window.requestAnimationFrame(function () {
              classes[2] = self.positionClass({ x: tile.x, y: tile.y });
              self.applyClasses(wrapper, classes); // 新しい位置に更新
          });
      } else if (tile.mergedFrom) {
          classes.push("tile-merged");
          this.applyClasses(wrapper, classes);

          // 元のタイルをすべて削除
          tile.mergedFrom.forEach(function (merged) {
              self.addTile(merged);
          });
      } else {
          classes.push("tile-new");
          this.applyClasses(wrapper, classes);
      }

      // DOMに追加
      wrapper.appendChild(inner);
      this.tileContainer.appendChild(wrapper);
  },

  // タイルを削除
  removeTile: function (tile) {
      var self = this;
      var tileElement = document.querySelector(".tile-position-" + tile.x + "-" + tile.y);

      if (tileElement) {
          window.requestAnimationFrame(function () {
              tileElement.remove();
          });
      }
  },

  // タイルの位置に基づいてクラスを適用
  positionClass: function (position) {
      return "tile-position-" + position.x + "-" + position.y;
  },

  // クラスを適用
  applyClasses: function (element, classes) {
      element.setAttribute("class", classes.join(" "));
  },

  // スコアを更新
  updateScore: function (score) {
      this.clearContainer(this.scoreContainer);
      var difference = score - this.score;
      this.score = score;

      this.scoreContainer.textContent = this.score;

      if (difference > 0) {
          var addition = document.createElement("div");
          addition.classList.add("score-addition");
          addition.textContent = "+" + difference;

          this.scoreContainer.appendChild(addition);
      }
  },

  // 最高得点を更新
  updateBestScore: function (bestScore) {
      this.bestContainer.textContent = bestScore;
  },

  // ゲームメッセージを表示
  message: function (won) {
      var type = won ? "game-won" : "game-over";
      var message = won ? "You win!" : "Game over!";

      this.messageContainer.classList.add(type);
      this.messageContainer.getElementsByTagName("p")[0].textContent = message;
  },

  // ゲームメッセージを消去
  clearMessage: function () {
      this.messageContainer.classList.remove("game-won");
      this.messageContainer.classList.remove("game-over");
  },

  // コンテナをクリア
  clearContainer: function (container) {
      while (container.firstChild) {
          container.removeChild(container.firstChild);
      }
    },

    // actuate メソッドの追加
    actuate: function (grid, metadata) {
        // actuate メソッドの実装
    }
};
// ツイート関連プログラム
// 消すな

//   HTMLActuator.prototype.scoreTweetButton = function () {
//     var tweet = document.createElement("a");
//     // tweet.classList.add("twitter-share-button");
//     // tweet.setAttribute("href", "https://twitter.com/share");
//     tweet.setAttribute("data-via", "gabrielecirulli");
//     tweet.setAttribute("data-url", "https://git.io/2048");
//     tweet.setAttribute("data-counturl", "https://gabrielecirulli.github.io/2048/");
//     tweet.textContent = "Tweet";
  
//     var text = "I scored " + this.score + " points at 2048, a game where you " +
//                "join numbers to score high! #2048game";
//     tweet.setAttribute("data-text", text);
  
//     return tweet;
//   };
// ツイート関連プログラム

// グリッドを管理するクラスの定義
function Grid(size, previousState) {
    this.size = size; // グリッドのサイズ
    this.cells = previousState ? this.fromState(previousState) : this.empty(); // グリッドのセルの状態
}
  
// Grid クラスのプロトタイプ定義
Grid.prototype = {
  // 空のグリッドを生成
  empty: function () {
      var cells = [];

      for (var x = 0; x < this.size; x++) {
          var row = cells[x] = [];

          for (var y = 0; y < this.size; y++) {
              row.push(null);
          }
      }

      return cells;
  }, // グリッド上の空きセルを返す
  cellsAvailable: function () {
      var cells = [];

      this.eachCell(function (x, y, tile) {
          if (!tile) {
              cells.push({ x: x, y: y });
          }
      });

      return cells.length > 0; // 空きセルが存在するかどうかを返す
  },


  
  // 前回のゲームの状態からグリッドを復元
  fromState: function (state) {
    var cells = [];

    for (var x = 0; x < this.size; x++) {
        var row = cells[x] = [];

        for (var y = 0; y < this.size; y++) {
            var tile = state[x][y];
            row.push(tile ? new Tile(tile.position, tile.value) : null);
        }
    }

    return cells;
},
    // グリッドの状態をシリアル化
    serialize: function () {
      var cellState = [];

      for (var x = 0; x < this.size; x++) {
          var row = cellState[x] = [];

          for (var y = 0; y < this.size; y++) {
              row.push(this.cells[x][y] ? this.cells[x][y].serialize() : null);
          }
      }

      return {
          size: this.size,
          cells: cellState
      };
  },
  
  // グリッド上の空きセルを返す
  availableCells: function () {
    var cells = [];

    this.eachCell(function (x, y, tile) {
        if (!tile) {
            cells.push({ x: x, y: y });
        }
    });

    return cells;
},
   // グリッド上の各セルに対して指定された関数を適用
   eachCell: function (callback) {
    for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++) {
            callback(x, y, this.cells[x][y]);
        }
    }
},
 // グリッド上のランダムな空きセルを返す
 randomAvailableCell: function () {
  var cells = this.availableCells();

  if (cells.length) {
      return cells[Math.floor(Math.random() * cells.length)];
  }
},
 // グリッド上の指定されたセルが存在し、空いているかどうかを判定
 cellAvailable: function (cell) {
  return !this.cellOccupied(cell);
},

// グリッド上の指定されたセルが存在し、タイルで埋められているかどうかを判定
cellOccupied: function (cell) {
  return !!this.cellContent(cell);
},

// グリッド上の指定されたセルの内容を返す
cellContent: function (cell) {
  if (this.withinBounds(cell)) {
      return this.cells[cell.x][cell.y];
  } else {
      return null;
  }
},

// 指定されたセルがグリッド内にあるかどうかを判定
withinBounds: function (position) {
  return position.x >= 0 && position.x < this.size &&
      position.y >= 0 && position.y < this.size;
},

// グリッドにタイルを挿入
insertTile: function (tile) {
  this.cells[tile.x][tile.y] = tile;
},

// グリッドからタイルを削除
removeTile: function (tile) {
  this.cells[tile.x][tile.y] = null;
}

};

// タイルを管理するクラスの定義
function Tile(position, value) {
  this.x = position.x;
  this.y = position.y;
  this.value = value || 2;

  this.previousPosition = null;
  this.mergedFrom = null; // タイルがマージされた元のセル
}

// Tile クラスのプロトタイプ定義
Tile.prototype = {
  // タイルの位置を更新
  updatePosition: function (position) {
      this.previousPosition = { x: this.x, y: this.y };
      this.x = position.x;
      this.y = position.y;
  },

  // タイルの内容をシリアル化
  serialize: function () {
      return {
          position: {
              x: this.x,
              y: this.y
          },
          value: this.value
      };
  }
};

// ゲームの状態を保存するクラスの定義
function LocalStorageManager() {
  this.bestScoreKey = "bestScore";
  this.gameStateKey = "gameState";
}
 // LocalStorageManager クラスのプロトタイプ定義
function LocalStorageManager() {
  // コンストラクタの定義
  this.bestScoreKey = "bestScore";
  this.gameStateKey = "gameState";
}

LocalStorageManager.prototype = {
  // 最高得点を取得
  getBestScore: function () {
      return localStorage.getItem(this.bestScoreKey) || 0;
  },

  // 最高得点を保存
  setBestScore: function (score) {
      localStorage.setItem(this.bestScoreKey, score);
  },

  // ゲームの状態を取得
  getGameState: function () {
      var stateJSON = localStorage.getItem(this.gameStateKey);
      return stateJSON ? JSON.parse(stateJSON) : null;
  },

  // ゲームの状態を保存
  setGameState: function (gameState) {
      localStorage.setItem(this.gameStateKey, JSON.stringify(gameState));
  },

  // ゲームの状態を削除
  clearGameState: function () {
      localStorage.removeItem(this.gameStateKey);
  }
};

// ゲームの要素を管理するクラスの定義
function GameManager(size, InputManager, Actuator, StorageManager) {
  this.size = size; // グリッドのサイズ
  this.inputManager = new InputManager(); // 入力を管理するオブジェクト
  this.storageManager = new StorageManager(); // ゲームの状態を保存するオブジェクト
  this.actuator = new Actuator(); // HTML要素を操作するオブジェクト

  this.startTiles = 2; // 初期タイルの数

  // 入力イベントのリスナーを設定
  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));

  // ゲームを初期化
  this.setup();
}

// GameManager クラスのプロトタイプ定義
GameManager.prototype = {

  
  // ゲームを初期化する
  setup: function () {
      var previousState = this.storageManager.getGameState();

      // 前回のセッションがある場合はそのセッションを復元する
      if (previousState) {
          this.grid = new Grid(previousState.grid.size,
              previousState.grid.cells); // グリッドの復元
          this.score = previousState.score; // スコアの復元
          this.over = previousState.over; // ゲームオーバー状態の復元
          this.won = previousState.won; // ゲームクリア状態の復元
      } else {
          // 前回のセッションがない場合は新しいゲームを開始する
          this.grid = new Grid(this.size);
          this.score = 0;
          this.over = false;
          this.won = false;

          // 2つのタイルをランダムな位置に追加
          this.addStartTiles();
      }

      // ゲームの状態を表示
      this.actuate();
  },

  // ゲーム終了時の処理
  over: function () {
    return this.isGameTerminated() || !this.movesAvailable();
},


won: function () {
  return this.won;
},


  // ゲームが続行可能な状態かどうかを判定する
  isGameTerminated: function () {
      return this.over || (this.won && !this.keepPlaying);
  },

  move: function (direction) {
    // ゲームが続行不可能な状態の場合は何もしない
    if (this.isGameTerminated()) return;

    var cell, tile;

    var vector = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved = false; // ここでmoved変数を初期化

    // 各方向に対してセルの移動を試行
    traversals.x.forEach(function (x) {
        traversals.y.forEach(function (y) {
            cell = { x: x, y: y };
            tile = this.grid.cellContent(cell);

            if (tile) {
                var positions = this.findFarthestPosition(cell, vector);
                var next = this.grid.cellContent(positions.next);

                if (next && next.value === tile.value && !next.mergedFrom) {
                    var merged = new Tile(positions.next, tile.value * 2);
                    merged.mergedFrom = [tile, next];

                    this.grid.insertTile(merged);
                    this.grid.removeTile(tile);

                    // タイルの値が2048以上の場合はゲームクリアとする
                    if (merged.value === 2048) this.won = true;
                } else {
                    this.moveTile(tile, positions.farthest);
                }

                // セルが移動したかどうかを判定
                if (!this.positionsEqual(cell, tile)) {
                    moved = true;
                }
            }
        }, this);
    }, this);

    // ゲームの状態を更新してログに記録
    console.log("Moved:", moved, "Game Over:", this.over, "Won:", this.won);

    // 移動した場合、スコアを更新してゲームの状態を表示
    if (moved) {
        this.score += this.addRandomTile().value;
        this.actuate();
    }
},
  // 初期タイルを追加
  addStartTiles: function () {
      for (var i = 0; i < this.startTiles; i++) {
          this.addRandomTile();
      }
  },

  // ランダムな空きセルにタイルを追加
  addRandomTile: function () {
      if (this.grid.cellsAvailable()) {
          var value = Math.random() < 0.9 ? 2 : 4;
          var tile = new Tile(this.grid.randomAvailableCell(), value);

          this.grid.insertTile(tile);
      }
      return tile;
  },

  // ゲームの状態を表示
  actuate: function () {
    container = document.querySelector(".game-container");
      // 状態を保存
      this.storageManager.setGameState(this.serialize());

      // ゲームオーバーかどうかを判定
      if (this.over) {
          this.storageManager.clearGameState();
      } else {
          // ゲームの状態を表示
          this.actuator.actuate(this.grid, {
              score: this.score,
              over: this.over,
              won: this.won,
              bestScore: this.storageManager.getBestScore(),
              terminated: this.isGameTerminated()
          });
      }
  },

  // ゲームの状態をオブジェクトにシリアル化
  serialize: function () {
      return {
          grid: this.grid.serialize(),
          score: this.score,
          over: this.over,
          won: this.won
      };
  },

  // 指定された方向に対するベクトルを取得
  getVector: function (direction) {
      // ベクトルマップ
      var map = {
          0: { x: 0, y: -1 }, // 上
          1: { x: 1, y: 0 },  // 右
          2: { x: 0, y: 1 },  // 下
          3: { x: -1, y: 0 }  // 左
      };

      return map[direction];
  },

  // 移動可能な方向のセルを構築
  buildTraversals: function (vector) {
      var traversals = { x: [], y: [] };

      for (var pos = 0; pos < this.size; pos++) {
          traversals.x.push(pos);
          traversals.y.push(pos);
      }

      // 移動する方向に応じてトラバーサルの順序を逆にする
      if (vector.x === 1) traversals.x = traversals.x.reverse();
      if (vector.y === 1) traversals.y = traversals.y.reverse();

      return traversals;
  },

  // 指定されたセルの最遠の位置を見つける
  findFarthestPosition: function (cell, vector) {
      var previous;

      // 向きに従って繰り返す
      do {
          previous = cell;
          cell = { x: previous.x + vector.x, y: previous.y + vector.y };
      } while (this.grid.withinBounds(cell) &&
          this.grid.cellAvailable(cell));

      return {
          farthest: previous,
          next: cell // 最後の移動先の位置も返す
      };
  },

// 指定されたタイルを指定された位置に移動
moveTile: function (tile, cell) {
  this.grid.cells[tile.x][tile.y] = null;
  this.grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);

  // 移動が行われたので、movedをtrueに設定
  this.moved = true;
},



  // セルが同じ位置にあるかどうかを判定
  positionsEqual: function (first, second) {
      return first.x === second.x && first.y === second.y;
  },

// ゲームのリスタートを行うメソッド
restart: function (event) {
  console.log(this); // この行を追加して、this の値を確認する
  if (event) {
      event.preventDefault();
  }
  this.emit("restart");
},


  // ゲームの続行
  keepPlaying: function () {
      this.keepPlaying = true;
      this.actuator.continueGame(); // 画面上の状態をリセット
  },

  // ゲーム中に動かせるセルがあるかどうかを判定
  movesAvailable: function () {
      return this.grid.cellsAvailable() || this.tileMatchesAvailable();
  },

  // 移動可能なタイルがあるかどうかを判定
  tileMatchesAvailable: function () {
      var self = this;

      var tile;

      for (var x = 0; x < this.size; x++) {
          for (var y = 0; y < this.size; y++) {
              tile = this.grid.cellContent({ x: x, y: y });

              if (tile) {
                  for (var direction = 0; direction < 4; direction++) {
                      var vector = self.getVector(direction);
                      var cell = { x: x + vector.x, y: y + vector.y };

                      var other = self.grid.cellContent(cell);

                      if (other && other.value === tile.value) {
                          return true; // 一致するタイルがある場合
                      }
                  }
              }
          }
      }

      return false;
  }
};


// ゲームを開始
function startGame() {
  // 正しいInputManagerとStorageManagerを渡す
  var gameManager = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
  gameManager.setup();
}

// ゲームを開始
startGame();
