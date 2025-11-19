import React, { useState, useMemo, useEffect } from 'react';
import { Trash2, Plus, Edit2 } from 'lucide-react';

/**
 * EventsPage
 * React (JavaScript) version of the TypeScript sample provided by the user.
 * Props:
 * - tasks: array of task objects { id, description, startDate, endDate, isCompleted }
 * - setTasks: setter for tasks state
 * - events: array of event objects { id, description, date }
 * - setEvents: setter for events state
 *
 * Features:
 * - Add / delete tasks and events
 * - Toggle task completion
 * - Group tasks by start/end date and show completion progress
 * - Optional desktop notification scheduling (request permission and schedule timeouts)
 */
const EventsPage = ({ tasks, setTasks, events, setEvents }) => {
  // Local form state
  const [taskDesc, setTaskDesc] = useState('');
  const [taskStart, setTaskStart] = useState('');
  const [taskEnd, setTaskEnd] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Notification controls
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [notificationOffset, setNotificationOffset] = useState('day'); // 'none', 'day', 'hour', '30min'

  // Effect: schedule notifications for upcoming events when permission is granted
  useEffect(() => {
    if (notificationPermission !== 'granted' || notificationOffset === 'none') return;

    const timerIds = [];

    const offsetMap = {
      day: { value: 24 * 60 * 60 * 1000, unit: 'day' },
      hour: { value: 60 * 60 * 1000, unit: 'hour' },
      '30min': { value: 30 * 60 * 1000, unit: '30 minutes' },
    };

    const offsetInfo = offsetMap[notificationOffset];
    if (!offsetInfo) return;

    events.forEach((evt) => {
      // Treat event.date as UTC date string (midnight UTC) to avoid timezone confusion
      const eventTime = new Date(evt.date + 'T00:00:00Z').getTime();
      const notificationTime = eventTime - offsetInfo.value;
      const now = Date.now();

      if (notificationTime > now) {
        const id = window.setTimeout(() => {
          try {
            // eslint-disable-next-line no-new
            new Notification('Upcoming Event Reminder!', {
              body: `${evt.description} is in about ${offsetInfo.unit}.`,
            });
          } catch (err) {
            console.warn('Notification failed:', err);
          }
        }, notificationTime - now);

        timerIds.push(id);
      }
    });

    return () => timerIds.forEach((tid) => clearTimeout(tid));
  }, [events, notificationOffset, notificationPermission]);

  // Request permission for desktop notifications
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notification');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  // Task handlers
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskDesc || !taskStart || !taskEnd) return;
    const newTask = {
      id: Date.now(),
      description: taskDesc,
      startDate: taskStart,
      endDate: taskEnd,
      isCompleted: false,
    };
    setTasks([...tasks, newTask]);
    setTaskDesc('');
    setTaskStart('');
    setTaskEnd('');
  };

  const toggleTaskCompletion = (id) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)));
  };

  const deleteTask = (id) => setTasks(tasks.filter((t) => t.id !== id));

  // Event handlers
  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!eventDesc || !eventDate) return;

    if (editingId) {
      // Update existing event
      const updated = events.map((ev) => (ev.id === editingId ? { ...ev, description: eventDesc, date: eventDate } : ev));
      setEvents(updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setEditingId(null);
    } else {
      const newEvent = { id: Date.now(), description: eventDesc, date: eventDate };
      // keep events sorted by date
      setEvents([...events, newEvent].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    }
    setEventDesc('');
    setEventDate('');
  };

  const deleteEvent = (id) => setEvents(events.filter((ev) => ev.id !== id));

  const handleEditEvent = (id) => {
    const ev = events.find((x) => x.id === id);
    if (!ev) return;
    setEditingId(id);
    setEventDesc(ev.description || '');
    setEventDate(ev.date || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEventDesc('');
    setEventDate('');
  };

  // Group tasks by startDate|endDate and compute completion percentage
  const groupedTasks = useMemo(() => {
    const groups = {};
    const sorted = [...tasks].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    sorted.forEach((t) => {
      const key = `${t.startDate}|${t.endDate}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    return Object.entries(groups).map(([key, items]) => {
      const [startDate, endDate] = key.split('|');
      const completedCount = items.filter((x) => x.isCompleted).length;
      const totalCount = items.length;
      const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
      return { startDate, endDate, tasks: items, completedCount, totalCount, percentage };
    });
  }, [tasks]);

  return (
    <div className="p-6 bg-bg-1 rounded-xl text-white space-y-8 overflow-y-auto">
      {/* Tasks Section */}
      <section>
        <h2 className="text-3xl font-bold mb-4">Manage Your Tasks</h2>
        <form onSubmit={handleAddTask} className="bg-bg-2 p-4 rounded-lg mb-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300">Task Description</label>
          <input type="text" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="e.g., Complete math assignment" className="mt-1 w-full bg-bg-top text-white px-4 py-3 rounded-lg border border-accent/30 ring-1 ring-accent/10 focus:border-accent focus:ring-accent/20 focus:outline-none" />
          </div>
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Start Date</label>
            <input type="date" value={taskStart} onChange={(e) => setTaskStart(e.target.value)} className="mt-1 bg-bg-top text-white px-4 py-3 rounded-lg border border-accent/30 ring-1 ring-accent/10 focus:border-accent focus:ring-accent/20 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Target Date</label>
            <input type="date" value={taskEnd} onChange={(e) => setTaskEnd(e.target.value)} className="mt-1 bg-bg-top text-white px-4 py-3 rounded-lg border border-accent/30 ring-1 ring-accent/10 focus:border-accent focus:ring-accent/20 focus:outline-none" />
            </div>
          </div>
        <button type="submit" className="bg-accent hover:bg-accent-1 text-white font-bold py-2 px-4 rounded-md flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" /> Add Task
        </button>
        </form>

        <div className="space-y-6">
          {groupedTasks.map((group, idx) => {
            const startDateStr = new Date(group.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
            const endDateStr = new Date(group.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

            return (
              <div key={idx} className="bg-bg-2 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-2">Tasks for {startDateStr} - {endDateStr}</h3>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-full bg-gray-600 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${group.percentage}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-300 whitespace-nowrap">{group.completedCount} / {group.totalCount} completed ({Math.round(group.percentage)}%)</span>
                </div>
                <div className="space-y-3">
                  {group.tasks.map((task) => (
                    <div key={task.id} className="bg-bg-2 p-3 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <input type="checkbox" checked={!!task.isCompleted} onChange={() => toggleTaskCompletion(task.id)} className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 bg-bg-top border-bg-2" />
                        <p className={`font-semibold ${task.isCompleted ? 'line-through text-gray-400' : ''}`}>{task.description}</p>
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {tasks.length === 0 && <p className="text-gray-400">You have no tasks. Add one above!</p>}
        </div>
      </section>

      {/* Events Section */}
      <section>
        <h2 className="text-3xl font-bold mb-4">Manage Deadlines & Events</h2>

        <div className="bg-bg-2 p-3 rounded-md mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label htmlFor="notification-time" className="font-medium text-sm sm:text-base">Notify me:</label>
            <select id="notification-time" value={notificationOffset} onChange={(e) => setNotificationOffset(e.target.value)} disabled={notificationPermission !== 'granted'} className="bg-bg-top border border-accent/30 ring-1 ring-accent/10 rounded-md p-2 text-sm focus:ring-accent/20 focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed text-white">
              <option value="none">Don't notify</option>
              <option value="day">1 day before</option>
              <option value="hour">1 hour before</option>
              <option value="30min">30 minutes before</option>
            </select>
          </div>
          {notificationPermission !== 'granted' && (
            <button onClick={requestNotificationPermission} className="bg-accent hover:bg-accent-1 text-white font-bold py-2 px-3 rounded-md text-sm transition-colors">Enable Notifications</button>
          )}
          {notificationPermission === 'denied' && <p className="text-xs text-yellow-400">Notifications are blocked in your browser.</p>}
        </div>

        <form onSubmit={handleAddEvent} className="bg-bg-2 p-4 rounded-lg mb-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300">Event/Deadline Description</label>
            <input type="text" value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} placeholder="e.g., Physics Project Deadline" className="mt-1 w-full bg-bg-top text-white px-4 py-3 rounded-lg border border-accent/30 ring-1 ring-accent/10 focus:border-accent focus:ring-accent/20 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Event Date</label>
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="mt-1 bg-bg-top text-white px-4 py-3 rounded-lg border border-accent/30 ring-1 ring-accent/10 focus:border-accent focus:ring-accent/20 focus:outline-none" />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" className="bg-accent hover:bg-accent-1 text-white font-bold py-2 px-4 rounded-md flex items-center gap-2 transition-colors">
              <Plus className="w-5 h-5" /> {editingId ? 'Save Event' : 'Add Event'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="bg-bg-top text-gray-300 py-2 px-3 rounded-md border border-bg-2 hover:bg-bg-2 transition-colors">Cancel</button>
            )}
          </div>
        </form>

        <div className="space-y-3">
          {events.map((ev) => (
            <div key={ev.id} className="bg-bg-2 p-3 rounded-lg flex items-center justify-between">
              <div className="cursor-pointer" onClick={() => handleEditEvent(ev.id)}>
                <p className="font-semibold">{ev.description}</p>
                <p className="text-sm text-gray-400">{new Date(ev.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => handleEditEvent(ev.id)} className="text-gray-300 hover:text-white transition-colors">
                  <Edit2 className="w-5 h-5" />
                </button>
                <button onClick={() => deleteEvent(ev.id)} className="text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
            </div>
          ))}
          {events.length === 0 && <p className="text-gray-400">You have no events. Add one above!</p>}
        </div>
      </section>
    </div>
  );
};

export default EventsPage;
