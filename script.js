// キーボード入力を管理するオブジェクト
function KeyboardInputManager() {
  // イベントを管理するオブジェクト
  this.events = {};
  // タッチイベントの種類を決定する
  this.eventTouchstart = window.navigator.msPointerEnabled ? "MSPointerDown" : "touchstart";
  this.eventTouchmove = window.navigator.msPointerEnabled ? "MSPointerMove" : "touchmove";
  this.eventTouchend = window.navigator.msPointerEnabled ? "MSPointerUp" : "touchend";
  // イベントリスナーを設定する
  this.listen();
}

// イベントを登録するメソッド
KeyboardInputManager.prototype.on = function(event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

// イベントを発火するメソッド
KeyboardInputManager.prototype.emit = function(event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach(function(callback) {
      callback(data);
    });
  }
};

// イベントリスナーを設定するメソッド
KeyboardInputManager.prototype.listen = function() {
  var self = this;
  // キーと方向のマッピング
  var map = {
    38: 0, 39: 1, 40: 2, 37: 3, 75: 0, 76: 1, 74: 2, 72: 3, 87: 0, 68: 1, 83: 2, 65: 3
  };

  // イベントごとの処理を定義
  var eventsMap = {
    "keydown": function(event) {
      var modifiers = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
      var mapped = map[event.which];
      // 入力が入力フィールド内でないか確認
      if (self.targetIsInput(event)) return;
      // 移動イベントを発火
      if (!modifiers && mapped !== undefined) {
        event.preventDefault();
        self.emit("move", mapped);
      }
      // R キーが押されたときにゲームをリスタートする
      if (!modifiers && event.which === 82) {
        self.restart.call(self, event);
      }
    },
    // タッチ操作の処理
    "touchstart": function(event) {
      // 複数のタッチがある場合や入力フィールド内でのタッチの場合は無視する
      if ((!window.navigator.msPointerEnabled && event.touches.length > 1) ||
        event.targetTouches > 1 || self.targetIsInput(event)) {
        return;
      }
      // タッチの座標を取得
      if (window.navigator.msPointerEnabled) {
        touchStartClientX = event.pageX;
        touchStartClientY = event.pageY;
      } else {
        touchStartClientX = event.touches[0].clientX;
        touchStartClientY = event.touches[0].clientY;
      }
      event.preventDefault();
    },
    "touchmove": function(event) {
      event.preventDefault();
    },
    "touchend": function(event) {
      // 複数のタッチがある場合や入力フィールド内でのタッチの場合は無視する
      if ((!window.navigator.msPointerEnabled && event.touches.length > 0) ||
        event.targetTouches > 0 || self.targetIsInput(event)) {
        return;
      }
      // タッチの終了時の座標を取得し、方向を判定して移動イベントを発火する
      var touchEndClientX, touchEndClientY;
      if (window.navigator.msPointerEnabled) {
        touchEndClientX = event.pageX;
        touchEndClientY = event.pageY;
      } else {
        touchEndClientX = event.changedTouches[0].clientX;
        touchEndClientY = event.changedTouches[0].clientY;
      }
      var dx = touchEndClientX - touchStartClientX;
      var absDx = Math.abs(dx);
      var dy = touchEndClientY - touchStartClientY;
      var absDy = Math.abs(dy);
      if (Math.max(absDx, absDy) > 10) {
        self.emit("move", absDx > absDy ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
      }
    }
  };

  // イベントリスナーを登録する
  Object.keys(eventsMap).forEach(function(eventName) {
    document.addEventListener(eventName, eventsMap[eventName]);
  });

  // ボタンがクリックされたときの処理を設定する
  this.bindButtonPress(".retry-button", this.restart);
  this.bindButtonPress(".restart-button", this.restart);
  this.bindButtonPress(".keep-playing-button", this.keepPlaying);
};

// ゲームをリスタートするメソッド
KeyboardInputManager.prototype.restart = function(event) {
  event.preventDefault();
  this.emit("restart");
};

// ゲームを続けるメソッド
KeyboardInputManager.prototype.keepPlaying = function(event) {
  event.preventDefault();
  this.emit("keepPlaying");
};

// ボタンが押されたときの処理を設定するメソッド
KeyboardInputManager.prototype.bindButtonPress = function(selector, fn) {
  var button = document.querySelector(selector);
  button.addEventListener("click", fn.bind(this));
  button.addEventListener(this.eventTouchend, fn.bind(this));
};

// イベントのターゲットが入力フィールドかどうかを判定するメソッド
KeyboardInputManager.prototype.targetIsInput = function(event) {
  return event.target.tagName.toLowerCase() === "input";
};

// タッチ開始時のクライアント座標を保持するグローバル変数
var touchStartClientX, touchStartClientY; 

// DOMContentLoaded イベントリスナー
document.addEventListener("DOMContentLoaded", function() {
  // ゲームコンテナを取得
  var gameContainer = document.getElementsByClassName("game-container")[0];

  // タッチ開始時の処理
  function handleTouchStart(event) {
    // 複数のタッチがある場合や入力フィールド内でのタッチの場合は無視する
    if ((!window.navigator.msPointerEnabled && event.touches.length > 1) ||
      event.targetTouches > 1 || KeyboardInputManager.targetIsInput(event)) {
      return;
    }
    // タッチの座標を取得
    if (window.navigator.msPointerEnabled) {
      touchStartClientX = event.pageX;
      touchStartClientY = event.pageY;
    } else {
      touchStartClientX = event.touches[0].clientX;
      touchStartClientY = event.touches[0].clientY;
    }
    event.preventDefault();
  }

  // タッチ移動時の処理
  function handleTouchMove(event) {
    event.preventDefault();
  }

  // タッチ終了時の処理
  function handleTouchEnd(event) {
    // 複数のタッチがある場合や入力フィールド内でのタッチの場合は無視する
    if ((!window.navigator.msPointerEnabled && event.touches.length > 0) ||
      event.targetTouches > 0 || KeyboardInputManager.targetIsInput(event)) {
      return;
    }
    // タッチの終了時の座標を取得し、方向を判定して移動イベントを発火する
    var touchEndClientX, touchEndClientY;
    if (window.navigator.msPointerEnabled) {
      touchEndClientX = event.pageX;
      touchEndClientY = event.pageY;
    } else {
      touchEndClientX = event.changedTouches[0].clientX;
      touchEndClientY = event.changedTouches[0].clientY;
    }
    var dx = touchEndClientX - touchStartClientX;
    var absDx = Math.abs(dx);
    var dy = touchEndClientY - touchStartClientY;
    var absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) > 10) {
      KeyboardInputManager.emit("move", absDx > absDy ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
    }
  }

  // イベントリスナーを登録
  gameContainer.addEventListener(KeyboardInputManager.eventTouchstart, handleTouchStart);
  gameContainer.addEventListener(KeyboardInputManager.eventTouchmove, handleTouchMove);
  gameContainer.addEventListener(KeyboardInputManager.eventTouchend, handleTouchEnd);
});

