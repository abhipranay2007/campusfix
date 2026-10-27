# Engineering decisions

- **MERN with JavaScript:** matches the requested course stack and keeps examples approachable.
- **Cookie JWT session:** an HttpOnly cookie keeps the token out of browser JavaScript. SameSite=Lax reduces cross-site request exposure; production requires HTTPS.
- **Student-only public registration:** prevents self-assignment of staff authority. Initial staff setup is explicit and local.
- **Embedded activity:** issue history is naturally bounded per issue and status plus history can be updated together in a MongoDB document operation.
- **Supporter IDs on issue:** `$addToSet` makes duplicate support safe and provides the count needed by the ranking logic.
- **Priority formula:** severity is the strongest initial factor; community support and capped unresolved age add visible increments. The formula is deterministic, offline, and easy to explain.
- **Derived dashboard:** metrics are calculated from stored records rather than hardcoded counters, avoiding drift.
- **No external integrations:** avoids keys, cost, and service failures for the core product. Attachments, notifications, and staff assignment are optional future work.
