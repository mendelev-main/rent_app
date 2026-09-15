# Booking Rules

## Core invariant

A property must never have overlapping blocking periods for confirmed Rent App bookings or effective external/manual blocks.

## Date semantics

Bookings use check-in and check-out dates with a half-open interval:

`[check_in, check_out)`

Example: booking 10–12 September occupies nights of 10 and 11 September. A new guest may check in on 12 September.

## Availability sources

A date range is unavailable when it overlaps at least one effective block from:

- confirmed booking;
- owner manual block;
- imported external calendar event.

Pending requests do not permanently block inventory in the first MVP. If product testing shows excessive races, we may add short-lived holds later.

## Confirmation

When an owner confirms a pending request, backend must atomically:

1. validate booking still has status `pending`;
2. re-check the requested range against current blocking periods;
3. fail cleanly if the range is no longer available;
4. mark booking `confirmed` if still available;
5. create/effect the corresponding availability block;
6. commit as one database transaction.

## Cancellation

Cancellation keeps the booking record for history but releases its blocking effect according to status/rules.

## External sync conflicts

If an imported external event overlaps a pending request, the external event wins for availability until manually resolved or removed by subsequent synchronization.

If a newly imported event overlaps an already confirmed Rent App booking, the system must not silently delete either record. It creates a synchronization conflict for owner/admin visibility. Conflict-resolution policy will be specified before external calendar sync reaches production.

## Time zone

Property-local date semantics will be used for check-in/check-out. The concrete timezone field and normalization rules will be finalized with the database schema before booking persistence is implemented.
