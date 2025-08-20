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
  help        - Show this help message
  ls [path]   - List directory contents
  pwd         - Print working directory
  cd [path]   - Change directory
  echo [text] - Display text
  clear       - Clear terminal
  whoami      - Display current user
  date        - Show current date
  history     - Show command history
  cat [file]  - Display file contents
  mkdir [dir] - Create directory
  touch [file]- Create empty file
  rm [file]   - Remove file
  python [file] - Run Python script
  git [args]  - Git commands
  tmux [args] - Tmux commands
  nvim [file] - Open Neovim editor`;
        });
        
        this.addCommand('ls', (args) => {
            const path = args[0] || '.';
            const files = {
                '.': ['model.py', 'train.py', 'data/', 'config.json', 'requirements.txt', '.gitignore', 'README.md'],
                'data': ['train.csv', 'test.csv', 'validation.csv', 'processed/'],
                'data/processed': ['features.npy', 'labels.npy', 'scaler.pkl']
            };
            
            const contents = files[path] || ['No such file or directory'];
            const formatted = contents.map(item => {
                if (item.endsWith('/')) {
                    return `\x1b[34m${item}\x1b[0m`; // Blue for directories
                } else if (item.endsWith('.py')) {
                    return `\x1b[32m${item}\x1b[0m`; // Green for Python files
                }
                return item;
            });
            
            return formatted.join('  ');
        });
        
        this.addCommand('pwd', () => {
            const fullPath = this.options.path === '~' ? 
                `/home/${this.options.user}` : 
                `/home/${this.options.user}/${this.options.path.replace('~/', '')}`;
            return fullPath;
        });
        
        this.addCommand('cd', (args) => {
            if (!args[0]) {
                this.options.path = '~';
            } else if (args[0] === '..') {
                // Go up one directory
                const pathParts = this.options.path.split('/');
                if (pathParts.length > 1) {
                    pathParts.pop();
                    this.options.path = pathParts.join('/') || '~';
                }
            } else {
                // Simple directory navigation
                if (args[0].startsWith('/')) {
                    this.options.path = args[0];
                } else {
                    this.options.path = this.options.path === '~' ? 
                        args[0] : `${this.options.path}/${args[0]}`;
                }
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
            return new Date().toLocaleString();
        });
        
        this.addCommand('history', () => {
            return this.history.map((cmd, i) => `${String(i + 1).padStart(3)} ${cmd}`).join('\n');
        });
        
        this.addCommand('cat', (args) => {
            if (!args[0]) {
                return 'cat: missing file operand';
            }
            
            const fileContents = {
                'model.py': `import torch\nimport torch.nn as nn\n\nclass AIModel(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.layer = nn.Linear(10, 1)\n\n    def forward(self, x):\n        return self.layer(x)`,
                'train.py': `from model import AIModel\nimport torch\n\ndef train():\n    model = AIModel()\n    # Training code here\n    print("Training complete!")\n\nif __name__ == "__main__":\n    train()`,
                'config.json': `{\n  "learning_rate": 0.001,\n  "batch_size": 32,\n  "epochs": 100\n}`,
                'README.md': `# AI Terminal Tutorial\n\nWelcome to the AI Terminal Tutorial!\n\n## Getting Started\n\n1. Run \`python train.py\` to start training\n2. Check results with \`ls\`\n3. Edit files with \`nvim\``
            };
            
            return fileContents[args[0]] || `cat: ${args[0]}: No such file or directory`;
        });
        
        this.addCommand('mkdir', (args) => {
            if (!args[0]) {
                return 'mkdir: missing operand';
            }
            return `mkdir: created directory '${args[0]}'`;
        });
        
        this.addCommand('touch', (args) => {
            if (!args[0]) {
                return 'touch: missing file operand';
            }
            return `touch: created file '${args[0]}'`;
        });
        
        this.addCommand('rm', (args) => {
            if (!args[0]) {
                return 'rm: missing operand';
            }
            return `rm: removed '${args[0]}'`;
        });
        
        this.addCommand('python', (args) => {
            if (!args[0]) {
                return 'Python 3.9.2 (default, Feb 28 2021, 17:03:44)\n[GCC 10.2.1] on linux\nType "help", "copyright", "credits" or "license" for more information.\n>>>';
            }
            
            const outputs = {
                'train.py': 'Training complete!\nModel saved to model.pth',
                'model.py': 'Model architecture loaded successfully',
                '-c "print(\'Hello World\')"': 'Hello World',
                '--version': 'Python 3.9.2'
            };
            
            const argStr = args.join(' ');
            return outputs[argStr] || `python: can't open file '${args[0]}': [Errno 2] No such file or directory`;
        });
        
        this.addCommand('git', (args) => {
            if (!args[0]) {
                return 'usage: git [--version] [--help] [-C <path>] [-c <name>=<value>]\n           [--exec-path[=<path>]] [--html-path] [--man-path] [--info-path]\n           [-p | --paginate | -P | --no-pager] [--no-replace-objects] [--bare]\n           [--git-dir=<path>] [--work-tree=<path>] [--namespace=<name>]\n           <command> [<args>]';
            }
            
            const gitCommands = {
                'status': 'On branch main\nnothing to commit, working tree clean',
                'log --oneline': '1a2b3c4 Initial commit\n5d6e7f8 Add model architecture\n9g0h1i2 Update training script',
                'branch': '* main\n  development\n  feature/new-model',
                'remote -v': 'origin\thttps://github.com/user/ai-project.git (fetch)\norigin\thttps://github.com/user/ai-project.git (push)'
            };
            
            const argStr = args.join(' ');
            return gitCommands[argStr] || `git: '${args[0]}' is not a git command. See 'git --help'.`;
        });
        
        this.addCommand('tmux', (args) => {
            if (!args[0]) {
                return 'usage: tmux [-2Cluv] [-c shell-command] [-f file] [-L socket-name]\n            [-S socket-path] [command [flags]]';
            }
            
            const tmuxCommands = {
                'ls': 'ai-dev: 3 windows (created Mon Jan 15 10:30:00 2024)',
                'list-sessions': 'ai-dev: 3 windows (created Mon Jan 15 10:30:00 2024)',
                'new-session -d -s training': 'Created session: training',
                'attach -t ai-dev': 'Attaching to session ai-dev...',
                'kill-session -t training': 'Session training killed'
            };
            
            const argStr = args.join(' ');
            return tmuxCommands[argStr] || `tmux: ${args[0]}: command not found`;
        });
        
        this.addCommand('nvim', (args) => {
            const file = args[0] || 'untitled';
            return `Opening ${file} in Neovim...\n\n~ VIM - Vi IMproved ~\n~ version 0.6.1 ~\n~ by Bram Moolenaar et al. ~\n\n[Press 'i' to enter insert mode, ':q' to quit]\n\n(Simulated - this would open the actual editor)`;
        });
    }
    
    addCommand(name, handler) {
        this.commands.set(name, handler);
    }
    
    executeCommand() {
        const command = this.input.value.trim();
        if (!command) return;
        
        // Don't add duplicate consecutive commands to history
        if (this.history[this.history.length - 1] !== command) {
            this.history.push(command);
        }
        this.historyIndex = this.history.length;
        
        this.addToOutput(`${this.getPrompt()}${command}`, 'command');
        
        const [cmd, ...args] = command.split(' ');
        const handler = this.commands.get(cmd);
        
        if (handler) {
            try {
                const result = handler(args);
                if (result) {
                    // Handle colored output (basic ANSI color support)
                    const coloredResult = this.processColorCodes(result);
                    this.addToOutput(coloredResult, 'output');
                }
            } catch (error) {
                this.addToOutput(`Error executing command: ${error.message}`, 'error');
            }
        } else {
            // Check for aliases or suggest similar commands
            const suggestion = this.getSuggestion(cmd);
            let errorMsg = `Command not found: ${cmd}`;
            if (suggestion) {
                errorMsg += `\nDid you mean: ${suggestion}?`;
            }
            this.addToOutput(errorMsg, 'error');
        }
        
        this.input.value = '';
        this.updatePrompt();
        
        // Check lesson progress
        if (this.currentLesson) {
            this.checkLessonProgress(command);
        }
    }
    
    processColorCodes(text) {
        // Basic ANSI color code processing
        return text
            .replace(/\x1b\[34m(.*?)\x1b\[0m/g, '<span style="color: #2196f3;">$1</span>')
            .replace(/\x1b\[32m(.*?)\x1b\[0m/g, '<span style="color: #4caf50;">$1</span>')
            .replace(/\x1b\[31m(.*?)\x1b\[0m/g, '<span style="color: #f44336;">$1</span>')
            .replace(/\x1b\[33m(.*?)\x1b\[0m/g, '<span style="color: #ffeb3b;">$1</span>');
    }
    
    getSuggestion(cmd) {
        const commands = Array.from(this.commands.keys());
        
        // Simple Levenshtein distance for suggestions
        let bestMatch = null;
        let bestDistance = Infinity;
        
        commands.forEach(command => {
            const distance = this.levenshteinDistance(cmd, command);
            if (distance < bestDistance && distance <= 2) {
                bestDistance = distance;
                bestMatch = command;
            }
        });
        
        return bestMatch;
    }
    
    levenshteinDistance(a, b) {
        const matrix = [];
        
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[b.length][a.length];
    }
    
    addToOutput(text, type = 'output') {
        const div = document.createElement('div');
        div.className = `terminal-line terminal-${type}`;
        
        // Handle HTML content for colored output
        if (text.includes('<span')) {
            div.innerHTML = text;
        } else {
            div.textContent = text;
        }
        
        this.output.appendChild(div);
        this.scrollToBottom();
        
        // Add animation for new output
        div.style.opacity = '0';
        div.style.transform = 'translateX(-10px)';
        requestAnimationFrame(() => {
            div.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            div.style.opacity = '1';
            div.style.transform = 'translateX(0)';
        });
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
        const words = input.split(' ');
        const currentWord = words[words.length - 1];
        
        if (words.length === 1) {
            // Command completion
            const commands = Array.from(this.commands.keys());
            const matches = commands.filter(cmd => cmd.startsWith(currentWord));
            
            if (matches.length === 1) {
                this.input.value = matches[0] + ' ';
            } else if (matches.length > 1) {
                this.addToOutput(matches.join('  '), 'output');
                return;
            }
        } else {
            // File/path completion
            const files = ['model.py', 'train.py', 'data/', 'config.json', 'requirements.txt', '.gitignore', 'README.md'];
            const matches = files.filter(file => file.startsWith(currentWord));
            
            if (matches.length === 1) {
                words[words.length - 1] = matches[0];
                this.input.value = words.join(' ');
            } else if (matches.length > 1) {
                this.addToOutput(matches.join('  '), 'output');
                return;
            }
        }
        
        this.input.setSelectionRange(this.input.value.length, this.input.value.length);
        this.updateCursorPosition();
    }
    
    focusInput() {
        this.input.focus();
    }
    
    scrollToBottom() {
        this.container.scrollTop = this.container.scrollHeight;
    }
    
    updateCursorPosition() {
        // Get computed styles from the input element
        const computedStyle = window.getComputedStyle(this.input);
        const inputPaddingLeft = parseInt(computedStyle.paddingLeft) || 0;
        
        if (this.input.value === '') {
            // When input is empty, position cursor at the start (accounting for padding)
            this.cursor.style.left = inputPaddingLeft + 'px';
            return;
        }
        
        // Create a temporary span to measure text width
        const tempSpan = document.createElement('span');
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.position = 'absolute';
        tempSpan.style.whiteSpace = 'pre';
        
        // Copy all computed styles from the input element
        tempSpan.style.fontFamily = computedStyle.fontFamily;
        tempSpan.style.fontSize = computedStyle.fontSize;
        tempSpan.style.fontWeight = computedStyle.fontWeight;
        tempSpan.style.letterSpacing = computedStyle.letterSpacing;
        
        // Get text up to cursor position
        tempSpan.textContent = this.input.value.substring(0, this.input.selectionStart);
        
        this.input.parentElement.appendChild(tempSpan);
        const textWidth = tempSpan.offsetWidth;
        this.input.parentElement.removeChild(tempSpan);
        
        // Position the cursor accounting for input padding
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
    
    // Enhanced utility methods
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
        this.addToOutput('Terminal reset. Type "help" for available commands.', 'success');
    }
    
    exportHistory() {
        const historyData = {
            commands: this.history,
            timestamp: new Date().toISOString(),
            user: this.options.user,
            host: this.options.host
        };
        
        const blob = new Blob([JSON.stringify(historyData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `terminal-history-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    importHistory(historyData) {
        try {
            const data = typeof historyData === 'string' ? JSON.parse(historyData) : historyData;
            this.history = data.commands || [];
            this.historyIndex = this.history.length;
            this.addToOutput('Command history imported successfully.', 'success');
        } catch (error) {
            this.addToOutput('Failed to import history: Invalid format.', 'error');
        }
    }
    
    saveSession() {
        const sessionData = {
            history: this.history,
            output: this.output.innerHTML,
            currentPath: this.options.path,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('terminal-session', JSON.stringify(sessionData));
        this.addToOutput('Session saved.', 'success');
    }
    
    loadSession() {
        try {
            const sessionData = JSON.parse(localStorage.getItem('terminal-session'));
            if (sessionData) {
                this.history = sessionData.history || [];
                this.output.innerHTML = sessionData.output || '';
                this.options.path = sessionData.currentPath || '~';
                this.updatePrompt();
                this.addToOutput('Session restored.', 'success');
            } else {
                this.addToOutput('No saved session found.', 'warning');
            }
        } catch (error) {
            this.addToOutput('Failed to load session.', 'error');
        }
    }
}

// Export for use in lessons
window.TerminalSimulator = TerminalSimulator;

// Enhanced terminal with AI-specific commands
class AITerminalSimulator extends TerminalSimulator {
    constructor(containerId, options = {}) {
        super(containerId, options);
        this.setupAICommands();
    }
    
    setupAICommands() {
        this.addCommand('tensorboard', (args) => {
            if (args[0] === '--logdir') {
                return `TensorBoard 2.8.0 at http://localhost:6006/ (Press CTRL+C to quit)`;
            }
            return 'usage: tensorboard --logdir=<directory>';
        });
        
        this.addCommand('wandb', (args) => {
            const wandbCommands = {
                'login': 'Successfully logged in to Weights & Biases!',
                'init': 'Initialized W&B project: ai-tutorial',
                'status': 'Logged in as: ai-developer\nCurrent project: ai-tutorial'
            };
            
            return wandbCommands[args[0]] || 'wandb: command not found. Run "wandb --help" for usage.';
        });
        
        this.addCommand('jupyter', (args) => {
            if (args[0] === 'notebook') {
                return 'Starting Jupyter Notebook server...\n[I 10:30:00.123 NotebookApp] Serving notebooks from /current/directory\n[I 10:30:00.123 NotebookApp] The Jupyter Notebook is running at:\n[I 10:30:00.123 NotebookApp] http://localhost:8888/';
            } else if (args[0] === 'lab') {
                return 'Starting JupyterLab server...\n[I 10:30:00.123 ServerApp] jupyterlab | extension was successfully loaded.\n[I 10:30:00.123 ServerApp] http://localhost:8888/lab';
            }
            return 'usage: jupyter {notebook|lab|console}';
        });
        
        this.addCommand('conda', (args) => {
            const condaCommands = {
                'list': 'numpy                     1.21.0\npandas                    1.3.0\npytorch                   1.9.0\nscikit-learn              0.24.2',
                'info': 'Active environment: ai-env\nPython version: 3.9.2',
                'env list': '# conda environments:\nbase                  /opt/conda\nai-env              * /opt/conda/envs/ai-env'
            };
            
            const argStr = args.join(' ');
            return condaCommands[argStr] || 'usage: conda {list|info|env}';
        });
        
        this.addCommand('pip', (args) => {
            if (args[0] === 'list') {
                return 'Package           Version\n-----------       -------\nnumpy             1.21.0\npandas            1.3.0\ntorch             1.9.0\nscikit-learn      0.24.2';
            } else if (args[0] === 'install' && args[1]) {
                return `Installing ${args[1]}...\nSuccessfully installed ${args[1]}`;
            }
            return 'usage: pip {list|install|show} [package]';
        });
        
        this.addCommand('nvidia-smi', () => {
            return `+-----------------------------------------------------------------------------+
| NVIDIA-SMI 470.57.02    Driver Version: 470.57.02    CUDA Version: 11.4     |
|-------------------------------+----------------------+----------------------+
| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
|                               |                      |               MIG M. |
|===============================+======================+======================|
|   0  Tesla V100-SXM2...  Off  | 00000000:00:04.0 Off |                    0 |
| N/A   32C    P0    41W / 300W |   1024MiB / 16160MiB |      2%      Default |
|                               |                      |                  N/A |
+-------------------------------+----------------------+----------------------+`;
        });
        
        this.addCommand('htop', () => {
            return 'htop - 10:30:45 up 1 day,  3:45,  1 user,  load average: 0.15, 0.20, 0.25\nTasks: 125 total,   1 running, 124 sleeping,   0 stopped,   0 zombie\n%Cpu(s):  2.3 us,  1.2 sy,  0.0 ni, 96.4 id,  0.1 wa,  0.0 hi,  0.0 si,  0.0 st\nMiB Mem :  16384.0 total,  12543.2 free,   2456.8 used,   1384.0 buff/cache\n\n  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND\n 1234 user      20   0 2547892 345678  12345 S   5.2   2.1   0:23.45 python train.py';
        });
    }
}

window.AITerminalSimulator = AITerminalSimulator;