// HTML要素を操作するオブジェクト
function HTMLActuator() {
  // タイルを表示するコンテナ
  this.tileContainer = document.querySelector(".tile-container");
  // スコアを表示するコンテナ
  this.scoreContainer = document.querySelector(".score-container");
  // ゲームメッセージを表示するコンテナ
  this.messageContainer = document.querySelector(".game-message");
  // スコアを共有するためのコンテナ
  this.sharingContainer = document.querySelector(".score-sharing");
  // スコア
  this.score = 0;
}

// ゲーム状態に基づいてHTML要素を更新するメソッド
HTMLActuator.prototype.actuate = function(grid, metadata) {
  var self = this;
  window.requestAnimationFrame(function() {
    // タイルコンテナをクリア
    self.clearContainer(self.tileContainer);
    // グリッドのセルを走査してタイルを追加
    grid.cells.forEach(function(column) {
      column.forEach(function(cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });
    // スコアを更新
    self.updateScore(metadata.score);
    // ゲームが終了した場合はメッセージを表示
    if (metadata.terminated) {
      if (metadata.over) {
        // ゲームオーバーメッセージ
        self.message(false); 
      } else if (metadata.won) {
        // ゲームクリアメッセージ
        self.message(true); 
      }
    }
  });
};

// ゲームを続けるためのメソッド
HTMLActuator.prototype.continueGame = function() {
  this.clearMessage();
};

// コンテナをクリアするメソッド
HTMLActuator.prototype.clearContainer = function(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

// タイルを追加するメソッド
HTMLActuator.prototype.addTile = function(tile) {
  var self = this;
  var wrapper = document.createElement("div");
  var inner = document.createElement("div");
  var position = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);
  var classes = ["tile", "tile-" + tile.value, positionClass];
  if (tile.value > 2048) classes.push("tile-super");
  this.applyClasses(wrapper, classes);
  inner.classList.add("tile-inner");
  inner.textContent = tile.value;
  if (tile.previousPosition) {
    window.requestAnimationFrame(function() {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes); 
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);
    tile.mergedFrom.forEach(function(merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }
  wrapper.appendChild(inner);
  this.tileContainer.appendChild(wrapper);
};

// クラスを適用するメソッド
HTMLActuator.prototype.applyClasses = function(element, classes) {
  element.setAttribute("class", classes.join(" "));
};

// 座標を正規化するメソッド
HTMLActuator.prototype.normalizePosition = function(position) {
  return { x: position.x + 1, y: position.y + 1 };
};

// タイルの位置に対応するクラスを取得するメソッド
HTMLActuator.prototype.positionClass = function(position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

// スコアを更新するメソッド
HTMLActuator.prototype.updateScore = function(score) {
  this.clearContainer(this.scoreContainer);
  var difference = score - this.score;
  this.score = score;
  this.scoreContainer.textContent = this.score;
};

// ゲームメッセージを表示するメソッド
HTMLActuator.prototype.message = function(won) {
  var type = won ? "game-won" : "game-over";
  var message = won ? "You win!" : "Game over!";
  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;
  this.clearContainer(this.sharingContainer);
  this.messageContainer.style.display = "block";
};

// ゲームメッセージをクリアするメソッド
HTMLActuator.prototype.clearMessage = function() {
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
  this.messageContainer.style.display = "none";
};

  
// GameManagerコンストラクタ
function GameManager(size, InputManager, Actuator) {
  // ゲームのサイズ
  this.size = size;
  // 入力マネージャーのインスタンス
  this.inputManager = new InputManager;
  // 表示マネージャーのインスタンス
  this.actuator = new Actuator;
  // ローカルストレージマネージャーのインスタンス
  // 直接LocalStorageManagerを使用する
  this.storageManager = new LocalStorageManager; 
  // 最初のタイルの数
  this.startTiles = 2;

  // moveTile 関数を this のプロトタイプとして定義する
  this.moveTile = function(tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
  };

  // インプットマネージャーの各イベントに対する処理を登録
  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));
  // ゲームの初期セットアップ
  this.setup();
}

// リスタート処理
GameManager.prototype.restart = function() {
  // ゲームを継続
  this.actuator.continueGame();
  // ゲームをセットアップ
  this.setup();
  // ゲームオーバーフラグをリセット
  this.over = false; 
};

// 継続プレイ処理
GameManager.prototype.keepPlaying = function() {
  this.keepPlaying = true;
  // ゲームを継続
  this.actuator.continueGame();
};

// ゲームが終了したかどうかを判断するメソッド
GameManager.prototype.isGameTerminated = function() {
  // ゲームオーバーかつ継続プレイしない場合に true を返す
  return this.over && !this.keepPlaying; 
};

// ゲームのセットアップ
GameManager.prototype.setup = function() {
  // 前回のゲーム状態を取得
  var previousState = this.storageManager.getGameState();
  if (previousState) {
    // 前回の状態がある場合はそれを復元
    this.grid = new Grid(previousState.grid.size, previousState.grid.cells);
    this.score = previousState.score;
    this.over = previousState.over;
    this.won = previousState.won;
    this.keepPlaying = previousState.keepPlaying;
  } else {
    // 前回の状態がない場合は新しいゲームをセットアップ
    this.grid = new Grid(this.size);
    this.score = 0;
    this.over = false;
    this.won = false;
    this.keepPlaying = false;
    // 初期タイルの追加
    this.addStartTiles();
  }
  // ゲームを描画
  this.actuate();
};

// 初期タイルの追加
GameManager.prototype.addStartTiles = function() {
  for (var i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
};

// ランダムな位置に新しいタイルを追加
GameManager.prototype.addRandomTile = function() {
  if (this.grid.cellsAvailable()) {
    var value = Math.random() < 0.9 ? 2 : 4;
    var tile = new Tile(this.grid.randomAvailableCell(), value);
    this.grid.insertTile(tile);
  }
};

// ゲームの描画
GameManager.prototype.actuate = function() {
  // アクチュエータにグリッドの状態を渡して描画
  this.actuator.actuate(this.grid, {
    score: this.score,
    over: this.over,
    won: this.won,
    keepPlaying: this.keepPlaying
  });

  // ゲームオーバーの場合はゲーム状態をクリア
  if (this.over) {
    this.storageManager.clearGameState();
  } else {
    // ゲーム状態を保存
    this.storageManager.setGameState(this.serialize());
  }
  // ゲームオーバーの場合はメッセージを表示
  if (this.isGameTerminated()) {
    this.actuator.message(false);
  }
};

// ゲームの状態をシリアライズする
GameManager.prototype.serialize = function() {
  return {
    grid: this.grid.serialize(),
    score: this.score,
    over: this.over,
    won: this.won,
    keepPlaying: this.keepPlaying
  };
};

// タイルの準備
GameManager.prototype.prepareTiles = function() {
  this.grid.eachCell(function(x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
};

// タイルの移動処理
GameManager.prototype.move = function(direction) {
  var self = this;
  if (this.isGameTerminated()) return; 
  var cell, tile;
  var vector = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved = false;
  this.prepareTiles();
  traversals.x.forEach(function(x) {
    traversals.y.forEach(function(y) {
      cell = { x: x, y: y };
      tile = self.grid.cellContent(cell);
      if (tile) {
        var positions = self.findFarthestPosition(cell, vector);
        var next = self.grid.cellContent(positions.next);
        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];
          self.grid.insertTile(merged);
          self.grid.removeTile(tile);
          tile.updatePosition(positions.next);
          self.score += merged.value;
          if (merged.value === 2048) self.won = true;
        } else {
          self.moveTile(tile, positions.farthest);
        }
        if (!self.positionsEqual(cell, tile)) {
          moved = true; 
        }
      }
    });
  });
  if (moved) {
    this.addRandomTile();
    if (!this.movesAvailable()) {
      this.over = true; 
    }
    this.actuate();
  }
};

// 移動方向に対応するベクトルを取得する
GameManager.prototype.getVector = function(direction) {
  var map = {
    0: { x: 0,  y: -1 },
    1: { x: 1,  y: 0 },
    2: { x: 0,  y: 1 },
    3: { x: -1, y: 0 }
  };
  return map[direction];
};

// トラバーサルのビルド
GameManager.prototype.buildTraversals = function(vector) {
  var traversals = { x: [], y: [] };
  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();
  return traversals;
};

// 最遠の位置を見つける
GameManager.prototype.findFarthestPosition = function(cell, vector) {
  var previous;
  do {
    previous = cell;
    cell = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.grid.withinBounds(cell) && this.grid.cellAvailable(cell));
  return {
    farthest: previous,
    next: cell
  };
};

// 移動可能なタイルがあるかどうかをチェック
GameManager.prototype.movesAvailable = function() {
  return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

// タイルがマッチするかどうかをチェック
GameManager.prototype.tileMatchesAvailable = function() {
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
            return true; 
          }
        }
      }
    }
  }
  return false;
};

