let summaries = [
  "Airbnb (John Doe)",
  "Reserved - Maria Gonzalez",
  "CLOSED - Peter Parker",
  "MisterPlan - Laura Silva",
  "Reservation from Booking.com: Alice Wonderland",
  "Reserva de Bob Builder"
];

for (let s of summaries) {
  let raw = s;
  raw = raw.replace(/Reservation from [^:]+:/i, '').trim();
  raw = raw.replace(/Reserva de /i, '').trim();
  raw = raw.replace(/MisterPlan - /i, '').trim();
  raw = raw.replace(/CLOSED - /i, '').trim();
  raw = raw.replace(/Reserved - /i, '').trim();
  raw = raw.replace(/Airbnb \(/i, '').replace(/\)$/, '').trim();
  console.log(s, "=>", raw);
}
