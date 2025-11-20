import React from 'react';
import Modal from './Modal';

function StatsModal({ isOpen, onClose, habits }) {
    const getDetailedStatistics = () => {
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        return {
            totalHabits: habits.length,
            completedToday: habits.filter(h => h.dates[today]).length,
            weeklyCompletion: getWeeklyCompletionRate(),
            longestStreak: Math.max(...habits.map(h => calculateStreak(h.dates)), 0),
            totalCompletions: habits.reduce((sum, h) => sum + Object.keys(h.dates).filter(d => h.dates[d]).length, 0),
            mostConsistentHabit: getMostConsistentHabit(),
            completionTrend: getCompletionTrend(),
            averageCompletionRate: getAverageCompletionRate(),
            habitPerformance: getHabitPerformance()
        };
    };

    const getWeeklyCompletionRate = () => {
        const week = getCurrentWeek();
        let totalPossible = habits.length * 7;
        let totalCompleted = 0;

        habits.forEach(habit => {
            week.forEach(day => {
                const dateStr = day.toISOString().split('T')[0];
                if (habit.dates[dateStr]) totalCompleted++;
            });
        });

        return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    };

    const getCurrentWeek = () => {
        const week = [];
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            week.push(day);
        }
        return week;
    };

    const calculateStreak = (dates) => {
        const today = new Date();
        let streak = 0;
        let date = new Date(today);
        while (dates[date.toISOString().split('T')[0]]) {
            streak++;
            date.setDate(date.getDate() - 1);
        }
        return streak;
    };

    const getMostConsistentHabit = () => {
        if (habits.length === 0) return null;
        return habits.reduce((most, current) => {
            const currentRate = Object.keys(current.dates).filter(d => current.dates[d]).length /
                Math.ceil((Date.now() - current.id) / (1000 * 60 * 60 * 24));
            const mostRate = Object.keys(most.dates).filter(d => most.dates[d]).length /
                Math.ceil((Date.now() - most.id) / (1000 * 60 * 60 * 24));
            return currentRate > mostRate ? current : most;
        });
    };

    const getCompletionTrend = () => {
        const trends = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const completed = habits.filter(h => h.dates[dateStr]).length;
            trends.push({
                date: dateStr,
                completion: habits.length > 0 ? (completed / habits.length) * 100 : 0
            });
        }
        return trends;
    };

    const getAverageCompletionRate = () => {
        if (habits.length === 0) return 0;
        const rates = habits.map(h => {
            const total = Object.keys(h.dates).length;
            const completed = Object.values(h.dates).filter(Boolean).length;
            return total > 0 ? (completed / total) * 100 : 0;
        });
        return Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length);
    };

    const getHabitPerformance = () => {
        return habits.map(habit => ({
            name: habit.name,
            streak: calculateStreak(habit.dates),
            completionRate: (() => {
                const total = Object.keys(habit.dates).length;
                const completed = Object.values(habit.dates).filter(Boolean).length;
                return total > 0 ? Math.round((completed / total) * 100) : 0;
            })(),
            totalDays: Object.keys(habit.dates).length
        })).sort((a, b) => b.completionRate - a.completionRate);
    };

    const stats = getDetailedStatistics();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detailed Statistics" className="wide-modal">
            <div className="detailed-stats">
                <div className="stats-overview">
                    <div className="stat-card">
                        <h3>Total Habits</h3>
                        <p>{stats.totalHabits}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Completed Today</h3>
                        <p>{stats.completedToday}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Weekly Completion</h3>
                        <p>{stats.weeklyCompletion}%</p>
                    </div>
                    <div className="stat-card">
                        <h3>Longest Streak</h3>
                        <p>{stats.longestStreak} days</p>
                    </div>
                    <div className="stat-card">
                        <h3>Total Completions</h3>
                        <p>{stats.totalCompletions}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Average Rate</h3>
                        <p>{stats.averageCompletionRate}%</p>
                    </div>
                </div>

                <div className="trend-chart">
                    <h3>7-Day Completion Trend</h3>
                    <div className="trend-bars">
                        {stats.completionTrend.map((day, index) => (
                            <div key={index} className="trend-bar">
                                <div
                                    className="bar"
                                    style={{ height: `${day.completion}%` }}
                                    title={`${day.date}: ${day.completion.toFixed(1)}%`}
                                ></div>
                                <span className="date">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="habit-performance">
                    <h3>Habit Performance</h3>
                    <div className="performance-list">
                        {stats.habitPerformance.map((habit, index) => (
                            <div key={index} className="performance-item">
                                <div className="habit-info">
                                    <h4>{habit.name}</h4>
                                    <div className="habit-metrics">
                                        <span>Streak: {habit.streak} days</span>
                                        <span>Rate: {habit.completionRate}%</span>
                                        <span>Days: {habit.totalDays}</span>
                                    </div>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress"
                                        style={{ width: `${habit.completionRate}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {stats.mostConsistentHabit && (
                    <div className="consistency-highlight">
                        <h3>🏆 Most Consistent Habit</h3>
                        <p>{stats.mostConsistentHabit.name}</p>
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default StatsModal;
