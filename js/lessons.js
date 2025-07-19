// Comprehensive lesson system for AI Terminal Tutor
class LessonSystem {
    constructor() {
        this.lessons = this.initializeLessons();
        this.currentLessonId = null;
        this.progress = this.loadProgress();
    }

    initializeLessons() {
        return {
            // Foundation Lessons (4 lessons)
            'zsh-basics': {
                id: 'zsh-basics',
                title: 'Zsh and Oh-My-Zsh Setup',
                category: 'Foundation',
                difficulty: 'beginner',
                duration: '2-3 hours',
                prerequisites: [],
                description: 'Install and configure zsh with oh-my-zsh for enhanced shell experience with powerful plugins',
                objectives: [
                    'Install and configure zsh as default shell',
                    'Set up oh-my-zsh with essential themes and plugins',
                    'Configure git, python, and docker plugins',
                    'Customize prompt and aliases'
                ],
                steps: [
                    {
                        instruction: "Let's start by checking your current shell. Use 'echo $SHELL' to see what shell you're using.",
                        expectedCommand: "echo $SHELL",
                        hint: "Type 'echo $SHELL' and press Enter"
                    },
                    {
                        instruction: "Good! Now let's check if zsh is installed. Use 'zsh --version' to check.",
                        expectedCommand: "zsh --version",
                        hint: "Type 'zsh --version'"
                    },
                    {
                        instruction: "Let's see what themes are available. Use 'ls ~/.oh-my-zsh/themes' to list themes.",
                        expectedCommand: "ls ~/.oh-my-zsh/themes",
                        hint: "Type 'ls ~/.oh-my-zsh/themes'"
                    },
                    {
                        instruction: "Let's check your current zsh configuration. Use 'cat ~/.zshrc | head -20' to see the first 20 lines.",
                        expectedCommand: "cat ~/.zshrc | head -20",
                        hint: "Type 'cat ~/.zshrc | head -20'"
                    }
                ],
                files: [
                    { name: '.zshrc', content: 'Basic zsh configuration file' },
                    { name: 'install-zsh.sh', content: 'Installation script for zsh and oh-my-zsh' }
                ]
            },

            'tmux-basics': {
                id: 'tmux-basics',
                title: 'Tmux Fundamentals',
                category: 'Foundation',
                difficulty: 'beginner',
                duration: '3-4 hours',
                prerequisites: ['zsh-basics'],
                description: 'Master terminal multiplexing with tmux for managing multiple sessions, windows, and panes',
                objectives: [
                    'Understand tmux concepts: sessions, windows, panes',
                    'Learn essential keybindings for navigation',
                    'Configure tmux for optimal workflow',
                    'Create and manage multiple sessions'
                ],
                steps: [
                    {
                        instruction: "Let's start a new tmux session. Use 'tmux new-session -s learning' to create a session named 'learning'.",
                        expectedCommand: "tmux new-session -s learning",
                        hint: "Type 'tmux new-session -s learning'"
                    },
                    {
                        instruction: "List all tmux sessions. Use 'tmux list-sessions' to see active sessions.",
                        expectedCommand: "tmux list-sessions",
                        hint: "Type 'tmux list-sessions' or 'tmux ls'"
                    },
                    {
                        instruction: "Let's check if we're inside a tmux session. Use 'echo $TMUX' to check.",
                        expectedCommand: "echo $TMUX",
                        hint: "Type 'echo $TMUX'"
                    },
                    {
                        instruction: "Create a new window in tmux. Use 'tmux new-window -n editor' to create a window named 'editor'.",
                        expectedCommand: "tmux new-window -n editor",
                        hint: "Type 'tmux new-window -n editor'"
                    }
                ]
            },

            'cli-tools': {
                id: 'cli-tools',
                title: 'Essential CLI Tools',
                category: 'Foundation',
                difficulty: 'beginner',
                duration: '2-3 hours',
                prerequisites: ['zsh-basics'],
                description: 'Install and master core CLI tools: ripgrep, fd, fzf for lightning-fast file operations',
                objectives: [
                    'Install ripgrep, fd, and fzf',
                    'Learn advanced search patterns with ripgrep',
                    'Use fd for fast file finding',
                    'Master fzf for fuzzy finding'
                ],
                steps: [
                    {
                        instruction: "Let's search for Python files using ripgrep. Use 'rg --type py \"def.*main\"' to find main functions.",
                        expectedCommand: "rg --type py \"def.*main\"",
                        hint: "Type 'rg --type py \"def.*main\"'"
                    },
                    {
                        instruction: "Now let's use fd to find all Python files. Use 'fd -e py' to find files with .py extension.",
                        expectedCommand: "fd -e py",
                        hint: "Type 'fd -e py'"
                    },
                    {
                        instruction: "Let's use fzf to interactively search files. Use 'ls | fzf' to open fuzzy finder.",
                        expectedCommand: "ls | fzf",
                        hint: "Type 'ls | fzf'"
                    },
                    {
                        instruction: "Combine tools! Use 'fd -e py | fzf' to fuzzy-find Python files.",
                        expectedCommand: "fd -e py | fzf",
                        hint: "Type 'fd -e py | fzf'"
                    }
                ]
            },

            'ssh-remote': {
                id: 'ssh-remote',
                title: 'SSH and Remote Development',
                category: 'Foundation',
                difficulty: 'intermediate',
                duration: '3-4 hours',
                prerequisites: ['tmux-basics'],
                description: 'Set up secure SSH connections and efficient remote development workflows for cloud GPU access',
                objectives: [
                    'Configure SSH keys and secure connections',
                    'Set up SSH config for easy server access',
                    'Use tmux for persistent remote sessions',
                    'Transfer files with scp and rsync'
                ],
                steps: [
                    {
                        instruction: "Check if you have SSH keys. Use 'ls ~/.ssh' to see your SSH directory.",
                        expectedCommand: "ls ~/.ssh",
                        hint: "Type 'ls ~/.ssh'"
                    },
                    {
                        instruction: "Let's look at SSH config structure. Use 'cat ~/.ssh/config' to see your SSH configuration.",
                        expectedCommand: "cat ~/.ssh/config",
                        hint: "Type 'cat ~/.ssh/config'"
                    },
                    {
                        instruction: "Test SSH key agent. Use 'ssh-add -l' to list loaded keys.",
                        expectedCommand: "ssh-add -l",
                        hint: "Type 'ssh-add -l'"
                    },
                    {
                        instruction: "Practice with a mock connection. Use 'ssh -T git@github.com' to test GitHub SSH.",
                        expectedCommand: "ssh -T git@github.com",
                        hint: "Type 'ssh -T git@github.com'"
                    }
                ]
            },

            // Editor Transition Lessons (6 lessons)
            'neovim-install': {
                id: 'neovim-install',
                title: 'Neovim Installation and Basic Configuration',
                category: 'Editor Transition',
                difficulty: 'beginner',
                duration: '2-3 hours',
                prerequisites: ['cli-tools'],
                description: 'Install Neovim and set up a modern configuration using kickstart.nvim or LazyVim',
                objectives: [
                    'Install Neovim and understand version requirements',
                    'Choose and install a Neovim distribution',
                    'Understand Lua configuration basics',
                    'Set up basic key mappings'
                ],
                steps: [
                    {
                        instruction: "Check if Neovim is installed. Use 'nvim --version' to check version.",
                        expectedCommand: "nvim --version",
                        hint: "Type 'nvim --version'"
                    },
                    {
                        instruction: "Let's check Neovim configuration location. Use 'echo $XDG_CONFIG_HOME' or check ~/.config/nvim.",
                        expectedCommand: "ls ~/.config/nvim",
                        hint: "Type 'ls ~/.config/nvim'"
                    },
                    {
                        instruction: "Let's look at a basic init.lua file. Use 'cat ~/.config/nvim/init.lua | head -10'.",
                        expectedCommand: "cat ~/.config/nvim/init.lua | head -10",
                        hint: "Type 'cat ~/.config/nvim/init.lua | head -10'"
                    },
                    {
                        instruction: "Start Neovim in the background to test. Use 'nvim --headless +q' to test silently.",
                        expectedCommand: "nvim --headless +q",
                        hint: "Type 'nvim --headless +q'"
                    }
                ]
            },

            'vim-motions': {
                id: 'vim-motions',
                title: 'Vim Motions and Navigation',
                category: 'Editor Transition',
                difficulty: 'beginner',
                duration: '6-8 hours',
                prerequisites: ['neovim-install'],
                description: 'Master essential vim motions and navigation commands for efficient text editing',
                objectives: [
                    'Learn basic movement commands (hjkl, w, b, e)',
                    'Master text objects and operators',
                    'Use search and replace efficiently',
                    'Navigate between files and buffers'
                ],
                steps: [
                    {
                        instruction: "Let's practice vim commands in a safe way. Use 'vimtutor' to start the tutorial.",
                        expectedCommand: "vimtutor",
                        hint: "Type 'vimtutor' to start interactive vim tutorial"
                    },
                    {
                        instruction: "Check vim help system. Use 'nvim +\":help motions\" +\":q\"' to see motion help.",
                        expectedCommand: "nvim +\":help motions\" +\":q\"",
                        hint: "Type the full command to view motions help"
                    },
                    {
                        instruction: "Practice with a test file. Use 'echo \"hello world\" > practice.txt' to create a practice file.",
                        expectedCommand: "echo \"hello world\" > practice.txt",
                        hint: "Type 'echo \"hello world\" > practice.txt'"
                    },
                    {
                        instruction: "Open the file in Neovim. Use 'nvim practice.txt' (we'll simulate this).",
                        expectedCommand: "nvim practice.txt",
                        hint: "Type 'nvim practice.txt'"
                    }
                ]
            },

            'lsp-setup': {
                id: 'lsp-setup',
                title: 'Language Server Protocol (LSP) Setup',
                category: 'Editor Transition',
                difficulty: 'intermediate',
                duration: '3-4 hours',
                prerequisites: ['vim-motions'],
                description: 'Configure LSP for Python, TypeScript, and other languages to get IDE-like features',
                objectives: [
                    'Understand what LSP provides',
                    'Install language servers for Python and TypeScript',
                    'Configure LSP keybindings and features',
                    'Set up diagnostic display and formatting'
                ],
                steps: [
                    {
                        instruction: "Check if pyright (Python LSP) is available. Use 'which pyright' to check.",
                        expectedCommand: "which pyright",
                        hint: "Type 'which pyright'"
                    },
                    {
                        instruction: "Check for TypeScript language server. Use 'which typescript-language-server'.",
                        expectedCommand: "which typescript-language-server",
                        hint: "Type 'which typescript-language-server'"
                    },
                    {
                        instruction: "List installed npm packages globally. Use 'npm list -g --depth=0' to see global packages.",
                        expectedCommand: "npm list -g --depth=0",
                        hint: "Type 'npm list -g --depth=0'"
                    },
                    {
                        instruction: "Check Python environment. Use 'python3 --version && which python3' to verify Python setup.",
                        expectedCommand: "python3 --version && which python3",
                        hint: "Type 'python3 --version && which python3'"
                    }
                ]
            },

            'neovim-plugins': {
                id: 'neovim-plugins',
                title: 'Essential Neovim Plugins',
                category: 'Editor Transition',
                difficulty: 'intermediate',
                duration: '4-5 hours',
                prerequisites: ['lsp-setup'],
                description: 'Install and configure Telescope, nvim-tree, and git integration plugins',
                objectives: [
                    'Install Telescope for fuzzy finding',
                    'Set up nvim-tree for file exploration',
                    'Configure git integration (fugitive/gitsigns)',
                    'Install and configure completion plugins'
                ],
                steps: [
                    {
                        instruction: "Check Lazy.nvim plugin directory. Use 'ls ~/.local/share/nvim/lazy' to see installed plugins.",
                        expectedCommand: "ls ~/.local/share/nvim/lazy",
                        hint: "Type 'ls ~/.local/share/nvim/lazy'"
                    },
                    {
                        instruction: "Look for Telescope installation. Use 'ls ~/.local/share/nvim/lazy | grep telescope'.",
                        expectedCommand: "ls ~/.local/share/nvim/lazy | grep telescope",
                        hint: "Type 'ls ~/.local/share/nvim/lazy | grep telescope'"
                    },
                    {
                        instruction: "Check git integration. Use 'ls ~/.local/share/nvim/lazy | grep git'.",
                        expectedCommand: "ls ~/.local/share/nvim/lazy | grep git",
                        hint: "Type 'ls ~/.local/share/nvim/lazy | grep git'"
                    },
                    {
                        instruction: "Test ripgrep for Telescope. Use 'rg --version' to ensure it's available.",
                        expectedCommand: "rg --version",
                        hint: "Type 'rg --version'"
                    }
                ]
            },

            'ai-coding-assistants': {
                id: 'ai-coding-assistants',
                title: 'AI Coding Assistants in Neovim',
                category: 'Editor Transition',
                difficulty: 'intermediate',
                duration: '2-3 hours',
                prerequisites: ['neovim-plugins'],
                description: 'Integrate GitHub Copilot or Codeium for AI-powered code completion',
                objectives: [
                    'Choose between Copilot and Codeium',
                    'Install and authenticate AI coding assistant',
                    'Configure AI suggestions and keybindings',
                    'Learn to work effectively with AI suggestions'
                ],
                steps: [
                    {
                        instruction: "Check if Node.js is installed for Copilot. Use 'node --version' to check.",
                        expectedCommand: "node --version",
                        hint: "Type 'node --version'"
                    },
                    {
                        instruction: "Check GitHub CLI for Copilot auth. Use 'gh --version' to verify GitHub CLI.",
                        expectedCommand: "gh --version",
                        hint: "Type 'gh --version'"
                    },
                    {
                        instruction: "Look for Copilot plugin. Use 'ls ~/.local/share/nvim/lazy | grep copilot'.",
                        expectedCommand: "ls ~/.local/share/nvim/lazy | grep copilot",
                        hint: "Type 'ls ~/.local/share/nvim/lazy | grep copilot'"
                    },
                    {
                        instruction: "Test codeium alternative. Use 'curl -fsSL https://codeium.com/profile | grep -o \"[^>]*\"'.",
                        expectedCommand: "curl -fsSL https://codeium.com/profile",
                        hint: "Type 'curl -fsSL https://codeium.com/profile'"
                    }
                ]
            },

            'advanced-neovim': {
                id: 'advanced-neovim',
                title: 'Advanced Neovim Configuration',
                category: 'Editor Transition',
                difficulty: 'advanced',
                duration: '4-6 hours',
                prerequisites: ['ai-coding-assistants'],
                description: 'Customize Neovim for AI development workflows with advanced features and optimizations',
                objectives: [
                    'Create custom functions and commands',
                    'Set up advanced keybindings and leader keys',
                    'Configure for specific AI/ML file types',
                    'Optimize performance for large files'
                ],
                steps: [
                    {
                        instruction: "Check Lua configuration structure. Use 'find ~/.config/nvim -name \"*.lua\" | head -10'.",
                        expectedCommand: "find ~/.config/nvim -name \"*.lua\" | head -10",
                        hint: "Type 'find ~/.config/nvim -name \"*.lua\" | head -10'"
                    },
                    {
                        instruction: "Look at custom keymaps. Use 'grep -r \"vim.keymap\" ~/.config/nvim | head -5'.",
                        expectedCommand: "grep -r \"vim.keymap\" ~/.config/nvim | head -5",
                        hint: "Type 'grep -r \"vim.keymap\" ~/.config/nvim | head -5'"
                    },
                    {
                        instruction: "Check autocmd configurations. Use 'grep -r \"autocmd\" ~/.config/nvim | head -3'.",
                        expectedCommand: "grep -r \"autocmd\" ~/.config/nvim | head -3",
                        hint: "Type 'grep -r \"autocmd\" ~/.config/nvim | head -3'"
                    },
                    {
                        instruction: "Verify Python support. Use 'nvim --headless -c \"echo has(\\'python3\\')\" -c \"q\"'.",
                        expectedCommand: "nvim --headless -c \"echo has('python3')\" -c \"q\"",
                        hint: "Type the command to check Python3 support"
                    }
                ]
            },

            // AI Workflow Tools (4 lessons)
            'tmux-ai-layouts': {
                id: 'tmux-ai-layouts',
                title: 'Tmux Layouts for AI Development',
                category: 'AI Workflow Tools',
                difficulty: 'intermediate',
                duration: '3-4 hours',
                prerequisites: ['tmux-basics', 'neovim-install'],
                description: 'Design optimal tmux layouts for AI development: logs, training, notebooks, and monitoring',
                objectives: [
                    'Create layouts for different AI workflows',
                    'Automate pane creation and arrangement',
                    'Integrate with training and monitoring tools',
                    'Set up session templates for projects'
                ],
                steps: [
                    {
                        instruction: "Create a new tmux session for AI work. Use 'tmux new-session -s ai-dev -d'.",
                        expectedCommand: "tmux new-session -s ai-dev -d",
                        hint: "Type 'tmux new-session -s ai-dev -d'"
                    },
                    {
                        instruction: "Split into panes for different tasks. Use 'tmux split-window -h'.",
                        expectedCommand: "tmux split-window -h",
                        hint: "Type 'tmux split-window -h'"
                    },
                    {
                        instruction: "Create a vertical split for logs. Use 'tmux split-window -v'.",
                        expectedCommand: "tmux split-window -v",
                        hint: "Type 'tmux split-window -v'"
                    },
                    {
                        instruction: "List current tmux layout. Use 'tmux list-windows -F \"#{window_layout}\"'.",
                        expectedCommand: "tmux list-windows -F \"#{window_layout}\"",
                        hint: "Type 'tmux list-windows -F \"#{window_layout}\"'"
                    }
                ]
            },

            'cloud-cli': {
                id: 'cloud-cli',
                title: 'Cloud Platform CLI Tools',
                category: 'AI Workflow Tools',
                difficulty: 'intermediate',
                duration: '4-5 hours',
                prerequisites: ['ssh-remote'],
                description: 'Master AWS/GCP CLI and kubectl for cloud-based AI development and deployment',
                objectives: [
                    'Install and configure AWS/GCP CLI',
                    'Set up kubectl for Kubernetes',
                    'Manage cloud resources from terminal',
                    'Deploy AI models to cloud platforms'
                ],
                steps: [
                    {
                        instruction: "Check AWS CLI installation. Use 'aws --version' to check if AWS CLI is installed.",
                        expectedCommand: "aws --version",
                        hint: "Type 'aws --version'"
                    },
                    {
                        instruction: "Check Google Cloud CLI. Use 'gcloud --version' to check GCP CLI.",
                        expectedCommand: "gcloud --version",
                        hint: "Type 'gcloud --version'"
                    },
                    {
                        instruction: "Check kubectl for Kubernetes. Use 'kubectl version --client' to check kubectl.",
                        expectedCommand: "kubectl version --client",
                        hint: "Type 'kubectl version --client'"
                    },
                    {
                        instruction: "Check Docker CLI for containers. Use 'docker --version' to verify Docker.",
                        expectedCommand: "docker --version",
                        hint: "Type 'docker --version'"
                    }
                ]
            },

            'jupyter-terminal': {
                id: 'jupyter-terminal',
                title: 'Jupyter in the Terminal',
                category: 'AI Workflow Tools',
                difficulty: 'beginner',
                duration: '2-3 hours',
                prerequisites: ['neovim-plugins'],
                description: 'Use Jupyter console and nbterm for notebook-style development in the terminal',
                objectives: [
                    'Set up jupyter console for interactive Python',
                    'Use nbterm for terminal-based notebooks',
                    'Integrate with Neovim for seamless workflow',
                    'Manage kernels and environments'
                ],
                steps: [
                    {
                        instruction: "Check Jupyter installation. Use 'jupyter --version' to see installed components.",
                        expectedCommand: "jupyter --version",
                        hint: "Type 'jupyter --version'"
                    },
                    {
                        instruction: "List available Jupyter kernels. Use 'jupyter kernelspec list' to see kernels.",
                        expectedCommand: "jupyter kernelspec list",
                        hint: "Type 'jupyter kernelspec list'"
                    },
                    {
                        instruction: "Check ipython installation. Use 'ipython --version' to verify IPython.",
                        expectedCommand: "ipython --version",
                        hint: "Type 'ipython --version'"
                    },
                    {
                        instruction: "Test jupyter console startup. Use 'jupyter console --kernel=python3 --no-confirm-exit'.",
                        expectedCommand: "jupyter console --kernel=python3 --no-confirm-exit",
                        hint: "Type 'jupyter console --kernel=python3 --no-confirm-exit'"
                    }
                ]
            },

            'model-monitoring': {
                id: 'model-monitoring',
                title: 'Model Training Monitoring',
                category: 'AI Workflow Tools',
                difficulty: 'intermediate',
                duration: '3-4 hours',
                prerequisites: ['jupyter-terminal'],
                description: 'Set up TensorBoard, Weights & Biases CLI, and GPU monitoring for model training',
                objectives: [
                    'Configure TensorBoard in terminal',
                    'Set up wandb CLI for experiment tracking',
                    'Monitor GPU usage with nvtop',
                    'Set up automated logging and alerts'
                ],
                steps: [
                    {
                        instruction: "Check TensorBoard installation. Use 'tensorboard --version' to verify.",
                        expectedCommand: "tensorboard --version",
                        hint: "Type 'tensorboard --version'"
                    },
                    {
                        instruction: "Check Weights & Biases CLI. Use 'wandb --version' to check wandb.",
                        expectedCommand: "wandb --version",
                        hint: "Type 'wandb --version'"
                    },
                    {
                        instruction: "Check GPU monitoring tools. Use 'nvidia-smi --version' to check NVIDIA tools.",
                        expectedCommand: "nvidia-smi --version",
                        hint: "Type 'nvidia-smi --version'"
                    },
                    {
                        instruction: "Check for htop process monitor. Use 'htop --version' to verify htop.",
                        expectedCommand: "htop --version",
                        hint: "Type 'htop --version'"
                    }
                ]
            },

            // Advanced Integration (5 lessons)
            'automation-scripts': {
                id: 'automation-scripts',
                title: 'Custom Automation Scripts',
                category: 'Advanced Integration',
                difficulty: 'advanced',
                duration: '5-6 hours',
                prerequisites: ['cloud-cli'],
                description: 'Create shell scripts to automate dataset downloads, model deployments, and common tasks',
                objectives: [
                    'Write bash scripts for data pipeline automation',
                    'Create deployment scripts for models',
                    'Automate environment setup and dependencies',
                    'Set up CI/CD workflows'
                ],
                steps: [
                    {
                        instruction: "Check bash scripting environment. Use 'echo $BASH_VERSION' to see bash version.",
                        expectedCommand: "echo $BASH_VERSION",
                        hint: "Type 'echo $BASH_VERSION'"
                    },
                    {
                        instruction: "Create a simple automation script. Use 'echo \"#!/bin/bash\" > automate.sh'.",
                        expectedCommand: "echo \"#!/bin/bash\" > automate.sh",
                        hint: "Type 'echo \"#!/bin/bash\" > automate.sh'"
                    },
                    {
                        instruction: "Make script executable. Use 'chmod +x automate.sh' to add execute permissions.",
                        expectedCommand: "chmod +x automate.sh",
                        hint: "Type 'chmod +x automate.sh'"
                    },
                    {
                        instruction: "Test script execution. Use './automate.sh' to run the script.",
                        expectedCommand: "./automate.sh",
                        hint: "Type './automate.sh'"
                    }
                ]
            },

            'neovim-repl': {
                id: 'neovim-repl',
                title: 'Neovim REPL Integration',
                category: 'Advanced Integration',
                difficulty: 'advanced',
                duration: '4-5 hours',
                prerequisites: ['advanced-neovim', 'jupyter-terminal'],
                description: 'Set up seamless integration between Neovim and terminal REPLs for interactive development',
                objectives: [
                    'Configure plugins for REPL integration',
                    'Send code blocks from Neovim to terminal',
                    'Set up Python, R, and Julia REPLs',
                    'Create custom REPL workflows'
                ],
                steps: [
                    {
                        instruction: "Check for REPL plugins in Neovim. Use 'ls ~/.local/share/nvim/lazy | grep repl'.",
                        expectedCommand: "ls ~/.local/share/nvim/lazy | grep repl",
                        hint: "Type 'ls ~/.local/share/nvim/lazy | grep repl'"
                    },
                    {
                        instruction: "Verify Python REPL availability. Use 'python3 -c \"print(\\'Python REPL ready\\')\"'.",
                        expectedCommand: "python3 -c \"print('Python REPL ready')\"",
                        hint: "Type 'python3 -c \"print(\\'Python REPL ready\\')\"'"
                    },
                    {
                        instruction: "Check tmux for REPL integration. Use 'tmux -V' to verify tmux version.",
                        expectedCommand: "tmux -V",
                        hint: "Type 'tmux -V'"
                    },
                    {
                        instruction: "Test IPython for enhanced REPL. Use 'ipython -c \"print(\\'IPython ready\\')\"'.",
                        expectedCommand: "ipython -c \"print('IPython ready')\"",
                        hint: "Type 'ipython -c \"print(\\'IPython ready\\')\"'"
                    }
                ]
            },

            'tmuxinator-automation': {
                id: 'tmuxinator-automation',
                title: 'Tmuxinator Project Automation',
                category: 'Advanced Integration',
                difficulty: 'advanced',
                duration: '3-4 hours',
                prerequisites: ['tmux-ai-layouts', 'automation-scripts'],
                description: 'Use tmuxinator to create project-specific tmux layouts and automate workspace setup',
                objectives: [
                    'Install and configure tmuxinator',
                    'Create project templates for different workflows',
                    'Automate startup commands and layouts',
                    'Integrate with development tools'
                ],
                steps: [
                    {
                        instruction: "Check tmuxinator installation. Use 'tmuxinator version' to check if installed.",
                        expectedCommand: "tmuxinator version",
                        hint: "Type 'tmuxinator version'"
                    },
                    {
                        instruction: "Check tmuxinator config directory. Use 'ls ~/.tmuxinator' to see configurations.",
                        expectedCommand: "ls ~/.tmuxinator",
                        hint: "Type 'ls ~/.tmuxinator'"
                    },
                    {
                        instruction: "List tmuxinator projects. Use 'tmuxinator list' to see available projects.",
                        expectedCommand: "tmuxinator list",
                        hint: "Type 'tmuxinator list'"
                    },
                    {
                        instruction: "Check Ruby for tmuxinator. Use 'ruby --version' to verify Ruby installation.",
                        expectedCommand: "ruby --version",
                        hint: "Type 'ruby --version'"
                    }
                ]
            },

            'performance-monitoring': {
                id: 'performance-monitoring',
                title: 'Performance Monitoring and Profiling',
                category: 'Advanced Integration',
                difficulty: 'advanced',
                duration: '4-5 hours',
                prerequisites: ['model-monitoring'],
                description: 'Master htop, iotop, and command-line profiling tools for optimizing AI workloads',
                objectives: [
                    'Use htop for CPU and memory monitoring',
                    'Monitor I/O with iotop and iostat',
                    'Profile Python code from command line',
                    'Set up continuous monitoring dashboards'
                ],
                steps: [
                    {
                        instruction: "Check system monitoring tools. Use 'htop --version' to verify htop installation.",
                        expectedCommand: "htop --version",
                        hint: "Type 'htop --version'"
                    },
                    {
                        instruction: "Check I/O monitoring. Use 'which iotop' to see if iotop is available.",
                        expectedCommand: "which iotop",
                        hint: "Type 'which iotop'"
                    },
                    {
                        instruction: "Test memory information. Use 'cat /proc/meminfo | head -5' to see memory stats.",
                        expectedCommand: "cat /proc/meminfo | head -5",
                        hint: "Type 'cat /proc/meminfo | head -5'"
                    },
                    {
                        instruction: "Check Python profiling tools. Use 'python3 -m cProfile --help | head -3'.",
                        expectedCommand: "python3 -m cProfile --help | head -3",
                        hint: "Type 'python3 -m cProfile --help | head -3'"
                    }
                ]
            },

            'workflow-mastery': {
                id: 'workflow-mastery',
                title: 'Terminal AI Workflow Mastery',
                category: 'Advanced Integration',
                difficulty: 'advanced',
                duration: '6-8 hours',
                prerequisites: ['neovim-repl', 'tmuxinator-automation', 'performance-monitoring'],
                description: 'Integrate all learned skills into a cohesive, efficient terminal-based AI development workflow',
                objectives: [
                    'Design complete AI project workflow',
                    'Integrate all tools and techniques learned',
                    'Create reproducible development environment',
                    'Optimize workflow for maximum productivity'
                ],
                steps: [
                    {
                        instruction: "Create a comprehensive workflow script. Use 'echo \"# AI Workflow Setup\" > ai-workflow.sh'.",
                        expectedCommand: "echo \"# AI Workflow Setup\" > ai-workflow.sh",
                        hint: "Type 'echo \"# AI Workflow Setup\" > ai-workflow.sh'"
                    },
                    {
                        instruction: "Document your complete setup. Use 'echo \"## Environment Setup\" >> ai-workflow.sh'.",
                        expectedCommand: "echo \"## Environment Setup\" >> ai-workflow.sh",
                        hint: "Type 'echo \"## Environment Setup\" >> ai-workflow.sh'"
                    },
                    {
                        instruction: "Test integrated environment. Use 'env | grep -E \"(EDITOR|SHELL|TMUX)\" | sort'.",
                        expectedCommand: "env | grep -E \"(EDITOR|SHELL|TMUX)\" | sort",
                        hint: "Type 'env | grep -E \"(EDITOR|SHELL|TMUX)\" | sort'"
                    },
                    {
                        instruction: "Final workflow validation. Use 'echo \"Workflow mastery complete!\" && date'.",
                        expectedCommand: "echo \"Workflow mastery complete!\" && date",
                        hint: "Type 'echo \"Workflow mastery complete!\" && date'"
                    }
                ]
            }
        };
    }

