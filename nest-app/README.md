

## Testing WebSockets via Insomnia

In Insomnia, create a **Socket.IO Request** (not standard WebSocket).

### 0. Create an Account & Sign In (HTTP REST)

Before using WebSockets, you must create a user and get a valid token.

**Action (Sign Up) in Insomnia:**
1. Create a new **HTTP Request** (POST).
2. **URL:** `http://localhost:3111/auth/sign-up`
3. **Body (JSON):**
```json
{
  "username": "berkay",
  "password": "super-secure-password"
}
```
4. Click **Send**.

**Action (Sign In) in Insomnia:**
1. Create a new **HTTP Request** (POST).
2. **URL:** `http://localhost:3111/auth/sign-in`
3. **Body (JSON):**
```json
{
  "username": "berkay",
  "password": "super-secure-password"
}
```
4. Click **Send**. 
5. **Copy the `token`** value from the JSON response.

---

## Testing WebSockets via Insomnia

In Insomnia, create a **Socket.IO Request** (not standard WebSocket).

**Global Setup (For Both Client A & Client B Tabs):**
* **URL:** `http://localhost:3111`
* **Namespace (in Socket.IO tab):** `/secure`
* **Headers:** Add a new header with Name: `user-slc-tkn` and Value: `Bearer <YOUR_COPIED_TOKEN>`
* Ensure both clients click **Connect** and see the green connected status.
* In the Timeline panel, type `receive-message` and `online-users` into the "Listen for events" box.

### 0.5 Who is Online?
Whenever clients connect or disconnect, the server automatically broadcasts the `online-users` event globally containing an array of currently connected usernames and the total number of active socket connections (`connectionCount`).

**Action in Client A (Check Online Users & Connection Count):**
* **Event:** `who-is-online`
* **Payload (JSON):** `{}`
* **Result:** Server acknowledges with `{ "status": "success", "onlineUsers": ["berkay"], "connectionCount": 1 }`


### 1. Test Single E2E Message

**Action in Client A:**
* **Event:** `send-message`
* **Payload (JSON):** 
```json
{
  "text": "Hello Client B!"
}
```
* **Result:** Client B logs an incoming `receive-message` containing the sender's username, ID, and text!

### 2. Decrypt the Message

**Action in Client B:**
* Check the timeline for the `encryptedText` object you just received.
* **Event:** `decrypt-payload`
* **Payload (JSON):** 
```json
{
  "encryptedText": {
    "iv": "your-iv-string",
    "content": "your-content-string"
  }
}
```
* **Result:** You will receive the decrypted string "Hello Client B!".

### 3. Test Private Rooms

**Action in Client A (Join Room):**
* **Event:** `join-room`
* **Payload (JSON):** 
```json
{
  "room": "MySecretRoom"
}
```

**Action in Client B (Join Room):**
* **Event:** `join-room`
* **Payload (JSON):** 
```json
{
  "room": "MySecretRoom"
}
```

**Action in Client A (Send to Room):**
* **Event:** `send-message`
* **Payload (JSON):** 
```json
{
  "text": "Hello Private Target!",
  "room": "MySecretRoom"
}
```
* **Result:** Client B receives it because they are in the same room.

### 4. Test Server-Side Hashing

**Action in Client A:**
* **Event:** `hash-payload`
* **Payload (JSON):** 
```json
{
  "text": "my-password"
}
```

### 5. Test Server-Side Encryption

**Action in Client A:**
* **Event:** `encrypt-payload`
* **Payload (JSON):** 
```json
{
  "text": "sensitive-data"
}
```
