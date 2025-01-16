import { Event } from '../models/event.model.js';
import { User } from '../models/user.model.js'
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';

const createEvent = asyncHandler(async (req, res) => {
  try {
    // Extract event details from the request body
    const {
      title,
      description,
      date,
      time,
      location,
      category,
      capacity
    } = req.body;

    // console.log(title, description, date, time, location, category, capacity);

    // Validate required fields
    if (!title || !description || !date || !time || !location || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, date, time, location, and category.',
      });
    }

    const eventPic = await uploadOnCloudinary(req.file?.path);

    // Create a new event
    const newEvent = new Event({
      title,
      description,
      date,
      time,
      location,
      category,
      imageUrl: eventPic?.url,
      organizer: req?.user?._id, // Assuming req.user contains the authenticated user's info
      capacity,
    });

    // Save the event to the database
    const savedEvent = await newEvent.save();

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      event: savedEvent,
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the event.',
      error: error.message,
    });
  }
});


const deleteEvent = asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
  
      // Validate ID
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Event ID is required.'
        });
      }
  
      // Find and delete the event
      const deletedEvent = await Event.findByIdAndDelete(id);
  
      if (!deletedEvent) {
        return res.status(404).json({
          success: false,
          message: 'Event not found.'
        });
      }
  
      // Return success response
      res.status(200).json({
        success: true,
        message: 'Event deleted successfully.',
        event: deletedEvent
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while deleting the event.',
        error: error.message
      });
    }
})

const getUpcomingEventsForUser = asyncHandler(async (req, res) => {
    try {
      const userId = req.user._id; // Assuming req.user contains the authenticated user's info
  
      // Find all upcoming events organized or attended by the user
      const upcomingEvents = await Event.find({
        $or: [
          { organizer: userId },
          { attendees: userId }
        ],
        date: { $gte: new Date() } // Events with a date in the future
      }).sort({ date: 1 }); // Sort by date ascending
  
      res.status(200).json({
        success: true,
        message: 'Upcoming events retrieved successfully.',
        events: upcomingEvents
      });
    } catch (error) {
      console.error('Error retrieving upcoming events:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while retrieving the events.',
        error: error.message
      });
    }
  })

const getPastEvents = asyncHandler(async (_, res) => {
    try {
      
      const currentDate = new Date();
  
      
      const pastEvents = await Event.find({ date: { $lt: currentDate } })
  
    
      return res.status(200).json(pastEvents);
    } catch (error) {
    
      console.error('Error fetching past events:', error);
      return res.status(500).json({ message: 'An error occurred while fetching past events.' });
    }
  })

const joinEvent = asyncHandler(async (req, res) => {
    try {
      const { eventId } = req.params; // Event ID from the URL params
      const userId = req.user?._id; // User ID from the authenticated user
      // console.log(eventId, userId)
      // Find the event by ID
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found.' });
      }
  
      // Check if the event is still open for joining
      if (event.status === 'completed' || event.attendees.length >= event.capacity) {
        return res.status(400).json({ success: false, message: 'Event is either completed or full.' });
      }
  
      // Check if the user is already an attendee
      if (event.attendees.includes(userId)) {
        return res.status(400).json({ success: false, message: 'You have already joined this event.' });
      }
  
      // Add the user to the attendees array
      event.attendees.push(userId);
  
      // Save the event with the updated attendees
      await event.save();
  
      // Respond with success
      res.status(200).json({
        success: true,
        message: 'Successfully joined the event.',
        event: event,
      });
    } catch (error) {
      console.error('Error joining event:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while joining the event.',
        error: error.message,
      });
    }
  });

const getAllEvents = asyncHandler(async (req, res) => {
    // try {
    //     // Fetch all events, sorted by date from newest to oldest
    //     const events = await Event.find()
    //         .populate("owner", "username email") // Populate owner details
    //         .populate("attendees", "username email") // Populate attendee details
    //         .sort({ createdAt: -1 });

    //     if (!events || events.length === 0) {
    //         return res.status(200).json(
    //             new ApiResponse(200, [], "No events found")
    //         );
    //     }

    //     return res.status(200).json(
    //         new ApiResponse(200, {
    //             events,
    //             totalEvents: events.length
    //         }, "Events fetched successfully")
    //     );

    // } catch (error) {
    //     throw new ApiError(500, `Error fetching events: ${error.message}`);
    // }

    try {
      // Get the current date
      const currentDate = new Date();
  
      // Find all events with status 'upcoming' and a date greater than or equal to today
      const upcomingEvents = await Event.find({
        status: 'upcoming',
        date: { $gte: currentDate },
      }).populate('organizer', 'name email') // Populate organizer details, adjust fields as needed
        .populate('attendees', 'name email'); // Populate attendees details, adjust fields as needed
  
      // Return the upcoming events
      res.status(200).json({ events: upcomingEvents });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to fetch upcoming events.' });
    }
});

const leaveEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user?.id; // Assuming user ID is available in req.user

  // console.log(eventId, userId)
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.attendees.includes(userId)) {
      return res.status(400).json({ message: 'User is not an attendee of this event' });
    }

    event.attendees = event.attendees.filter(attendee => attendee.toString() !== userId.toString());

    await event.save();

    // const user = await User.findById(userId);
    // user.events = user.events.filter(event => event.toString() !== eventId.toString());
    // await user.save();

    res.status(200).json({ message: 'Successfully left the event' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
})

  export {
    createEvent,
    deleteEvent,
    getUpcomingEventsForUser,
    getPastEvents,
    joinEvent,
    getAllEvents,
    leaveEvent
}