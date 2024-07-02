const bookingsRepo = require("../../repositories/booking");
const { getFlightbyId } = require("../../repositories/flight");
const {
    getHelperBookingByBookingId,
} = require("../../repositories/helperBooking");
const sendEmail = require("../../config/emailConfig");
const template = require("../../helpers/templateTicket");
// const puppeteer = require("puppeteer");
const moment = require("moment-timezone");

exports.getBookings = async () => {
    const data = await bookingsRepo.getBookings();
    return data;
};

exports.getBookingById = async (id) => {
    const data = await bookingsRepo.getBookingById(id);
    return data;
};

exports.createBooking = async (payload) => {
    const data = await bookingsRepo.createBooking(payload);
    return data;
};

exports.updateBooking = async (id, payload) => {
    const data = await bookingsRepo.updateBooking(id, payload);
    return data;
};

exports.deleteBooking = async (id) => {
    const data = await bookingsRepo.deleteBooking(id);
    return data;
};

exports.generateFlightTicket = async (email, bookingId) => {
    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    };

    const formatTime = (date, timezone) => {
        return moment.tz(date, timezone).format("HH:mm");
    };

    const booking = await bookingsRepo.getBookingById(bookingId);
    const helperBooking = await getHelperBookingByBookingId(bookingId);
    let flightIdDeparture;
    let flightIdReturn;
    let flightDeparture;
    let flightReturn;
    let flightDeparturePlain;
    let flightReturnPlain;

    if (booking[0]?.roundtripFlightId) {
        flightIdDeparture = helperBooking[0].Seat.flightId;
        flightIdReturn = booking[0].roundtripFlightId;
        flightDeparture = await getFlightbyId(flightIdDeparture);
        flightReturn = await getFlightbyId(flightIdReturn);
        flightDeparturePlain = flightDeparture[0].get({ plain: true });
        flightReturnPlain = flightReturn[0].get({ plain: true });
    } else {
        flightIdDeparture = helperBooking[0].Seat.flightId;
        flightDeparture = await getFlightbyId(flightIdDeparture);
        flightDeparturePlain = flightDeparture[0].get({ plain: true });
    }

    let airlineClass = helperBooking[0].Seat.airlineClass;
    if (airlineClass === "FIRST_CLASS") {
        airlineClass = "FirstClass";
    } else if (airlineClass === "BUSINESS") {
        airlineClass = "Business";
    } else if (airlineClass === "ECONOMY") {
        airlineClass = "Economy";
    }

    let userBooking = {
        bookingCode: booking[0].bookingCode,
        class: airlineClass,
        flightDepartureCode: flightDeparturePlain?.flightCode,
        flightDepartureAirportCode:
            flightDeparturePlain?.StartAirport?.iataCode,
        flightDepartureAirportCode2: flightDeparturePlain?.EndAirport?.iataCode,
        flightDepartureAirportName: flightDeparturePlain?.StartAirport?.name,
        flightDepartureAirportName2: flightDeparturePlain?.EndAirport?.name,
        flightDepartureCity: flightDeparturePlain?.StartAirport?.city,
        flightDepartureCity2: flightDeparturePlain?.EndAirport?.city,
        departureDuration: formatDuration(flightDeparturePlain?.duration),
        departureTime: formatTime(
            flightDeparturePlain?.departureAt,
            flightDeparturePlain?.StartAirport?.timezone
        ),
        departureTerminal: flightDeparturePlain?.StartAirport?.terminal,
        flightReturnCode: flightReturnPlain?.flightCode,
        flightReturnAirportCode: flightReturnPlain?.EndAirport?.iataCode,
        flightReturnAirportCode2: flightReturnPlain?.StartAirport?.iataCode,
        flightReturnAirportName: flightReturnPlain?.EndAirport?.name,
        flightReturnAirportName2: flightReturnPlain?.StartAirport?.name,
        flightReturnCity: flightReturnPlain?.StartAirport?.city,
        flightReturnCity2: flightReturnPlain?.EndAirport?.city,
        returnDuration: formatDuration(flightReturnPlain?.duration),
        returnTime: formatTime(
            flightReturnPlain?.departureAt,
            flightReturnPlain?.StartAirport.timezone
        ),
        returnTerminal: flightReturnPlain?.StartAirport?.terminal,
    };
    const html = template.emailTemplate(userBooking);

    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.setContent(html);
    // const pdfBuffer = await page.pdf({ format: "A4" });
    // await browser.close();

    await sendEmail({
        to: email,
        subject: "Flight Ticket Booking Confirmation",
        html,
        // attachments: [
        //     {
        //         filename: "FlightTicket.pdf",
        //         content: pdfBuffer,
        //         contentType: "application/pdf",
        //     },
        // ],
    });
    console.log("berhasil");
    const data = await bookingsRepo.getBookingById(bookingId);

    return data;
};
