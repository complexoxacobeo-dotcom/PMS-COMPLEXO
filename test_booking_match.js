const email = {
    checkIn: '2026-07-31',
    noches: 3,
    personas: 2,
    clientName: 'Alonso Miguel',
    agency: 'Booking'
};

const checkInStr = '2026-07-31';
const nights = 3;
const pax = 2;
const recentEmails = [email];

let candidates = recentEmails.filter(e => e.checkIn === checkInStr && e.noches === nights);
if (candidates.length > 0) {
    let matchedEmail = candidates.find(e => e.personas === pax) || candidates[0];
    console.log("MATCHED!", matchedEmail.clientName);
} else {
    console.log("NOT MATCHED");
}
