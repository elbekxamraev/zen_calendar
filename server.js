require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,
}));
app.use(express.json());

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
  });
  res.redirect(url);
});

app.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    res.redirect(`${process.env.ALLOWED_ORIGINS}?status=success`);
  } catch (error) {
    console.error('Error during OAuth callback:', error);
    res.redirect(`${process.env.ALLOWED_ORIGINS}?status=error`);
  }
});

app.post('/create-event', async (req, res) => {
  const { summary, startDateTime, endDateTime } = req.body;

  if (!oauth2Client.credentials.access_token) {
    return res.status(401).json({ error: 'No access token available. Please reconnect Google Calendar.' });
  }

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const event = {
    summary,
    start: { dateTime: startDateTime, timeZone: 'UTC' },
    end: { dateTime: endDateTime, timeZone: 'UTC' },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });
    res.status(200).json({ message: 'Event created!', event: response.data });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event.' });
  }
});

app.get('/get-events', async (req, res) => {
  const { date } = req.query;
  
  if (!oauth2Client.credentials.access_token) {
    return res.status(401).json({ error: 'No access token available. Please reconnect Google Calendar.' });
  }

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: `${date}T00:00:00Z`,
      timeMax: `${date}T23:59:59Z`,
      singleEvents: true,
      orderBy: 'startTime',
    });
    res.status(200).json(response.data.items);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events.' });
  }
});
const adminRouter = express.Router();

// Check connection status
adminRouter.get('/check-connection', (req, res) => {
  res.json({ 
    connected: !!oauth2Client.credentials.access_token 
  });
});

// Get calendar events
adminRouter.get('/events', async (req, res) => {
  try {
    const { range } = req.query;
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const now = new Date();
    let timeMin, timeMax;

    if (range === 'today') {
      timeMin = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      timeMax = new Date(now.setHours(23, 59, 59, 999)).toISOString();
    } else if (range === 'past') {
      timeMax = new Date().toISOString();
    } else { // upcoming
      timeMin = new Date().toISOString();
    }

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: range !== 'past' ? timeMin : undefined,
      timeMax: range === 'past' ? timeMax : undefined,
      maxResults: 50,
      singleEvents: true,
      orderBy: range === 'past' ? 'startTime' : 'startTime'
    });

    res.json(response.data.items || []);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Disconnect calendar
adminRouter.post('/disconnect', (req, res) => {
  oauth2Client.setCredentials({});
  res.json({ success: true });
});

// Mount admin routes
app.use('/admin', adminRouter);

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));