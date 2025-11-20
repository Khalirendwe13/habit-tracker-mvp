import React, { useState, useEffect } from 'react';
import './App.css';
import Statistics from './Statistics';
import Suggestions from './Suggestions';
import Reminders from './Reminders';
import Modal from './Modal';
import SettingsModal from './SettingsModal';
import SuggestionsModal from './SuggestionsModal';
import StatsModal from './StatsModal';

function App() {
    const [habits, setHabits] = useState([]);
    const [newHabit, setNewHabit] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isPro, setIsPro] = useState(false);
    const [notification, setNotification] = useState(null);
    const [lastCheckDate, setLastCheckDate] = useState(new Date().toDateString());

    // Load from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('habits');
        if (stored) setHabits(JSON.parse(stored));
    }, []);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('habits', JSON.stringify(habits));
    }, [habits]);

    // Setup data sync
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'habits' && e.newValue) {
                if (window.confirm('New data detected from another tab. Load it?')) {
                    setHabits(JSON.parse(e.newValue));
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Check for new day
    useEffect(() => {
        const checkNewDay = () => {
            const today = new Date().toDateString();
            if (lastCheckDate !== today) {
                setLastCheckDate(today);
                showNotification("New day! Time to build those habits! 🌅", "info");
            }
        };
        const interval = setInterval(checkNewDay, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [lastCheckDate]);

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    // Setup notifications
    useEffect(() => {
        if (isPro && 'Notification' in window) {
            Notification.requestPermission();
        }
    }, [isPro]);

    const addHabit = () => {
        if (newHabit.trim()) {
            setHabits([...habits, { id: Date.now(), name: newHabit, dates: {} }]);
            setNewHabit('');
        }
    };

    const deleteHabit = (id) => {
        setHabits(habits.filter(h => h.id !== id));
    };

    const toggleDone = (id, date) => {
        setHabits(habits.map(h => {
            if (h.id === id) {
                const dates = { ...h.dates };
                dates[date] = !dates[date];
                return { ...h, dates };
            }
            return h;
        }));
    };

    const exportData = () => {
        const dataStr = JSON.stringify(habits, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'habits.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const importData = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    setHabits(imported);
                } catch (err) {
                    alert('Invalid JSON file');
                }
            };
            reader.readAsText(file);
        }
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

    const calculateCompletionRate = (dates) => {
        const totalDays = Object.keys(dates).length;
        const doneDays = Object.values(dates).filter(Boolean).length;
        return totalDays ? Math.round((doneDays / totalDays) * 100) : 0;
    };

    return (
        <div>
            <h1>Habit Tracker MVP</h1>
            <div>
                <input value={newHabit} onChange={(e) => setNewHabit(e.target.value)} placeholder="New habit" />
                <button onClick={addHabit}>Add Habit</button>
            </div>
            <div className="date-picker">
                <label>Select Date: </label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            {habits.map(habit => (
                <div key={habit.id} className="habit">
                    <h3>{habit.name}</h3>
                    <button onClick={() => toggleDone(habit.id, selectedDate)}>
                        {habit.dates[selectedDate] ? 'Undo' : 'Mark Done'} for {selectedDate}
                    </button>
                    <button onClick={() => deleteHabit(habit.id)}>Delete</button>
                    <div className="analytics">
                        <p>Current Streak: {calculateStreak(habit.dates)}</p>
                        <p>Completion Rate: {calculateCompletionRate(habit.dates)}%</p>
                    </div>
                </div>
            ))}
            <div>
                <button onClick={exportData}>Export JSON</button>
                <input type="file" accept=".json" onChange={importData} />
            </div>
            {notification && (
                <div className={`notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}
            <div className="pro-toggle">
                <label>Pro Mode: </label>
                <input type="checkbox" checked={isPro} onChange={() => setIsPro(!isPro)} />
                {isPro && <p>Pro features unlocked! (Placeholder for subscription)</p>}
            </div>
            {isPro && (
                <div className="pro-features">
                    <Statistics habits={habits} />
                    <Suggestions onAddHabit={addHabit} />
                    <Reminders habits={habits} onUpdateHabit={setHabits} />
                </div>
            )}
            <div>
                <h2>Scaling Notes</h2>
                <ul>
                    <li>Push Notifications: Integrate with service like Firebase for reminders.</li>
                    <li>Cloud Sync: Use Firebase or AWS for multi-device sync.</li>
                    <li>Payments: Integrate Stripe or PayPal for Pro subscriptions.</li>
                    <li>AdMob: Add ads for free users.</li>
                </ul>
            </div>
        </div>
    );
}

export default App;
