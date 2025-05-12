import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const CustomCalendar = ({ embed = false }) => {
  const WORKDAY_START = 9;
  const WORKDAY_END = 17;
  const TIME_SLOT_DURATION = 30;
  const LUNCH_START = 12;
  const LUNCH_END = 13;

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [questions, setQuestions] = useState({ name: '', email: '', reason: '' });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookedAppointments, setBookedAppointments] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState({ date: '', time: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState('date');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('status') === 'success') {
      setIsConnected(true);
    }
  }, []);

  const isDateDisabled = (date) => {
    if (!date || isNaN(date.getTime())) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const generateTimeSlots = () => {
    const slots = [];
    let currentHour = WORKDAY_START;
    let currentMinute = 0;

    while (currentHour < WORKDAY_END || (currentHour === WORKDAY_END && currentMinute === 0)) {
      if (!(currentHour >= LUNCH_START && currentHour < LUNCH_END)) {
        const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
      
      currentMinute += TIME_SLOT_DURATION;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }

    return slots;
  };

  const isTimeSlotBooked = (time) => {
    if (!selectedDate || !bookedAppointments.length) return false;

    const [hours, minutes] = time.split(':');
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hours, minutes, 0, 0);
    
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotStart.getMinutes() + TIME_SLOT_DURATION);

    return bookedAppointments.some((event) => {
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);
      return slotStart < eventEnd && slotEnd > eventStart;
    });
  };

  const fetchEventsForDate = async (date) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/get-events`, {
        params: { date: date.toISOString().split('T')[0] },
      });
      setBookedAppointments(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGoogleCalendar = () => {
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/auth/google`;
  };

  const handleDateClick = (day) => {
    setSelectedDate(day);
    setCurrentView('time');
    fetchEventsForDate(day);
  };

  const handleTimeClick = (time) => {
    setSelectedTime(time);
    setCurrentView('questions');
  };

  const handleChange = (e) => {
    setQuestions({ ...questions, [e.target.name]: e.target.value });
  };

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || !questions.name || !questions.email || !questions.reason) {
      alert('Please fill in all fields');
      return;
    }

    const startDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    startDateTime.setHours(hours, minutes, 0);
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(startDateTime.getMinutes() + TIME_SLOT_DURATION);

    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/create-event`, {
        summary: `Appointment with ${questions.name}`,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
      });

      await fetchEventsForDate(selectedDate);
      setConfirmationDetails({
        date: selectedDate.toDateString(),
        time: selectedTime,
      });
      setShowConfirmation(true);
      setCurrentView('date');
      setQuestions({ name: '', email: '', reason: '' });
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      alert('Failed to schedule appointment.');
    }
  };

  const handleBackToDates = () => {
    setCurrentView('date');
    setSelectedDate(null);
  };

  const handleBackToTimes = () => {
    setCurrentView('time');
    setSelectedTime('');
  };

  const renderCalendar = () => {
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const daysInMonth = endOfMonth.getDate();
    const startDay = startOfMonth.getDay();

    const days = [];
    
    for (let i = 0; i < startDay; i++) {
      days.push(<td key={`empty-${i}`} className="empty-cell"></td>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const disabled = isDateDisabled(day);

      days.push(
        <td
          key={i}
          onClick={() => !disabled && handleDateClick(day)}
          className={`date-cell 
            ${selectedDate?.toDateString() === day.toDateString() ? 'selected' : ''}
            ${disabled ? 'disabled' : ''}`}
        >
          {i}
        </td>
      );
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(<tr key={i / 7}>{days.slice(i, i + 7)}</tr>);
    }

    return (
      <table className="calendar-table">
        <thead>
          <tr>
            <th colSpan="7">
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                aria-label="Previous month"
              >
                &lt;
              </button>
              <span className="month-header">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                aria-label="Next month"
              >
                &gt;
              </button>
            </th>
          </tr>
          <tr>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <th key={day}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>{weeks}</tbody>
      </table>
    );
  };

  const renderTimeSlots = () => {
    const allSlots = generateTimeSlots();
    const availableSlots = allSlots.filter(time => !isTimeSlotBooked(time));

    return (
      <div className="time-selection">
        {isLoading ? (
          <p className="loading-message">Loading available times...</p>
        ) : availableSlots.length > 0 ? (
          availableSlots.map((time, index) => (
            <button
              key={index}
              onClick={() => handleTimeClick(time)}
              className="time-button"
            >
              {time}
            </button>
          ))
        ) : (
          <p className="no-slots-message">No available time slots for this date</p>
        )}
      </div>
    );
  };

  return (
    <div className={`calendar-container ${embed ? 'embed-mode' : ''}`}>
      {!embed && <h1 className="calendar-title">Schedule an Appointment</h1>}
      
      { (
        <div className="scheduler">
          {!showConfirmation ? (
            <>
              {currentView === 'date' && (
                <>
                  <h2>Select Date</h2>
                  <div className="calendar-wrapper">
                    {renderCalendar()}
                  </div>
                </>
              )}

              {currentView === 'time' && selectedDate && (
                <div>
                  <button className="back-button" onClick={handleBackToDates}>
                    ← Back to dates
                  </button>
                  <h2>Select Time for {selectedDate.toDateString()}</h2>
                  <div className="time-slots-wrapper">
                    {renderTimeSlots()}
                  </div>
                </div>
              )}

              {currentView === 'questions' && selectedDate && selectedTime && (
                <div className="appointment-form">
                  <button className="back-button" onClick={handleBackToTimes}>
                    ← Back to times
                  </button>
                  <h2>Appointment Details</h2>
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    value={questions.name}
                    onChange={handleChange}
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    value={questions.email}
                    onChange={handleChange}
                  />
                  <textarea
                    name="reason"
                    placeholder="Reason for appointment"
                    value={questions.reason}
                    onChange={handleChange}
                  />
                  <button className="schedule-button" onClick={handleSchedule}>
                    Schedule Appointment
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="confirmation-message">
              <h2 className="confirmation-title">Appointment Scheduled!</h2>
              <p><strong>Date:</strong> {confirmationDetails.date}</p>
              <p><strong>Time:</strong> {confirmationDetails.time}</p>
              <button
                className="new-appointment-button"
                onClick={() => {
                  setShowConfirmation(false);
                  setCurrentView('date');
                }}
              >
                Schedule Another Appointment
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomCalendar;