// Function.prototype.bind のポリフィルを定義します
Function.prototype.bind = Function.prototype.bind || function (target) {
    var self = this;
    return function (args) {
      if (!(args instanceof Array)) {
        args = [args];
      }
      self.apply(target, args);
    };
  };
  // Element.classList のポリフィルを定義します
  (function () {
    // もし既に定義されていたら何もせずに終了します
    if (typeof window.Element === "undefined" ||
        "classList" in document.documentElement) {
      return;
    }
    var prototype = Array.prototype,
        push = prototype.push,
        splice = prototype.splice,
        join = prototype.join;

  // DOMTokenList クラスの定義
    function DOMTokenList(el) {
      this.el = el;
    // クラス名を取得し、空白で分割して配列にします
      var classes = el.className.replace(/^\s+|\s+$/g, '').split(/\s+/);
      for (var i = 0; i < classes.length; i++) {
        push.call(this, classes[i]);
      }
    }

      // DOMTokenList オブジェクトのプロトタイプ定義
      DOMTokenList.prototype = {
        // クラスを追加するメソッド
        add: function (token) {
            if (this.contains(token)) return;
            push.call(this, token);
            this.el.className = this.toString();
        },
        // 指定したクラスが含まれているかを判定するメソッド
        contains: function (token) {
            return this.el.className.indexOf(token) != -1;
        },
        // 指定したインデックスのクラスを取得するメソッド
        item: function (index) {
            return this[index] || null;
        },
        // 指定したクラスを削除するメソッド
        remove: function (token) {
            if (!this.contains(token)) return;
            for (var i = 0; i < this.length; i++) {
                if (this[i] == token) break;
            }
            splice.call(this, i, 1);
            this.el.className = this.toString();
        },
        // クラス名を文字列に変換するメソッド
        toString: function () {
            return join.call(this, ' ');
        },
        // クラスの状態を切り替えるメソッド
        toggle: function (token) {
            if (!this.contains(token)) {
                this.add(token);
            } else {
                this.remove(token);
            }

            return this.contains(token);
        }
    };
  
 // グローバルに DOMTokenList クラスを公開します
 window.DOMTokenList = DOMTokenList;

 // HTMLElement.prototype.classList の定義
 function defineElementGetter(obj, prop, getter) {
     // Object.defineProperty が使える場合はそれを使います
     if (Object.defineProperty) {
         Object.defineProperty(obj, prop, {
             get: getter
         });
     } else {
         // それ以外の場合は __defineGetter__ を使います
         obj.__defineGetter__(prop, getter);
     }
 }
  
   // HTMLElement.prototype.classList プロパティの定義
   defineElementGetter(HTMLElement.prototype, 'classList', function () {
    return new DOMTokenList(this);
});
})();


// requestAnimationFrame と cancelAnimationFrame のポリフィルを定義します
(function () {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame =
            window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
 // requestAnimationFrame が定義されていない場合のポリフィル
 if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function () {
            callback(currTime + timeToCall);
        },
            timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };
}
    // cancelAnimationFrame が定義されていない場合のポリフィル
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
})();


