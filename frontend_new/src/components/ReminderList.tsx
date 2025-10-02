

import React, { useState, useMemo, useEffect } from 'react';
import type { Patient, Reminder } from '../types';

interface ReminderListProps {
  patient: Patient;
  onAddReminder: (patientId: string, reminder: Omit<Reminder, 'id' | 'completed'>) => void;
  onToggleReminder: (patientId: string, reminderId: string) => void;
  onDeleteReminder: (patientId: string, reminderId: string) => void;
  reminderDefaults: Partial<Omit<Reminder, 'id' | 'completed'>> | null;
  onReminderDefaultsHandled: () => void;
}

const NewReminderForm: React.FC<{ 
    onAdd: (reminder: Omit<Reminder, 'id' | 'completed'>) => void, 
    onCancel: () => void,
    initialData?: Partial<Omit<Reminder, 'id' | 'completed'>> | null 
}> = ({ onAdd, onCancel, initialData }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [time, setTime] = useState('');
    const [type, setType] = useState<'appointment' | 'medication'>('appointment');
    const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setDate(initialData.date || new Date().toISOString().split('T')[0]);
            setDueDate(initialData.dueDate || '');
            setTime(initialData.time || '09:00');
            setType(initialData.type || 'appointment');
            setPriority(initialData.priority || 'medium');
        } else {
            // Set defaults for a blank form
            setTitle('');
            setDate(new Date().toISOString().split('T')[0]);
            setDueDate('');
            setTime('09:00');
            setType('appointment');
            setPriority('medium');
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert('Please enter a title for the reminder.');
            return;
        }
        onAdd({ title, date, time, type, priority, dueDate: dueDate || undefined });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-3 mb-4 border border-border-light dark:border-border-dark">
            <h5 className="font-semibold text-text-light dark:text-text-dark">Add New Reminder</h5>
            <div>
                 <label htmlFor="rem-title" className="sr-only">Title</label>
                 <input
                    id="rem-title"
                    type="text"
                    placeholder="Reminder title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm"
                    required
                 />
            </div>
            <div className="grid grid-cols-1 @[25rem]:grid-cols-3 gap-3">
                <div>
                     <label htmlFor="rem-date" className="block text-xs font-medium text-subtle-light dark:text-subtle-dark mb-1">Remind On</label>
                     <input
                        id="rem-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                         className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm"
                        required
                     />
                </div>
                <div>
                     <label htmlFor="rem-due-date" className="block text-xs font-medium text-subtle-light dark:text-subtle-dark mb-1">Due Date (Optional)</label>
                     <input
                        id="rem-due-date"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                         className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm"
                     />
                </div>
                 <div>
                     <label htmlFor="rem-time" className="block text-xs font-medium text-subtle-light dark:text-subtle-dark mb-1">Time</label>
                     <input
                        id="rem-time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                         className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm"
                        required
                     />
                </div>
            </div>
             <div className="grid grid-cols-2 gap-3">
                <select
                    id="rem-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm"
                >
                    <option value="appointment">Appointment</option>
                    <option value="medication">Medication</option>
                </select>
                <select
                    id="rem-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm"
                >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                </select>
            </div>
            <div className="flex items-center justify-end gap-2">
                 <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm font-medium text-subtle-light dark:text-subtle-dark bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                 <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-primary-DEFAULT rounded-md hover:bg-primary-hover transition-colors">Save Reminder</button>
            </div>
        </form>
    )
}

