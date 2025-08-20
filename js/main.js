// Main JavaScript functionality for AI Terminal Tutor
class AITerminalTutor {
    constructor() {
        this.theme = 'dark'; // Always use dark mode
        this.progress = JSON.parse(localStorage.getItem('progress') || '{}');
        this.init();
    }
    
    init() {
        this.setupTheme();
        this.setupNavigation();
        this.setupProgress();
        this.setupEventListeners();
        this.loadProgress();
    }
    
    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        // Apply dark mode to body for immediate effect
        document.body.style.backgroundColor = '#1a1a1a';
        document.body.style.color = '#e0e0e0';
    }
    
    setupNavigation() {
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Active navigation highlighting
        window.addEventListener('scroll', () => {
            const sections = document.querySelectorAll('section[id]');
            const navLinks = document.querySelectorAll('.nav-link');
            
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (window.scrollY >= sectionTop - 200) {
                    current = section.getAttribute('id');
                }
            });
            
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
    }
    
    setupProgress() {
        this.progress = {
            lessonsCompleted: 0,
            totalLessons: 19,
            exercisesCompleted: 0,
            totalExercises: 45,
            timeSpent: 0,
            streak: 0,
            lastActivity: null,
            completedLessons: [],
            preferences: {
                fontSize: 'medium',
                reducedMotion: false,
                highContrast: false,
                screenReader: false
            },
            ...this.progress
        };
        
        // Apply accessibility preferences
        this.applyAccessibilityPreferences();
    }
    
    applyAccessibilityPreferences() {
        const { preferences } = this.progress;
        
        // Font size
        document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');
        document.documentElement.classList.add(`font-${preferences.fontSize}`);
        
        // Reduced motion
        if (preferences.reducedMotion) {
            document.documentElement.classList.add('reduced-motion');
        }
        
        // High contrast
        if (preferences.highContrast) {
            document.documentElement.classList.add('high-contrast');
        }
        
        // Screen reader optimizations
        if (preferences.screenReader) {
            document.documentElement.classList.add('screen-reader');
        }
    }
    
    setupEventListeners() {
        // Search functionality with debounce
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            const debouncedSearch = debounce((value) => {
                this.searchLessons(value);
            }, 300);
            
            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
            
            // Clear search on Escape
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    this.searchLessons('');
                    this.announceToScreenReader('Search cleared');
                }
            });
        }
        
        // Lesson card clicks with keyboard support
        document.querySelectorAll('.lesson-card').forEach(card => {
            // Make cards focusable
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `View lesson: ${card.querySelector('.card-title')?.textContent || 'Unknown lesson'}`);
            
            const handleActivation = (e) => {
                if (e.type === 'click' || (e.type === 'keydown' && (e.key === 'Enter' || e.key === ' '))) {
                    if (e.type === 'keydown') e.preventDefault();
                    const lessonId = card.dataset.lessonId;
                    if (lessonId) {
                        this.navigateToLesson(lessonId);
                    }
                }
            };
            
            card.addEventListener('click', handleActivation);
            card.addEventListener('keydown', handleActivation);
        });
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Skip if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            if (e.altKey) {
                switch (e.key) {
                    case 'h':
                        e.preventDefault();
                        this.showKeyboardShortcuts();
                        break;
                    case 's':
                        e.preventDefault();
                        const searchInput = document.getElementById('search-input');
                        if (searchInput) {
                            searchInput.focus();
                        }
                        break;
                    case 'p':
                        e.preventDefault();
                        this.showAccessibilityPanel();
                        break;
                }
            }
        });
        
        // Focus management for better keyboard navigation
        this.setupFocusManagement();
    }
    
    setupFocusManagement() {
        // Skip links for keyboard users
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        skipLink.setAttribute('aria-label', 'Skip to main content');
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Focus trap for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const modal = document.querySelector('.modal.show');
                if (modal) {
                    this.trapFocus(e, modal);
                }
            }
        });
    }
    
    trapFocus(e, container) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }
    
    showKeyboardShortcuts() {
        const shortcuts = [
            { key: 'Alt + H', action: 'Show this help dialog' },
            { key: 'Alt + S', action: 'Focus search input' },
            { key: 'Alt + P', action: 'Open accessibility preferences' },
            { key: 'Tab', action: 'Navigate between interactive elements' },
            { key: 'Enter/Space', action: 'Activate focused element' },
            { key: 'Escape', action: 'Close modal or clear search' }
        ];
        
        const modal = this.createModal('Keyboard Shortcuts', 
            shortcuts.map(s => `<div class="shortcut-item"><kbd>${s.key}</kbd><span>${s.action}</span></div>`).join(''),
            [{ text: 'Close', action: 'close' }]
        );
        
        this.showModal(modal);
    }
    
    showAccessibilityPanel() {
        const { preferences } = this.progress;
        
        const content = `
            <div class="accessibility-panel">
                <div class="preference-group">
                    <label for="font-size-select">Font Size:</label>
                    <select id="font-size-select" class="form-select">
                        <option value="small" ${preferences.fontSize === 'small' ? 'selected' : ''}>Small</option>
                        <option value="medium" ${preferences.fontSize === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="large" ${preferences.fontSize === 'large' ? 'selected' : ''}>Large</option>
                    </select>
                </div>
                
                <div class="preference-group">
                    <label class="form-check-label">
                        <input type="checkbox" id="reduced-motion" class="form-check-input" 
                               ${preferences.reducedMotion ? 'checked' : ''}>
                        Reduce motion and animations
                    </label>
                </div>
                
                <div class="preference-group">
                    <label class="form-check-label">
                        <input type="checkbox" id="high-contrast" class="form-check-input" 
                               ${preferences.highContrast ? 'checked' : ''}>
                        High contrast mode
                    </label>
                </div>
                
                <div class="preference-group">
                    <label class="form-check-label">
                        <input type="checkbox" id="screen-reader" class="form-check-input" 
                               ${preferences.screenReader ? 'checked' : ''}>
                        Screen reader optimizations
                    </label>
                </div>
            </div>
        `;
        
        const modal = this.createModal('Accessibility Preferences', content, [
            { text: 'Save', action: 'save', primary: true },
            { text: 'Cancel', action: 'close' }
        ]);
        
        modal.querySelector('.btn-primary').addEventListener('click', () => {
            this.saveAccessibilityPreferences();
            this.hideModal(modal);
        });
        
        this.showModal(modal);
    }
    
    saveAccessibilityPreferences() {
        const fontSize = document.getElementById('font-size-select').value;
        const reducedMotion = document.getElementById('reduced-motion').checked;
        const highContrast = document.getElementById('high-contrast').checked;
        const screenReader = document.getElementById('screen-reader').checked;
        
        this.progress.preferences = {
            fontSize,
            reducedMotion,
            highContrast,
            screenReader
        };
        
        this.applyAccessibilityPreferences();
        this.saveProgress();
        this.showNotification('Accessibility preferences saved', 'success');
        this.announceToScreenReader('Accessibility preferences updated');
    }
    
    
    loadProgress() {
        // Update progress display
        const elements = {
            'lessons-completed': this.progress.lessonsCompleted,
            'total-lessons': this.progress.totalLessons,
            'exercises-completed': this.progress.exercisesCompleted,
            'total-exercises': this.progress.totalExercises,
            'time-spent': `${this.progress.timeSpent}h`,
            'streak': this.progress.streak
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Update overall progress bar
        const overallProgress = (this.progress.lessonsCompleted / this.progress.totalLessons) * 100;
        const progressBar = document.getElementById('overall-progress');
        if (progressBar) {
            progressBar.style.width = `${overallProgress}%`;
            progressBar.textContent = `${Math.round(overallProgress)}%`;
        }
        
        // Update category progress bars
        this.updateCategoryProgress();
    }
    
    updateCategoryProgress() {
        const categories = [
            { name: 'foundation', lessons: 4, startIndex: 0 },
            { name: 'editor', lessons: 6, startIndex: 4 },
            { name: 'ai-workflows', lessons: 4, startIndex: 10 },
            { name: 'advanced', lessons: 5, startIndex: 14 }
        ];
        
        categories.forEach(category => {
            const completedInCategory = this.progress.completedLessons.filter(
                lessonId => {
                    const index = parseInt(lessonId.split('-')[1]);
                    return index >= category.startIndex && index < category.startIndex + category.lessons;
                }
            ).length;
            
            const progress = (completedInCategory / category.lessons) * 100;
            const progressBar = document.querySelector(`.${category.name}-progress`);
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
        });
    }
    
    completeLesson(lessonId) {
        if (!this.progress.completedLessons.includes(lessonId)) {
            this.progress.completedLessons.push(lessonId);
            this.progress.lessonsCompleted++;
            this.progress.lastActivity = new Date().toISOString();
            
            // Update streak
            this.updateStreak();
            
            this.saveProgress();
            this.loadProgress();
            
            // Show completion notification with celebration
            this.showNotification(`Lesson completed! 🎉`, 'success', 7000);
            this.announceToScreenReader(`Congratulations! You have completed the lesson. Your progress has been saved.`);
            
            // Trigger celebration animation if not reduced motion
            if (!this.progress.preferences.reducedMotion) {
                this.triggerCelebration();
            }
            
            // Track achievement
            this.trackEvent('lesson_completed', {
                lessonId,
                totalCompleted: this.progress.lessonsCompleted,
                streak: this.progress.streak
            });
        }
    }
    
    triggerCelebration() {
        // Create confetti effect
        const celebrationContainer = document.createElement('div');
        celebrationContainer.className = 'celebration-container';
        celebrationContainer.innerHTML = '🎉🎊✨🏆🌟';
        celebrationContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 2rem;
            z-index: 9999;
            pointer-events: none;
            animation: celebration 2s ease-out forwards;
        `;
        
        document.body.appendChild(celebrationContainer);
        
        setTimeout(() => {
            celebrationContainer.remove();
        }, 2000);
    }
    
    markLessonComplete(lessonId) {
        this.completeLesson(lessonId);
    }
    
    getProgress() {
        return this.progress;
    }
    
    trackLessonView(lessonId) {
        // Track lesson view for analytics
        this.trackEvent('lesson_view', { lessonId });
    }
    
    trackEvent(eventType, data = {}) {
        try {
            // Validate event data
            if (typeof eventType !== 'string' || !eventType.trim()) {
                console.warn('Invalid event type:', eventType);
                return;
            }
            
            // Sanitize data to prevent potential security issues
            const sanitizedData = {};
            Object.entries(data).forEach(([key, value]) => {
                if (typeof key === 'string' && key.length < 100) {
                    // Only include safe, reasonable-sized data
                    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                        sanitizedData[key] = typeof value === 'string' ? 
                            (window.sanitizeInput ? window.sanitizeInput(value) : value) : 
                            value;
                    }
                }
            });
            
            const event = {
                type: eventType.trim(),
                timestamp: new Date().toISOString(),
                url: window.location.pathname,
                userAgent: navigator.userAgent.substring(0, 200), // Limit length
                ...sanitizedData
            };
            
            // In a real application, this would send to analytics service
            console.log('Event:', event);
            
            // Store locally for debugging (with size limit)
            try {
                const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
                events.push(event);
                
                // Keep only last 100 events to prevent storage bloat
                if (events.length > 100) {
                    events.splice(0, events.length - 100);
                }
                
                localStorage.setItem('analytics_events', JSON.stringify(events));
            } catch (storageError) {
                console.warn('Failed to store analytics event:', storageError);
            }
            
        } catch (error) {
            console.error('Error tracking event:', error);
        }
    }
    
    announceToScreenReader(message) {
        // Create a live region for screen reader announcements
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    completeExercise(exerciseId) {
        if (!this.progress.completedExercises) {
            this.progress.completedExercises = [];
        }
        
        if (!this.progress.completedExercises.includes(exerciseId)) {
            this.progress.completedExercises.push(exerciseId);
            this.progress.exercisesCompleted++;
            this.saveProgress();
            this.loadProgress();
        }
    }
    
    updateStreak() {
        try {
            const today = new Date();
            const lastActivity = this.progress.lastActivity ? new Date(this.progress.lastActivity) : null;
            
            if (lastActivity && !isNaN(lastActivity.getTime())) {
                const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
                
                // Validate the date difference is reasonable
                if (daysDiff < 0 || daysDiff > 365) {
                    console.warn('Invalid date difference for streak calculation:', daysDiff);
                    this.progress.streak = 1;
                } else if (daysDiff === 1) {
                    this.progress.streak = Math.max(0, this.progress.streak) + 1;
                } else if (daysDiff > 1) {
                    this.progress.streak = 1;
                }
                // If daysDiff === 0, keep current streak
            } else {
                this.progress.streak = 1;
            }
            
            // Ensure streak is a valid number
            if (!Number.isInteger(this.progress.streak) || this.progress.streak < 0) {
                this.progress.streak = 1;
            }
            
        } catch (error) {
            console.error('Error updating streak:', error);
            this.progress.streak = 1;
        }
    }
    
    addTimeSpent(minutes) {
        this.progress.timeSpent += minutes / 60;
        this.saveProgress();
        this.loadProgress();
    }
    
    saveProgress() {
        try {
            // Validate progress data before saving
            if (window.validateProgress) {
                const validation = window.validateProgress(this.progress);
                if (!validation.valid) {
                    console.warn('Invalid progress data:', validation.errors);
                    // Continue saving anyway, but log the issues
                }
            }
            
            localStorage.setItem('progress', JSON.stringify(this.progress));
        } catch (error) {
            console.error('Failed to save progress:', error);
            this.showNotification('Failed to save your progress', 'danger');
        }
    }
    
    searchLessons(query) {
        // Validate search query
        if (window.validateSearchQuery) {
            const validation = window.validateSearchQuery(query);
            if (!validation.valid) {
                this.showNotification(validation.errors[0], 'warning');
                return;
            }
            query = validation.value; // Use sanitized query
        }
        
        const lessons = document.querySelectorAll('.lesson-card');
        const normalizedQuery = query.toLowerCase().trim();
        
        let visibleCount = 0;
        
        lessons.forEach(lesson => {
            const title = lesson.querySelector('.card-title')?.textContent?.toLowerCase() || '';
            const description = lesson.querySelector('.card-text')?.textContent?.toLowerCase() || '';
            const category = lesson.dataset.category?.toLowerCase() || '';
            
            const isMatch = !normalizedQuery || 
                title.includes(normalizedQuery) || 
                description.includes(normalizedQuery) ||
                category.includes(normalizedQuery);
            
            if (isMatch) {
                lesson.style.display = 'block';
                lesson.parentElement.style.display = 'block';
                visibleCount++;
                
                // Highlight search terms
                this.highlightSearchTerms(lesson, normalizedQuery);
            } else {
                lesson.style.display = 'none';
                lesson.parentElement.style.display = 'none';
            }
        });
        
        // Update search results count
        this.updateSearchResults(visibleCount, normalizedQuery);
    }
    
    highlightSearchTerms(element, query) {
        if (!query) {
            // Remove existing highlights
            element.querySelectorAll('.search-highlight').forEach(highlight => {
                const parent = highlight.parentNode;
                parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
                parent.normalize();
            });
            return;
        }
        
        const textElements = element.querySelectorAll('.card-title, .card-text');
        textElements.forEach(textEl => {
            const text = textEl.textContent;
            const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            const highlightedText = text.replace(regex, '<mark class="search-highlight">$1</mark>');
            if (highlightedText !== text) {
                textEl.innerHTML = highlightedText;
            }
        });
    }
    
    updateSearchResults(count, query) {
        let resultsEl = document.getElementById('search-results');
        if (!resultsEl) {
            resultsEl = document.createElement('div');
            resultsEl.id = 'search-results';
            resultsEl.className = 'search-results alert alert-info';
            resultsEl.setAttribute('role', 'status');
            resultsEl.setAttribute('aria-live', 'polite');
            
            const searchContainer = document.querySelector('.search-container');
            if (searchContainer) {
                searchContainer.appendChild(resultsEl);
            }
        }
        
        if (query) {
            resultsEl.textContent = `Found ${count} lesson${count !== 1 ? 's' : ''} matching "${query}"`;
            resultsEl.style.display = 'block';
        } else {
            resultsEl.style.display = 'none';
        }
    }
    
    navigateToLesson(lessonId) {
        window.location.href = `lessons/${lessonId}.html`;
    }
    
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show notification`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        notification.setAttribute('aria-atomic', 'true');
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1050;
            min-width: 300px;
            max-width: 400px;
        `;
        
        const icon = this.getNotificationIcon(type);
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="${icon} me-2" aria-hidden="true"></i>
                <span class="flex-grow-1">${message}</span>
                <button type="button" class="btn-close" aria-label="Close notification"></button>
            </div>
        `;
        
        const closeBtn = notification.querySelector('.btn-close');
        closeBtn.addEventListener('click', () => {
            this.hideNotification(notification);
        });
        
        document.body.appendChild(notification);
        
        // Auto-dismiss
        const timer = setTimeout(() => {
            this.hideNotification(notification);
        }, duration);
        
        // Pause timer on hover/focus
        notification.addEventListener('mouseenter', () => clearTimeout(timer));
        notification.addEventListener('mouseleave', () => {
            setTimeout(() => this.hideNotification(notification), 2000);
        });
        
        // Announce to screen readers
        this.announceToScreenReader(message);
    }
    
    getNotificationIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            danger: 'fas fa-exclamation-triangle',
            warning: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }
    
    hideNotification(notification) {
        notification.classList.remove('show');
        notification.classList.add('fade');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 150);
    }
    
    createModal(title, content, buttons = []) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'modal-title');
        modal.setAttribute('aria-modal', 'true');
        
        const buttonsHtml = buttons.map(btn => {
            const btnClass = btn.primary ? 'btn-primary' : 'btn-secondary';
            const action = btn.action === 'close' ? 'data-bs-dismiss="modal"' : '';
            return `<button type="button" class="btn ${btnClass}" ${action}>${btn.text}</button>`;
        }).join('');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        ${buttonsHtml}
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }
    
    showModal(modal) {
        document.body.appendChild(modal);
        
        if (window.bootstrap) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            
            // Focus first focusable element when modal opens
            modal.addEventListener('shown.bs.modal', () => {
                const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (firstFocusable) {
                    firstFocusable.focus();
                }
            });
            
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
            });
        }
    }
    
    hideModal(modal) {
        if (window.bootstrap) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
    }
    
    exportProgress() {
        const data = {
            progress: this.progress,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ai-terminal-tutor-progress.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    importProgress(file) {
        // Validate file
        if (!file) {
            this.showNotification('No file selected', 'warning');
            return;
        }
        
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            this.showNotification('Please select a valid JSON file', 'warning');
            return;
        }
        
        if (file.size > 1024 * 1024) { // 1MB limit
            this.showNotification('File is too large. Maximum size is 1MB', 'warning');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validate imported data structure
                if (!data || typeof data !== 'object') {
                    throw new Error('Invalid file format');
                }
                
                if (!data.progress || typeof data.progress !== 'object') {
                    throw new Error('No progress data found in file');
                }
                
                // Validate progress data
                if (window.validateProgress) {
                    const validation = window.validateProgress(data.progress);
                    if (!validation.valid) {
                        console.warn('Some imported data is invalid:', validation.errors);
                        // Use sanitized data
                        data.progress = validation.data;
                    }
                }
                
                // Merge with existing progress
                this.progress = { ...this.progress, ...data.progress };
                this.saveProgress();
                this.loadProgress();
                this.showNotification('Progress imported successfully!', 'success');
                
            } catch (error) {
                console.error('Import error:', error);
                this.showNotification(
                    `Error importing progress file: ${error.message}`,
                    'danger'
                );
            }
        };
        
        reader.onerror = () => {
            this.showNotification('Failed to read file', 'danger');
        };
        
        reader.readAsText(file);
    }
    
    resetProgress() {
        if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
            localStorage.removeItem('progress');
            this.setupProgress();
            this.loadProgress();
            this.showNotification('Progress reset successfully', 'info');
        }
    }
}

