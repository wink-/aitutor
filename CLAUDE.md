# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an interactive HTML5/ES6/Bootstrap tutorial site for teaching terminal-based AI coding. It transforms GUI-dependent developers into terminal-proficient AI coding experts through hands-on lessons and practical exercises.

## Development Commands

### Running the Development Server
```bash
npm run dev
# or
python3 -m http.server 8000
```

### Project Structure
```
/
├── index.html              # Main homepage
├── css/
│   └── main.css           # Main stylesheet with terminal themes
├── js/
│   ├── main.js            # Core application functionality
│   ├── lesson-manager.js  # Lesson management and navigation
│   └── terminal-simulator.js # Interactive terminal component
├── lessons/
│   ├── index.html         # Lessons directory page
│   ├── 01-zsh-basics.html # Foundation lessons
│   ├── 02-oh-my-zsh.html
│   ├── 03-tmux-basics.html
│   ├── 04-tmux-workflows.html
│   ├── 05-search-tools.html
│   ├── 06-productivity-tools.html
│   ├── 07-neovim-basics.html
│   ├── 08-neovim-ai-setup.html
│   ├── 09-cloud-ai-tools.html
│   ├── 10-ai-monitoring.html
│   ├── 11-automation-scripts.html
│   └── 12-advanced-integration.html
└── assets/                # Static assets
```

## Architecture

### Core Components
- **AITerminalTutor** (`js/main.js`): Main application class handling theme, navigation, and progress tracking
- **TerminalSimulator** (`js/terminal-simulator.js`): Interactive terminal component for hands-on exercises
- **LessonManager** (`js/lesson-manager.js`): Handles lesson loading, navigation, and progress synchronization

### Learning Progression
1. **Foundation (4 lessons)**: zsh, tmux, CLI tools, SSH
2. **Editor Transition (6 lessons)**: Neovim basics, plugins, LSP, AI integration
3. **AI Workflows (4 lessons)**: Cloud CLI, monitoring, Jupyter console
4. **Advanced Integration (5 lessons)**: Automation, workflows, troubleshooting

### Key Features
- Interactive terminal simulator with command execution
- Progress tracking with localStorage persistence
- Theme switching (light/dark modes)
- Responsive Bootstrap 5 design
- Lesson prerequisites and recommendations
- Downloadable configuration files
- Hands-on exercises with real-world AI scenarios

## Development Guidelines

### Adding New Lessons
1. Create HTML file in `lessons/` directory
2. Use Bootstrap 5 structure with lesson navigation
3. Include terminal simulator sections for interactive exercises
4. Add downloadable configuration files where appropriate
5. Update lesson count in `js/main.js` progress tracking

### Terminal Simulator Usage
```javascript
const terminal = new TerminalSimulator('terminal-container');
terminal.loadLesson(lessonData);
```

### Progress Tracking
- User progress stored in localStorage
- Lesson completion tracked with timestamps
- Streak counting and time tracking
- Export/import functionality for progress data

This site teaches the essential terminal skills needed for modern AI development through interactive lessons and practical exercises.