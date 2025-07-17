/**
 * Lesson Manager for AI Tutorial Site
 * Handles lesson loading, navigation, completion tracking, and interactive exercises
 */

class LessonManager {
    constructor() {
        this.currentLesson = null;
        this.lessonData = new Map();
        this.terminalSimulator = null;
        this.lessonStartTime = null;
        this.exercises = new Map();
        this.bookmarkedLessons = new Set(JSON.parse(localStorage.getItem('bookmarkedLessons') || '[]'));
        this.prerequisites = new Map();
        
        this.init();
    }

    /**
     * Initialize the lesson manager
     */
    init() {
        this.bindEvents();
        this.loadCurrentLesson();
        this.initializeTerminal();
        this.setupExercises();
        this.loadPrerequisites();
        this.setupProgressSync();
    }

    /**
     * Load lesson prerequisites from lessons.json
     */
    async loadPrerequisites() {
        try {
            const response = await fetch('../lessons.json');
            const data = await response.json();
            
            data.lessons.forEach(lesson => {
                this.prerequisites.set(lesson.id, lesson.prerequisites || []);
            });
        } catch (error) {
            console.error('Error loading prerequisites:', error);
        }
    }

    /**
     * Setup progress synchronization with main.js
     */
    setupProgressSync() {
        // Sync with main progress tracking system
        if (window.aiTerminalTutor) {
            const mainProgress = window.aiTerminalTutor.progress;
            this.syncProgress(mainProgress);
        }
    }

    /**
     * Sync progress with main system
     * @param {Object} mainProgress - Progress from main.js
     */
    syncProgress(mainProgress) {
        // Update lesson completion status based on main progress
        const lessonElements = document.querySelectorAll('[data-lesson-id]');
        lessonElements.forEach(element => {
            const lessonId = element.dataset.lessonId;
            if (mainProgress.completedLessons.includes(lessonId)) {
                element.classList.add('completed');
            }
        });
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Lesson navigation buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.next-lesson, .next-lesson *')) {
                const button = e.target.closest('.next-lesson');
                this.navigateToNextLesson(button.dataset.nextLessonId);
            }
            
            if (e.target.matches('.prev-lesson, .prev-lesson *')) {
                const button = e.target.closest('.prev-lesson');
                this.navigateToPreviousLesson(button.dataset.prevLessonId);
            }
            
            if (e.target.matches('.start-lesson, .start-lesson *')) {
                const button = e.target.closest('.start-lesson');
                this.startLesson(button.dataset.lessonId);
            }
            
            if (e.target.matches('.complete-exercise, .complete-exercise *')) {
                const button = e.target.closest('.complete-exercise');
                this.completeExercise(button.dataset.exerciseId);
            }
            
            if (e.target.matches('.reset-exercise, .reset-exercise *')) {
                const button = e.target.closest('.reset-exercise');
                this.resetExercise(button.dataset.exerciseId);
            }
            
            if (e.target.matches('.export-progress, .export-progress *')) {
                this.exportProgressReport();
            }
            
            if (e.target.matches('.bookmark-lesson, .bookmark-lesson *')) {
                const button = e.target.closest('.bookmark-lesson');
                this.toggleBookmark(button.dataset.lessonId);
            }
            