// Initialize the application with error handling
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.aiTerminalTutor = new AITerminalTutor();
        
        // Add loading state management
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');
        
        // Announce application ready to screen readers
        setTimeout(() => {
            announceToScreenReader('AI Terminal Tutor application loaded and ready');
        }, 500);
        
    } catch (error) {
        handleError(error, 'Application initialization failed');
        
        // Fallback UI
        document.body.innerHTML = `
            <div class="error-fallback">
                <h1>Something went wrong</h1>
                <p>The application failed to load. Please refresh the page to try again.</p>
                <button onclick="window.location.reload()">Refresh Page</button>
            </div>
        `;
    }
});

// Enhanced utility functions
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

// Accessibility utilities
function announceToScreenReader(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
    `;
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

function getPreferredColorScheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

function getPreferredReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Performance utilities
function measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    if (window.aiTerminalTutor) {
        window.aiTerminalTutor.trackEvent('performance', {
            operation: name,
            duration: end - start
        });
    }
    
    return result;
}

// Error handling utilities
function handleError(error, context = '') {
    console.error('Application Error:', error, context);
    
    if (window.aiTerminalTutor) {
        window.aiTerminalTutor.trackEvent('error', {
            message: error.message,
            context,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
    
    // Show user-friendly error message
    if (window.aiTerminalTutor && window.aiTerminalTutor.showNotification) {
        window.aiTerminalTutor.showNotification(
            'An error occurred. Please refresh the page if problems persist.',
            'danger'
        );
    }
}

// Set up global error handling
window.addEventListener('error', (event) => {
    handleError(event.error, `Global error: ${event.filename}:${event.lineno}`);
});

window.addEventListener('unhandledrejection', (event) => {
    handleError(event.reason, 'Unhandled promise rejection');
});

// Service Worker registration for offline functionality
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Performance monitoring
if ('performance' in window && 'PerformanceObserver' in window) {
    // Monitor Largest Contentful Paint
    const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        // Track performance metrics for analytics
        if (window.aiTerminalTutor) {
            window.aiTerminalTutor.trackEvent('performance', {
                metric: 'LCP',
                value: lastEntry.startTime,
                url: window.location.pathname
            });
        }
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
}

// Accessibility enhancements
document.addEventListener('DOMContentLoaded', () => {
    // Add proper ARIA labels to interactive elements
    document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(button => {
        if (!button.textContent.trim()) {
            button.setAttribute('aria-label', 'Button');
        }
    });
    
    // Add landmarks for better screen reader navigation
    const main = document.querySelector('main');
    if (!main) {
        const mainContent = document.querySelector('#main-content, .main-content, .container');
        if (mainContent && !mainContent.getAttribute('role')) {
            mainContent.setAttribute('role', 'main');
        }
    }
    
    // Enhance focus indicators
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });
});