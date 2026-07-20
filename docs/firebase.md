# Firebase setup

Read `docs/architecture.md` first if you have not: **the atlas corpus does not go
in Firestore.** It is static, version-controlled data. Firebase is here for
user-generated content — the things a reader creates, which genuinely need a
backend.

Nothing in the current build requires Firebase. Follow this when you add the
first user-facing feature that needs an account, not before.

## What Firebase is for here

| Feature | Needs Firebase? |
| --- | --- |
| Gazetteer, timeline, book mode, search | No — static, bundled, CDN-cached |
| Saved places and reading positions | Yes — Firestore |
| Personal study notes on a place | Yes — Firestore |
| Shared or published reading plans | Yes — Firestore, with careful rules |
| Uploaded images | Yes — Storage |
| Sign-in | Yes — Authentication |

## 1. Create the project

1. Go to the [Firebase console](https://console.firebase.google.com) and create a
   project. Disable Google Analytics unless you have a specific use for it — it
   adds a consent obligation you otherwise do not have.
2. Add a **Web** app to the project. Copy the config object it gives you.
3. Choose a Firestore location close to your users. **This cannot be changed
   later** without recreating the database.

## 2. Environment variables

Create `.env.local` (already gitignored):

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

The `NEXT_PUBLIC_` prefix ships these to the browser, which is correct and safe:
a Firebase web API key is an identifier, not a secret. **Your security rules are
what protect the data.** Treat any advice to hide the API key as a distraction
from writing rules properly.

Add the same variables to Vercel under Project → Settings → Environment
Variables.

## 3. Data model

Keep user data under the user's own document. It makes the rules simple enough to
verify by reading them, which is the property you want in a rules file.

```
users/{uid}
  displayName: string
  createdAt: timestamp

users/{uid}/notes/{placeId}
  body: string
  updatedAt: timestamp

users/{uid}/bookmarks/{placeId}
  createdAt: timestamp

plans/{planId}                     # shared reading plans
  ownerUid: string
  title: string
  visibility: 'private' | 'public'
  stops: [{ placeId: string, note: string }]
```

Note that `placeId` is the document id, not a field. Place ids come from the
static corpus, so a note is naturally one-per-place-per-user and the uniqueness
is structural rather than enforced by a query.

## 4. Security rules

Start from deny-all and open the minimum. Put this in `firestore.rules`:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }

    // A user's own subtree. Nobody else reads it, including other signed-in users.
    match /users/{uid} {
      allow read, write: if isOwner(uid);

      match /{document=**} {
        allow read, write: if isOwner(uid);
      }
    }

    // Shared plans: readable when public or owned; only ever written by the owner,
    // and the owner field cannot be reassigned to someone else.
    match /plans/{planId} {
      allow read: if resource.data.visibility == 'public'
                  || isOwner(resource.data.ownerUid);

      allow create: if isSignedIn()
                    && request.resource.data.ownerUid == request.auth.uid
                    && request.resource.data.title is string
                    && request.resource.data.title.size() <= 200
                    && request.resource.data.visibility in ['private', 'public'];

      allow update: if isOwner(resource.data.ownerUid)
                    && request.resource.data.ownerUid == resource.data.ownerUid;

      allow delete: if isOwner(resource.data.ownerUid);
    }

    // Anything not matched above is denied. Do not add a catch-all.
  }
}
```

Two things worth calling out, because they are the mistakes that actually happen:

- The `update` rule pins `ownerUid` to its existing value. Without that, any
  owner could hand their document to another account, or a crafted update could
  change who owns it.
- There is no wildcard fallback at the bottom. Firestore denies by default;
  adding `match /{document=**} { allow read: if true; }` "temporarily" during
  development is how databases end up public.

Storage rules, if you add uploads:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{uid}/{allPaths=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == uid
                         && request.resource.size < 5 * 1024 * 1024
                         && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## 5. Test the rules before you ship them

Rules are code and deserve tests. The emulator makes this cheap:

```bash
npm install --save-dev @firebase/rules-unit-testing firebase-tools
npx firebase emulators:start --only firestore
```

Write at least the negative cases: a signed-out read, a signed-in read of another
user's notes, an update that tries to reassign `ownerUid`. A rules file that has
only ever been tested with the happy path has not been tested.

## 6. Deploy the rules

```bash
npx firebase login
npx firebase init firestore   # select the existing project
npx firebase deploy --only firestore:rules,storage:rules
```

Deploy rules **before** the client code that writes the new shape, so there is
never a window where the data is reachable and unprotected.

## 7. Authentication

Enable only the providers you will use. Email-link (passwordless) sign-in is
worth considering here: this is a reference tool people return to occasionally,
and it avoids handling passwords at all.

Under Authentication → Settings, add your production domain to the authorised
domains list, and remove any you do not control.