            if (e.target.matches('.prerequisite-check, .prerequisite-check *')) {
                const button = e.target.closest('.prerequisite-check');
                this.checkPrerequisites(button.dataset.lessonId);
            }
        });

        // Track lesson viewing time
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseLessonTimer();
            } else {
                this.resumeLessonTimer();
            }
        });

        // Auto-save progress
        window.addEventListener('beforeunload', () => {
            this.saveLessonProgress();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'ArrowRight':
                        e.preventDefault();
                        this.navigateToNextLesson();
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.navigateToPreviousLesson();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveLessonProgress();
                        break;
                }
            }
        });
    }

    /**
     * Load current lesson based on URL or page data
     */
    loadCurrentLesson() {
        const lessonElement = document.querySelector('[data-lesson-id]');
        if (lessonElement) {
            const lessonId = lessonElement.dataset.lessonId;
            this.loadLesson(lessonId);
        }
    }

    /**
     * Load a specific lesson
     * @param {string} lessonId - The ID of the lesson to load
     */
    async loadLesson(lessonId) {
        try {
            // Check prerequisites
            if (!this.checkPrerequisites(lessonId)) {
                return;
            }
            
            this.currentLesson = lessonId;
            this.lessonStartTime = Date.now();
            
            // Update URL without page reload
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('lesson', lessonId);
            history.pushState({ lessonId }, '', newUrl);
            
            // Load lesson data if not cached
            if (!this.lessonData.has(lessonId)) {
                await this.fetchLessonData(lessonId);
            }
            
            // Render lesson content
            this.renderLesson(lessonId);
            
            // Track lesson start
            this.trackLessonEvent('lesson_started', lessonId);
            
            // Update navigation
            this.updateNavigationState();
            
            // Sync with main progress system
            if (window.aiTerminalTutor) {
                window.aiTerminalTutor.trackLessonView(lessonId);
            }
            
            // Announce to screen readers
            if (window.aiTerminalTutor) {
                window.aiTerminalTutor.announceToScreenReader(`Loaded lesson: ${this.getLessonTitle(lessonId)}`);
            }
            
        } catch (error) {
            console.error('Error loading lesson:', error);
            this.showError('Failed to load lesson. Please try again.');
        }
    }

    /**
     * Fetch lesson data from server or cache
     * @param {string} lessonId - The ID of the lesson
     */
    async fetchLessonData(lessonId) {
        // In a real application, this would fetch from an API
        // For now, we'll extract data from the current page
        const lessonElement = document.querySelector(`[data-lesson-id="${lessonId}"]`);
        if (lessonElement) {
            const data = {
                id: lessonId,
                title: lessonElement.querySelector('h1, h2, .lesson-title')?.textContent || 'Untitled Lesson',
                content: lessonElement.querySelector('.lesson-content')?.innerHTML || '',
                exercises: this.extractExercises(lessonElement),
                duration: lessonElement.dataset.duration || '10 minutes',
                difficulty: lessonElement.dataset.difficulty || 'beginner',
                prerequisites: lessonElement.dataset.prerequisites?.split(',') || [],
                objectives: this.extractObjectives(lessonElement)
            };
            
            this.lessonData.set(lessonId, data);
        }
    }

    /**
     * Extract exercises from lesson element
     * @param {Element} lessonElement - The lesson DOM element
     * @returns {Array} Array of exercise objects
     */
    extractExercises(lessonElement) {
        const exerciseElements = lessonElement.querySelectorAll('.exercise, .interactive-exercise');
        return Array.from(exerciseElements).map((el, index) => ({
            id: el.id || `exercise-${index}`,
            type: el.dataset.exerciseType || 'text',
            question: el.querySelector('.exercise-question')?.textContent || '',
            answer: el.dataset.answer || '',
            hints: el.dataset.hints?.split('|') || [],
            completed: false
        }));
    }

    /**
     * Extract learning objectives from lesson element
     * @param {Element} lessonElement - The lesson DOM element
     * @returns {Array} Array of objectives
     */
    extractObjectives(lessonElement) {
        const objectiveElements = lessonElement.querySelectorAll('.objective, .learning-objective');
        return Array.from(objectiveElements).map(el => el.textContent.trim());
    }

    /**
     * Render lesson content
     * @param {string} lessonId - The ID of the lesson to render
     */
    renderLesson(lessonId) {
        const lessonData = this.lessonData.get(lessonId);
        if (!lessonData) return;

        // Update lesson header
        this.updateLessonHeader(lessonData);
        
        // Update lesson progress
        this.updateLessonProgress(lessonId);
        
        // Initialize interactive elements
        this.initializeInteractiveElements(lessonId);
        
        // Set up code highlighting if present
        this.setupCodeHighlighting();
    }

    /**
     * Update lesson header with metadata
     * @param {Object} lessonData - Lesson data object
     */
    updateLessonHeader(lessonData) {
        const header = document.querySelector('.lesson-header');
        if (!header) return;

        const metaInfo = header.querySelector('.lesson-meta') || this.createLessonMeta();
        metaInfo.innerHTML = `
            <span class="lesson-duration">
                <i class="fas fa-clock"></i> ${lessonData.duration}
            </span>
            <span class="lesson-difficulty">
                <i class="fas fa-signal"></i> ${this.capitalize(lessonData.difficulty)}
            </span>
            ${lessonData.prerequisites.length > 0 ? `
                <span class="lesson-prerequisites">
                    <i class="fas fa-list"></i> Prerequisites: ${lessonData.prerequisites.join(', ')}
                </span>
            ` : ''}
        `;

        if (!header.contains(metaInfo)) {
            header.appendChild(metaInfo);
        }
    }

    /**
     * Create lesson meta information element
     * @returns {Element} Meta information element
     */
    createLessonMeta() {
        const meta = document.createElement('div');
        meta.className = 'lesson-meta mt-3 d-flex flex-wrap gap-3';
        return meta;
    }

    /**
     * Update lesson progress display
     * @param {string} lessonId - The lesson ID
     */
    updateLessonProgress(lessonId) {
        const progress = window.AITutorial?.getProgress() || {};
        const lessonProgress = progress[lessonId];
        
        // Update completion status
        const statusElement = document.querySelector('.lesson-status-indicator');
        if (statusElement && lessonProgress?.completed) {
            statusElement.innerHTML = `
                <i class="fas fa-check-circle text-success"></i>
                <span>Completed on ${new Date(lessonProgress.completedAt).toLocaleDateString()}</span>
            `;
        }
        
        // Update time spent
        const timeElement = document.querySelector('.lesson-time-spent');
        if (timeElement && lessonProgress?.timeSpent) {
            timeElement.textContent = this.formatTime(lessonProgress.timeSpent);
        }
    }

    /**
     * Initialize interactive elements in the lesson
     * @param {string} lessonId - The lesson ID
     */
    initializeInteractiveElements(lessonId) {
        // Code blocks with copy functionality
        this.setupCodeBlocks();
        
        // Interactive exercises
        this.setupExercises();
        
        // Collapsible sections
        this.setupCollapsibleSections();
        
        // Tooltips and popovers
        this.setupTooltips();
    }

    /**
     * Set up code blocks with copy functionality
     */
    setupCodeBlocks() {
        document.querySelectorAll('pre code, .code-block').forEach((block, index) => {
            if (!block.parentElement.querySelector('.copy-button')) {
                const copyButton = document.createElement('button');
                copyButton.className = 'btn btn-sm btn-outline-secondary copy-button';
                copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                copyButton.setAttribute('aria-label', 'Copy code');
                copyButton.onclick = () => this.copyCode(block, copyButton);
                
                const wrapper = document.createElement('div');
                wrapper.className = 'code-wrapper position-relative';
                block.parentElement.insertBefore(wrapper, block.parentElement);
                wrapper.appendChild(block.parentElement);
                wrapper.appendChild(copyButton);
            }
        });
    }

    /**
     * Copy code to clipboard
     * @param {Element} codeBlock - The code block element
     * @param {Element} button - The copy button
     */
    async copyCode(codeBlock, button) {
        try {
            await navigator.clipboard.writeText(codeBlock.textContent);
            button.innerHTML = '<i class="fas fa-check"></i>';
            button.classList.add('btn-success');
            
            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-copy"></i>';
                button.classList.remove('btn-success');
            }, 2000);
            
            window.AITutorial?.announceToScreenReader('Code copied to clipboard');
        } catch (error) {
            console.error('Failed to copy code:', error);
        }
    }

    /**
     * Set up interactive exercises
     */
    setupExercises() {
        document.querySelectorAll('.interactive-exercise').forEach(exercise => {
            const exerciseId = exercise.id || `exercise-${Date.now()}`;
            this.exercises.set(exerciseId, {
                element: exercise,
                completed: false,
                attempts: 0
            });
            
            this.initializeExercise(exerciseId, exercise);
        });
    }

    /**
     * Initialize a specific exercise
     * @param {string} exerciseId - The exercise ID
     * @param {Element} exerciseElement - The exercise DOM element
     */
    initializeExercise(exerciseId, exerciseElement) {
        const type = exerciseElement.dataset.exerciseType || 'text';
        
        switch (type) {
            case 'multiple-choice':
                this.initializeMultipleChoice(exerciseId, exerciseElement);
                break;
            case 'code':
                this.initializeCodeExercise(exerciseId, exerciseElement);
                break;
            case 'drag-drop':
                this.initializeDragDrop(exerciseId, exerciseElement);
                break;
            default:
                this.initializeTextExercise(exerciseId, exerciseElement);
        }
    }

    /**
     * Initialize multiple choice exercise
     * @param {string} exerciseId - The exercise ID
     * @param {Element} exerciseElement - The exercise DOM element
     */
    initializeMultipleChoice(exerciseId, exerciseElement) {
        const options = exerciseElement.querySelectorAll('.option');
        const submitButton = exerciseElement.querySelector('.submit-answer');
        
        options.forEach(option => {
            option.addEventListener('click', () => {
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
        
        if (submitButton) {
            submitButton.addEventListener('click', () => {
                this.checkMultipleChoiceAnswer(exerciseId, exerciseElement);
            });
        }
    }

    /**
     * Check multiple choice answer
     * @param {string} exerciseId - The exercise ID
     * @param {Element} exerciseElement - The exercise DOM element
     */
    checkMultipleChoiceAnswer(exerciseId, exerciseElement) {
        const selected = exerciseElement.querySelector('.option.selected');
        const correctAnswer = exerciseElement.dataset.answer;
        
        if (!selected) {
            this.showExerciseFeedback(exerciseElement, 'Please select an answer.', 'warning');
            return;
        }
        
        const isCorrect = selected.dataset.value === correctAnswer;
        
        if (isCorrect) {
            this.showExerciseFeedback(exerciseElement, 'Correct! Well done.', 'success');
            this.markExerciseComplete(exerciseId);
        } else {
            this.showExerciseFeedback(exerciseElement, 'Incorrect. Try again.', 'error');
            this.incrementExerciseAttempts(exerciseId);
        }
    }

    /**
     * Initialize code exercise
     * @param {string} exerciseId - The exercise ID
     * @param {Element} exerciseElement - The exercise DOM element
     */
    initializeCodeExercise(exerciseId, exerciseElement) {
        const codeInput = exerciseElement.querySelector('.code-input, textarea');
        const runButton = exerciseElement.querySelector('.run-code');
        
        if (runButton && codeInput) {
            runButton.addEventListener('click', () => {
                this.runCodeExercise(exerciseId, codeInput.value);
            });
        }
    }

    /**
     * Run code exercise
     * @param {string} exerciseId - The exercise ID
     * @param {string} code - The code to run
     */
    runCodeExercise(exerciseId, code) {
        const exercise = this.exercises.get(exerciseId);
        if (!exercise) return;
        
        // Simulate code execution (in a real app, this would use a sandbox)
        try {
            const expectedOutput = exercise.element.dataset.expectedOutput;
            const result = this.simulateCodeExecution(code);
            
            if (result === expectedOutput) {
                this.showExerciseFeedback(exercise.element, 'Code executed successfully!', 'success');
                this.markExerciseComplete(exerciseId);
            } else {
                this.showExerciseFeedback(exercise.element, 'Output doesn\'t match expected result.', 'error');
            }
        } catch (error) {
            this.showExerciseFeedback(exercise.element, `Error: ${error.message}`, 'error');
        }
    }

    /**
     * Simulate code execution (placeholder)
     * @param {string} code - The code to execute
     * @returns {string} Simulated output
     */
    simulateCodeExecution(code) {
        // This is a simple simulation - in reality you'd use a secure sandbox
        if (code.includes('console.log("Hello, World!")')) {
            return 'Hello, World!';
        }
        return 'Code executed';
    }

    /**
     * Initialize drag and drop exercise
     * @param {string} exerciseId - The exercise ID
     * @param {Element} exerciseElement - The exercise DOM element
     */
    initializeDragDrop(exerciseId, exerciseElement) {
        const draggables = exerciseElement.querySelectorAll('.draggable');
        const dropZones = exerciseElement.querySelectorAll('.drop-zone');
        
        draggables.forEach(item => {
            item.draggable = true;
            item.addEventListener('dragstart', this.handleDragStart.bind(this));
        });
        
        dropZones.forEach(zone => {
            zone.addEventListener('dragover', this.handleDragOver.bind(this));
            zone.addEventListener('drop', this.handleDrop.bind(this, exerciseId));
        });
    }

    /**
     * Handle drag start
     * @param {DragEvent} e - Drag event
     */
    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.value);
        e.target.classList.add('dragging');
    }

    /**
     * Handle drag over
     * @param {DragEvent} e - Drag event
     */
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    /**
     * Handle drop
     * @param {string} exerciseId - The exercise ID
     * @param {DragEvent} e - Drag event
     */
    handleDrop(exerciseId, e) {
        e.preventDefault();
        const data = e.dataTransfer.getData('text/plain');
        const dropZone = e.currentTarget;
        
        dropZone.classList.remove('drag-over');
        dropZone.textContent = data;
        dropZone.dataset.value = data;
        
        // Check if all drop zones are filled
        this.checkDragDropCompletion(exerciseId);
    }

    /**
     * Check drag and drop completion
     * @param {string} exerciseId - The exercise ID
     */
    checkDragDropCompletion(exerciseId) {
        const exercise = this.exercises.get(exerciseId);
        if (!exercise) return;
        
        const dropZones = exercise.element.querySelectorAll('.drop-zone');
        const allFilled = Array.from(dropZones).every(zone => zone.dataset.value);
        
        if (allFilled) {
            const correctOrder = exercise.element.dataset.correctOrder?.split(',') || [];
            const currentOrder = Array.from(dropZones).map(zone => zone.dataset.value);
            
            if (JSON.stringify(currentOrder) === JSON.stringify(correctOrder)) {
                this.showExerciseFeedback(exercise.element, 'Perfect! All items in correct order.', 'success');
                this.markExerciseComplete(exerciseId);
            } else {
                this.showExerciseFeedback(exercise.element, 'Not quite right. Try reordering.', 'error');
            }
        }
    }

    /**
     * Initialize text exercise
     * @param {string} exerciseId - The exercise ID
     * @param {Element} exerciseElement - The exercise DOM element
     */
    initializeTextExercise(exerciseId, exerciseElement) {
        const input = exerciseElement.querySelector('input, textarea');
        const submitButton = exerciseElement.querySelector('.submit-answer');
        
        if (input && submitButton) {
            submitButton.addEventListener('click', () => {
                this.checkTextAnswer(exerciseId, input.value.trim());
            });
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.checkTextAnswer(exerciseId, input.value.trim());
                }
            });
        }
    }

    /**
     * Check text answer
     * @param {string} exerciseId - The exercise ID
     * @param {string} answer - The user's answer
     */
    checkTextAnswer(exerciseId, answer) {
        const exercise = this.exercises.get(exerciseId);
        if (!exercise) return;
        
        const correctAnswer = exercise.element.dataset.answer?.toLowerCase();
        const userAnswer = answer.toLowerCase();
        
        if (userAnswer === correctAnswer) {
            this.showExerciseFeedback(exercise.element, 'Correct!', 'success');
            this.markExerciseComplete(exerciseId);
        } else {
            this.showExerciseFeedback(exercise.element, 'Try again. Check your spelling.', 'error');
            this.incrementExerciseAttempts(exerciseId);
        }
    }

    /**
     * Show exercise feedback
     * @param {Element} exerciseElement - The exercise element
     * @param {string} message - Feedback message
     * @param {string} type - Feedback type (success, error, warning)
     */
    showExerciseFeedback(exerciseElement, message, type) {
        const existingFeedback = exerciseElement.querySelector('.exercise-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        const feedback = document.createElement('div');
        feedback.className = `exercise-feedback alert alert-${type === 'error' ? 'danger' : type} mt-2`;
        feedback.textContent = message;
        feedback.setAttribute('role', 'alert');
        
        exerciseElement.appendChild(feedback);
        
        // Announce to screen readers
        window.AITutorial?.announceToScreenReader(message);
        
        // Auto-remove after 5 seconds for non-success messages
        if (type !== 'success') {
            setTimeout(() => feedback.remove(), 5000);
        }
    }

    /**
     * Mark exercise as complete
     * @param {string} exerciseId - The exercise ID
     */
    markExerciseComplete(exerciseId) {
        const exercise = this.exercises.get(exerciseId);
        if (!exercise) return;
        
        exercise.completed = true;
        exercise.element.classList.add('completed');
        
        // Disable further interaction
        const inputs = exercise.element.querySelectorAll('input, textarea, button:not(.reset-exercise)');
        inputs.forEach(input => input.disabled = true);
        
        // Track completion
        this.trackLessonEvent('exercise_completed', exerciseId);
        
        // Check if all exercises in lesson are complete
        this.checkLessonCompletion();
    }

    /**
     * Increment exercise attempt count
     * @param {string} exerciseId - The exercise ID
     */
    incrementExerciseAttempts(exerciseId) {
        const exercise = this.exercises.get(exerciseId);
        if (exercise) {
            exercise.attempts++;
            
            // Show hint after 3 attempts
            if (exercise.attempts >= 3) {
                this.showExerciseHint(exerciseId);
            }
        }
    }

    /**
     * Show exercise hint
     * @param {string} exerciseId - The exercise ID
     */
    showExerciseHint(exerciseId) {
        const exercise = this.exercises.get(exerciseId);
        if (!exercise) return;
        
        const hints = exercise.element.dataset.hints?.split('|') || [];
        if (hints.length > 0) {
            const hint = hints[Math.min(exercise.attempts - 3, hints.length - 1)];
            this.showExerciseFeedback(exercise.element, `Hint: ${hint}`, 'info');
        }
    }

    /**
     * Reset exercise
     * @param {string} exerciseId - The exercise ID
     */
    resetExercise(exerciseId) {
        const exercise = this.exercises.get(exerciseId);
        if (!exercise) return;
        
        exercise.completed = false;
        exercise.attempts = 0;
        exercise.element.classList.remove('completed');
        
        // Re-enable inputs
        const inputs = exercise.element.querySelectorAll('input, textarea, button');
        inputs.forEach(input => input.disabled = false);
        
        // Clear feedback
        const feedback = exercise.element.querySelector('.exercise-feedback');
        if (feedback) feedback.remove();
        
        // Reset form fields
        const form = exercise.element.querySelector('form');
        if (form) form.reset();
        
        // Clear selections
        exercise.element.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        
        window.AITutorial?.announceToScreenReader('Exercise reset');
    }

    /**
     * Check if all exercises in lesson are complete
     */
    checkLessonCompletion() {
        const lessonExercises = Array.from(this.exercises.values()).filter(ex => 
            ex.element.closest(`[data-lesson-id="${this.currentLesson}"]`)
        );
        
        const allComplete = lessonExercises.every(ex => ex.completed);
        
        if (allComplete && lessonExercises.length > 0) {
            this.markLessonComplete(this.currentLesson);
        }
    }

    /**
     * Mark lesson as complete
     * @param {string} lessonId - The lesson ID
     */
    markLessonComplete(lessonId) {
        // Calculate time spent
        const timeSpent = this.lessonStartTime ? Date.now() - this.lessonStartTime : 0;
        
        // Update progress through main.js
        if (window.aiTerminalTutor) {
            window.aiTerminalTutor.completeLesson(lessonId);
            window.aiTerminalTutor.addTimeSpent(timeSpent / 1000 / 60); // Convert to minutes
        }
        
        // Save time spent
        this.saveLessonTime(lessonId, timeSpent);
        
        // Show completion modal
        this.showCompletionModal(lessonId, timeSpent);
        
        // Track completion
        this.trackLessonEvent('lesson_completed', lessonId, { timeSpent });
        
        // Update UI
        this.updateLessonCompletionUI(lessonId);
    }

    /**
     * Update lesson completion UI
     * @param {string} lessonId - The lesson ID
     */
    updateLessonCompletionUI(lessonId) {
        const lessonElements = document.querySelectorAll(`[data-lesson-id="${lessonId}"]`);
        lessonElements.forEach(element => {
            element.classList.add('completed');
            
            // Add completion indicator
            const completionIndicator = element.querySelector('.completion-indicator');
            if (completionIndicator) {
                completionIndicator.innerHTML = '<i class="fas fa-check-circle text-success"></i>';
            }
        });
    }

    /**
     * Save lesson time
     * @param {string} lessonId - The lesson ID
     * @param {number} timeSpent - Time spent in milliseconds
     */
    saveLessonTime(lessonId, timeSpent) {
        const progress = window.AITutorial?.getProgress() || {};
        if (progress[lessonId]) {
            progress[lessonId].timeSpent = (progress[lessonId].timeSpent || 0) + timeSpent;
            localStorage.setItem('userProgress', JSON.stringify(progress));
        }
    }

    /**
     * Show lesson completion modal
     * @param {string} lessonId - The lesson ID
     * @param {number} timeSpent - Time spent in milliseconds
     */
    showCompletionModal(lessonId, timeSpent) {
        const lessonData = this.lessonData.get(lessonId);
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-trophy text-warning"></i>
                            Lesson Complete!
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <h4>Congratulations!</h4>
                        <p>You've successfully completed "${lessonData?.title || 'this lesson'}"</p>
                        <div class="completion-stats">
                            <div class="stat">
                                <i class="fas fa-clock"></i>
                                <span>Time: ${this.formatTime(timeSpent)}</span>
                            </div>
                            <div class="stat">
                                <i class="fas fa-tasks"></i>
                                <span>Exercises: ${this.getCompletedExerciseCount(lessonId)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Continue Learning
                        </button>
                        <button type="button" class="btn btn-primary next-lesson" data-next-lesson-id="${this.getNextLessonId()}">
                            Next Lesson
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show modal (requires Bootstrap JS)
        if (window.bootstrap) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
            });
        }
    }

    /**
     * Navigate to next lesson
     * @param {string} nextLessonId - The ID of the next lesson
     */
    navigateToNextLesson(nextLessonId) {
        if (!nextLessonId) {
            nextLessonId = this.getNextLessonId();
        }
        
        if (nextLessonId) {
            this.loadLesson(nextLessonId);
        } else {
            this.showError('No next lesson available.');
        }
    }

    /**
     * Navigate to previous lesson
     * @param {string} prevLessonId - The ID of the previous lesson
     */
    navigateToPreviousLesson(prevLessonId) {
        if (!prevLessonId) {
            prevLessonId = this.getPreviousLessonId();
        }
        
        if (prevLessonId) {
            this.loadLesson(prevLessonId);
        } else {
            this.showError('No previous lesson available.');
        }
    }

    /**
     * Get next lesson ID
     * @returns {string|null} Next lesson ID
     */
    getNextLessonId() {
        const currentElement = document.querySelector(`[data-lesson-id="${this.currentLesson}"]`);
        const nextElement = currentElement?.parentElement.nextElementSibling?.querySelector('[data-lesson-id]');
        return nextElement?.dataset.lessonId || null;
    }

    /**
     * Get previous lesson ID
     * @returns {string|null} Previous lesson ID
     */
    getPreviousLessonId() {
        const currentElement = document.querySelector(`[data-lesson-id="${this.currentLesson}"]`);
        const prevElement = currentElement?.parentElement.previousElementSibling?.querySelector('[data-lesson-id]');
        return prevElement?.dataset.lessonId || null;
    }

    /**
     * Start a lesson
     * @param {string} lessonId - The lesson ID to start
     */
    startLesson(lessonId) {
        this.loadLesson(lessonId);
        
        // Scroll to lesson content
        const lessonElement = document.querySelector(`[data-lesson-id="${lessonId}"]`);
        if (lessonElement) {
            lessonElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * Initialize terminal simulator
     */
    initializeTerminal() {
        const terminalElements = document.querySelectorAll('.terminal-simulator');
        terminalElements.forEach(terminal => {
            this.setupTerminal(terminal);
        });
    }

    /**
     * Set up a terminal simulator
     * @param {Element} terminalElement - The terminal element
     */
    setupTerminal(terminalElement) {
        const output = terminalElement.querySelector('.terminal-output');
        const input = terminalElement.querySelector('.terminal-input');
        const prompt = terminalElement.querySelector('.terminal-prompt');
        
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const command = input.value.trim();
                    if (command) {
                        this.executeTerminalCommand(command, output, prompt);
                        input.value = '';
                    }
                }
            });
        }
    }

    /**
     * Execute terminal command
     * @param {string} command - The command to execute
     * @param {Element} output - The output element
     * @param {Element} prompt - The prompt element
     */
    executeTerminalCommand(command, output, prompt) {
        // Add command to output
        const commandLine = document.createElement('div');
        commandLine.className = 'terminal-line';
        commandLine.innerHTML = `<span class="terminal-prompt">$</span> ${command}`;
        output.appendChild(commandLine);
        
        // Simulate command execution
        const result = this.simulateCommand(command);
        
        if (result) {
            const resultLine = document.createElement('div');
            resultLine.className = 'terminal-result';
            resultLine.textContent = result;
            output.appendChild(resultLine);
        }
        
        // Scroll to bottom
        output.scrollTop = output.scrollHeight;
    }

    /**
     * Simulate terminal command
     * @param {string} command - The command to simulate
     * @returns {string} Command result
     */
    simulateCommand(command) {
        const commands = {
            'ls': 'index.html  style.css  script.js  README.md',
            'pwd': '/home/user/tutorial',
            'whoami': 'tutorial-user',
            'date': new Date().toString(),
            'clear': () => {
                const output = document.querySelector('.terminal-output');
                if (output) output.innerHTML = '';
                return '';
            },
            'help': 'Available commands: ls, pwd, whoami, date, clear, help'
        };
        
        if (typeof commands[command] === 'function') {
            return commands[command]();
        }
        
        return commands[command] || `Command not found: ${command}`;
    }

    /**
     * Export progress report
     */
    exportProgressReport() {
        const progress = window.AITutorial?.getProgress() || {};
        const report = this.generateProgressReport(progress);
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-tutorial-progress-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        window.AITutorial?.announceToScreenReader('Progress report exported');
    }

    /**
     * Generate progress report
     * @param {Object} progress - Progress data
     * @returns {Object} Progress report
     */
    generateProgressReport(progress) {
        const totalLessons = Object.keys(progress).length;
        const completedLessons = Object.values(progress).filter(p => p.completed).length;
        const totalTime = Object.values(progress).reduce((total, p) => total + (p.timeSpent || 0), 0);
        
        return {
            summary: {
                totalLessons,
                completedLessons,
                completionRate: totalLessons > 0 ? (completedLessons / totalLessons * 100).toFixed(1) : 0,
                totalTimeSpent: this.formatTime(totalTime),
                exportDate: new Date().toISOString()
            },
            lessons: progress,
            exerciseStats: this.getExerciseStats()
        };
    }

    /**
     * Get exercise statistics
     * @returns {Object} Exercise statistics
     */
    getExerciseStats() {
        const stats = {
            total: this.exercises.size,
            completed: 0,
            averageAttempts: 0
        };
        
        const exercises = Array.from(this.exercises.values());
        stats.completed = exercises.filter(ex => ex.completed).length;
        
        if (exercises.length > 0) {
            const totalAttempts = exercises.reduce((sum, ex) => sum + ex.attempts, 0);
            stats.averageAttempts = (totalAttempts / exercises.length).toFixed(1);
        }
        
        return stats;
    }

    /**
     * Utility Functions
     */

    /**
     * Format time in milliseconds to readable string
     * @param {number} ms - Time in milliseconds
     * @returns {string} Formatted time string
     */
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Capitalize first letter of string
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Get lesson title
     * @param {string} lessonId - The lesson ID
     * @returns {string} Lesson title
     */
    getLessonTitle(lessonId) {
        const lessonData = this.lessonData.get(lessonId);
        return lessonData?.title || 'Untitled Lesson';
    }

    /**
     * Get completed exercise count for lesson
     * @param {string} lessonId - The lesson ID
     * @returns {number} Number of completed exercises
     */
    getCompletedExerciseCount(lessonId) {
        return Array.from(this.exercises.values()).filter(ex => 
            ex.completed && ex.element.closest(`[data-lesson-id="${lessonId}"]`)
        ).length;
    }

    /**
     * Check lesson prerequisites
     * @param {string} lessonId - The lesson ID
     * @returns {boolean} Whether prerequisites are met
     */
    checkPrerequisites(lessonId) {
        const prerequisites = this.prerequisites.get(lessonId) || [];
        if (prerequisites.length === 0) return true;
        
        const progress = window.aiTerminalTutor?.progress?.completedLessons || [];
        const unmetPrerequisites = prerequisites.filter(prereq => !progress.includes(prereq));
        
        if (unmetPrerequisites.length > 0) {
            this.showPrerequisiteWarning(lessonId, unmetPrerequisites);
            return false;
        }
        
        return true;
    }

    /**
     * Show prerequisite warning
     * @param {string} lessonId - The lesson ID
     * @param {Array} unmetPrerequisites - Array of unmet prerequisites
     */
    showPrerequisiteWarning(lessonId, unmetPrerequisites) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-exclamation-triangle text-warning"></i>
                            Prerequisites Not Met
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>This lesson requires you to complete the following prerequisites first:</p>
                        <ul>
                            ${unmetPrerequisites.map(prereq => `<li>${this.getLessonTitle(prereq)}</li>`).join('')}
                        </ul>
                        <p>Would you like to continue anyway or go to the first prerequisite?</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="window.lessonManager.loadLesson('${unmetPrerequisites[0]}')" data-bs-dismiss="modal">
                            Go to Prerequisite
                        </button>
                        <button type="button" class="btn btn-warning" onclick="window.lessonManager.loadLesson('${lessonId}')" data-bs-dismiss="modal">
                            Continue Anyway
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        if (window.bootstrap) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
            });
        }
    }

    /**
     * Toggle lesson bookmark
     * @param {string} lessonId - The lesson ID
     */
    toggleBookmark(lessonId) {
        if (this.bookmarkedLessons.has(lessonId)) {
            this.bookmarkedLessons.delete(lessonId);
            this.showNotification('Lesson removed from bookmarks', 'info');
        } else {
            this.bookmarkedLessons.add(lessonId);
            this.showNotification('Lesson bookmarked!', 'success');
        }
        
        // Save to localStorage
        localStorage.setItem('bookmarkedLessons', JSON.stringify([...this.bookmarkedLessons]));
        
        // Update UI
        this.updateBookmarkUI(lessonId);
    }

    /**
     * Update bookmark UI
     * @param {string} lessonId - The lesson ID
     */
    updateBookmarkUI(lessonId) {
        const bookmarkButtons = document.querySelectorAll(`[data-lesson-id="${lessonId}"] .bookmark-lesson`);
        bookmarkButtons.forEach(button => {
            const icon = button.querySelector('i');
            if (this.bookmarkedLessons.has(lessonId)) {
                icon.className = 'fas fa-bookmark';
                button.classList.add('bookmarked');
            } else {
                icon.className = 'far fa-bookmark';
                button.classList.remove('bookmarked');
            }
        });
    }

    /**
     * Get bookmarked lessons
     * @returns {Set} Set of bookmarked lesson IDs
     */
    getBookmarkedLessons() {
        return this.bookmarkedLessons;
    }

    /**
     * Handle smooth navigation between lessons
     * @param {string} lessonId - Target lesson ID
     */
    smoothNavigateToLesson(lessonId) {
        // Check prerequisites first
        if (!this.checkPrerequisites(lessonId)) {
            return;
        }
        
        // Smooth transition effect
        const currentContent = document.querySelector('.lesson-content');
        if (currentContent) {
            currentContent.style.opacity = '0.5';
            currentContent.style.transform = 'translateY(20px)';
        }
        
        setTimeout(() => {
            this.loadLesson(lessonId);
            
            setTimeout(() => {
                if (currentContent) {
                    currentContent.style.opacity = '1';
                    currentContent.style.transform = 'translateY(0)';
                }
            }, 100);
        }, 200);
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     */
    showNotification(message, type = 'info') {
        // Use the notification system from main.js if available
        if (window.aiTerminalTutor) {
            window.aiTerminalTutor.showNotification(message, type);
        } else {
            // Fallback notification
            const notification = document.createElement('div');
            notification.className = `alert alert-${type} alert-dismissible fade show notification`;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1050;
                min-width: 300px;
            `;
            
            notification.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
    }

    /**
     * Track lesson events for analytics
     * @param {string} eventType - Type of event
     * @param {string} lessonId - Lesson ID
     * @param {Object} data - Additional event data
     */
    trackLessonEvent(eventType, lessonId, data = {}) {
        // In a real application, this would send to analytics service
        console.log('Lesson Event:', {
            type: eventType,
            lessonId,
            timestamp: new Date().toISOString(),
            ...data
        });
        
        // Also track in main progress system
        if (window.aiTerminalTutor) {
            window.aiTerminalTutor.trackEvent(eventType, { lessonId, ...data });
        }
    }

    /**
     * Save lesson progress
     */
    saveLessonProgress() {
        if (this.currentLesson && this.lessonStartTime) {
            const timeSpent = Date.now() - this.lessonStartTime;
            this.saveLessonTime(this.currentLesson, timeSpent);
            this.lessonStartTime = Date.now(); // Reset timer
        }
    }

    /**
     * Pause lesson timer
     */
    pauseLessonTimer() {
        if (this.currentLesson && this.lessonStartTime) {
            const timeSpent = Date.now() - this.lessonStartTime;
            this.saveLessonTime(this.currentLesson, timeSpent);
            this.lessonStartTime = null;
        }
    }

    /**
     * Resume lesson timer
     */
    resumeLessonTimer() {
        if (this.currentLesson && !this.lessonStartTime) {
            this.lessonStartTime = Date.now();
        }
    }

    /**
     * Set up collapsible sections
     */
    setupCollapsibleSections() {
        document.querySelectorAll('.collapsible-header').forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                const isExpanded = header.getAttribute('aria-expanded') === 'true';
                
                header.setAttribute('aria-expanded', !isExpanded);
                content.classList.toggle('show');
                
                const icon = header.querySelector('.collapse-icon');
                if (icon) {
                    icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
                }
            });
        });
    }

    /**
     * Set up tooltips
     */
    setupTooltips() {
        // Initialize Bootstrap tooltips if available
        if (window.bootstrap && document.querySelectorAll('[data-bs-toggle="tooltip"]').length > 0) {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
        }
    }

    /**
     * Set up code highlighting
     */
    setupCodeHighlighting() {
        // If using a syntax highlighting library like Prism.js or highlight.js
        if (window.Prism) {
            Prism.highlightAll();
        } else if (window.hljs) {
            hljs.highlightAll();
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.main-content') || document.body;
        container.insertBefore(alert, container.firstChild);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    /**
     * Update navigation state
     */
    updateNavigationState() {
        const nextButton = document.querySelector('.next-lesson');
        const prevButton = document.querySelector('.prev-lesson');
        
        if (nextButton) {
            const nextLessonId = this.getNextLessonId();
            nextButton.disabled = !nextLessonId;
            if (nextLessonId) {
                nextButton.dataset.nextLessonId = nextLessonId;
            }
        }
        
        if (prevButton) {
            const prevLessonId = this.getPreviousLessonId();
            prevButton.disabled = !prevLessonId;
            if (prevLessonId) {
                prevButton.dataset.prevLessonId = prevLessonId;
            }
        }
    }
}

/**
 * Lesson Index Page Manager
 * Handles the lessons index page functionality
 */
class LessonIndex {
    constructor() {
        this.lessonsData = null;
        this.filteredLessons = null;
        this.currentFilter = '';
        this.currentSearchTerm = '';
        
        this.init();
    }
    
    /**
     * Initialize the lesson index
     */
    async init() {
        try {
            await this.loadLessonsData();
            this.bindEvents();
            this.renderLessons();
            this.updateProgress();
            this.generateRecommendations();
            this.renderBookmarkedLessons();
        } catch (error) {
            console.error('Error initializing lesson index:', error);
        }
    }
    
    /**
     * Load lessons data from JSON file
     */
    async loadLessonsData() {
        try {
            const response = await fetch('../lessons.json');
            this.lessonsData = await response.json();
            this.filteredLessons = this.lessonsData.lessons;
        } catch (error) {
            console.error('Error loading lessons data:', error);
        }
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentSearchTerm = e.target.value.toLowerCase();
                this.filterLessons();
            });
        }
        
        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.filterLessons();
            });
        }
        
        // Quick actions
        document.getElementById('continue-learning')?.addEventListener('click', () => {
            this.continueLearning();
        });
        
        document.getElementById('reset-progress')?.addEventListener('click', () => {
            this.resetProgress();
        });
        
        document.getElementById('export-progress')?.addEventListener('click', () => {
            this.exportProgress();
        });
        
        document.getElementById('open-terminal')?.addEventListener('click', () => {
            this.openTerminal();
        });
        
        document.getElementById('launch-terminal')?.addEventListener('click', () => {
            this.openTerminal();
        });
        
        // Import progress
        document.getElementById('import-progress-btn')?.addEventListener('click', () => {
            this.importProgress();
        });
        
        // Learning path clicks
        document.querySelectorAll('.path-step').forEach(step => {
            step.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.scrollToCategory(category);
            });
        });
    }
    
    /**
     * Filter lessons based on search and category
     */
    filterLessons() {
        if (!this.lessonsData) return;
        
        this.filteredLessons = this.lessonsData.lessons.filter(lesson => {
            const matchesSearch = this.currentSearchTerm === '' || 
                lesson.title.toLowerCase().includes(this.currentSearchTerm) ||
                lesson.description.toLowerCase().includes(this.currentSearchTerm) ||
                lesson.objectives.some(obj => obj.toLowerCase().includes(this.currentSearchTerm));
            
            const matchesCategory = this.currentFilter === '' || lesson.category === this.currentFilter;
            
            return matchesSearch && matchesCategory;
        });
        
        this.renderLessons();
    }
    
    /**
     * Render lessons in their respective categories
     */
    renderLessons() {
        if (!this.filteredLessons) return;
        
        const categories = ['foundation', 'editor-transition', 'ai-workflow-tools', 'advanced-integration'];
        
        categories.forEach(category => {
            const container = document.getElementById(`${category}-lessons`);
            if (!container) return;
            
            const categoryLessons = this.filteredLessons.filter(lesson => lesson.category === category);
            container.innerHTML = '';
            
            categoryLessons.forEach(lesson => {
                const lessonCard = this.createLessonCard(lesson);
                container.appendChild(lessonCard);
            });
        });
    }
    
    /**
     * Create lesson card HTML
     * @param {Object} lesson - Lesson data
     * @returns {HTMLElement} Lesson card element
     */
    createLessonCard(lesson) {
        const progress = window.aiTerminalTutor?.progress || {};
        const isCompleted = progress.completedLessons?.includes(lesson.id);
        const isBookmarked = window.lessonManager?.bookmarkedLessons?.has(lesson.id);
        
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4 mb-4';
        card.innerHTML = `
            <div class="card lesson-card h-100 ${isCompleted ? 'completed' : ''}" data-lesson-id="${lesson.id}">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span class="lesson-difficulty badge badge-${lesson.difficulty}">
                        ${lesson.difficulty}
                    </span>
                    <div class="lesson-actions">
                        <button class="btn btn-sm btn-outline-secondary bookmark-lesson ${isBookmarked ? 'bookmarked' : ''}" 
                                data-lesson-id="${lesson.id}" title="Bookmark lesson">
                            <i class="${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i>
                        </button>
                        <div class="completion-indicator">
                            ${isCompleted ? '<i class="fas fa-check-circle text-success"></i>' : ''}
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${lesson.title}</h5>
                    <p class="card-text">${lesson.description}</p>
                    <div class="lesson-meta">
                        <small class="text-muted">
                            <i class="fas fa-clock"></i> ${lesson.estimatedTime}
                        </small>
                        ${lesson.prerequisites && lesson.prerequisites.length > 0 ? 
                            `<small class="text-muted">
                                <i class="fas fa-link"></i> ${lesson.prerequisites.length} prerequisite(s)
                            </small>` : ''
                        }
                    </div>
                    <div class="lesson-objectives mt-2">
                        <h6>Learning Objectives:</h6>
                        <ul class="list-unstyled">
                            ${lesson.objectives.slice(0, 3).map(obj => `<li><i class="fas fa-check text-success"></i> ${obj}</li>`).join('')}
                            ${lesson.objectives.length > 3 ? '<li class="text-muted">... and more</li>' : ''}
                        </ul>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="d-flex justify-content-between align-items-center">
                        <button class="btn btn-primary start-lesson" data-lesson-id="${lesson.id}">
                            ${isCompleted ? 'Review' : 'Start'} Lesson
                        </button>
                        <button class="btn btn-outline-secondary prerequisite-check" 
                                data-lesson-id="${lesson.id}" title="Check prerequisites">
                            <i class="fas fa-list-check"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add click handlers
        const startButton = card.querySelector('.start-lesson');
        startButton.addEventListener('click', () => {
            this.startLesson(lesson.id);
        });
        
        const bookmarkButton = card.querySelector('.bookmark-lesson');
        bookmarkButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleBookmark(lesson.id);
        });
        
        const prerequisiteButton = card.querySelector('.prerequisite-check');
        prerequisiteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showPrerequisites(lesson);
        });
        
        return card;
    }
    
    /**
     * Start a lesson
     * @param {string} lessonId - The lesson ID
     */
    startLesson(lessonId) {
        // Map lesson IDs to actual file names
        const lessonFileMap = {
            'zsh-basics': '01-zsh-basics.html',
            'tmux-fundamentals': '02-oh-my-zsh.html',
            'cli-tools-essentials': '03-tmux-basics.html',
            'ssh-remote-development': '04-tmux-workflows.html',
            'neovim-installation': '05-search-tools.html',
            'vim-motions-mastery': '06-productivity-tools.html',
            'lsp-setup': '07-neovim-basics.html',
            'essential-plugins': '08-neovim-ai-setup.html',
            'ai-plugins-integration': '09-cloud-ai-tools.html',
            'advanced-neovim-config': '10-ai-monitoring.html',
            'tmux-layouts-ai': '11-automation-scripts.html',
            'cloud-cli-tools': '12-advanced-integration.html',
            'jupyter-terminal': '13-jupyter-terminal.html',
            'model-monitoring': '14-model-monitoring.html',
            'automation-scripts': '15-automation-scripts.html',
            'neovim-repl-integration': '16-neovim-repl-integration.html',
            'tmuxinator-automation': '17-tmuxinator-automation.html',
            'performance-profiling': '18-performance-profiling.html',
            'terminal-ai-mastery': '19-terminal-ai-mastery.html'
        };

        const fileName = lessonFileMap[lessonId];
        if (fileName) {
            window.location.href = fileName;
        } else {
            console.error(`Lesson file not found for ID: ${lessonId}`);
            alert(`Lesson file not found for: ${lessonId}`);
        }
    }
    
    /**
     * Toggle bookmark for a lesson
     * @param {string} lessonId - The lesson ID
     */
    toggleBookmark(lessonId) {
        if (window.lessonManager) {
            window.lessonManager.toggleBookmark(lessonId);
        } else {
            // Fallback if lesson manager not available
            const bookmarkedLessons = new Set(JSON.parse(localStorage.getItem('bookmarkedLessons') || '[]'));
            
            if (bookmarkedLessons.has(lessonId)) {
                bookmarkedLessons.delete(lessonId);
            } else {
                bookmarkedLessons.add(lessonId);
            }
            
            localStorage.setItem('bookmarkedLessons', JSON.stringify([...bookmarkedLessons]));
        }
        
        // Re-render to update UI
        this.renderLessons();
        this.renderBookmarkedLessons();
    }
    
    /**
     * Show prerequisites for a lesson
     * @param {Object} lesson - Lesson data
     */
    showPrerequisites(lesson) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-list-check"></i> Prerequisites for "${lesson.title}"
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${lesson.prerequisites && lesson.prerequisites.length > 0 ? `
                            <p>This lesson requires completion of:</p>
                            <ul>
                                ${lesson.prerequisites.map(prereq => `<li>${this.getLessonTitle(prereq)}</li>`).join('')}
                            </ul>
                        ` : '<p>No prerequisites required for this lesson.</p>'}
                        
                        <h6>Learning Objectives:</h6>
                        <ul>
                            ${lesson.objectives.map(obj => `<li>${obj}</li>`).join('')}
                        </ul>
                        
                        <p><strong>Estimated Time:</strong> ${lesson.estimatedTime}</p>
                        <p><strong>Difficulty:</strong> ${lesson.difficulty}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="window.lessonIndex.startLesson('${lesson.id}')" data-bs-dismiss="modal">
                            Start Lesson
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        if (window.bootstrap) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
            });
        }
    }
    
    /**
     * Get lesson title by ID
     * @param {string} lessonId - The lesson ID
     * @returns {string} Lesson title
     */
    getLessonTitle(lessonId) {
        const lesson = this.lessonsData?.lessons.find(l => l.id === lessonId);
        return lesson ? lesson.title : lessonId;
    }
    
    /**
     * Update progress display
     */
    updateProgress() {
        const progress = window.aiTerminalTutor?.progress || {};
        
        // Update overall progress
        const completedLessons = progress.completedLessons?.length || 0;
        const totalLessons = this.lessonsData?.lessons.length || 19;
        const completionRate = Math.round((completedLessons / totalLessons) * 100);
        
        document.getElementById('completion-rate').textContent = `${completionRate}%`;
        document.getElementById('lessons-completed').textContent = completedLessons;
        document.getElementById('time-spent').textContent = `${progress.timeSpent || 0}h`;
        document.getElementById('streak').textContent = progress.streak || 0;
        document.getElementById('exercises-completed').textContent = progress.exercisesCompleted || 0;
        
        // Update overall progress bar
        const progressBar = document.getElementById('overall-progress');
        if (progressBar) {
            progressBar.style.width = `${completionRate}%`;
            progressBar.textContent = `${completionRate}%`;
            progressBar.setAttribute('aria-valuenow', completionRate);
        }
        
        // Update category progress
        this.updateCategoryProgress();
    }
    
    /**
     * Update category progress bars
     */
    updateCategoryProgress() {
        const progress = window.aiTerminalTutor?.progress || {};
        const completedLessons = progress.completedLessons || [];
        
        const categories = [
            { name: 'foundation', lessons: ['zsh-basics', 'tmux-fundamentals', 'cli-tools-essentials', 'ssh-remote-development'] },
            { name: 'editor-transition', lessons: ['neovim-installation', 'vim-motions-mastery', 'lsp-setup', 'essential-plugins', 'ai-plugins-integration', 'advanced-neovim-config'] },
            { name: 'ai-workflow-tools', lessons: ['tmux-layouts-ai', 'cloud-cli-tools', 'jupyter-terminal', 'model-monitoring'] },
            { name: 'advanced-integration', lessons: ['automation-scripts', 'neovim-repl-integration', 'tmuxinator-automation', 'performance-profiling', 'terminal-ai-mastery'] }
        ];
        
        categories.forEach(category => {
            const completedInCategory = category.lessons.filter(lesson => completedLessons.includes(lesson)).length;
            const progress = (completedInCategory / category.lessons.length) * 100;
            
            const progressBar = document.querySelector(`.${category.name}-progress`);
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
        });
    }
    
    /**
     * Generate lesson recommendations
     */
    generateRecommendations() {
        const progress = window.aiTerminalTutor?.progress || {};
        const completedLessons = progress.completedLessons || [];
        const recommendations = [];
        
        if (!this.lessonsData) return;
        
        // Find next lessons to take
        const availableLessons = this.lessonsData.lessons.filter(lesson => {
            if (completedLessons.includes(lesson.id)) return false;
            
            // Check if prerequisites are met
            const prerequisites = lesson.prerequisites || [];
            return prerequisites.every(prereq => completedLessons.includes(prereq));
        });
        
        // Sort by category order and take first 3
        const sortedLessons = availableLessons.sort((a, b) => {
            const categoryOrder = { 'foundation': 1, 'editor-transition': 2, 'ai-workflow-tools': 3, 'advanced-integration': 4 };
            return categoryOrder[a.category] - categoryOrder[b.category];
        });
        
        recommendations.push(...sortedLessons.slice(0, 3));
        
        this.renderRecommendations(recommendations);
    }
    
    /**
     * Render lesson recommendations
     * @param {Array} recommendations - Array of recommended lessons
     */
    renderRecommendations(recommendations) {
        const container = document.getElementById('recommendations');
        if (!container) return;
        
        if (recommendations.length === 0) {
            container.innerHTML = '<p class="text-muted">No recommendations available. Great job on your progress!</p>';
            return;
        }
        
        container.innerHTML = recommendations.map(lesson => `
            <div class="recommendation-card">
                <div class="recommendation-header">
                    <span class="lesson-category">${lesson.category.replace('-', ' ')}</span>
                    <span class="lesson-difficulty badge badge-${lesson.difficulty}">${lesson.difficulty}</span>
                </div>
                <h6 class="recommendation-title">${lesson.title}</h6>
                <p class="recommendation-description">${lesson.description}</p>
                <div class="recommendation-actions">
                    <button class="btn btn-sm btn-primary" onclick="window.lessonIndex.startLesson('${lesson.id}')">
                        Start Lesson
                    </button>
                    <small class="text-muted">
                        <i class="fas fa-clock"></i> ${lesson.estimatedTime}
                    </small>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Render bookmarked lessons
     */
    renderBookmarkedLessons() {
        const container = document.getElementById('bookmarked-lessons');
        if (!container) return;
        
        const bookmarkedLessons = JSON.parse(localStorage.getItem('bookmarkedLessons') || '[]');
        
        if (bookmarkedLessons.length === 0) {
            container.innerHTML = '<p class="text-muted">No bookmarked lessons yet. Click the bookmark icon on any lesson to save it here.</p>';
            return;
        }
        
        const bookmarkedLessonData = bookmarkedLessons.map(id => 
            this.lessonsData?.lessons.find(lesson => lesson.id === id)
        ).filter(Boolean);
        
        container.innerHTML = bookmarkedLessonData.map(lesson => `
            <div class="bookmarked-lesson">
                <div class="bookmark-info">
                    <h6>${lesson.title}</h6>
                    <p class="text-muted">${lesson.category.replace('-', ' ')} • ${lesson.estimatedTime}</p>
                </div>
                <div class="bookmark-actions">
                    <button class="btn btn-sm btn-primary" onclick="window.lessonIndex.startLesson('${lesson.id}')">
                        Start
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="window.lessonIndex.toggleBookmark('${lesson.id}')">
                        <i class="fas fa-bookmark"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Continue learning - navigate to next available lesson
     */
    continueLearning() {
        const progress = window.aiTerminalTutor?.progress || {};
        const completedLessons = progress.completedLessons || [];
        
        if (!this.lessonsData) return;
        
        // Find the next available lesson
        const nextLesson = this.lessonsData.lessons.find(lesson => {
            if (completedLessons.includes(lesson.id)) return false;
            
            const prerequisites = lesson.prerequisites || [];
            return prerequisites.every(prereq => completedLessons.includes(prereq));
        });
        
        if (nextLesson) {
            this.startLesson(nextLesson.id);
        } else {
            alert('Congratulations! You have completed all available lessons.');
        }
    }
    
    /**
     * Reset progress
     */
    resetProgress() {
        if (window.aiTerminalTutor) {
            window.aiTerminalTutor.resetProgress();
        }
        
        // Clear bookmarks
        localStorage.removeItem('bookmarkedLessons');
        
        // Refresh page
        window.location.reload();
    }
    
    /**
     * Export progress
     */
    exportProgress() {
        if (window.aiTerminalTutor) {
            window.aiTerminalTutor.exportProgress();
        }
    }
    
    /**
     * Import progress
     */
    importProgress() {
        const fileInput = document.getElementById('progress-file');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Please select a file first.');
            return;
        }
        
        if (window.aiTerminalTutor) {
            window.aiTerminalTutor.importProgress(file);
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('importProgressModal'));
        if (modal) {
            modal.hide();
        }
    }
    
    /**
     * Open terminal simulator
     */
    openTerminal() {
        window.location.href = '../terminal-example.html';
    }
    
    /**
     * Scroll to category section
     * @param {string} category - Category name
     */
    scrollToCategory(category) {
        const categorySection = document.querySelector(`[data-category="${category}"]`);
        if (categorySection) {
            categorySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

// Initialize lesson manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('lessons/index.html') || window.location.pathname.endsWith('lessons/')) {
        // Initialize lesson index
        window.lessonIndex = new LessonIndex();
    } else {
        // Initialize regular lesson manager
        window.lessonManager = new LessonManager();
    }
});

// Export for use in other modules
window.LessonManager = LessonManager;
window.LessonIndex = LessonIndex;