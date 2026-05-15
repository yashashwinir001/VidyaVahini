# Security Specification for Vidya-Vahini

## Data Invariants
- A status update (ping/breakdown) must be attached to a valid route.
- A user can only report pings with their own UID.
- Timestamps must be server-generated.
- User profiles can only be modified by the owner.
- Routes are primarily read-only for students.

## The "Dirty Dozen" Payloads (Anti-Tests)
1. **Identity Spoofing**: Creating a ping with another student's `reporterId`.
2. **Resource Poisoning**: Injecting a 1MB string into a `stopId` field.
3. **Identity Spoofing (User)**: Updating someone else's user profile.
4. **State Shortcutting**: Manually setting a `timestamp` in the future instead of using `request.time`.
5. **Privilege Escalation**: Attempting to create a new `Route` without proper authorization (restricted in logic).
6. **Shadow Fields**: Adding an `isAdmin: true` field to a user profile update.
7. **Cross-Route Access**: Listing updates for a route with a non-existent route ID.
8. **PII Leak**: Authenticated user trying to read all `users` collection (blanket read blocked).
9. **Spamming**: Rapid fire pings (limited by verified email).
10. **ID Poisoning**: Using a document ID that is actually a JS payload.
11. **Immutability Breach**: Changing the `timestamp` of an existing update.
12. **Orphaned Updates**: Creating an update for a route ID that doesn't exist (verified via `isValidId`).

## Test Plan
- Verify all write operations require `request.auth.token.email_verified == true`.
- Verify `reporterId` matches `auth.uid`.
- Verify `timestamp` matches `request.time`.
