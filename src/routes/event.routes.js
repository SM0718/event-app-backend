import { Router } from 'express'
import {
    createEvent,
    deleteEvent,
    getUpcomingEventsForUser,
    getPastEvents,
    joinEvent,
    getAllEvents,
    leaveEvent
} from '../controllers/event.controllers.js'
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = new Router()

router.route('/create-event').post(verifyJWT, upload.single('imageUrl'), createEvent)
router.route('/delete-event').delete(verifyJWT, deleteEvent)
router.route('/get-all-event').get(verifyJWT, getUpcomingEventsForUser)
router.route('/get-past-event').get(verifyJWT, getPastEvents)
router.route('/join/:eventId').post(verifyJWT, joinEvent);
router.route("/get-all-events").get(getAllEvents)
router.route('/leave/:eventId').post(verifyJWT, leaveEvent);

export default router