const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getUserById } = require('./User');

// Path to the events data file
const dataPath = path.join(__dirname, '../data/events.json');

// Initialize events data file if it doesn't exist
const initEventsData = () => {
  if (!fs.existsSync(path.dirname(dataPath))) {
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  }
  
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify([]));
  }
};

// Get all events
const getEvents = () => {
  initEventsData();
  const data = fs.readFileSync(dataPath, 'utf8');
  return JSON.parse(data);
};

// Save events to file
const saveEvents = (events) => {
  fs.writeFileSync(dataPath, JSON.stringify(events, null, 2));
};

// Create a new event
const createEvent = (eventData) => {
  const events = getEvents();
  const allNewEvents = [];

  // Validate and parse dates
  const validateAndParseDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    return date;
  };

  // Function to create a single event instance
  const createSingleEvent = (startTime, endTime) => {
    // Ensure dates are valid
    const start = validateAndParseDate(startTime);
    const end = validateAndParseDate(endTime);

    // Validate that end is after start
    if (end <= start) {
      throw new Error('End time must be after start time');
    }

    return {
      id: uuidv4(),
      title: eventData.title,
      description: eventData.description || '',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      tutorId: eventData.tutorId,
      studentIds: eventData.studentIds || [],
      location: eventData.location || '',
      color: eventData.color || '#4285F4',
      isRecurring: eventData.isRecurring || false,
      recurringPattern: eventData.recurringPattern || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  // If it's a recurring event, create multiple instances
  if (eventData.isRecurring && eventData.recurringPattern) {
    const { type, occurrences } = eventData.recurringPattern;
    const startDate = validateAndParseDate(eventData.startTime);
    const endDate = validateAndParseDate(eventData.endTime);
    const duration = endDate.getTime() - startDate.getTime();

    if (duration <= 0) {
      throw new Error('Invalid event duration');
    }

    for (let i = 0; i < occurrences; i++) {
      let newStartDate = new Date(startDate);
      
      // Calculate the next occurrence based on pattern type
      switch (type) {
        case 'weekly':
          newStartDate.setDate(newStartDate.getDate() + (i * 7));
          break;
        case 'biweekly':
          newStartDate.setDate(newStartDate.getDate() + (i * 14));
          break;
        case 'monthly':
          newStartDate.setMonth(newStartDate.getMonth() + i);
          break;
        default:
          throw new Error('Invalid recurring pattern type');
      }

      const newEndDate = new Date(newStartDate.getTime() + duration);
      
      // Create the event instance
      try {
        const newEvent = createSingleEvent(
          newStartDate.toISOString(),
          newEndDate.toISOString()
        );
        allNewEvents.push(newEvent);
      } catch (error) {
        throw new Error(`Failed to create recurring event instance ${i + 1}: ${error.message}`);
      }
    }
  } else {
    // For non-recurring events, create a single instance
    try {
      allNewEvents.push(createSingleEvent(eventData.startTime, eventData.endTime));
    } catch (error) {
      throw new Error(`Failed to create event: ${error.message}`);
    }
  }

  // Add all events to the events array
  events.push(...allNewEvents);
  saveEvents(events);
  
  // Return all created events
  return allNewEvents.length === 1 ? allNewEvents[0] : allNewEvents;
};

// Get event by ID
const getEventById = (eventId) => {
  const events = getEvents();
  return events.find(event => event.id === eventId);
};

// Get events for a tutor
const getEventsByTutorId = (tutorId) => {
  const events = getEvents();
  return events.filter(event => event.tutorId === tutorId);
};

// Get events for a student
const getEventsByStudentId = (studentId) => {
  const events = getEvents();
  return events.filter(event => event.studentIds.includes(studentId));
};

// Update event
const updateEvent = (eventId, updates) => {
  const events = getEvents();
  const index = events.findIndex(event => event.id === eventId);
  
  if (index === -1) {
    throw new Error('Event not found');
  }
  
  events[index] = {
    ...events[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  saveEvents(events);
  return events[index];
};

// Delete event
const deleteEvent = (eventId) => {
  const events = getEvents();
  const filteredEvents = events.filter(event => event.id !== eventId);
  
  if (filteredEvents.length === events.length) {
    throw new Error('Event not found');
  }
  
  saveEvents(filteredEvents);
  return { success: true };
};

// Generate iCalendar format for an event
const generateICalEvent = (event) => {
  const tutor = getUserById(event.tutorId);
  const tutorName = tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Tutor';
  
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  
  const formatDate = (date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };
  
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Advanced Tutoring//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `LOCATION:${event.location || 'Online'}`,
    `ORGANIZER;CN=${tutorName}:mailto:${tutor?.email || 'tutor@example.com'}`,
    `DTSTAMP:${formatDate(new Date())}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
};

module.exports = {
  getEvents,
  createEvent,
  getEventById,
  getEventsByTutorId,
  getEventsByStudentId,
  updateEvent,
  deleteEvent,
  generateICalEvent
}; 