// 位置が等しいかどうかをチェック
GameManager.prototype.positionsEqual = function(first, second) {
  return first.x === second.x && first.y === second.y;
};

// Gridコンストラクタ
function Grid(size, previousState) {
  // グリッドのサイズ
  this.size = size;
  // セルの状態を前の状態から取得するか、空の状態で初期化する
  this.cells = previousState ? this.fromState(previousState) : this.empty();
}

// グリッドの状態を復元する
Grid.prototype.fromState = function(state) {
  var cells = [];
  for (var x = 0; x < this.size; x++) {
    var row = cells[x] = [];
    for (var y = 0; y < this.size; y++) {
      var tile = state[x][y];
      // 状態からタイルを作成してセルに追加する
      row.push(tile ? new Tile(tile.position, tile.value) : null);
    }
  }
  return cells;
};

// 空のグリッドを作成する
Grid.prototype.empty = function() {
  var cells = [];
  for (var x = 0; x < this.size; x++) {
    var row = cells[x] = [];
    for (var y = 0; y < this.size; y++) {
      // セルをnullで埋める
      row.push(null);
    }
  }
  return cells;
};

// ランダムな利用可能なセルを返す
Grid.prototype.randomAvailableCell = function() {
  var cells = this.availableCells();
  if (cells.length) {
    // 利用可能なセルからランダムに選択して返す
    return cells[Math.floor(Math.random() * cells.length)];
  }
};

