const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const Event = require('../models/Event');
const { ROLES, getUserById } = require('../models/User');

// Middleware to check if user is authenticated
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication token is required' });
  }
  
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check if user is a tutor
const isTutor = (req, res, next) => {
  if (req.user.role !== ROLES.TUTOR && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ message: 'Forbidden - Tutor access required' });
  }
  next();
};

// Get all events
router.get('/', authenticateToken, (req, res) => {
  try {
    let events = Event.getEvents();
    
    // Filter events based on user role
    if (req.user.role === 'student') {
      // Students can only see their own events
      events = events.filter(event => event.studentIds.includes(req.user.id));
    } else if (req.user.role === 'tutor') {
      // Tutors can only see events they created
      events = events.filter(event => event.tutorId === req.user.id);
    }
    // Admins can see all events (no filtering needed)

    // Add recurring information to the response
    const eventsWithRecurringInfo = events.map(event => ({
      ...event,
      extendedProps: {
        description: event.description,
        isRecurring: event.isRecurring,
        recurringPattern: event.recurringPattern
      }
    }));

    res.json({ events: eventsWithRecurringInfo });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// Create a new event
router.post('/', authenticateToken, isTutor, async (req, res) => {
  try {
    const { title, startTime, endTime, description, studentIds, isRecurring, recurringPattern } = req.body;

    // Validate required fields
    if (!title || !startTime || !endTime || !studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Validate recurring pattern if event is recurring
    if (isRecurring) {
      if (!recurringPattern || !recurringPattern.type || !recurringPattern.occurrences) {
        return res.status(400).json({ message: 'Invalid recurring pattern' });
      }

      // Validate pattern type
      const validTypes = ['weekly', 'biweekly', 'monthly'];
      if (!validTypes.includes(recurringPattern.type)) {
        return res.status(400).json({ message: 'Invalid recurring pattern type' });
      }

      // Validate occurrences (must be a positive number)
      if (!Number.isInteger(recurringPattern.occurrences) || recurringPattern.occurrences <= 0) {
        return res.status(400).json({ message: 'Invalid number of occurrences' });
      }
    }

    // Create event(s)
    const eventData = {
      title,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      description,
      studentIds,
      tutorId: req.user.id,
      isRecurring,
      recurringPattern
    };

    const createdEvents = Event.createEvent(eventData);

    // Return appropriate response based on whether it's a single or recurring event
    if (Array.isArray(createdEvents)) {
      res.status(201).json({
        message: 'Recurring events created successfully',
        events: createdEvents
      });
    } else {
      res.status(201).json({
        message: 'Event created successfully',
        event: createdEvents
      });
    }
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({ message: error.message || 'Failed to create event' });
  }
});

// Export all user events as iCal - IMPORTANT: This route must be defined before /:id routes
router.get('/ical', authenticateToken, (req, res) => {
  try {
    let events = [];
    
    if (req.user.role === ROLES.TUTOR || req.user.role === ROLES.ADMIN) {
      // If user is a tutor or admin, get all events they created
      events = Event.getEventsByTutorId(req.user.id);
    } else {
      // If user is a student, get all events they're invited to
      events = Event.getEventsByStudentId(req.user.id);
    }
    
    // Generate iCal content
    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Advanced Tutoring//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];
    
    // Add each event
    events.forEach(event => {
      const icalEvent = Event.generateICalEvent(event).split('\r\n');
      // Remove the BEGIN:VCALENDAR and END:VCALENDAR lines
      const eventContentLines = icalEvent.slice(5, -1);
      icalContent = [...icalContent, ...eventContentLines];
    });
    
    // Close the calendar
    icalContent.push('END:VCALENDAR');
    
    // Set headers and send response
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename="tutoring-calendar.ics"');
    res.send(icalContent.join('\r\n'));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate iCal file' });
  }
});

// Get a specific event
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const event = Event.getEventById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if the user has access to this event
    if (req.user.role !== ROLES.ADMIN && 
        event.tutorId !== req.user.id && 
        !event.studentIds.includes(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden - You do not have access to this event' });
    }
    
    res.json({ event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve event' });
  }
});

// Update an event (only the creator can update)
router.put('/:id', authenticateToken, isTutor, (req, res) => {
  try {
    const event = Event.getEventById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if the user is the creator of the event
    if (req.user.role !== ROLES.ADMIN && event.tutorId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden - You can only update your own events' });
    }
    
    const updatedEvent = Event.updateEvent(req.params.id, req.body);
    res.json({ event: updatedEvent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update event' });
  }
});

// Delete an event (only the creator can delete)
router.delete('/:id', authenticateToken, isTutor, (req, res) => {
  try {
    const event = Event.getEventById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if the user is the creator of the event
    if (req.user.role !== ROLES.ADMIN && event.tutorId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden - You can only delete your own events' });
    }
    
    Event.deleteEvent(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

// Export event in iCalendar format
router.get('/:id/ical', authenticateToken, (req, res) => {
  try {
    const event = Event.getEventById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if the user has access to this event
    if (req.user.role !== ROLES.ADMIN && 
        event.tutorId !== req.user.id && 
        !event.studentIds.includes(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden - You do not have access to this event' });
    }
    
    const icalData = Event.generateICalEvent(event);
    
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="${event.title.replace(/\s+/g, '_')}.ics"`);
    res.send(icalData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate iCal file' });
  }
});

module.exports = router; 