# Pocket Billiards

An 8-ball pool game designed for large touchscreen displays. This is a proof-of-concept implementation built with HTML5 Canvas.

## Overview

Pocket Billiards is a touchscreen-optimized 8-ball game meant for TV-sized tabletop displays. The game uses tap-based controls that feel responsive on large touch surfaces.

## Features

- **8-Ball Game**: Standard 8-ball pool rules
- **Touch Controls**: Tap-based interface optimized for large touchscreens
- **HTML5 Canvas**: Full-screen canvas rendering
- **TypeScript**: Built with vanilla TypeScript
- **State Management**: Redux for predictable state management

## Requirements

- Large touchscreen display (40" or larger recommended)
- Modern web browser with HTML5 Canvas support (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/anicolao/pocket-billiards.git
   cd pocket-billiards
   ```

2. Serve the game locally:
   ```bash
   python -m http.server 8000
   ```

3. Open `http://localhost:8000` in your browser

4. For touchscreen devices, use full-screen mode (F11)

## How to Play

- **Tap** on the table to aim your shot
- **Tap and hold** to set power, release to shoot
- Follow standard 8-ball rules

## Project Status

This project is in early development as a proof of concept. See [VISION.md](VISION.md) for long-term goals.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.