// 利用可能なセルの配列を返す
Grid.prototype.availableCells = function() {
  var cells = [];
  // 各セルに対して、タイルが存在しない場合にセルを追加する
  this.eachCell(function(x, y, tile) {
    if (!tile) {
      cells.push({ x: x, y: y });
    }
  });
  return cells;
};

// 各セルに対してコールバック関数を実行する
Grid.prototype.eachCell = function(callback) {
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      callback(x, y, this.cells[x][y]);
    }
  }
};

// 利用可能なセルが存在するかどうかをチェックする
Grid.prototype.cellsAvailable = function() {
  return !!this.availableCells().length;
};

// 指定されたセルが利用可能かどうかをチェックする
Grid.prototype.cellAvailable = function(cell) {
  return !this.cellOccupied(cell);
};

// 指定されたセルが占有されているかどうかをチェックする
Grid.prototype.cellOccupied = function(cell) {
  return !!this.cellContent(cell);
};

// 指定されたセルの内容を取得する
Grid.prototype.cellContent = function(cell) {
  if (this.withinBounds(cell)) {
    return this.cells[cell.x][cell.y];
  } else {
    return null;
  }
};

// タイルを挿入する
Grid.prototype.insertTile = function(tile) {
  this.cells[tile.x][tile.y] = tile;
};

