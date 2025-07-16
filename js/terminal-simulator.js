class TerminalSimulator {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            prompt: '$ ',
            user: 'user',
            host: 'ai-dev',
            path: '~',
            theme: 'dark',
            ...options
        };
        
        this.history = [];
        this.historyIndex = -1;
        this.currentLesson = null;
        this.lessonProgress = [];
        this.commands = new Map();
        
        this.init();
        this.setupDefaultCommands();
    }
    
    init() {
        this.container.innerHTML = `
            <div class="terminal-simulator">
                <div class="terminal-header">
                    <div class="terminal-controls">
                        <span class="terminal-control close"></span>
                        <span class="terminal-control minimize"></span>
                        <span class="terminal-control maximize"></span>
                    </div>
                    <div class="terminal-title">Terminal</div>
                </div>
                <div class="terminal-content" id="terminal-content">
                    <div class="terminal-output" id="terminal-output"></div>
                    <div class="terminal-input-line">
                        <span class="terminal-prompt" id="terminal-prompt">${this.getPrompt()}</span>
                        <div class="terminal-input-container">
                            <input type="text" class="terminal-input" id="terminal-input" autocomplete="off" spellcheck="false">
                            <span class="terminal-cursor" id="terminal-cursor">|</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.output = document.getElementById('terminal-output');
        this.input = document.getElementById('terminal-input');
        this.promptElement = document.getElementById('terminal-prompt');
        this.cursor = document.getElementById('terminal-cursor');
        
        this.setupEventListeners();
        this.focusInput();
        this.updateCursorPosition();
    }
    
    setupEventListeners() {
        this.input.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'Enter':
                    this.executeCommand();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateHistory(-1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateHistory(1);
                    break;
                case 'Tab':
                    e.preventDefault();
                    this.handleTabCompletion();
                    break;
            }
        });
        
        // Update cursor position on input, click, and key events
        this.input.addEventListener('input', () => {
            this.updateCursorPosition();
        });
        
        this.input.addEventListener('keyup', () => {
            this.updateCursorPosition();
        });
        
        this.input.addEventListener('click', () => {
            this.updateCursorPosition();
        });
        
        this.input.addEventListener('focus', () => {
            this.updateCursorPosition();
        });
        
        this.container.addEventListener('click', () => {
            this.focusInput();
        });
    }
    
    setupDefaultCommands() {
        this.addCommand('help', () => {
            return `Available commands:
  help     - Show this help message
  ls       - List directory contents
  pwd      - Print working directory
  cd       - Change directory
  echo     - Display text
  clear    - Clear terminal
  whoami   - Display current user
  date     - Show current date
  history  - Show command history`;
        });
        
        this.addCommand('ls', (args) => {
            const files = ['model.py', 'train.py', 'data/', 'config.json', 'requirements.txt'];
            return files.join('  ');
        });
        
        this.addCommand('pwd', () => {
            return `/home/${this.options.user}/${this.options.path.replace('~', '')}`;
        });
        
        this.addCommand('cd', (args) => {
            if (!args[0]) {
                this.options.path = '~';
            } else {
                this.options.path = args[0];
            }
            this.updatePrompt();
            return '';
        });
        
        this.addCommand('echo', (args) => {
            return args.join(' ');
        });
        
        this.addCommand('clear', () => {
            this.output.innerHTML = '';
            return '';
        });
        
        this.addCommand('whoami', () => {
            return this.options.user;
        });
        
        this.addCommand('date', () => {
            return new Date().toString();
        });
        
        this.addCommand('history', () => {
            return this.history.map((cmd, i) => `${i + 1}  ${cmd}`).join('\n');
        });
    }
    
    addCommand(name, handler) {
        this.commands.set(name, handler);
    }
    
    executeCommand() {
        const command = this.input.value.trim();
        if (!command) return;
        
        this.history.push(command);
        this.historyIndex = this.history.length;
        
        this.addToOutput(`${this.getPrompt()}${command}`, 'command');
        
        const [cmd, ...args] = command.split(' ');
        const handler = this.commands.get(cmd);
        
        if (handler) {
            const result = handler(args);
            if (result) {
                this.addToOutput(result, 'output');
            }
        } else {
            this.addToOutput(`Command not found: ${cmd}`, 'error');
        }
        
        this.input.value = '';
        this.updatePrompt();
        
        // Check lesson progress
        if (this.currentLesson) {
            this.checkLessonProgress(command);
        }
    }
    
    addToOutput(text, type = 'output') {
        const div = document.createElement('div');
        div.className = `terminal-line terminal-${type}`;
        div.textContent = text;
        this.output.appendChild(div);
        this.scrollToBottom();
    }
    
    getPrompt() {
        return `${this.options.user}@${this.options.host}:${this.options.path}${this.options.prompt}`;
    }
    
    updatePrompt() {
        this.promptElement.textContent = this.getPrompt();
    }
    
    navigateHistory(direction) {
        if (this.history.length === 0) return;
        
        this.historyIndex += direction;
        this.historyIndex = Math.max(0, Math.min(this.historyIndex, this.history.length));
        
        if (this.historyIndex < this.history.length) {
            this.input.value = this.history[this.historyIndex];
        } else {
            this.input.value = '';
        }
        
        // Move cursor to end of input
        this.input.setSelectionRange(this.input.value.length, this.input.value.length);
        this.updateCursorPosition();
    }
    
    handleTabCompletion() {
        const input = this.input.value;
        const commands = Array.from(this.commands.keys());
        const matches = commands.filter(cmd => cmd.startsWith(input));
        
        if (matches.length === 1) {
            this.input.value = matches[0];
            this.input.setSelectionRange(this.input.value.length, this.input.value.length);
            this.updateCursorPosition();
        } else if (matches.length > 1) {
            this.addToOutput(matches.join('  '), 'output');
        }
    }
    
    focusInput() {
        this.input.focus();
    }
    
    scrollToBottom() {
        this.container.scrollTop = this.container.scrollHeight;
    }
    
    updateCursorPosition() {
        // Create a temporary span to measure text width
        const tempSpan = document.createElement('span');
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.position = 'absolute';
        tempSpan.style.whiteSpace = 'pre';
        
        // Copy all computed styles from the input element
        const computedStyle = window.getComputedStyle(this.input);
        tempSpan.style.fontFamily = computedStyle.fontFamily;
        tempSpan.style.fontSize = computedStyle.fontSize;
        tempSpan.style.fontWeight = computedStyle.fontWeight;
        tempSpan.style.letterSpacing = computedStyle.letterSpacing;
        tempSpan.style.padding = computedStyle.padding;
        
        // Get text up to cursor position
        tempSpan.textContent = this.input.value.substring(0, this.input.selectionStart);
        
        this.input.parentElement.appendChild(tempSpan);
        const textWidth = tempSpan.offsetWidth;
        this.input.parentElement.removeChild(tempSpan);
        
        // Position the cursor accounting for input padding
        const inputPaddingLeft = parseInt(computedStyle.paddingLeft) || 0;
        this.cursor.style.left = (textWidth + inputPaddingLeft) + 'px';
    }
    
    // Lesson management
    loadLesson(lesson) {
        this.currentLesson = lesson;
        this.lessonProgress = [];
        this.addToOutput(`Starting lesson: ${lesson.title}`, 'lesson');
        this.addToOutput(lesson.introduction, 'lesson');
        
        if (lesson.commands) {
            lesson.commands.forEach(cmd => {
                this.addCommand(cmd.name, cmd.handler);
            });
        }
        
        this.displayNextStep();
    }
    
    displayNextStep() {
        if (!this.currentLesson) return;
        
        const step = this.currentLesson.steps[this.lessonProgress.length];
        if (step) {
            this.addToOutput(`Step ${this.lessonProgress.length + 1}: ${step.instruction}`, 'lesson');
            if (step.hint) {
                this.addToOutput(`Hint: ${step.hint}`, 'hint');
            }
        } else {
            this.addToOutput('Lesson completed! 🎉', 'success');
            this.currentLesson = null;
        }
    }
    
    checkLessonProgress(command) {
        if (!this.currentLesson) return;
        
        const currentStep = this.currentLesson.steps[this.lessonProgress.length];
        if (currentStep && currentStep.expectedCommand) {
            const expected = currentStep.expectedCommand;
            const matches = typeof expected === 'string' ? 
                command === expected : 
                expected.test(command);
            
            if (matches) {
                this.lessonProgress.push(command);
                this.addToOutput('✓ Correct!', 'success');
                setTimeout(() => this.displayNextStep(), 1000);
            }
        }
    }
    
    // Utility methods
    setTheme(theme) {
        this.options.theme = theme;
        this.container.className = `terminal-simulator theme-${theme}`;
    }
    
    reset() {
        this.output.innerHTML = '';
        this.history = [];
        this.historyIndex = -1;
        this.currentLesson = null;
        this.lessonProgress = [];
        this.input.value = '';
        this.updatePrompt();
    }
}

// Export for use in lessons
window.TerminalSimulator = TerminalSimulator;