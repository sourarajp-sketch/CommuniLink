# Security Specification: CommuniLink

## Data Invariants
1. An Issue cannot exist without a valid location, severity, and reporter.
2. Only authenticated users can report an issue.
3. Only the reporter or an admin can delete an issue.
4. A Volunteer profile must be linked to a valid authenticated user's UID.
5. Assignments must link a valid Issue and Volunteer.
6. Identity roles are only valid if verified by Firestore data (not client claims).

## The "Dirty Dozen" Payloads
1. **The ID Poisoning Attack**: Attempt to create an issue with a 2MB string as ID.
2. **The Identity Spoof**: Create an issue as User A but set `reportedBy` to User B.
3. **The Privilege Escalation**: A volunteer attempts to mark an issue as "Resolved" when they are not assigned.
4. **The Ghost Field**: Add `isVerified: true` to a user profile update.
5. **The Orphaned Write**: Create an assignment for a non-existent issue.
6. **The Status Jump**: Update an issue from "Open" to "Resolved" without an "In Progress" step (if logic enforced).
7. **The PII Leak**: Authenticated User A tries to list all Private Volunteer info.
8. **The Immutable Field Change**: Attempt to change `reportedAt` on an existing issue.
9. **The Denial of Wallet**: Querying issues with a loop to drain read quota.
10. **The Unverified Admin**: Attempt to access admin routes with a spoofed email (not verified).
11. **The Over-Sized Write**: Submitting an issue description that is 5MB.
12. **The Relational Break**: Deleting an issue while it still has active assignments.

## Test Runner (Draft)
```typescript
// firestore.rules.test.ts
// This file would be used with the @firebase/rules-unit-testing library
// to verify the logic described above.
```
