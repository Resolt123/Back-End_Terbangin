const bookingUsecase = require("../../usecases/booking/index");
const isUUID = require("../../helpers/isUUID");
const {
    createAutomaticNotification,
} = require("../../controllers/notification/index");

exports.getBookings = async (req, res, next) => {
    try {
        const data = await bookingUsecase.getBookings();

        res.status(200).json({
            message: "Successs",
            data,
        });
    } catch (error) {
        next(error);
    }
};

exports.getBookingById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await bookingUsecase.getBookingById(id);
        if (!data) {
            return next({
                message: `booking with this id :${id} is not found!`,
                statusCode: 404,
            });
        }

        res.status(200).json({
            message: "Successs",
            data,
        });
    } catch (error) {
        next(error);
    }
};

exports.createBooking = async (req, res, next) => {
    try {
        const payload = req.body;

        if (!payload.userId || !isUUID(payload.userId)) {
            throw {
                statusCode: 400,
                message: "user id cannot be empty and must be a valid UUID",
            };
        }
        if (!payload.paymentId || !isUUID(payload.paymentId)) {
            throw {
                statusCode: 400,
                message: "payment id cannot be empty and must be a valid UUID",
            };
        }
        const validTypes = ["One Way", "Return"];
        if (!payload.status || !validTypes.includes(payload.status)) {
            throw {
                statusCode: 400,
                message: "status must be one of One Way, Return",
            };
        }

        const data = await bookingUsecase.createBooking(payload);

        await createAutomaticNotification(
            "Booking",
            `Data booking anda telah tersimpan dengan kode booking ${data.bookingCode}. Status pembayaran anda masih berstatus UNPAID, tolong segera selesaikan pembayaran anda`,
            payload.userId,
            data.id
        );

        req.io.emit("bookingNotification", {
            message: `Data booking anda telah tersimpan dengan kode booking`,
            highlight: data.bookingCode,
            userId: payload.userId,
        });

        req.io.emit("notificationUpdate", {
            message: "Notification Update",
        });

        res.status(201).json({
            message: "Success",
            data,
        });
    } catch (error) {
        next(error);
    }
};

exports.updateBooking = async (req, res, next) => {
    try {
        const payload = req.body;
        const { id } = req.params;
        if (payload.userId && !isUUID(payload.userId)) {
            throw {
                statusCode: 400,
                message: "user id cannot be empty and must be a valid UUID",
            };
        }
        if (payload.paymentId && !isUUID(payload.paymentId)) {
            throw {
                statusCode: 400,
                message: "payment id cannot be empty and must be a valid UUID",
            };
        }
        const validTypes = ["One Way", "Return"];
        if (payload.status && !validTypes.includes(payload.status)) {
            throw {
                statusCode: 400,
                message: "status must be one of One Way, Return",
            };
        }

        const data = await bookingUsecase.updateBooking(id, payload);

        res.status(201).json({
            message: "Successs",
            data,
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await bookingUsecase.deleteBooking(id);

        res.status(200).json({
            message: "Successs",
            data,
        });
    } catch (error) {
        next(error);
    }
};

exports.generateFlightTicket = async (req, res, next) => {
    try {
        const { email, bookingId } = req?.body;
        const data = await bookingUsecase.generateFlightTicket(
            email,
            bookingId
        );

        res.status(200).json({
            message: "Successs send email ticket",
            data,
        });
    } catch (error) {
        next(error);
    }
};
