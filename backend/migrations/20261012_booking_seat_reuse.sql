-- Keep historical show_seat_id references while enforcing one active booking per seat.
ALTER TABLE booking_seats
  ADD COLUMN active_show_seat_id BIGINT UNSIGNED NULL;

UPDATE booking_seats bs
JOIN bookings b ON b.booking_id = bs.booking_id
SET bs.active_show_seat_id = bs.show_seat_id
WHERE b.status IN ('pending', 'confirmed');

ALTER TABLE booking_seats
  DROP INDEX uq_booking_show_seat,
  ADD UNIQUE KEY uq_booking_active_show_seat (active_show_seat_id),
  ADD KEY ix_booking_seats_show_seat_id (show_seat_id);
