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
├── index.html              # Main homepage with course overview
├── css/
│   ├── main.css           # Main stylesheet with terminal themes
│   ├── lessons.css        # Lesson-specific styling
│   └── style.css          # Additional styles
├── js/
│   ├── main.js            # Core application (AITerminalTutor class)
│   ├── lesson-manager.js  # Lesson loading and progress sync
│   └── terminal-simulator.js # Interactive terminal emulator
├── lessons/
│   ├── index.html         # Lessons directory page
│   ├── 01-zsh-basics.html through 12-advanced-integration.html
│   └── configs/           # Downloadable configuration files
├── assets/                # Static assets (icons, images)
├── lessons.json           # Complete course structure (19 lessons)
├── package.json           # NPM scripts and metadata
├── plan.md                # Development planning document
└── CLAUDE.md             # This file
```

## Architecture

### Core Components
- **AITerminalTutor** (`js/main.js`): Main application class handling theme, navigation, and progress tracking
- **TerminalSimulator** (`js/terminal-simulator.js`): Interactive terminal component for hands-on exercises
- **LessonManager** (`js/lesson-manager.js`): Handles lesson loading, navigation, and progress synchronization

### Learning Progression
The course contains 19 lessons organized into 4 categories (defined in lessons.json):

1. **Foundation (4 lessons)**: Essential terminal skills
   - zsh-basics: Zsh and Oh-My-Zsh setup
   - tmux-fundamentals: Terminal multiplexing
   - cli-tools-essentials: ripgrep, fd, fzf
   - ssh-remote-development: SSH and remote workflows

2. **Editor Transition (6 lessons)**: Mastering Neovim
   - neovim-installation: Basic setup with kickstart.nvim/LazyVim
   - vim-motions-mastery: Navigation and editing
   - lsp-setup: Language Server Protocol configuration
   - essential-plugins: Telescope, nvim-tree, git integration
   - ai-plugins-integration: GitHub Copilot/Codeium
   - advanced-neovim-config: Custom functions and optimizations

3. **AI Workflow Tools (4 lessons)**: Specialized AI/ML tools
   - tmux-layouts-ai: Optimal layouts for AI development
   - cloud-cli-tools: AWS/GCP CLI and kubectl
   - jupyter-terminal: Jupyter console and nbterm
   - model-monitoring: TensorBoard, wandb CLI, nvtop

4. **Advanced Integration (5 lessons)**: Automation and mastery
   - automation-scripts: Custom shell scripts
   - neovim-repl-integration: REPL workflows
   - tmuxinator-automation: Project templates
   - performance-profiling: htop, iotop, profiling
   - terminal-ai-mastery: Complete workflow integration

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
1. Create HTML file in `lessons/` directory following the naming pattern: `NN-lesson-name.html`
2. Update `lessons.json` with the new lesson metadata including:
   - id, category, title, description
   - objectives array
   - prerequisites array (lesson ids)
   - estimatedTime, difficulty
   - hands_on_exercises array
3. Use Bootstrap 5 structure with standard lesson navigation components
4. Include terminal simulator sections for interactive exercises
5. Add downloadable configuration files to `lessons/configs/` where appropriate
6. No need to update lesson count - it's dynamically calculated from lessons.json

### Terminal Simulator Usage
```javascript
const terminal = new TerminalSimulator('terminal-container', {
    prompt: '$ ',
    user: 'user',
    host: 'ai-dev',
    path: '~',
    theme: 'dark'
});
terminal.loadLesson(lessonData);
```

The terminal simulator supports:
- Command history with arrow keys
- Tab completion
- Custom command handlers
- Lesson-specific commands and exercises
- Real-time cursor positioning

### Progress Tracking
- User progress stored in localStorage under 'aiTerminalTutorProgress'
- Lesson completion tracked with timestamps
- Streak counting and time tracking
- Export/import functionality for progress data
- Progress syncs across lesson navigation

### Key JavaScript Classes

1. **AITerminalTutor** (js/main.js)
   - Manages theme switching (light/dark)
   - Handles progress tracking and statistics
   - Controls navigation and lesson loading
   - localStorage keys: 'theme', 'aiTerminalTutorProgress'

2. **TerminalSimulator** (js/terminal-simulator.js)
   - Creates interactive terminal emulator
   - Processes commands and maintains history
   - Supports lesson-specific command sets
   - Handles cursor positioning and input focus

3. **LessonManager** (js/lesson-manager.js)
   - Loads lessons from lessons.json
   - Manages lesson prerequisites and recommendations
   - Syncs progress with main application
   - Handles lesson navigation and filtering

### Testing and Validation

Currently no automated tests. Manual testing required for:
- Terminal simulator command execution
- Progress tracking persistence
- Theme switching functionality
- Lesson navigation and prerequisites
- Mobile responsiveness

This site teaches essential terminal skills for AI development through 19 interactive lessons, transforming GUI-dependent developers into terminal-proficient AI experts.