class HabitTrackerPro {
    constructor() {
        this.habits = JSON.parse(localStorage.getItem('habits')) || [];
        this.currentView = 'weekly';
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.theme = localStorage.getItem('theme') || 'light';

        this.init();
    }

    init() {
        this.applyTheme();
        this.bindEvents();
        this.render();
        this.setupServiceWorker();
        this.checkReminders();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = this.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    bindEvents() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // View controls
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.dataset.view));
        });

        // Modal controls
        document.getElementById('addHabitModalBtn').addEventListener('click', () => this.showModal('add'));
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.hideModals());
        });

        // Form submission
        document.getElementById('habitForm').addEventListener('submit', (e) => this.handleAddHabit(e));

        // Monthly view navigation
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));

        // Filter and search
        document.getElementById('categoryFilter').addEventListener('change', () => this.render());
        document.getElementById('searchHabits').addEventListener('input', () => this.render());

        // Export functionality
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());

        // Close modal on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModals();
            }
        });
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    }

    switchView(view) {
        this.currentView = view;

        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Show/hide views
        document.getElementById('habitsContainer').classList.toggle('hidden', view !== 'weekly');
        document.getElementById('monthlyView').classList.toggle('hidden', view !== 'monthly');
        document.getElementById('streaksView').classList.toggle('hidden', view !== 'streaks');

        if (view === 'monthly') {
            this.renderMonthlyView();
        } else if (view === 'streaks') {
            this.renderStreaksView();
        } else {
            this.render();
        }
    }

    showModal(type, habitId = null) {
        const modalId = type === 'add' ? 'addHabitModal' : 'editHabitModal';
        document.getElementById(modalId).classList.remove('hidden');

        if (type === 'edit' && habitId) {
            this.populateEditForm(habitId);
        }
    }

    hideModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
        document.getElementById('habitForm').reset();
    }

    handleAddHabit(e) {
        e.preventDefault();

        const habit = {
            id: Date.now(),
            name: document.getElementById('habitName').value,
            category: document.getElementById('habitCategory').value,
            frequency: document.getElementById('habitFrequency').value,
            reminder: document.getElementById('habitReminder').value,
            color: document.querySelector('input[name="habitColor"]:checked').value,
            completed: {},
            streak: 0,
            longestStreak: 0,
            createdAt: new Date().toISOString()
        };

        this.habits.push(habit);
        this.saveToLocalStorage();
        this.render();
        this.hideModals();
        this.showNotification('Habit added successfully!', 'success');
    }

    deleteHabit(id) {
        if (confirm('Are you sure you want to delete this habit?')) {
            this.habits = this.habits.filter(habit => habit.id !== id);
            this.saveToLocalStorage();
            this.render();
            this.showNotification('Habit deleted', 'warning');
        }
    }

    editHabit(id) {
        this.showModal('edit', id);
    }

    populateEditForm(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (habit) {
            // Populate form fields
            document.getElementById('editHabitName').value = habit.name;
            // ... populate other fields
        }
    }

    toggleDay(habitId, date) {
        const habit = this.habits.find(h => h.id === habitId);
        if (habit) {
            const dateStr = date.toISOString().split('T')[0];

            if (habit.completed[dateStr]) {
                delete habit.completed[dateStr];
            } else {
                habit.completed[dateStr] = true;
            }

            this.updateStreak(habit);
            this.saveToLocalStorage();
            this.render();
        }
    }

    updateStreak(habit) {
        const dates = Object.keys(habit.completed)
            .map(d => new Date(d))
            .sort((a, b) => b - a);

        let currentStreak = 0;
        let currentDate = new Date();

        // Reset to today's date at start of day
        currentDate.setHours(0, 0, 0, 0);

        for (let i = 0; i < dates.length; i++) {
            const habitDate = new Date(dates[i]);
            habitDate.setHours(0, 0, 0, 0);

            const diffTime = currentDate - habitDate;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);

            if (diffDays === i) {
                currentStreak++;
            } else {
                break;
            }
        }

        habit.streak = currentStreak;
        habit.longestStreak = Math.max(habit.longestStreak, currentStreak);
    }

    getFilteredHabits() {
        const categoryFilter = document.getElementById('categoryFilter').value;
        const searchTerm = document.getElementById('searchHabits').value.toLowerCase();

        return this.habits.filter(habit => {
            const categoryMatch = categoryFilter === 'all' || habit.category === categoryFilter;
            const searchMatch = habit.name.toLowerCase().includes(searchTerm);
            return categoryMatch && searchMatch;
        });
    }

    render() {
        if (this.currentView !== 'weekly') return;

        const container = document.getElementById('habitsContainer');
        const filteredHabits = this.getFilteredHabits();

        if (filteredHabits.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        container.innerHTML = filteredHabits.map(habit => this.renderHabit(habit)).join('');
        this.updateQuickStats();
    }

    renderHabit(habit) {
        const week = this.getCurrentWeek();
        const completedCount = week.filter(day => {
            const dateStr = day.toISOString().split('T')[0];
            return habit.completed[dateStr];
        }).length;

        const progress = (completedCount / 7) * 100;

        return `
            <div class="habit-item fade-in" style="border-left-color: ${habit.color}">
                <div class="habit-header">
                    <div class="habit-info">
                        <h3 class="habit-name">${habit.name}</h3>
                        <span class="habit-category">${habit.category}</span>
                        ${habit.reminder ? `<span class="reminder-badge"><i class="fas fa-bell"></i> ${habit.reminder}</span>` : ''}
                    </div>
                    <div class="habit-actions">
                        <button class="btn-edit" onclick="tracker.editHabit(${habit.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete" onclick="tracker.deleteHabit(${habit.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>

                <div class="week-grid">
                    ${week.map((day, index) => {
                        const dateStr = day.toISOString().split('T')[0];
                        const isChecked = habit.completed[dateStr];
                        const isToday = this.isToday(day);

                        return `
                            <div class="day ${isChecked ? 'checked' : ''} ${isToday ? 'today' : ''}"
                                 onclick="tracker.toggleDay(${habit.id}, new Date('${day.toISOString()}'))"
                                 style="${isChecked ? `background: ${habit.color}; border-color: ${habit.color}` : ''}">
                                <div class="day-label">
                                    ${day.toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                                <div class="date">
                                    ${day.getDate()}
                                </div>
                                ${isToday ? '<div class="today-indicator"></div>' : ''}
                            </div>
                        `;
                    }).join('')}
                </div>

                <div class="habit-progress">
                    <div class="progress-info">
                        <span>${completedCount}/7 days completed</span>
                        <span>Streak: ${habit.streak} days</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%; background: ${habit.color}"></div>
                    </div>
                </div>
            </div>
        `;
    }

    renderMonthlyView() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('currentMonth').textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;

        const calendarGrid = document.getElementById('calendarGrid');
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        let calendarHTML = '';

        // Add empty cells for days before the first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }

        // Add days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(this.currentYear, this.currentMonth, day);
            const dateStr = date.toISOString().split('T')[0];
            const completedHabits = this.habits.filter(habit => habit.completed[dateStr]).length;
            const totalHabits = this.habits.length;
            const completionRate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

            let dayClass = 'calendar-day';
            if (completionRate === 100) dayClass += ' checked';
            else if (completionRate > 0) dayClass += ' partial';

            calendarHTML += `
                <div class="${dayClass}" title="${completedHabits}/${totalHabits} habits completed">
                    ${day}
                    <div class="completion-dot" style="opacity: ${completionRate / 100}"></div>
                </div>
            `;
        }

        calendarGrid.innerHTML = calendarHTML;
    }

    renderStreaksView() {
        const container = document.getElementById('streaksContainer');
        const sortedHabits = [...this.habits].sort((a, b) => b.streak - a.streak);

        container.innerHTML = sortedHabits.map(habit => `
            <div class="streak-item fade-in">
                <div class="streak-info">
                    <h4>${habit.name}</h4>
                    <p>Current streak: ${habit.streak} days | Longest: ${habit.longestStreak} days</p>
                </div>
                <div class="streak-count">
                    ${habit.streak}
                </div>
            </div>
        `).join('');
    }

    updateQuickStats() {
        const statsContainer = document.getElementById('quickStats');

        const totalHabits = this.habits.length;
        const completedToday = this.habits.filter(habit => {
            const today = new Date().toISOString().split('T')[0];
            return habit.completed[today];
        }).length;

        const totalCompletions = this.habits.reduce((sum, habit) =>
            sum + Object.keys(habit.completed).length, 0
        );

        const averageCompletion = totalHabits > 0 ?
            Math.round((completedToday / totalHabits) * 100) : 0;

        const activeStreaks = this.habits.filter(habit => habit.streak > 0).length;

        statsContainer.innerHTML = `
            <div class="stat-card ${averageCompletion >= 80 ? 'good' : averageCompletion >= 50 ? 'warning' : 'danger'}">
                <div class="stat-value">${averageCompletion}%</div>
                <div class="stat-label">Today's Completion</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${completedToday}/${totalHabits}</div>
                <div class="stat-label">Habits Today</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${activeStreaks}</div>
                <div class="stat-label">Active Streaks</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalCompletions}</div>
                <div class="stat-label">Total Completions</div>
            </div>
        `;
    }

    getCurrentWeek() {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        const week = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            week.push(day);
        }
        return week;
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    changeMonth(direction) {
        this.currentMonth += direction;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.renderMonthlyView();
    }

    exportData() {
        const data = {
            habits: this.habits,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `habit-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showNotification('Data exported successfully!', 'success');
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'warning' ? 'exclamation-triangle' : 'info'}"></i>
            ${message}
        `;

        container.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    checkReminders() {
        // Simple reminder check - in a real app, you'd use more sophisticated scheduling
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' +
                           now.getMinutes().toString().padStart(2, '0');

        this.habits.forEach(habit => {
            if (habit.reminder === currentTime) {
                this.showNotification(`Reminder: Time for ${habit.name}`, 'info');
            }
        });
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(console.error);
        }
    }

    getEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-clipboard-list" style="font-size: 4em; margin-bottom: 20px; opacity: 0.5;"></i>
                <h3>No habits yet</h3>
                <p>Start building your routine by adding your first habit!</p>
                <button class="btn-primary" onclick="tracker.showModal('add')" style="margin-top: 20px;">
                    <i class="fas fa-plus"></i> Add Your First Habit
                </button>
            </div>
        `;
    }

    saveToLocalStorage() {
        localStorage.setItem('habits', JSON.stringify(this.habits));
    }
}

// Initialize the enhanced app
const tracker = new HabitTrackerPro();

// Add some sample data for demonstration
if (!localStorage.getItem('habits') || JSON.parse(localStorage.getItem('habits')).length === 0) {
    const sampleHabits = [
        {
            id: 1,
            name: "Morning Meditation",
            category: "health",
            frequency: "daily",
            reminder: "07:00",
            color: "#667eea",
            completed: {},
            streak: 0,
            longestStreak: 0,
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            name: "30 Minute Workout",
            category: "health",
            frequency: "daily",
            color: "#51cf66",
            completed: {},
            streak: 0,
            longestStreak: 0,
            createdAt: new Date().toISOString()
        }
    ];
    localStorage.setItem('habits', JSON.stringify(sampleHabits));
}
