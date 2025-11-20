import React, { useState, useEffect } from 'react';

function Reminders({ habits, onUpdateHabit }) {
    const [reminderTimes, setReminderTimes] = useState({});
    const [notificationPermission, setNotificationPermission] = useState('default');

    useEffect(() => {
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
    }, []);

    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
        }
    };

    const handleReminderChange = (habitId, time) => {
        const updatedHabits = habits.map(habit => {
            if (habit.id === habitId) {
                return { ...habit, reminder: time };
            }
            return habit;
        });
        onUpdateHabit(updatedHabits);
        setReminderTimes({ ...reminderTimes, [habitId]: time });
    };

    const scheduleReminders = () => {
        if (notificationPermission !== 'granted') return;

        habits.forEach(habit => {
            if (habit.reminder) {
                const [hours, minutes] = habit.reminder.split(':');
                const now = new Date();
                const reminderTime = new Date();
                reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                if (reminderTime < now) {
                    reminderTime.setDate(reminderTime.getDate() + 1);
                }

                const timeout = reminderTime.getTime() - now.getTime();

                if (timeout > 0 && timeout < 24 * 60 * 60 * 1000) {
                    setTimeout(() => {
                        new Notification('Habit Tracker Reminder', {
                            body: `Time for: ${habit.name}`,
                            icon: '/icons/icon-192x192.png',
                            badge: '/icons/icon-72x72.png'
                        });
                    }, timeout);
                }
            }
        });
    };

    useEffect(() => {
        scheduleReminders();
    }, [habits, notificationPermission]);

    return (
        <div className="reminders">
            <h2>Smart Reminders</h2>
            <p>Set personalized reminders to stay on track with your habits.</p>

            {notificationPermission !== 'granted' && (
                <div className="notification-permission">
                    <p>Enable notifications to receive habit reminders.</p>
                    <button onClick={requestNotificationPermission}>Enable Notifications</button>
                </div>
            )}

            <div className="reminders-list">
                {habits.map(habit => (
                    <div key={habit.id} className="reminder-item">
                        <h3>{habit.name}</h3>
                        <div className="reminder-input">
                            <label>Reminder time: </label>
                            <input
                                type="time"
                                value={habit.reminder || ''}
                                onChange={(e) => handleReminderChange(habit.id, e.target.value)}
                            />
                        </div>
                        {habit.reminder && (
                            <p className="reminder-status">
                                Reminder set for {habit.reminder} daily
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {habits.some(h => h.reminder) && (
                <div className="reminder-info">
                    <p>💡 Reminders will be scheduled for the next occurrence. Make sure the app stays open or use a service worker for persistent notifications.</p>
                </div>
            )}
        </div>
    );
}

export default Reminders;
