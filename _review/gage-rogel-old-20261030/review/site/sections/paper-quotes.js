// Hayden 10/30: "put the client's testimony on the piece of paper, obviously". Each person's words printed on a sheet of
// US-letter paper for the Paper Crumple port (js/vendor/paper-crumple.js): Gage's letterhead, the quote, the result, and an
// honest red SAMPLE stamp, because the quotes are samples until his clients give their own words (the three real clients)
// and three of the people are generated stand-ins. Nobody is named (Hayden 10/29).
// paperFor(person) → Promise<canvas>   (1024 × 1325, drawn once per person and kept)
export const PAPER_ASPECT = 11 / 8.5;
const W = 1024;
const H = Math.round(W * PAPER_ASPECT);
const M = 96;   // margin
const INK = '#18202c', NAVY = '#0B111B', BLUE = '#0687FF', PRINT_BLUE = '#0a5fc2', GREY = '#6f7a8b', STAMP = '#c23b2e';

let fontsReady = null;
const fonts = () =>
  fontsReady ||
  (fontsReady = Promise.all(
    ['700 100px "Chakra Petch"', '600 40px "Chakra Petch"', '500 48px Figtree', '600 30px Figtree'].map(f => document.fonts.load(f))
  ).catch(() => {}));

function wrap(g, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? line + ' ' + word : word;
    if (line && g.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function stamp(g, line, cx, cy) {   // a rubber stamp: double border, worn ink, slapped on a little crooked
  const s = document.createElement('canvas');
  s.width = 440;
  s.height = 240;
  const k = s.getContext('2d');
  k.translate(220, 120);
  k.rotate(-0.15);
  k.strokeStyle = k.fillStyle = STAMP;
  k.lineWidth = 7;
  k.beginPath();
  k.roundRect(-178, -80, 356, 160, 14);
  k.stroke();
  k.lineWidth = 2.5;
  k.beginPath();
  k.roundRect(-165, -67, 330, 134, 9);
  k.stroke();
  k.textAlign = 'center';
  k.textBaseline = 'middle';
  k.font = '700 80px "Chakra Petch"';
  k.letterSpacing = '12px';
  k.fillText('SAMPLE', 6, -14);
  k.font = '600 25px Figtree';
  k.letterSpacing = '1px';
  k.fillText(line, 0, 44);
  k.setTransform(1, 0, 0, 1, 0, 0);
  k.globalCompositeOperation = 'destination-out';   // worn rubber: a scatter of tiny gaps in the ink
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 950; i++) {
    k.globalAlpha = 0.25 + rnd() * 0.6;
    k.beginPath();
    k.arc(rnd() * s.width, rnd() * s.height, 0.6 + rnd() * 1.9, 0, Math.PI * 2);
    k.fill();
  }
  g.save();
  g.globalAlpha = 0.86;
  g.globalCompositeOperation = 'multiply';
  g.drawImage(s, cx - s.width / 2, cy - s.height / 2);
  g.restore();
}

const cache = new Map();
export function paperFor(p) {
  if (!cache.has(p)) cache.set(p, draw(p));
  return cache.get(p);
}

async function draw(p) {
  await fonts();
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#f4f0e8';   // the original's paper color
  g.fillRect(0, 0, W, H);
  const edge = g.createRadialGradient(W / 2, H * 0.45, W * 0.3, W / 2, H / 2, W * 0.95);
  edge.addColorStop(0, 'rgba(0,0,0,0)');
  edge.addColorStop(1, 'rgba(80,60,30,0.07)');
  g.fillStyle = edge;
  g.fillRect(0, 0, W, H);
  g.textBaseline = 'alphabetic';

  // letterhead
  g.fillStyle = NAVY;
  g.font = '700 30px "Chakra Petch"';
  g.letterSpacing = '7px';
  g.fillText('GAGE ROGEL FITNESS', M, 128);
  g.fillStyle = GREY;
  g.font = '600 22px "Chakra Petch"';
  g.letterSpacing = '5px';
  g.textAlign = 'right';
  g.fillText('CLIENT RESULT', W - M, 128);
  g.textAlign = 'left';
  g.fillStyle = BLUE;
  g.fillRect(M, 152, W - 2 * M, 4);

  // the stamp, top right, before the words so it never sits on them
  stamp(g, p.real ? 'needs his own words' : 'not a real client', W - M - 190, 300);

  // the big quote mark
  g.fillStyle = BLUE;
  g.font = '700 230px "Chakra Petch"';
  g.letterSpacing = '0px';
  g.fillText('“', M - 12, 404);

  // the words
  g.fillStyle = INK;
  g.font = '500 50px Figtree';
  let y = 478;
  for (const line of wrap(g, p.q, W - 2 * M)) {
    g.fillText(line, M, y);
    y += 74;
  }

  // the result, when there is one
  if (p.result) {
    y += 22;
    g.fillStyle = NAVY;
    g.fillRect(M, y - 8, 70, 4);
    y += 60;
    g.fillStyle = PRINT_BLUE;
    g.font = '700 40px "Chakra Petch"';
    g.letterSpacing = '4px';
    for (const line of wrap(g, p.result.toUpperCase(), W - 2 * M)) {
      g.fillText(line, M, y);
      y += 54;
    }
  }

  // footer
  g.fillStyle = GREY;
  g.font = '600 22px "Chakra Petch"';
  g.letterSpacing = '5px';
  g.fillText('ONLINE COACHING · 1-ON-1 WITH GAGE', M, H - 96);
  g.fillStyle = 'rgba(11,17,27,0.18)';
  g.fillRect(M, H - 140, W - 2 * M, 2);
  return c;
}
