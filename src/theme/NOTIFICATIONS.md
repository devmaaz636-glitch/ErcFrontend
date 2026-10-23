# ERC Notifications Architecture

Three channels, one event pipeline — **Push**, **Email**, **In-App**.

## Pipeline

```
Clinic / admin event
        │
        ▼
POST /api/notifications/events
        │
        ▼
Redis preferences (per uid)
  ├─ alerts[type] must be ON
  └─ channels: push | email | inApp
        │
        ├── inApp ──► Redis feed + PUBLISH ──► SSE / poll ──► App feed (live)
        ├── email ──► SMTP (nodemailer) ──► user inbox
        └── push  ──► Expo Push API ──► device OS notification
```

## Zero loading (client)

1. **AsyncStorage cache** — Profile / Notifications paint instantly from last prefs + feed  
2. **Background sync** after Firebase auth — no blocking spinner  
3. **Optimistic toggles** — switch flips immediately, then Redis confirms  
4. **SSE stream** (`/api/notifications/stream`) with poll fallback — feed updates without refresh  

## Where to control channels

| Place | What |
| --- | --- |
| **Profile tab** | Push / Email / In-App toggles (instant save) |
| **Notifications screen** | Same channels + alert types + live feed |

## Channel roles

| Channel | When it fires | Transport |
| --- | --- | --- |
| **In-App** | App open / background sync | Redis list + pub/sub → SSE |
| **Email** | Anytime prefs allow | SMTP `mailer.sendMail` |
| **Push** | Device registered + channel ON | Expo Push (`exp.host`) |

## Key files

- Backend: `Backend/src/notifications.js`, routes in `app.js`  
- Client store: `frontend/src/context/NotificationsContext.js`  
- SSE: `frontend/src/lib/notificationStream.js`  
- Push: `frontend/src/lib/pushNotifications.js`  
- API: `frontend/src/lib/notifications.js`  

## Device registration

```
POST   /api/notifications/devices   { token, platform }
DELETE /api/notifications/devices   { token }
```

Tokens live in Redis set `notify:devices:{uid}`. Turning **Push** ON on Profile registers the Expo token; turning OFF unregisters it.

## Account & booking events (automatic)

These fire after real user actions (respect channel + alert toggles):

| Action | Alert type | Where |
| --- | --- | --- |
| Save name / email / region / photo | `profileChanges` | Edit Profile |
| Change / reset password | `passwordChanges` | Security / Forgot Password |
| Open an appointment detail | `bookingUpdates` | Appointment Detail (once / session) |

Keep **In-App** and/or **Email** ON in Profile, and leave those alert toggles ON under Notification Preferences.

## How to test (see it work)

### 1. Prep
1. Backend running on `:4000` (`cd Backend && npm start`)
2. Phone/emulator and PC on the **same Wi‑Fi**
3. Sign in to the app → Profile → turn channels ON as needed

### 2. In-App (easiest)
1. Profile → enable **In-App Notifications** (look for `● Live`)
2. Open **Notification Preferences**
3. Tap **Send Test Notification**
4. You should see **Recent Activity** update with “Test: Refund Spike Detected”
5. Profile bell badge unread count should increase

### 3. Email
1. Enable **Email Notifications**
2. Tap **Send Test Notification**
3. Check the inbox for the signed-in Firebase email  
   - Subject like `[ERC] Test: Refund Spike Detected`  
   - If SMTP is in dev-console mode, look at the Backend terminal for `[mail:dev] ...`

### 4. Push (physical device recommended)
1. Use a **real phone** (not iOS Simulator for reliable push)
2. Enable **Push Notifications** and allow system permission
3. Tap **Send Test Notification**
4. Banner / notification tray should show the test title  
   - Status line after send shows `Push ✓` when Expo accepted the token

### 5. What the status line means
After **Send Test Notification** you get something like:

`Test sent · In-App ✓  Email ✓  Push —`

| Mark | Meaning |
| --- | --- |
| ✓ | That channel delivered |
| — | Channel off, no token, or SMTP/push failed |

### 6. Optional: curl (same event)
With a Firebase ID token:

```bash
curl -X POST http://YOUR_LAN_IP:4000/api/notifications/events \
  -H "Authorization: Bearer FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"refund\",\"title\":\"Test: Refund Spike\",\"body\":\"Hello from curl\"}"
```
