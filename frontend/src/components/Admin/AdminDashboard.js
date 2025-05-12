import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('upcoming');
  const [view, setView] = useState('events'); // 'events' or 'settings'
  const navigate = useNavigate();

  // Check connection status on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/admin/check-connection`);
        setIsConnected(response.data.connected);
        if (response.data.connected) {
          fetchEvents();
        }
      } catch (err) {
        setError('Failed to check connection status');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    checkConnection();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/admin/events`, {
        params: { range: timeRange }
      });
      setCalendarEvents(response.data);
    } catch (err) {
      setError('Failed to fetch events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await axios.post(`${process.env.REACT_APP_API_URL}/admin/disconnect`);
      setIsConnected(false);
      setCalendarEvents([]);
    } catch (err) {
      setError('Failed to disconnect');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    if (isConnected) {
      fetchEvents();
    }
  };

  const formatEventTime = (dateTime) => {
    const options = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    };
    return new Date(dateTime).toLocaleString('en-US', options);
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Calendar Admin Dashboard</h1>
        <div className="connection-status">
          Status: 
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button 
          className={`nav-button ${view === 'events' ? 'active' : ''}`}
          onClick={() => setView('events')}
        >
          Scheduled Events
        </button>
        <button 
          className={`nav-button ${view === 'settings' ? 'active' : ''}`}
          onClick={() => setView('settings')}
        >
          Calendar Settings
        </button>
      </nav>

      {view === 'events' && (
        <div className="events-section">
          <div className="controls">
            <div className="time-range-selector">
              <button
                className={`range-button ${timeRange === 'upcoming' ? 'active' : ''}`}
                onClick={() => handleTimeRangeChange('upcoming')}
              >
                Upcoming
              </button>
              <button
                className={`range-button ${timeRange === 'today' ? 'active' : ''}`}
                onClick={() => handleTimeRangeChange('today')}
              >
                Today
              </button>
              <button
                className={`range-button ${timeRange === 'past' ? 'active' : ''}`}
                onClick={() => handleTimeRangeChange('past')}
              >
                Past
              </button>
            </div>
            <button 
              className="refresh-button"
              onClick={fetchEvents}
              disabled={loading || !isConnected}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="loading-message">Loading events...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : !isConnected ? (
            <div className="disconnected-message">
              <p>Your calendar is not connected.</p>
              <button 
                className="connect-button"
                onClick={() => navigate('/admin')}
              >
                Connect Google Calendar
              </button>
            </div>
          ) : calendarEvents.length === 0 ? (
            <div className="no-events-message">
              No events found for the selected time range.
            </div>
          ) : (
            <div className="events-list">
              <table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Attendees</th>
                  </tr>
                </thead>
                <tbody>
                  {calendarEvents.map((event) => (
                    <tr key={event.id}>
                      <td>{event.summary}</td>
                      <td>{formatEventTime(event.start.dateTime)}</td>
                      <td>{formatEventTime(event.end.dateTime)}</td>
                      <td>
                        {event.attendees ? 
                          event.attendees.map(a => a.email).join(', ') : 
                          'No attendees'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {view === 'settings' && (
        <div className="settings-section">
          <h2>Calendar Connection</h2>
          {isConnected ? (
            <>
              <p>Your calendar is currently connected.</p>
              <button 
                className="disconnect-button"
                onClick={handleDisconnect}
                disabled={loading}
              >
                Disconnect Google Calendar
              </button>
              <div className="connection-info">
                <h3>Connected Calendar Info</h3>
                <p>You can manage your Google Calendar permissions directly in your Google account settings.</p>
              </div>
            </>
          ) : (
            <>
              <p>Connect your Google Calendar to manage appointments.</p>
              <button 
                className="connect-button"
                onClick={() => navigate('/admin')}
              >
                Connect Google Calendar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;