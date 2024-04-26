function KeyboardInputManager() {
  this.events = {};
  this.eventTouchstart = window.navigator.msPointerEnabled ? "MSPointerDown" : "touchstart";
  this.eventTouchmove = window.navigator.msPointerEnabled ? "MSPointerMove" : "touchmove";
  this.eventTouchend = window.navigator.msPointerEnabled ? "MSPointerUp" : "touchend";
  this.listen();
}

KeyboardInputManager.prototype.on = function(event, callback) {
  if (!this.events[event]) {
      this.events[event] = [];
  }
  this.events[event].push(callback);
};

KeyboardInputManager.prototype.emit = function(event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
      callbacks.forEach(function(callback) {
          callback(data);
      });
  }
};

KeyboardInputManager.prototype.listen = function() {
  var self = this;
  var map = {
      38: 0, 39: 1, 40: 2, 37: 3, 75: 0, 76: 1, 74: 2, 72: 3, 87: 0, 68: 1, 83: 2, 65: 3
  };

  var eventsMap = {
      "keydown": function(event) {
          var modifiers = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
          var mapped = map[event.which];
          if (self.targetIsInput(event)) return;
          if (!modifiers && mapped !== undefined) {
              event.preventDefault();
              self.emit("move", mapped);
          }
          if (!modifiers && event.which === 82) {
              self.restart.call(self, event);
          }
      },
      "touchstart": function(event) {
          if ((!window.navigator.msPointerEnabled && event.touches.length > 1) ||
              event.targetTouches > 1 || self.targetIsInput(event)) {
              return;
          }
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
          if ((!window.navigator.msPointerEnabled && event.touches.length > 0) ||
              event.targetTouches > 0 || self.targetIsInput(event)) {
              return;
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
          if (Math.max(absDx, absDy) > 10) {
              self.emit("move", absDx > absDy ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
          }
      }
  };

  Object.keys(eventsMap).forEach(function(eventName) {
      document.addEventListener(eventName, eventsMap[eventName]);
  });

  this.bindButtonPress(".retry-button", this.restart);
  this.bindButtonPress(".restart-button", this.restart);
  this.bindButtonPress(".keep-playing-button", this.keepPlaying);
};
KeyboardInputManager.prototype.restart = function(event) {
  event.preventDefault();
  this.emit("restart");
};

KeyboardInputManager.prototype.keepPlaying = function(event) {
  event.preventDefault();
  this.emit("keepPlaying");
};
KeyboardInputManager.prototype.bindButtonPress = function(selector, fn) {
  var button = document.querySelector(selector);
  button.addEventListener("click", fn.bind(this));
  button.addEventListener(this.eventTouchend, fn.bind(this));
};

KeyboardInputManager.prototype.targetIsInput = function(event) {
  return event.target.tagName.toLowerCase() === "input";
};
// タッチ開始時のクライアント座標を保持するグローバル変数
var touchStartClientX, touchStartClientY; 

// タッチイベントの処理をまとめる
document.addEventListener("DOMContentLoaded", function() {
  var gameContainer = document.getElementsByClassName("game-container")[0];

  function handleTouchStart(event) {
      if ((!window.navigator.msPointerEnabled && event.touches.length > 1) ||
          event.targetTouches > 1 || KeyboardInputManager.targetIsInput(event)) {
          return;
      }
      if (window.navigator.msPointerEnabled) {
          touchStartClientX = event.pageX;
          touchStartClientY = event.pageY;
      } else {
          touchStartClientX = event.touches[0].clientX;
          touchStartClientY = event.touches[0].clientY;
      }
      event.preventDefault();
  }

  function handleTouchMove(event) {
      event.preventDefault();
  }

  function handleTouchEnd(event) {
      if ((!window.navigator.msPointerEnabled && event.touches.length > 0) ||
          event.targetTouches > 0 || KeyboardInputManager.targetIsInput(event)) {
          return;
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
      if (Math.max(absDx, absDy) > 10) {
          KeyboardInputManager.emit("move", absDx > absDy ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
      }
  }

  gameContainer.addEventListener(KeyboardInputManager.eventTouchstart, handleTouchStart);
  gameContainer.addEventListener(KeyboardInputManager.eventTouchmove, handleTouchMove);
  gameContainer.addEventListener(KeyboardInputManager.eventTouchend, handleTouchEnd);
});

  function HTMLActuator() {
    this.tileContainer = document.querySelector(".tile-container");
    this.scoreContainer = document.querySelector(".score-container");
    this.messageContainer = document.querySelector(".game-message");
    this.sharingContainer = document.querySelector(".score-sharing");
    this.score = 0;
  }
  
  HTMLActuator.prototype.actuate = function(grid, metadata) {
    var self = this;
    window.requestAnimationFrame(function() {
      self.clearContainer(self.tileContainer);
      grid.cells.forEach(function(column) {
        column.forEach(function(cell) {
          if (cell) {
            self.addTile(cell);
          }
        });
      });
      self.updateScore(metadata.score);
    //   self.updateBestScore(metadata.bestScore);
      if (metadata.terminated) {
        if (metadata.over) {
          self.message(false); 
        } else if (metadata.won) {
          self.message(true); 
        }
      }
    });
  };
  
  HTMLActuator.prototype.continueGame = function() {
    this.clearMessage();
  };
  
  HTMLActuator.prototype.clearContainer = function(container) {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  };
  
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
  
  HTMLActuator.prototype.applyClasses = function(element, classes) {
    element.setAttribute("class", classes.join(" "));
  };
  
  HTMLActuator.prototype.normalizePosition = function(position) {
    return { x: position.x + 1, y: position.y + 1 };
  };
  
  HTMLActuator.prototype.positionClass = function(position) {
    position = this.normalizePosition(position);
    return "tile-position-" + position.x + "-" + position.y;
  };
  
  HTMLActuator.prototype.updateScore = function(score) {
    this.clearContainer(this.scoreContainer);
    var difference = score - this.score;
    this.score = score;
    this.scoreContainer.textContent = this.score;
  };
  
  HTMLActuator.prototype.message = function(won) {
    var type = won ? "game-won" : "game-over";
    var message = won ? "You win!" : "Game over!";
    this.messageContainer.classList.add(type);
    this.messageContainer.getElementsByTagName("p")[0].textContent = message;
    this.clearContainer(this.sharingContainer);
    this.messageContainer.style.display = "block";
  };
  
  HTMLActuator.prototype.clearMessage = function() {
    this.messageContainer.classList.remove("game-won");
    this.messageContainer.classList.remove("game-over");
    this.messageContainer.style.display = "none";
  };
  
  function GameManager(size, InputManager, Actuator) {
    this.size = size;
    this.inputManager = new InputManager;
    this.actuator = new Actuator;
    this.storageManager = new LocalStorageManager; // 直接LocalStorageManagerを使用する
    this.startTiles = 2;

      // moveTile 関数を this のプロトタイプとして定義する
    this.moveTile = function(tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
  };

    this.inputManager.on("move", this.move.bind(this));
    this.inputManager.on("restart", this.restart.bind(this));
    this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));
    this.setup();
}

GameManager.prototype.restart = function() {
    this.actuator.continueGame();
    this.setup();
    this.over = false; // ゲームをリスタートするときにゲームオーバーのフラグをリセットする
};

GameManager.prototype.keepPlaying = function() {
    this.keepPlaying = true;
    this.actuator.continueGame();
};

GameManager.prototype.isGameTerminated = function() {
  // ゲームオーバーであり、かつ継続プレイしない場合に true を返す
    return this.over && !this.keepPlaying; 
};

GameManager.prototype.setup = function() {
    var previousState = this.storageManager.getGameState();
    if (previousState) {
        this.grid = new Grid(previousState.grid.size, previousState.grid.cells);
        this.score = previousState.score;
        this.over = previousState.over;
        this.won = previousState.won;
        this.keepPlaying = previousState.keepPlaying;
    } else {
        this.grid = new Grid(this.size);
        this.score = 0;
        this.over = false;
        this.won = false;
        this.keepPlaying = false;
        this.addStartTiles();
    }
    this.actuate();
};

GameManager.prototype.addStartTiles = function() {
    for (var i = 0; i < this.startTiles; i++) {
        this.addRandomTile();
    }
};

GameManager.prototype.addRandomTile = function() {
    if (this.grid.cellsAvailable()) {
        var value = Math.random() < 0.9 ? 2 : 4;
        var tile = new Tile(this.grid.randomAvailableCell(), value);
        this.grid.insertTile(tile);
    }
};

GameManager.prototype.actuate = function() {
  this.actuator.actuate(this.grid, {
    score: this.score,
    over: this.over,
    won: this.won,
    keepPlaying: this.keepPlaying
  });
  if (this.storageManager.getBestScore() < this.score) {
    this.storageManager.setBestScore(this.score);
  }
  if (this.over) {
    this.storageManager.clearGameState();
  } else {
    this.storageManager.setGameState(this.serialize());
  }
     // ゲームオーバーの場合はメッセージを表示する
     if (this.isGameTerminated()) {
      this.actuator.message(false);
  }
};

GameManager.prototype.serialize = function() {
    return {
        grid: this.grid.serialize(),
        score: this.score,
        over: this.over,
        won: this.won,
        keepPlaying: this.keepPlaying
    };
};
GameManager.prototype.prepareTiles = function() {
  this.grid.eachCell(function(x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
};

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

  GameManager.prototype.getVector = function(direction) {
    var map = {
      0: { x: 0,  y: -1 },
      1: { x: 1,  y: 0 },
      2: { x: 0,  y: 1 },
      3: { x: -1, y: 0 }
    };
    return map[direction];
  };
  
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
  
  GameManager.prototype.movesAvailable = function() {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
  };
  
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
  
  GameManager.prototype.positionsEqual = function(first, second) {
    return first.x === second.x && first.y === second.y;
  };
  
  
function Grid(size, previousState) {
  this.size = size;
  this.cells = previousState ? this.fromState(previousState) : this.empty();
}

Grid.prototype.fromState = function(state) {
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

Grid.prototype.empty = function() {
  var cells = [];
  for (var x = 0; x < this.size; x++) {
      var row = cells[x] = [];
      for (var y = 0; y < this.size; y++) {
          row.push(null);
      }
  }
  return cells;
};

Grid.prototype.randomAvailableCell = function() {
  var cells = this.availableCells();
  if (cells.length) {
      return cells[Math.floor(Math.random() * cells.length)];
  }
};

Grid.prototype.availableCells = function() {
  var cells = [];
  this.eachCell(function(x, y, tile) {
      if (!tile) {
          cells.push({ x: x, y: y });
      }
  });
  return cells;
};

Grid.prototype.eachCell = function(callback) {
  for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
          callback(x, y, this.cells[x][y]);
      }
  }
};

Grid.prototype.cellsAvailable = function() {
  return !!this.availableCells().length;
};

Grid.prototype.cellAvailable = function(cell) {
  return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function(cell) {
  return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function(cell) {
  if (this.withinBounds(cell)) {
    return this.cells[cell.x][cell.y];
  } else {
    return null;
  }
};
Grid.prototype.insertTile = function(tile) {
  this.cells[tile.x][tile.y] = tile;
};

Grid.prototype.removeTile = function(tile) {
  this.cells[tile.x][tile.y] = null;
};

Grid.prototype.withinBounds = function(position) {
  return position.x >= 0 && position.x < this.size && position.y >= 0 && position.y < this.size;
};

Grid.prototype.serialize = function() {
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
    this.mergedFrom       = null;
  }
  
  Tile.prototype.savePosition = function() {
    this.previousPosition = { x: this.x, y: this.y };
  };
  
  Tile.prototype.updatePosition = function(position) {
    this.x = position.x;
    this.y = position.y;
  };
  
  Tile.prototype.serialize = function() {
    return {
      position: {
        x: this.x,
        y: this.y
      },
      value: this.value
    };
  };
  
  function LocalStorageManager() {
    this.bestScoreKey = "bestScore";
    this.gameStateKey = "gameState";
  }
  
  LocalStorageManager.prototype.getBestScore = function() {
    return localStorage.getItem(this.bestScoreKey) || 0;
  };
  
  LocalStorageManager.prototype.setBestScore = function(score) {
    localStorage.setItem(this.bestScoreKey, score);
  };
  
  LocalStorageManager.prototype.getGameState = function() {
    var stateJSON = localStorage.getItem(this.gameStateKey);
    return stateJSON ? JSON.parse(stateJSON) : null;
  };
  
  LocalStorageManager.prototype.setGameState = function(state) {
    localStorage.setItem(this.gameStateKey, JSON.stringify(state));
  };
  
  LocalStorageManager.prototype.clearGameState = function() {
    localStorage.removeItem(this.gameStateKey);
  };
  
  var size = 4;
  var inputManager = new KeyboardInputManager();
  var storageManager = new LocalStorageManager();
  var actuator = new HTMLActuator();
  var game = new GameManager(size, KeyboardInputManager, HTMLActuator, storageManager);
  
  // 修正前643