// キーボード入力を管理するクラスの定義
function KeyboardInputManager() {
    this.events = {};

    // MSPointerEnabled がサポートされているかどうかでイベントの種類を設定
    this.eventTouchstart = window.navigator.msPointerEnabled ? 'MSPointerDown' : 'touchstart';
    this.eventTouchmove = window.navigator.msPointerEnabled ? 'MSPointerMove' : 'touchmove';
    this.eventTouchend = window.navigator.msPointerEnabled ? 'MSPointerUp' : 'touchend';
    this.eventTouchcancel = window.navigator.msPointerEnabled ? 'MSPointerCancel' : 'touchcancel';

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
  
// 指定されたイベントに対するコールバックを呼び出す
emit: function (event, data) {
    var callbacks = this.events[event];
    if (callbacks) {
        callbacks.forEach(function (callback) {
            callback(data);
        });
    }
},
  // キーボード入力のリスナーを登録
  listen: function () {
    var self = this;

    // キーボードのキーが押されたときの処理
    var map = {
        38: 0, // 上キー
        39: 1, // 右キー
        40: 2, // 下キー
        37: 3, // 左キー
        75: 0, // Vim 方向キー上
        76: 1, // Vim 方向キー右
        74: 2, // Vim 方向キー下
        72: 3, // Vim 方向キー左
        87: 0, // W
        68: 1, // D
        83: 2, // S
        65: 3  // A
    };
  
// キーボードイベントのリスナーを登録
document.addEventListener("keydown", function (event) {
    var modifiers = event.altKey || event.ctrlKey || event.metaKey ||
        event.shiftKey;
    var mapped = map[event.which];

    if (!modifiers) {
        if (mapped !== undefined) {
            event.preventDefault();
            self.emit("move", mapped);
        }
    }

    // R キーを押したときの処理
    if (!modifiers && event.which === 82) {
        self.restart.bind(self)(event);
    }
});
  
   // タッチイベントのリスナーを登録
   this.bindButtonPress(".retry-button", this.restart);
   this.bindButtonPress(".restart-button", this.restart);
   this.bindButtonPress(".keep-playing-button", this.keepPlaying);

   // ゲームボードのタッチ操作のリスナーを登録
   var touchStartClientX, touchStartClientY;
   var gameContainer = document.getElementsByClassName("game-container")[0];

   // タッチ開始時の処理
   gameContainer.addEventListener(this.eventTouchstart, function (event) {
       if ((!window.navigator.msPointerEnabled && event.touches.length > 1) ||
           event.targetTouches > 1) {
           return; // 複数のタッチポイントがある場合は何もしない
       }

       if (window.navigator.msPointerEnabled) {
           touchStartClientX = event.pageX;
           touchStartClientY = event.pageY;
       } else {
           touchStartClientX = event.touches[0].clientX;
           touchStartClientY = event.touches[0].clientY;
       }

       event.preventDefault();
   });
  
    // タッチ移動時の処理
    gameContainer.addEventListener(this.eventTouchmove, function (event) {
        event.preventDefault();
    });

    // タッチ終了時の処理
    gameContainer.addEventListener(this.eventTouchend, function (event) {
        if ((!window.navigator.msPointerEnabled && event.touches.length > 0) ||
            event.targetTouches > 0) {
            return; // まだタッチポイントが残っている場合は何もしない
        }
  
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

        // 移動が十分に小さい場合は何もしない
        if (Math.max(absDx, absDy) < 10) {
            return;
        }

        // 移動の方向を決定する
        var direction = absDx > absDy ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);

        self.emit("move", direction);
    });
},
  
 // ボタンが押されたときの処理をバインドする
 bindButtonPress: function (selector, fn) {
    var button = document.querySelector(selector);
    button.addEventListener("click", fn.bind(this));
    button.addEventListener(this.eventTouchend, fn.bind(this));
    } ,

// ゲームのリスタートを行う
    restart: function (event) {
    event.preventDefault();
    this.emit("restart");
    },

// ゲームを続ける
    keepPlaying: function (event) {
    event.preventDefault();
    this.emit("keepPlaying");
    }
};

