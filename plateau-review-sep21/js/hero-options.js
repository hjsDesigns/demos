window.PLATEAU_TRANSITIONS = [
  {
    "id": "soft-melt",
    "name": "Soft Melt",
    "description": "The pieces and mountains gradually become the logo together.",
    "opacity": [
      0.05,
      0.68
    ],
    "move": [
      0.35,
      1
    ],
    "mountain": [
      0.05,
      0.68
    ],
    "board": [
      0.16,
      0.86
    ],
    "fade": [
      0.05,
      0.82
    ],
    "rate": 0.8
  },
  {
    "id": "mountains-first",
    "name": "Mountains First",
    "description": "Rainier turns into the illustrated ridge, then the chess pieces follow.",
    "opacity": [
      0.24,
      0.84
    ],
    "move": [
      0.45,
      1
    ],
    "mountain": [
      0,
      0.42
    ],
    "board": [
      0.3,
      0.92
    ],
    "fade": [
      0.12,
      0.91
    ],
    "rate": 0.8
  },
  {
    "id": "pieces-first",
    "name": "Pieces First",
    "description": "The chess pieces change first while the mountain scene stays visible longer.",
    "opacity": [
      0,
      0.58
    ],
    "move": [
      0.34,
      1
    ],
    "mountain": [
      0.35,
      0.96
    ],
    "board": [
      0.22,
      0.82
    ],
    "fade": [
      0.18,
      0.95
    ],
    "rate": 0.8
  },
  {
    "id": "king-outward",
    "name": "King Outward",
    "description": "The king changes first, then the transformation spreads to the outer pieces.",
    "opacity": [
      0,
      0.52
    ],
    "move": [
      0.4,
      1
    ],
    "mountain": [
      0.12,
      0.82
    ],
    "board": [
      0.28,
      0.94
    ],
    "fade": [
      0.12,
      0.96
    ],
    "rate": 0.8,
    "order": "center"
  },
  {
    "id": "across-the-pieces",
    "name": "Across the Pieces",
    "description": "The transformation travels from the pawn on the left to the rook on the right.",
    "opacity": [
      0,
      0.56
    ],
    "move": [
      0.35,
      1
    ],
    "mountain": [
      0.05,
      0.95
    ],
    "board": [
      0.3,
      0.97
    ],
    "fade": [
      0.12,
      0.97
    ],
    "rate": 0.8,
    "order": "left"
  },
  {
    "id": "draw-together",
    "name": "Draw Together",
    "description": "The logo shapes appear inside the moving pieces, then gather into their final spacing.",
    "opacity": [
      0,
      0.55
    ],
    "move": [
      0.48,
      1
    ],
    "mountain": [
      0,
      0.55
    ],
    "board": [
      0.4,
      0.95
    ],
    "fade": [
      0.05,
      0.65
    ],
    "rate": 0.75
  }
];
