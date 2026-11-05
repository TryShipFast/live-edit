# Changelog

## 0.18.0 (unreleased)

### Team editing: one person per section

Owner, 5 Nov 2026: "if we allow for collaboration, we should lock a section a
team member is working on and publish releases it, otherwise, they override
eachother works".

- A section somebody is editing is theirs until they publish, discard, or leave
  it alone for 30 minutes. Teammates see a dashed outline and "Ada is editing
  this section", and pressing it says so instead of opening it.
- The server refuses (409, in plain words) any save into a section somebody
  else holds, even from a stale page. Two first edits at once: one wins, the
  other is told who.
- Publish puts live only the publisher's own sections, then releases them. A
  teammate's unfinished section stays a draft and stays theirs.
- Discard (`POST /team/discard`) throws away only your own changes and releases
  your sections. Putting back one change is for its author or the owner.
- A lapsed section keeps its changes, still attributed to their author; the
  next person is told "Ada left unpublished changes here" and can continue from
  them, or (owner) discard them.
- The owner or an admin can take over any section, with its unpublished
  changes; the holder is told "Olu took over Hero".
- Changes and the publish window are split into "Your changes (these go live
  when you publish)" and "Others' changes (not included)", by name.
- History says who published each version and lists its changes by section and
  author ("Ada changed the headline in Hero"). **Undo these changes** takes back
  one version only and leaves later work alone. Restoring a whole version says
  whose published work it undoes and keeps a teammate's drafts.
- Sessions can say who the person is: `EditorSession::begin($site, $editor,
  'owner')`, or `editor: {id, name, role}` on `POST /sessions`. A session that
  says nothing is the website itself and behaves exactly as before.
- New: `GET /team`, `POST /team/claim|heartbeat|release|take-over|discard-left|discard`,
  `POST /versions/{n}/undo`, `live-edit:prune-locks` (scheduled every ten
  minutes), config `live-edit.team.*`, migration
  `2026_11_05_120000_one_person_per_section`.

### Roles: owner, admin, editor

Owner, 5 Nov 2026: "the first person to open is the admin, but can also add
other team member as admin or someone can be promoted to admin".

- `admin` is accepted wherever a role is read (the grant's `role`,
  `editor.role` on `POST /sessions`, `EditorSession::begin`). The owner and
  admins may take over, throw away left changes, put back a teammate's change
  and restore a whole version; an editor may not ("Ask an admin to take over").
- A role change counts on the next request: powers are checked fresh, the
  cached who-is-editing answer forgets a person when their grant changes, and
  `POST /sessions/role` changes a host-named person's sessions at once.
- The Publish button (`pending` on `/content` and `/content/version` for an
  editor) counts only your own changes, what pressing it will publish.
- Restoring a whole version stays out of History, API only, and is refused
  (403) for an editor.

### Caching and load

- `GET /team` costs no database query when nothing changed: a cached answer per
  site and revision, a 304 for the ETag the browser holds, and a key check
  remembered for 30 seconds (forgotten when the key changes).
- What visitors read (`GET /content` and `/content/version` with the public
  key) is remembered for up to 10 seconds per site and language and forgotten
  on every save, publish, restore, undo and discard: 5 fewer queries per page
  view.
- The CORS check remembers a site's allowed addresses for a minute instead of a
  query on every API request; forgotten when the site is saved.
- `tests/load/team-locks.mjs`: 50 editors on one site and 200 other sites
  polling the real API.