// いじらないで
  function HTMLActuator() {
    this.tileContainer    = document.querySelector(".tile-container");
    this.scoreContainer   = document.querySelector(".score-container");
    this.bestContainer    = document.querySelector(".best-container");
    this.messageContainer = document.querySelector(".game-message");
    this.sharingContainer = document.querySelector(".score-sharing");
  
    this.score = 0;
  }
  
  HTMLActuator.prototype.actuate = function (grid, metadata) {
    var self = this;
  
    window.requestAnimationFrame(function () {
      self.clearContainer(self.tileContainer);
  
      grid.cells.forEach(function (column) {
        column.forEach(function (cell) {
          if (cell) {
            self.addTile(cell);
          }
        });
      });
  
      self.updateScore(metadata.score);
      self.updateBestScore(metadata.bestScore);
  
      if (metadata.terminated) {
        if (metadata.over) {
          self.message(false); // You lose
        } else if (metadata.won) {
          self.message(true); // You win!
        }
      }
  
    });
  };
  
  // Continues the game (both restart and keep playing)
  HTMLActuator.prototype.continueGame = function () {
    if (typeof ga !== "undefined") {
      ga("send", "event", "game", "restart");
    }
  
    this.clearMessage();
  };
  
  HTMLActuator.prototype.clearContainer = function (container) {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  };
  
  //HTMLActuator.prototype.tileHTML = ["菜鸟", "入门", "码畜", "码奴", "码农", "IT民工", "IT工程师", "IT人才", "IT精英", "IT大哥", "IT领袖"];
  HTMLActuator.prototype.tileHTML = ["2", "4", "8", "16", "32", "64", "128", "256", "512", "1024", "2048"];
  //HTMLActuator.prototype.tileHTML = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "win"];
  //HTMLActuator.prototype.tileHTML = ["工兵", "班长", "排长", "连长", "营长", "团长", "旅长", "师长", "军长", "司令", "军旗"];
  
  HTMLActuator.prototype.addTile = function (tile) {
    var self = this;
  
    var wrapper   = document.createElement("div");
    var inner     = document.createElement("div");
    var position  = tile.previousPosition || { x: tile.x, y: tile.y };
    var positionClass = this.positionClass(position);
  
    // We can't use classlist because it somehow glitches when replacing classes
    var classes = ["tile", "tile-" + tile.value, positionClass];
  
    if (tile.value > 2048) classes.push("tile-super");
  
    this.applyClasses(wrapper, classes);
  
    inner.classList.add("tile-inner");
    inner.textContent = HTMLActuator.prototype.tileHTML[Math.log(tile.value) / Math.LN2 - 1] || tile.value;
  
    if (tile.previousPosition) {
      // Make sure that the tile gets rendered in the previous position first
      window.requestAnimationFrame(function () {
        classes[2] = self.positionClass({ x: tile.x, y: tile.y });
        self.applyClasses(wrapper, classes); // Update the position
      });
    } else if (tile.mergedFrom) {
      classes.push("tile-merged");
      this.applyClasses(wrapper, classes);
  
      // Render the tiles that merged
      tile.mergedFrom.forEach(function (merged) {
        self.addTile(merged);
      });
    } else {
      classes.push("tile-new");
      this.applyClasses(wrapper, classes);
    }
  
    // Add the inner part of the tile to the wrapper
    wrapper.appendChild(inner);
  
    // Put the tile on the board
    this.tileContainer.appendChild(wrapper);
  };
  
  HTMLActuator.prototype.applyClasses = function (element, classes) {
    element.setAttribute("class", classes.join(" "));
  };
  
  HTMLActuator.prototype.normalizePosition = function (position) {
    return { x: position.x + 1, y: position.y + 1 };
  };
  
  HTMLActuator.prototype.positionClass = function (position) {
    position = this.normalizePosition(position);
    return "tile-position-" + position.x + "-" + position.y;
  };
  
  HTMLActuator.prototype.updateScore = function (score) {
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
  };
  
  HTMLActuator.prototype.updateBestScore = function (bestScore) {
    this.bestContainer.textContent = bestScore;
  };
  
  HTMLActuator.prototype.message = function (won) {
    var type    = won ? "game-won" : "game-over";
    var message = won ? "You Win!" : "Game Over!";
  
    if (typeof ga !== "undefined") {
      ga("send", "event", "game", "end", type, this.score);
    }
  
    this.messageContainer.classList.add(type);
    this.messageContainer.getElementsByTagName("p")[0].textContent = message;
  
    this.clearContainer(this.sharingContainer);
    // Twitter関連
    // this.sharingContainer.appendChild(this.scoreTweetButton());
    //twttr.widgets.load();
  };
  
  HTMLActuator.prototype.clearMessage = function () {
    // IE only takes one value to remove at a time.
    this.messageContainer.classList.remove("game-won");
    this.messageContainer.classList.remove("game-over");
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
  
  // Build a grid of the specified size
  Grid.prototype.empty = function () {
    var cells = [];
  
    for (var x = 0; x < this.size; x++) {
      var row = cells[x] = [];
  
      for (var y = 0; y < this.size; y++) {
        row.push(null);
      }
    }
  
    return cells;
  };
  
  Grid.prototype.fromState = function (state) {
    var cells = [];
  
    for (var x = 0; x < this.size; x++) {
      var row = cells[x] = [];
  
      for (var y = 0; y < this.size; y++) {
        var tile = state[x][y];
        row.push(tile ? new Tile(tile.position, tile.value) : null);
      }
    }
  
    return cells;
  };
  
  // Find the first available random position
  Grid.prototype.randomAvailableCell = function () {
    var cells = this.availableCells();
  
    if (cells.length) {
      return cells[Math.floor(Math.random() * cells.length)];
    }
  };
  
  Grid.prototype.availableCells = function () {
    var cells = [];
  
    this.eachCell(function (x, y, tile) {
      if (!tile) {
        cells.push({ x: x, y: y });
      }
    });
  
    return cells;
  };
  
  // Call callback for every cell
  Grid.prototype.eachCell = function (callback) {
    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        callback(x, y, this.cells[x][y]);
      }
    }
  };
  
  // Check if there are any cells available
  Grid.prototype.cellsAvailable = function () {
    return !!this.availableCells().length;
  };
  
  // Check if the specified cell is taken
  Grid.prototype.cellAvailable = function (cell) {
    return !this.cellOccupied(cell);
  };
  
  Grid.prototype.cellOccupied = function (cell) {
    return !!this.cellContent(cell);
  };
  
  Grid.prototype.cellContent = function (cell) {
    if (this.withinBounds(cell)) {
      return this.cells[cell.x][cell.y];
    } else {
      return null;
    }
  };
  
  // Inserts a tile at its position
  Grid.prototype.insertTile = function (tile) {
    this.cells[tile.x][tile.y] = tile;
  };
  
  Grid.prototype.removeTile = function (tile) {
    this.cells[tile.x][tile.y] = null;
  };
  
  Grid.prototype.withinBounds = function (position) {
    return position.x >= 0 && position.x < this.size &&
           position.y >= 0 && position.y < this.size;
  };
  
  Grid.prototype.serialize = function () {
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
  };
  function Tile(position, value) {
    this.x                = position.x;
    this.y                = position.y;
    this.value            = value || 2;
  
    this.previousPosition = null;
    this.mergedFrom       = null; // Tracks tiles that merged together
  }
  
  Tile.prototype.savePosition = function () {
    this.previousPosition = { x: this.x, y: this.y };
  };
  
  Tile.prototype.updatePosition = function (position) {
    this.x = position.x;
    this.y = position.y;
  };
  
  Tile.prototype.serialize = function () {
    return {
      position: {
        x: this.x,
        y: this.y
      },
      value: this.value
    };
  };
  window.fakeStorage = {
    _data: {},
  
    setItem: function (id, val) {
      return this._data[id] = String(val);
    },
  
    getItem: function (id) {
      return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
    },
  
    removeItem: function (id) {
      return delete this._data[id];
    },
  
    clear: function () {
      return this._data = {};
    }
  };
  
  function LocalStorageManager() {
    this.bestScoreKey     = "bestScore";
    this.gameStateKey     = "gameState";
  
    var supported = this.localStorageSupported();
    this.storage = supported ? window.localStorage : window.fakeStorage;
  }
  
  LocalStorageManager.prototype.localStorageSupported = function () {
    var testKey = "test";
    var storage = window.localStorage;
  
    try {
      storage.setItem(testKey, "1");
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  };
  
  // Best score getters/setters
  LocalStorageManager.prototype.getBestScore = function () {
    return this.storage.getItem(this.bestScoreKey) || 0;
  };
  
  LocalStorageManager.prototype.setBestScore = function (score) {
    this.storage.setItem(this.bestScoreKey, score);
  };
  
  // Game state getters/setters and clearing
  LocalStorageManager.prototype.getGameState = function () {
    var stateJSON = this.storage.getItem(this.gameStateKey);
    return stateJSON ? JSON.parse(stateJSON) : null;
  };
  
  LocalStorageManager.prototype.setGameState = function (gameState) {
    this.storage.setItem(this.gameStateKey, JSON.stringify(gameState));
  };
  
  LocalStorageManager.prototype.clearGameState = function () {
    this.storage.removeItem(this.gameStateKey);
  };

//   ここまで

  function GameManager(size, InputManager, Actuator, StorageManager) {
    this.size           = size; // Size of the grid
    this.inputManager   = new InputManager;
    this.storageManager = new StorageManager;
    this.actuator       = new Actuator;
  
    this.startTiles     = 2;
  
    this.inputManager.on("move", this.move.bind(this));
    this.inputManager.on("restart", this.restart.bind(this));
    this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));
  
    this.setup();
  }
  
  // Restart the game
  GameManager.prototype.restart = function () {
    this.storageManager.clearGameState();
    this.actuator.continueGame(); // Clear the game won/lost message
    this.setup();
  };
  
  // Keep playing after winning (allows going over 2048)
  GameManager.prototype.keepPlaying = function () {
    this.keepPlaying = true;
    this.actuator.continueGame(); // Clear the game won/lost message
  };
  
  // Return true if the game is lost, or has won and the user hasn't kept playing
  GameManager.prototype.isGameTerminated = function () {
    if (this.over || (this.won && !this.keepPlaying)) {
      return true;
    } else {
      return false;
    }
  };
  
  // Set up the game
  GameManager.prototype.setup = function () {
    var previousState = this.storageManager.getGameState();
  
    // Reload the game from a previous game if present
    if (previousState) {
      this.grid        = new Grid(previousState.grid.size,
                                  previousState.grid.cells); // Reload grid
      this.score       = previousState.score;
      this.over        = previousState.over;
      this.won         = previousState.won;
      this.keepPlaying = previousState.keepPlaying;
    } else {
      this.grid        = new Grid(this.size);
      this.score       = 0;
      this.over        = false;
      this.won         = false;
      this.keepPlaying = false;
  
      // Add the initial tiles
      this.addStartTiles();
    }
  
    // Update the actuator
    this.actuate();
  };
  
  // Set up the initial tiles to start the game with
  GameManager.prototype.addStartTiles = function () {
    for (var i = 0; i < this.startTiles; i++) {
      this.addRandomTile();
    }
  };
  
  // Adds a tile in a random position
  GameManager.prototype.addRandomTile = function () {
    if (this.grid.cellsAvailable()) {
      var value = Math.random() < 0.9 ? 2 : 4;
      var tile = new Tile(this.grid.randomAvailableCell(), value);
  
      this.grid.insertTile(tile);
    }
  };
  
  // Sends the updated grid to the actuator
  GameManager.prototype.actuate = function () {
    if (this.storageManager.getBestScore() < this.score) {
      this.storageManager.setBestScore(this.score);
    }
  
    // Clear the state when the game is over (game over only, not win)
    if (this.over) {
      this.storageManager.clearGameState();
    } else {
      this.storageManager.setGameState(this.serialize());
    }
  
    this.actuator.actuate(this.grid, {
      score:      this.score,
      over:       this.over,
      won:        this.won,
      bestScore:  this.storageManager.getBestScore(),
      terminated: this.isGameTerminated()
    });
  
  };
  
  // Represent the current game as an object
  GameManager.prototype.serialize = function () {
    return {
      grid:        this.grid.serialize(),
      score:       this.score,
      over:        this.over,
      won:         this.won,
      keepPlaying: this.keepPlaying
    };
  };
  
  // Save all tile positions and remove merger info
  GameManager.prototype.prepareTiles = function () {
    this.grid.eachCell(function (x, y, tile) {
      if (tile) {
        tile.mergedFrom = null;
        tile.savePosition();
      }
    });
  };
  
  // Move a tile and its representation
  GameManager.prototype.moveTile = function (tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
  };
  
  // Move tiles on the grid in the specified direction
  GameManager.prototype.move = function (direction) {
    // 0: up, 1: right, 2: down, 3: left
    var self = this;
  
    if (this.isGameTerminated()) return; // Don't do anything if the game's over
  
    var cell, tile;
  
    var vector     = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved      = false;
  
    // Save the current tile positions and remove merger information
    this.prepareTiles();
  
    // Traverse the grid in the right direction and move tiles
    traversals.x.forEach(function (x) {
      traversals.y.forEach(function (y) {
        cell = { x: x, y: y };
        tile = self.grid.cellContent(cell);
  
        if (tile) {
          var positions = self.findFarthestPosition(cell, vector);
          var next      = self.grid.cellContent(positions.next);
  
          // Only one merger per row traversal?
          if (next && next.value === tile.value && !next.mergedFrom) {
            var merged = new Tile(positions.next, tile.value * 2);
            merged.mergedFrom = [tile, next];
  
            self.grid.insertTile(merged);
            self.grid.removeTile(tile);
  
            // Converge the two tiles' positions
            tile.updatePosition(positions.next);
  
            // Update the score
            self.score += merged.value;
  
            // The mighty 2048 tile
            if (merged.value === 2048) self.won = true;
          } else {
            self.moveTile(tile, positions.farthest);
          }
  
          if (!self.positionsEqual(cell, tile)) {
            moved = true; // The tile moved from its original cell!
          }
        }
      });
    });
  
    if (moved) {
      this.addRandomTile();
  
      if (!this.movesAvailable()) {
        this.over = true; // Game over!
      }
  
      this.actuate();
    }
  };
  
  // Get the vector representing the chosen direction
  GameManager.prototype.getVector = function (direction) {
    // Vectors representing tile movement
    var map = {
      0: { x: 0,  y: -1 }, // Up
      1: { x: 1,  y: 0 },  // Right
      2: { x: 0,  y: 1 },  // Down
      3: { x: -1, y: 0 }   // Left
    };
  
    return map[direction];
  };
  
  // Build a list of positions to traverse in the right order
  GameManager.prototype.buildTraversals = function (vector) {
    var traversals = { x: [], y: [] };
  
    for (var pos = 0; pos < this.size; pos++) {
      traversals.x.push(pos);
      traversals.y.push(pos);
    }
  
    // Always traverse from the farthest cell in the chosen direction
    if (vector.x === 1) traversals.x = traversals.x.reverse();
    if (vector.y === 1) traversals.y = traversals.y.reverse();
  
    return traversals;
  };
  
  GameManager.prototype.findFarthestPosition = function (cell, vector) {
    var previous;
  
    // Progress towards the vector direction until an obstacle is found
    do {
      previous = cell;
      cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.grid.withinBounds(cell) &&
             this.grid.cellAvailable(cell));
  
    return {
      farthest: previous,
      next: cell // Used to check if a merge is required
    };
  };
  
  GameManager.prototype.movesAvailable = function () {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
  };
  
  // Check for available matches between tiles (more expensive check)
  GameManager.prototype.tileMatchesAvailable = function () {
    var self = this;
  
    var tile;
  
    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        tile = this.grid.cellContent({ x: x, y: y });
  
        if (tile) {
          for (var direction = 0; direction < 4; direction++) {
            var vector = self.getVector(direction);
            var cell   = { x: x + vector.x, y: y + vector.y };
  
            var other  = self.grid.cellContent(cell);
  
            if (other && other.value === tile.value) {
              return true; // These two tiles can be merged
            }
          }
        }
      }
    }
  
    return false;
  };
  
  GameManager.prototype.positionsEqual = function (first, second) {
    return first.x === second.x && first.y === second.y;
  };
  // Wait till the browser is ready to render the game (avoids glitches)
  window.requestAnimationFrame(function () {
    new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
  });