    getLesson(id) {
        return this.lessons[id] || null;
    }

    getLessonsByCategory(category) {
        return Object.values(this.lessons).filter(lesson => lesson.category === category);
    }

    getNextLesson(currentLessonId) {
        const lessonIds = Object.keys(this.lessons);
        const currentIndex = lessonIds.indexOf(currentLessonId);
        if (currentIndex !== -1 && currentIndex < lessonIds.length - 1) {
            return this.lessons[lessonIds[currentIndex + 1]];
        }
        return null;
    }

    checkPrerequisites(lessonId) {
        const lesson = this.lessons[lessonId];
        if (!lesson) return false;
        
        return lesson.prerequisites.every(prereqId => 
            this.progress.completedLessons.includes(prereqId)
        );
    }

    markLessonComplete(lessonId) {
        if (!this.progress.completedLessons.includes(lessonId)) {
            this.progress.completedLessons.push(lessonId);
            this.progress.lastActivity = new Date().toISOString();
            this.saveProgress();
        }
    }

    loadProgress() {
        const saved = localStorage.getItem('ai-tutor-progress');
        return saved ? JSON.parse(saved) : {
            completedLessons: [],
            currentLesson: null,
            lastActivity: null,
            totalTimeSpent: 0
        };
    }

    saveProgress() {
        localStorage.setItem('ai-tutor-progress', JSON.stringify(this.progress));
    }

    getProgressStats() {
        const totalLessons = Object.keys(this.lessons).length;
        const completedCount = this.progress.completedLessons.length;
        const progressPercentage = Math.round((completedCount / totalLessons) * 100);
        
        return {
            totalLessons,
            completedCount,
            progressPercentage,
            lastActivity: this.progress.lastActivity
        };
    }
}

// Export for global use
window.LessonSystem = LessonSystem;