// タイルを削除する
Grid.prototype.removeTile = function(tile) {
  this.cells[tile.x][tile.y] = null;
};

// 指定された位置がグリッドの範囲内にあるかどうかをチェックする
Grid.prototype.withinBounds = function(position) {
  return position.x >= 0 && position.x < this.size && position.y >= 0 && position.y < this.size;
};

// グリッドの状態をシリアライズする
Grid.prototype.serialize = function() {
  var cellState = [];
  for (var x = 0; x < this.size; x++) {
    var row = cellState[x] = [];
    for (var y = 0; y < this.size; y++) {
      // セルが存在する場合はタイルの状態をシリアライズし、存在しない場合はnullを追加する
      row.push(this.cells[x][y] ? this.cells[x][y].serialize() : null);
    }
  }
  return {
    size: this.size,
    cells: cellState
  };
};
  
// タイルコンストラクタ
function Tile(position, value) {
  // タイルの位置
  this.x = position.x;
  this.y = position.y;
  // タイルの値（デフォルトは2）
  this.value = value || 2;
  // 直前の位置
  this.previousPosition = null;
  // マージされた元のタイルのリスト
  this.mergedFrom = null;
}

// タイルの位置を保存する
Tile.prototype.savePosition = function() {
  this.previousPosition = { x: this.x, y: this.y };
};

// タイルの位置を更新する
Tile.prototype.updatePosition = function(position) {
  this.x = position.x;
  this.y = position.y;
};

// タイルをシリアライズする
Tile.prototype.serialize = function() {
  return {
    // タイルの位置
    position: {
      x: this.x,
      y: this.y
    },
    // タイルの値
    value: this.value
  };
};

 // ローカルストレージマネージャー
function LocalStorageManager() {
  // ベストスコアのキー
  this.bestScoreKey = "bestScore";
  // ゲームの状態のキー
  this.gameStateKey = "gameState";
}

// ローカルストレージからゲームの状態を取得する
LocalStorageManager.prototype.getGameState = function() {
  var stateJSON = localStorage.getItem(this.gameStateKey);
  return stateJSON ? JSON.parse(stateJSON) : null;
};

// ローカルストレージにゲームの状態を設定する
LocalStorageManager.prototype.setGameState = function(state) {
  localStorage.setItem(this.gameStateKey, JSON.stringify(state));
};

// ローカルストレージのゲームの状態をクリアする
LocalStorageManager.prototype.clearGameState = function() {
  localStorage.removeItem(this.gameStateKey);
};

// ゲームのサイズ
var size = 4;
// インプットマネージャー
var inputManager = new KeyboardInputManager();
// ローカルストレージマネージャー
var storageManager = new LocalStorageManager();
// アクチュエーター
var actuator = new HTMLActuator();
// ゲームマネージャーのインスタンス化
var game = new GameManager(size, KeyboardInputManager, HTMLActuator, storageManager);
