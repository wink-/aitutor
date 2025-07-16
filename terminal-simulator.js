/**
 * Terminal Simulator Component
 * A vanilla ES6 JavaScript terminal emulator for educational purposes
 */

class TerminalSimulator {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      prompt: '$ ',
      welcomeMessage: 'Welcome to Terminal Simulator\nType "help" for available commands\n',
      ...options
    };
    
    this.currentDirectory = '/home/user';
    this.fileSystem = {
      '/': {
        type: 'directory',
        children: ['home', 'etc', 'var']
      },
      '/home': {
        type: 'directory',
        children: ['user']
      },
      '/home/user': {
        type: 'directory',
        children: ['documents', 'projects', 'readme.txt']
      },
      '/home/user/documents': {
        type: 'directory',
        children: ['file1.txt', 'file2.txt']
      },
      '/home/user/projects': {
        type: 'directory',
        children: ['project1', 'project2']
      },
      '/home/user/readme.txt': {
        type: 'file',
        content: 'Welcome to the terminal simulator!'
      }
    };
    
    this.commandHistory = [];
    this.historyIndex = -1;
    this.currentInput = '';
    
    // Lesson tracking
    this.currentLesson = null;
    this.lessonStep = 0;
    this.completedCommands = [];
    
    this.init();
  }
  
  init() {
    this.createTerminalStructure();
    this.bindEvents();
    this.displayWelcomeMessage();
    this.createNewLine();
  }
  
  createTerminalStructure() {
    this.container.innerHTML = `
      <div class="terminal-header">
        <div class="terminal-buttons">
          <span class="terminal-button terminal-button-red"></span>
          <span class="terminal-button terminal-button-yellow"></span>
          <span class="terminal-button terminal-button-green"></span>
        </div>
        <div class="terminal-title">Terminal</div>
      </div>
      <div class="terminal-body">
        <div class="terminal-output"></div>
        <div class="terminal-input-line">
          <span class="terminal-prompt">${this.options.prompt}</span>
          <input type="text" class="terminal-input" autocomplete="off" spellcheck="false">
          <span class="terminal-cursor"></span>
        </div>
      </div>
    `;
    
    this.output = this.container.querySelector('.terminal-output');
    this.inputLine = this.container.querySelector('.terminal-input-line');
    this.input = this.container.querySelector('.terminal-input');
    this.prompt = this.container.querySelector('.terminal-prompt');
    this.cursor = this.container.querySelector('.terminal-cursor');
  }
  
  bindEvents() {
    this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.input.addEventListener('input', (e) => this.handleInput(e));
    
    // Click anywhere on terminal to focus input
    this.container.addEventListener('click', () => {
      this.input.focus();
    });
    
    // Keep input focused
    this.input.addEventListener('blur', () => {
      setTimeout(() => this.input.focus(), 0);
    });
    
    this.input.focus();
  }
  
  handleKeyDown(e) {
    switch(e.key) {
      case 'Enter':
        e.preventDefault();
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
        this.autocomplete();
        break;
    }
  }
  
  handleInput(e) {
    this.currentInput = e.target.value;
    this.updateCursorPosition();
  }
  
  updateCursorPosition() {
    const inputWidth = this.getTextWidth(this.currentInput, getComputedStyle(this.input).font);
    this.cursor.style.left = inputWidth + 'px';
  }
  
  getTextWidth(text, font) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;
    return context.measureText(text).width;
  }
  
  navigateHistory(direction) {
    if (direction === -1 && this.historyIndex < this.commandHistory.length - 1) {
      this.historyIndex++;
    } else if (direction === 1 && this.historyIndex > -1) {
      this.historyIndex--;
    }
    
    if (this.historyIndex === -1) {
      this.input.value = '';
    } else {
      this.input.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex];
    }
    
    this.currentInput = this.input.value;
    this.updateCursorPosition();
  }
  
  executeCommand() {
    const command = this.input.value.trim();
    
    if (command) {
      this.commandHistory.push(command);
      this.historyIndex = -1;
    }
    
    // Display the command
    this.addOutput(`${this.options.prompt}${command}`, 'command');
    
    // Process the command
    if (command) {
      this.processCommand(command);
      
      // Track for lessons
      if (this.currentLesson) {
        this.checkLessonProgress(command);
      }
    }
    
    // Clear input and create new line
    this.input.value = '';
    this.currentInput = '';
    this.createNewLine();
  }
  
  processCommand(command) {
    const [cmd, ...args] = command.split(' ');
    
    switch(cmd) {
      case 'help':
        this.showHelp();
        break;
      case 'ls':
        this.listDirectory(args);
        break;
      case 'cd':
        this.changeDirectory(args[0]);
        break;
      case 'pwd':
        this.printWorkingDirectory();
        break;
      case 'echo':
        this.echo(args.join(' '));
        break;
      case 'clear':
        this.clear();
        break;
      case 'cat':
        this.catFile(args[0]);
        break;
      case 'mkdir':
        this.makeDirectory(args[0]);
        break;
      case 'touch':
        this.createFile(args[0]);
        break;
      case 'rm':
        this.removeFile(args[0]);
        break;
      case 'whoami':
        this.addOutput('user');
        break;
      case 'date':
        this.addOutput(new Date().toString());
        break;
      default:
        this.addOutput(`Command not found: ${cmd}`, 'error');
    }
  }
  
  showHelp() {
    const helpText = `
Available commands:
  help     - Show this help message
  ls       - List directory contents
  cd       - Change directory
  pwd      - Print working directory
  echo     - Display a message
  clear    - Clear the terminal
  cat      - Display file contents
  mkdir    - Create a directory
  touch    - Create a file
  rm       - Remove a file
  whoami   - Display current user
  date     - Display current date
    `;
    this.addOutput(helpText);
  }
  
  listDirectory(args) {
    const showHidden = args.includes('-a');
    const longFormat = args.includes('-l');
    
    const currentDir = this.fileSystem[this.currentDirectory];
    if (!currentDir || currentDir.type !== 'directory') {
      this.addOutput('Error: Current directory not found', 'error');
      return;
    }
    
    let items = currentDir.children || [];
    
    if (!showHidden) {
      items = items.filter(item => !item.startsWith('.'));
    }
    
    if (longFormat) {
      items.forEach(item => {
        const fullPath = this.resolvePath(item);
        const fileInfo = this.fileSystem[fullPath];
        const type = fileInfo && fileInfo.type === 'directory' ? 'd' : '-';
        const permissions = type === 'd' ? 'drwxr-xr-x' : '-rw-r--r--';
        const date = new Date().toLocaleDateString();
        this.addOutput(`${permissions} 1 user user 4096 ${date} ${item}`);
      });
    } else {
      const formattedItems = items.map(item => {
        const fullPath = this.resolvePath(item);
        const fileInfo = this.fileSystem[fullPath];
        if (fileInfo && fileInfo.type === 'directory') {
          return `<span class="directory">${item}/</span>`;
        }
        return item;
      });
      this.addOutput(formattedItems.join('  '));
    }
  }
  
  changeDirectory(path) {
    if (!path) {
      this.currentDirectory = '/home/user';
      return;
    }
    
    let newPath;
    if (path === '..') {
      const parts = this.currentDirectory.split('/').filter(p => p);
      parts.pop();
      newPath = '/' + parts.join('/');
      if (newPath === '/') {
        newPath = '/';
      }
    } else if (path.startsWith('/')) {
      newPath = path;
    } else {
      newPath = this.resolvePath(path);
    }
    
    if (this.fileSystem[newPath] && this.fileSystem[newPath].type === 'directory') {
      this.currentDirectory = newPath;
    } else {
      this.addOutput(`cd: ${path}: No such file or directory`, 'error');
    }
  }
  
  printWorkingDirectory() {
    this.addOutput(this.currentDirectory);
  }
  
  echo(message) {
    this.addOutput(message);
  }
  
  clear() {
    this.output.innerHTML = '';
  }
  
  catFile(filename) {
    if (!filename) {
      this.addOutput('cat: missing file operand', 'error');
      return;
    }
    
    const fullPath = this.resolvePath(filename);
    const file = this.fileSystem[fullPath];
    
    if (!file) {
      this.addOutput(`cat: ${filename}: No such file or directory`, 'error');
    } else if (file.type === 'directory') {
      this.addOutput(`cat: ${filename}: Is a directory`, 'error');
    } else {
      this.addOutput(file.content || '');
    }
  }
  
  makeDirectory(dirname) {
    if (!dirname) {
      this.addOutput('mkdir: missing operand', 'error');
      return;
    }
    
    const fullPath = this.resolvePath(dirname);
    
    if (this.fileSystem[fullPath]) {
      this.addOutput(`mkdir: cannot create directory '${dirname}': File exists`, 'error');
      return;
    }
    
    this.fileSystem[fullPath] = {
      type: 'directory',
      children: []
    };
    
    // Add to parent directory
    const parentPath = this.currentDirectory;
    if (this.fileSystem[parentPath]) {
      this.fileSystem[parentPath].children.push(dirname);
    }
  }
  
  createFile(filename) {
    if (!filename) {
      this.addOutput('touch: missing file operand', 'error');
      return;
    }
    
    const fullPath = this.resolvePath(filename);
    
    if (!this.fileSystem[fullPath]) {
      this.fileSystem[fullPath] = {
        type: 'file',
        content: ''
      };
      
      // Add to parent directory
      const parentPath = this.currentDirectory;
      if (this.fileSystem[parentPath]) {
        this.fileSystem[parentPath].children.push(filename);
      }
    }
  }
  
  removeFile(filename) {
    if (!filename) {
      this.addOutput('rm: missing operand', 'error');
      return;
    }
    
    const fullPath = this.resolvePath(filename);
    const file = this.fileSystem[fullPath];
    
    if (!file) {
      this.addOutput(`rm: cannot remove '${filename}': No such file or directory`, 'error');
      return;
    }
    
    if (file.type === 'directory') {
      this.addOutput(`rm: cannot remove '${filename}': Is a directory`, 'error');
      return;
    }
    
    // Remove from filesystem
    delete this.fileSystem[fullPath];
    
    // Remove from parent directory
    const parentPath = this.currentDirectory;
    if (this.fileSystem[parentPath]) {
      this.fileSystem[parentPath].children = 
        this.fileSystem[parentPath].children.filter(child => child !== filename);
    }
  }
  
  resolvePath(path) {
    if (path.startsWith('/')) {
      return path;
    }
    
    if (this.currentDirectory === '/') {
      return '/' + path;
    }
    
    return this.currentDirectory + '/' + path;
  }
  
  autocomplete() {
    const parts = this.currentInput.split(' ');
    const lastPart = parts[parts.length - 1];
    
    if (parts.length === 1) {
      // Autocomplete commands
      const commands = ['help', 'ls', 'cd', 'pwd', 'echo', 'clear', 'cat', 'mkdir', 'touch', 'rm', 'whoami', 'date'];
      const matches = commands.filter(cmd => cmd.startsWith(lastPart));
      
      if (matches.length === 1) {
        this.input.value = matches[0] + ' ';
        this.currentInput = this.input.value;
        this.updateCursorPosition();
      } else if (matches.length > 1) {
        this.addOutput(matches.join('  '));
        this.createNewLine();
        this.input.value = this.currentInput;
        this.updateCursorPosition();
      }
    } else {
      // Autocomplete file/directory names
      const currentDir = this.fileSystem[this.currentDirectory];
      if (currentDir && currentDir.children) {
        const matches = currentDir.children.filter(child => child.startsWith(lastPart));
        
        if (matches.length === 1) {
          parts[parts.length - 1] = matches[0];
          this.input.value = parts.join(' ');
          this.currentInput = this.input.value;
          this.updateCursorPosition();
        } else if (matches.length > 1) {
          this.addOutput(matches.join('  '));
          this.createNewLine();
          this.input.value = this.currentInput;
          this.updateCursorPosition();
        }
      }
    }
  }
  
  addOutput(text, className = '') {
    const outputLine = document.createElement('div');
    outputLine.className = 'terminal-output-line';
    if (className) {
      outputLine.classList.add(className);
    }
    
    // Handle HTML in output
    if (text.includes('<span')) {
      outputLine.innerHTML = text;
    } else {
      outputLine.textContent = text;
    }
    
    this.output.appendChild(outputLine);
    this.scrollToBottom();
  }
  
  createNewLine() {
    this.prompt.textContent = this.options.prompt;
    this.scrollToBottom();
  }
  
  displayWelcomeMessage() {
    if (this.options.welcomeMessage) {
      this.addOutput(this.options.welcomeMessage);
    }
  }
  
  scrollToBottom() {
    const terminalBody = this.container.querySelector('.terminal-body');
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }
  
  // Lesson functionality
  loadLesson(lesson) {
    this.currentLesson = lesson;
    this.lessonStep = 0;
    this.completedCommands = [];
    
    this.clear();
    this.addOutput(`\n=== ${lesson.title} ===\n`, 'lesson-title');
    this.addOutput(lesson.description + '\n');
    this.showNextStep();
  }
  
  showNextStep() {
    if (!this.currentLesson || this.lessonStep >= this.currentLesson.steps.length) {
      this.completeLesson();
      return;
    }
    
    const step = this.currentLesson.steps[this.lessonStep];
    this.addOutput(`\nStep ${this.lessonStep + 1}: ${step.instruction}`, 'lesson-step');
    
    if (step.hint) {
      this.addOutput(`Hint: ${step.hint}`, 'lesson-hint');
    }
    
    if (step.expectedCommand) {
      this.addOutput(`Expected command: ${step.expectedCommand}`, 'lesson-expected');
    }
  }
  
  checkLessonProgress(command) {
    if (!this.currentLesson || this.lessonStep >= this.currentLesson.steps.length) {
      return;
    }
    
    const step = this.currentLesson.steps[this.lessonStep];
    
    // Check if command matches expected
    if (step.expectedCommand && command === step.expectedCommand) {
      this.addOutput('\n✓ Correct! Moving to next step...', 'lesson-success');
      this.completedCommands.push(command);
      this.lessonStep++;
      
      setTimeout(() => {
        this.showNextStep();
      }, 1000);
    } else if (step.validation && step.validation(command, this)) {
      this.addOutput('\n✓ Correct! Moving to next step...', 'lesson-success');
      this.completedCommands.push(command);
      this.lessonStep++;
      
      setTimeout(() => {
        this.showNextStep();
      }, 1000);
    } else {
      this.addOutput('\n✗ Not quite right. Try again!', 'lesson-error');
      
      if (step.hint) {
        this.addOutput(`Hint: ${step.hint}`, 'lesson-hint');
      }
    }
  }
  
  completeLesson() {
    this.addOutput('\n🎉 Congratulations! You completed the lesson!', 'lesson-complete');
    this.addOutput(`Commands learned: ${this.completedCommands.join(', ')}`, 'lesson-summary');
    
    if (this.options.onLessonComplete) {
      this.options.onLessonComplete(this.currentLesson, this.completedCommands);
    }
    
    this.currentLesson = null;
    this.lessonStep = 0;
  }
  
  // API methods
  setPrompt(prompt) {
    this.options.prompt = prompt;
    this.prompt.textContent = prompt;
  }
  
  setDirectory(directory) {
    this.currentDirectory = directory;
  }
  
  addCustomCommand(name, handler) {
    this.customCommands = this.customCommands || {};
    this.customCommands[name] = handler;
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TerminalSimulator;
}