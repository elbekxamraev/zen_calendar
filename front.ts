import React, { useEffect, useState } from 'react';

const GoogleCalendarIntegration = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check for the OAuth callback status
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');

    if (status === 'success') {
      setIsConnected(true); // Update state to show the calendar
      alert('Google Calendar connected successfully!');
    } else if (status === 'error') {
      alert('Failed to connect Google Calendar.');
    }
  }, []);

  const handleConnectGoogleCalendar = () => {
    // Redirect the user to the backend OAuth endpoint
    window.location.href = 'http://localhost:5000/auth/google';
  };

  return (
    <div>
      <h1>Connect Google Calendar</h1>
      {!isConnected ? (
        <button onClick={handleConnectGoogleCalendar}>Connect Google Calendar</button>
      ) : (
        <div>
          <h2>Calendar</h2>
          <iframe src="https://your-app.com/schedule" width="600" height="800" frameborder="0"></iframe>
          <p>Your calendar will be displayed here.</p>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarIntegration;