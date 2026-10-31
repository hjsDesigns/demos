// Aceternity UI "Text Flipping Board" (text-flipping-board.tsx), as an ES module for Gage's site.
// This is the local proof port (website-factory/vendor/effects/aceternity/proof/text-flipping-board.js) unchanged inside:
// same grid, character set, timings (30 ms a column, 20 ms a row, 55 ms a step, 0.35 s flaps), scramble counts (25-39 for a
// letter, 8-15 for a blank), 20% accent odds and accent colours, and the same flip choreography. Only the wrapper changed:
// the IIFE that set window.createFlippingBoard is now ES exports, and FlapCell + the timing constants are exported too, so a
// page can lay out its own short row of cells (Gage's "SPOTS OPEN" line) with the exact same flaps.
// Licence (ui.aceternity.com/licence): use inside end products for us or clients; never redistribute this source.

var FLAP_CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$()-+&=;:'\"%,./?°";
var BOARD_ROWS = 6;
var BOARD_COLS = 22;
var BASE_COL_DELAY = 30;
var BASE_ROW_DELAY = 20;
var BASE_STEP_MS = 55;
var BASE_FLIP_S = 0.35;
var BASE_TOTAL_S =
  ((BOARD_COLS - 1) * BASE_COL_DELAY + (BOARD_ROWS - 1) * BASE_ROW_DELAY + 8 * BASE_STEP_MS) / 1000;

/* Tailwind v4 values: red-600/700, orange-500/600, yellow-400/500, green-600/700,
   blue-600/700, violet-600/700, white/neutral-100; text white or neutral-900 */
var WHITE = "#fff";
var N900 = "oklch(20.5% 0 0)";
var ACCENT_COLORS = [
  { top: "oklch(57.7% 0.245 27.325)", bottom: "oklch(50.5% 0.213 27.518)", text: WHITE },
  { top: "oklch(70.5% 0.213 47.604)", bottom: "oklch(64.6% 0.222 41.116)", text: WHITE },
  { top: "oklch(85.2% 0.199 91.936)", bottom: "oklch(79.5% 0.184 86.047)", text: N900 },
  { top: "oklch(62.7% 0.194 149.214)", bottom: "oklch(52.7% 0.154 150.069)", text: WHITE },
  { top: "oklch(54.6% 0.245 262.881)", bottom: "oklch(48.8% 0.243 264.376)", text: WHITE },
  { top: "oklch(54.1% 0.281 293.009)", bottom: "oklch(49.1% 0.27 292.581)", text: WHITE },
  { top: "#fff", bottom: "oklch(97% 0 0)", text: N900 }
];

var COLOR_MAP = {
  "{R}": "#D32F2F", "{O}": "#F57C00", "{Y}": "#FBC02D", "{G}": "#43A047",
  "{B}": "#1E88E5", "{V}": "#8E24AA", "{W}": "#FAFAFA"
};

function reducedMotion() {
  return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

function div(cls) {
  var d = document.createElement("div");
  if (cls) d.className = cls;
  return d;
}

function show(ch) { return ch === " " ? " " : ch; }

// ── Row parser / word wrap (verbatim logic) ─────────────────────────
function parseRow(row) {
  var cells = [];
  var i = 0;
  while (i < row.length) {
    if (row[i] === "{" && i + 2 < row.length && row[i + 2] === "}") {
      var code = row.substring(i, i + 3);
      if (COLOR_MAP[code]) {
        cells.push({ type: "color", hex: COLOR_MAP[code] });
        i += 3;
        continue;
      }
    }
    cells.push({ type: "char", value: row[i] });
    i++;
  }
  return cells;
}

function wrapParagraph(paragraph, maxCols) {
  var lines = [];
  var words = paragraph.split(/[ \t]+/).filter(Boolean);
  var currentLine = "";
  for (var w = 0; w < words.length; w++) {
    var word = words[w];
    if (word.length > maxCols) {
      if (currentLine) { lines.push(currentLine); currentLine = ""; }
      lines.push(word.slice(0, maxCols));
      continue;
    }
    if (!currentLine) currentLine = word;
    else if (currentLine.length + 1 + word.length <= maxCols) currentLine += " " + word;
    else { lines.push(currentLine); currentLine = word; }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function wrapText(input, maxCols) {
  var out = [];
  input.split("\n").forEach(function (p) {
    if (p.trim() === "") out.push("");
    else out.push.apply(out, wrapParagraph(p, maxCols));
  });
  return out;
}

function buildGrid(text, rows) {
  var grid = [];
  for (var r = 0; r < BOARD_ROWS; r++) {
    grid.push([]);
    for (var c = 0; c < BOARD_COLS; c++) grid[r].push({ type: "char", value: " " });
  }
  if (text) {
    var lines = wrapText(text, BOARD_COLS).slice(0, BOARD_ROWS);
    var startRow = Math.max(0, Math.floor((BOARD_ROWS - lines.length) / 2));
    lines.forEach(function (line, i) {
      var row = startRow + i;
      if (row >= BOARD_ROWS) return;
      var parsed = parseRow(line);
      var startCol = Math.max(0, Math.floor((BOARD_COLS - parsed.length) / 2));
      parsed.forEach(function (cell, ci) {
        if (startCol + ci < BOARD_COLS) grid[row][startCol + ci] = cell;
      });
    });
  } else if (rows) {
    rows.forEach(function (row, r2) {
      if (r2 >= BOARD_ROWS) return;
      parseRow(row).forEach(function (cell, ci) {
        if (ci < BOARD_COLS) grid[r2][ci] = cell;
      });
    });
  }
  return grid;
}

// ── One split-flap cell ─────────────────────────────────────────────
function FlapCell() {
  this.cur = " ";
  this.accent = null;
  this.target = null;      // last raw target prop (React effect dependency)
  this.delay = null;
  this.startTimer = null;
  this.stepTimer = null;
  this.flipped = false;

  var el = div("tfb-cell");
  var flaps = div("tfb-flaps");
  var hinge = div("tfb-hinge");
  hinge.appendChild(div("tfb-hinge-l"));
  hinge.appendChild(div("tfb-hinge-m"));
  hinge.appendChild(div("tfb-hinge-r"));
  var top = div("tfb-half tfb-top");
  var topCh = div("tfb-ch");
  topCh.textContent = show(" ");
  top.appendChild(topCh);
  var bot = div("tfb-half tfb-bot");
  var botCh = div("tfb-ch");
  botCh.textContent = show(" ");
  bot.appendChild(botCh);
  var split = div("tfb-split");
  flaps.appendChild(hinge);
  flaps.appendChild(top);
  flaps.appendChild(bot);
  flaps.appendChild(split);
  el.appendChild(flaps);
  el.appendChild(div("tfb-stripes"));

  this.el = el;
  this.flaps = flaps;
  this.top = top;
  this.topCh = topCh;
  this.bot = bot;
  this.botCh = botCh;
  this.split = split;
  this.live = [];          // elements of the current flip (replaced every step, like React keys)
}

FlapCell.prototype.clearTimers = function () {
  if (this.startTimer) clearTimeout(this.startTimer);
  if (this.stepTimer) clearTimeout(this.stepTimer);
  this.startTimer = null;
  this.stepTimer = null;
};

FlapCell.prototype.paintStatic = function (ch, accent) {
  var t = show(ch);
  this.topCh.textContent = t;
  this.botCh.textContent = t;
  this.top.style.backgroundColor = accent ? accent.top : "";
  this.bot.style.backgroundColor = accent ? accent.bottom : "";
  this.topCh.style.color = accent ? accent.text : "";
  this.botCh.style.color = accent ? accent.text : "";
};

FlapCell.prototype.flip = function (prev, prevAccent, ch, accent) {
  // remove last step's keyed elements (React unmounts them when flipId changes)
  for (var i = 0; i < this.live.length; i++) this.live[i].remove();
  this.live.length = 0;

  this.paintStatic(ch, accent);

  var shimmer = div("tfb-fx tfb-shimmer");
  this.bot.appendChild(shimmer);

  var ft = div("tfb-flap-top");
  if (prevAccent) ft.style.backgroundColor = prevAccent.top;
  var ftCh = div("tfb-ch");
  ftCh.textContent = show(prev);
  if (prevAccent) ftCh.style.color = prevAccent.text;
  ft.appendChild(ftCh);
  ft.appendChild(div("tfb-fx"));

  var fb = div("tfb-flap-bot");
  if (accent) fb.style.backgroundColor = accent.bottom;
  var fbCh = div("tfb-ch");
  fbCh.textContent = show(ch);
  if (accent) fbCh.style.color = accent.text;
  fb.appendChild(fbCh);
  fb.appendChild(div("tfb-fx"));
  // Motion ends this flap at transform "none" (off the 3D layer); match it so text rasterizes the same
  fb.addEventListener("animationend", function (e) {
    if (e.target !== fb) return;
    fb.style.animation = "none";
    fb.style.transform = "none";
  });

  this.flaps.insertBefore(ft, this.split);
  this.flaps.insertBefore(fb, this.split);
  this.live.push(shimmer, ft, fb);
};

FlapCell.prototype.setTarget = function (target, delay, stepMs, instant) {
  if (target === this.target && delay === this.delay) return; // effect deps unchanged
  this.target = target;
  this.delay = delay;
  this.clearTimers();

  var up = target.toUpperCase();
  var normalized = FLAP_CHARS.indexOf(up) !== -1 ? up : " ";

  if (instant) {
    for (var i = 0; i < this.live.length; i++) this.live[i].remove();
    this.live.length = 0;
    this.cur = normalized;
    this.accent = null;
    this.paintStatic(normalized, null);
    return;
  }

  if (normalized === " " && this.cur === " ") return;

  var scrambleCount =
    normalized === " "
      ? 8 + Math.floor(Math.random() * 8)
      : 25 + Math.floor(Math.random() * 15);

  var self = this;
  var runStep = function (n) {
    var isLast = n === scrambleCount;
    var ch = isLast
      ? normalized
      : FLAP_CHARS[1 + Math.floor(Math.random() * (FLAP_CHARS.length - 1))];
    var newAccent = isLast
      ? null
      : Math.random() < 0.2
        ? ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)]
        : null;

    var prev = self.cur;
    var prevAccent = self.accent;
    self.cur = ch;
    self.accent = newAccent;
    self.flip(prev, prevAccent, ch, newAccent);

    if (!isLast) self.stepTimer = setTimeout(function () { runStep(n + 1); }, stepMs);
  };
  this.startTimer = setTimeout(function () { runStep(1); }, delay);
};

function ColorCell(hex) {
  this.el = div("tfb-color");
  this.el.style.backgroundColor = hex;
  this.hex = hex;
}

// ── Board ───────────────────────────────────────────────────────────
function createFlippingBoard(mount, opts) {
  opts = opts || {};
  var duration = typeof opts.duration === "number" ? opts.duration : BASE_TOTAL_S;
  var scale = duration / BASE_TOTAL_S;
  var colDelay = BASE_COL_DELAY * scale;
  var rowDelay = BASE_ROW_DELAY * scale;
  var stepMs = BASE_STEP_MS * scale;
  var flipDur = Math.min(0.6, Math.max(0.15, BASE_FLIP_S * scale));

  var root = div("tfb" + (opts.theme === "dark" ? " tfb--dark" : ""));
  root.style.setProperty("--tfb-flip", flipDur + "s");
  root.setAttribute("role", "img");
  var grid = div("tfb-grid");
  grid.setAttribute("aria-hidden", "true");
  root.appendChild(grid);
  mount.appendChild(root);

  var cells = [];
  for (var r = 0; r < BOARD_ROWS; r++) {
    cells.push([]);
    for (var c = 0; c < BOARD_COLS; c++) {
      var fc = new FlapCell();
      cells[r].push(fc);
      grid.appendChild(fc.el);
    }
  }

  function render(text, rows) {
    var g = buildGrid(text, rows);
    var instant = reducedMotion();
    root.setAttribute("aria-label", (text || (rows || []).join(" ")).replace(/\s+/g, " ").trim());
    for (var r = 0; r < BOARD_ROWS; r++) {
      for (var c = 0; c < BOARD_COLS; c++) {
        var want = g[r][c];
        var have = cells[r][c];
        if (want.type === "color") {
          if (!(have instanceof ColorCell) || have.hex !== want.hex) {
            if (have.clearTimers) have.clearTimers();
            var cc = new ColorCell(want.hex);
            grid.replaceChild(cc.el, have.el);
            cells[r][c] = cc;
          }
        } else {
          if (have instanceof ColorCell) {       // type changed: fresh FlapCell (remount)
            var nf = new FlapCell();
            grid.replaceChild(nf.el, have.el);
            cells[r][c] = have = nf;
          }
          have.setTarget(want.value, c * colDelay + r * rowDelay, stepMs, instant);
        }
      }
    }
  }

  render(opts.text, opts.rows);

  return {
    el: root,
    set: function (text) { render(text, null); },
    setRows: function (rows) { render(null, rows); },
    destroy: function () {
      cells.forEach(function (row) { row.forEach(function (cell) { if (cell.clearTimers) cell.clearTimers(); }); });
      root.remove();
    }
  };
}

export { createFlippingBoard, FlapCell, FLAP_CHARS, BASE_COL_DELAY, BASE_ROW_DELAY, BASE_STEP_MS, BASE_FLIP_S, BASE_TOTAL_S };
export default createFlippingBoard;
