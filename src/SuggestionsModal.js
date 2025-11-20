import React, { useState } from 'react';
import Modal from './Modal';

function SuggestionsModal({ isOpen, onClose, onAddHabit }) {
    const [selectedCategory, setSelectedCategory] = useState('all');

    const suggestions = [
        { name: "Morning Meditation", category: "health", icon: "🧘" },
        { name: "30 Minute Walk", category: "health", icon: "🚶" },
        { name: "Read 10 Pages", category: "learning", icon: "📚" },
        { name: "Drink 8 Glasses of Water", category: "health", icon: "💧" },
        { name: "Journaling", category: "personal", icon: "📔" },
        { name: "No Social Media Before Noon", category: "productivity", icon: "📱" },
        { name: "Learn a New Language", category: "learning", icon: "🗣️" },
        { name: "Evening Stretch", category: "health", icon: "🤸" },
        { name: "Write Thank You Notes", category: "personal", icon: "✉️" },
        { name: "Meal Prep for Week", category: "health", icon: "🥗" },
        { name: "Practice Instrument", category: "learning", icon: "🎵" },
        { name: "Call a Friend", category: "personal", icon: "📞" },
        { name: "Deep Breathing Exercises", category: "health", icon: "🫁" },
        { name: "Plan Tomorrow's Tasks", category: "productivity", icon: "📋" },
        { name: "Gratitude Practice", category: "personal", icon: "🙏" }
    ];

    const categories = [
        { value: 'all', label: 'All Categories' },
        { value: 'health', label: 'Health & Fitness' },
        { value: 'learning', label: 'Learning & Growth' },
        { value: 'productivity', label: 'Productivity' },
        { value: 'personal', label: 'Personal Development' }
    ];

    const filteredSuggestions = selectedCategory === 'all'
        ? suggestions
        : suggestions.filter(s => s.category === selectedCategory);

    const handleAddHabit = (suggestion) => {
        onAddHabit(suggestion.name);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Popular Habit Ideas">
            <div className="category-filter">
                <label>Filter by category: </label>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                </select>
            </div>
            <div className="suggestions-grid">
                {filteredSuggestions.map((suggestion, index) => (
                    <div key={index} className="suggestion-card">
                        <div className="suggestion-icon">{suggestion.icon}</div>
                        <div className="suggestion-content">
                            <h4>{suggestion.name}</h4>
                            <span className={`category-tag ${suggestion.category}`}>
                                {categories.find(c => c.value === suggestion.category)?.label}
                            </span>
                        </div>
                        <button
                            className="add-suggestion-btn"
                            onClick={() => handleAddHabit(suggestion)}
                        >
                            <i className="fas fa-plus"></i> Add
                        </button>
                    </div>
                ))}
            </div>
        </Modal>
    );
}

export default SuggestionsModal;
