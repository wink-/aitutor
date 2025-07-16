// Main JavaScript functionality for AI Terminal Tutor
class AITerminalTutor {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
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
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            icon.className = this.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
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
            ...this.progress
        };
    }
    
    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchLessons(e.target.value);
            });
        }
        
        // Lesson card clicks
        document.querySelectorAll('.lesson-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const lessonId = card.dataset.lessonId;
                if (lessonId) {
                    this.navigateToLesson(lessonId);
                }
            });
        });
    }
    
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.setupTheme();
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
            
            // Show completion notification
            this.showNotification(`Lesson completed! 🎉`, 'success');
        }
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
        // In a real application, this would send to analytics service
        console.log('Event:', {
            type: eventType,
            timestamp: new Date().toISOString(),
            ...data
        });
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
        const today = new Date();
        const lastActivity = this.progress.lastActivity ? new Date(this.progress.lastActivity) : null;
        
        if (lastActivity) {
            const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
            if (daysDiff === 1) {
                this.progress.streak++;
            } else if (daysDiff > 1) {
                this.progress.streak = 1;
            }
        } else {
            this.progress.streak = 1;
        }
    }
    
    addTimeSpent(minutes) {
        this.progress.timeSpent += minutes / 60;
        this.saveProgress();
        this.loadProgress();
    }
    
    saveProgress() {
        localStorage.setItem('progress', JSON.stringify(this.progress));
    }
    
    searchLessons(query) {
        const lessons = document.querySelectorAll('.lesson-card');
        const normalizedQuery = query.toLowerCase();
        
        lessons.forEach(lesson => {
            const title = lesson.querySelector('.card-title').textContent.toLowerCase();
            const description = lesson.querySelector('.card-text').textContent.toLowerCase();
            
            if (title.includes(normalizedQuery) || description.includes(normalizedQuery)) {
                lesson.style.display = 'block';
            } else {
                lesson.style.display = 'none';
            }
        });
    }
    
    navigateToLesson(lessonId) {
        window.location.href = `lessons/${lessonId}.html`;
    }
    
    showNotification(message, type = 'info') {
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
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.progress = { ...this.progress, ...data.progress };
                this.saveProgress();
                this.loadProgress();
                this.showNotification('Progress imported successfully!', 'success');
            } catch (error) {
                this.showNotification('Error importing progress file', 'danger');
            }
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

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.aiTerminalTutor = new AITerminalTutor();
});

// Utility functions
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
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

// Service Worker registration for offline functionality
if ('serviceWorker' in navigator) {
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