const ReminderItem: React.FC<{ reminder: Reminder; onToggle: () => void; onDelete: () => void; isOverdue: boolean }> = ({ reminder, onToggle, onDelete, isOverdue }) => {
    const icon = reminder.type === 'appointment' ? 'calendar_month' : 'medication';
    const itemClasses = `
        flex items-center gap-3 p-3 rounded-lg transition-colors
        ${reminder.completed ? 'bg-green-50 dark:bg-green-900/30' : (isOverdue ? 'bg-red-50 dark:bg-red-900/30' : 'bg-gray-50 dark:bg-gray-800/50')}
    `;
    const textClasses = `
        ${reminder.completed ? 'line-through text-subtle-light dark:text-subtle-dark' : 'text-text-light dark:text-text-dark'}
    `;

    const priorityClasses = {
        high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    
    const effectiveDateStr = reminder.dueDate || reminder.date;
    const effectiveDate = new Date(`${effectiveDateStr}T${reminder.time}`);
    const displayDate = effectiveDate.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

    let reminderDateText = null;
    if (reminder.dueDate && reminder.dueDate !== reminder.date) {
        // Create date in local timezone to avoid off-by-one day errors
        const [year, month, day] = reminder.date.split('-').map(Number);
        const remindDate = new Date(year, month - 1, day);
        reminderDateText = `Reminds: ${remindDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}`;
    }

    return (
        <li className={itemClasses}>
            <input
              type="checkbox"
              checked={reminder.completed}
              onChange={onToggle}
              aria-label={`Mark reminder '${reminder.title}' as ${reminder.completed ? 'incomplete' : 'complete'}`}
              className="h-4 w-4 rounded border-gray-300 text-primary-DEFAULT focus:ring-primary-DEFAULT"
            />
            <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${isOverdue && !reminder.completed ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' : 'bg-primary-DEFAULT/10 text-primary-DEFAULT'}`}>
                <span className="material-symbols-outlined text-base">{icon}</span>
            </div>
            <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                     <p className={`font-medium text-sm ${textClasses}`}>{reminder.title}</p>
                     {!reminder.completed && (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityClasses[reminder.priority]}`}>
                            {reminder.priority.charAt(0).toUpperCase() + reminder.priority.slice(1)}
                        </span>
                     )}
                </div>
                <p className={`text-xs ${reminder.completed ? 'text-subtle-light dark:text-subtle-dark' : (isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-subtle-light dark:text-subtle-dark')}`}>
                    {displayDate}
                </p>
                {reminderDateText && (
                     <p className="text-xs text-subtle-light dark:text-subtle-dark -mt-0.5">{reminderDateText}</p>
                )}
            </div>
            <button
              onClick={onDelete}
              aria-label={`Delete reminder: ${reminder.title}`}
              className="p-1 ml-2 text-subtle-light dark:text-subtle-dark hover:text-red-500 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
            >
                <span className="material-symbols-outlined text-base">delete</span>
            </button>
        </li>
    );
};

const CalendarView: React.FC<Omit<ReminderListProps, 'reminderDefaults' | 'onReminderDefaultsHandled'>> = ({ patient, onToggleReminder, onDeleteReminder }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const remindersByDate = useMemo(() => {
        const map = new Map<string, { reminders: Reminder[], highestPriority: 'high' | 'medium' | 'low' }>();
        const priorityOrder = { high: 0, medium: 1, low: 2 };

        for (const reminder of patient.reminders || []) {
            const dateKey = reminder.dueDate || reminder.date;
            const existing = map.get(dateKey) || { reminders: [], highestPriority: 'low' };
            existing.reminders.push(reminder);

            if (priorityOrder[reminder.priority] < priorityOrder[existing.highestPriority]) {
                existing.highestPriority = reminder.priority;
            }
            map.set(dateKey, existing);
        }
        return map;
    }, [patient.reminders]);
    
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const startingDayIndex = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
    
    const today = new Date();
    today.setHours(0,0,0,0);

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    
    const handleDayClick = (day: number) => {
        const newSelectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        // If clicking the same day, deselect it. Otherwise, select the new day.
        if (selectedDate && newSelectedDate.getTime() === selectedDate.getTime()) {
            setSelectedDate(null);
        } else {
            setSelectedDate(newSelectedDate);
        }
    };


    const priorityDotClasses = {
        high: 'bg-red-500',
        medium: 'bg-yellow-500',
        low: 'bg-green-500',
    };

    const selectedReminders = useMemo(() => {
        if (!selectedDate) return [];
        const dateKey = selectedDate.toISOString().split('T')[0];
        return remindersByDate.get(dateKey)?.reminders || [];
    }, [selectedDate, remindersByDate]);


    return (
        <div className="mt-4">
             <div className="flex items-center justify-between mb-4">
                <button onClick={handlePrevMonth} aria-label="Go to previous month" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <h5 className="text-base font-semibold text-text-light dark:text-text-dark text-center">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h5>
                <button onClick={handleNextMonth} aria-label="Go to next month" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                     <span className="material-symbols-outlined">chevron_right</span>
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-subtle-light dark:text-subtle-dark mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startingDayIndex }).map((_, i) => <div key={`empty-${i}`}></div>)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const dateKey = dayDate.toISOString().split('T')[0];
                    const dayReminders = remindersByDate.get(dateKey);
                    const isToday = dayDate.getTime() === today.getTime();
                    const isSelected = selectedDate && dayDate.getTime() === selectedDate.getTime();

                    const dayClasses = `
                        relative flex items-center justify-center h-9 w-9 rounded-full cursor-pointer transition-colors
                        ${isSelected ? 'bg-primary-DEFAULT text-white' : ''}
                        ${!isSelected && isToday ? 'bg-primary-DEFAULT/10 text-primary-DEFAULT font-bold' : ''}
                        ${!isSelected && !isToday ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                    `;

                    return (
                        <button
                            key={day}
                            onClick={() => handleDayClick(day)}
                            className={dayClasses}
                            aria-label={`View reminders for ${dayDate.toLocaleDateString()}`}
                            aria-pressed={isSelected}
                        >
                            <span>{day}</span>
                            {dayReminders && (
                                <span className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${priorityDotClasses[dayReminders.highestPriority]}`} aria-hidden="true"></span>
                            )}
                        </button>
                    );
                })}
            </div>

            {selectedDate && (
                <div className="mt-6">
                     <h5 className="mb-2 text-sm font-semibold text-subtle-light dark:text-subtle-dark uppercase">
                        Reminders for {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h5>
                    {selectedReminders.length > 0 ? (
                        <ul className="space-y-2">
                            {selectedReminders.map(r => (
                                 <ReminderItem
                                    key={r.id}
                                    reminder={r}
                                    onToggle={() => onToggleReminder(patient.id, r.id)}
                                    onDelete={() => onDeleteReminder(patient.id, r.id)}
                                    isOverdue={false} // Overdue status is handled in list view
                                />
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-subtle-light dark:text-subtle-dark">No reminders for this day.</p>
                    )}
                </div>
            )}
        </div>
    );
};


const ReminderList: React.FC<ReminderListProps> = ({ patient, onAddReminder, onToggleReminder, onDeleteReminder, reminderDefaults, onReminderDefaultsHandled }) => {
    const [showForm, setShowForm] = useState(false);
    const [view, setView] = useState<'list' | 'calendar'>('list');
    
    useEffect(() => {
        if (reminderDefaults) {
            setShowForm(true);
        }
    }, [reminderDefaults]);

    const reminders = patient.reminders || [];
    
    const { overdue, today, upcoming, completed } = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Compare dates only
        const todayStr = new Date().toISOString().split('T')[0];
        
        const categorized = {
            overdue: [] as Reminder[],
            today: [] as Reminder[],
            upcoming: [] as Reminder[],
            completed: [] as Reminder[],
        };

        const getEffectiveDate = (r: Reminder) => r.dueDate || r.date;

        reminders
          .sort((a, b) => new Date(`${getEffectiveDate(a)}T${a.time}`).getTime() - new Date(`${getEffectiveDate(b)}T${b.time}`).getTime())
          .forEach(r => {
            if (r.completed) {
                categorized.completed.push(r);
                return;
            }
            const effectiveDateStr = getEffectiveDate(r);
            // Create date in local timezone to avoid off-by-one day errors
            const [year, month, day] = effectiveDateStr.split('-').map(Number);
            const reminderDate = new Date(year, month - 1, day);
            reminderDate.setHours(0,0,0,0);

            if (reminderDate < now) {
                categorized.overdue.push(r);
            } else if (effectiveDateStr === todayStr) {
                categorized.today.push(r);
            } else {
                categorized.upcoming.push(r);
            }
        });
        
        categorized.completed.sort((a,b) => new Date(`${getEffectiveDate(b)}T${b.time}`).getTime() - new Date(`${getEffectiveDate(a)}T${a.time}`).getTime());

        return categorized;
    }, [reminders]);

    const handleAdd = (newReminderData: Omit<Reminder, 'id' | 'completed'>) => {
        onAddReminder(patient.id, newReminderData);
        setShowForm(false);
        if (reminderDefaults) {
            onReminderDefaultsHandled();
        }
    };
    
    const handleCancel = () => {
        setShowForm(false);
        if (reminderDefaults) {
            onReminderDefaultsHandled();
        }
    };

    const renderGroup = (title: string, reminderGroup: Reminder[], isOverdueGroup = false) => {
        if (reminderGroup.length === 0) return null;
        return (
            <div className="mb-4">
                <h5 className="mb-2 text-sm font-semibold text-subtle-light dark:text-subtle-dark uppercase">{title}</h5>
                <ul className="space-y-2">
                    {reminderGroup.map(r => (
                        <ReminderItem
                            key={r.id}
                            reminder={r}
                            onToggle={() => onToggleReminder(patient.id, r.id)}
                            onDelete={() => onDeleteReminder(patient.id, r.id)}
                            isOverdue={isOverdueGroup}
                        />
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div className="pb-6 border-b border-border-light dark:border-border-dark @container">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                     <span className="material-symbols-outlined text-primary-DEFAULT">task_alt</span>
                    <h4 className="text-lg font-semibold text-text-light dark:text-text-dark">Reminders</h4>
                    <div className="flex items-center border border-border-light dark:border-border-dark rounded-md ml-2">
                        <button onClick={() => setView('list')} className={`p-1.5 rounded-l-md ${view === 'list' ? 'bg-primary-DEFAULT/10 text-primary-DEFAULT' : 'text-subtle-light dark:text-subtle-dark'}`} title="List View" aria-label="Switch to list view">
                            <span className="material-symbols-outlined text-base">list</span>
                        </button>
                        <button onClick={() => setView('calendar')} className={`p-1.5 rounded-r-md border-l border-border-light dark:border-border-dark ${view === 'calendar' ? 'bg-primary-DEFAULT/10 text-primary-DEFAULT' : 'text-subtle-light dark:text-subtle-dark'}`} title="Calendar View" aria-label="Switch to calendar view">
                             <span className="material-symbols-outlined text-base">calendar_month</span>
                        </button>
                    </div>
                </div>
                 <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-secondary rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors"
                    aria-expanded={showForm}
                >
                    <span className="material-symbols-outlined text-base">add</span>
                    <span>Add Reminder</span>
                </button>
            </div>
            
            {showForm && <NewReminderForm onAdd={handleAdd} onCancel={handleCancel} initialData={reminderDefaults} />}
            
            {view === 'calendar' && (
                <CalendarView 
                    patient={patient}
                    onAddReminder={onAddReminder}
                    onToggleReminder={onToggleReminder}
                    onDeleteReminder={onDeleteReminder}
                />
            )}

            {view === 'list' && (
                reminders.length === 0 && !showForm ? (
                    <div className="text-center text-sm text-subtle-light dark:text-subtle-dark py-6 border-2 border-dashed border-border-light dark:border-border-dark rounded-lg">
                        No reminders set for {patient.name}.
                    </div>
                ) : (
                    <div className="mt-4">
                        {renderGroup('Overdue', overdue, true)}
                        {renderGroup('Today', today)}
                        {renderGroup('Upcoming', upcoming)}
                        {renderGroup('Completed', completed)}
                    </div>
                )
            )}
        </div>
    );
};

export default ReminderList;