# stateless-encryption-session
Simple and secure stateless session system with **AES-GCM encryption**. No JWT. No database.

* 🔒 **Encrypted payload** (not readable by client)
* ⚡ **No database** required
* 🛡️ **No JWT**
* Works on **Node.js (v18+)** and **Edge runtimes**

---

## 📦 What is this?

A small utility to:

* Encrypt a session object → becomes a token
* Decrypt a token → returns the session

Everything is **stateless**.
No session is stored on the server.

---

## ⚙️ How it works

1. You pass a session payload (object).
2. Payload is converted to JSON.
3. Encrypted using **AES-GCM**.
4. Encoded using **base64url**.
5. Returned as token:

```
v1.<iv>.<ciphertext>
```

On read:

* Token is parsed.
* Decrypted using the same secret.
* Expiration is checked.
* Payload is returned (or `null` if invalid).

---

## 🔐 Crypto

This project uses:

* **AES-GCM** → authenticated encryption
* **SHA-256** → derive key from secret
* **Web Crypto API** → `crypto.subtle`

---

## 🚀 Usage

### TypeScript

```ts
import { sealSession, unsealSession } from "./sessionCrypto";

const token = await sealSession({
  v: 1,
  exp: Date.now() + 1000 * 60 * 60, // 1 hour
  user: "user_123",
  role: "user"
});

const session = await unsealSession(token);

if (!session) {
  console.log("Invalid or expired session");
} else {
  console.log("Hello", session.user);
}
```

### JavaScript

```js
import { sealSession, unsealSession } from "./sessionCrypto.js";

const token = await sealSession({
  v: 1,
  exp: Date.now() + 1000 * 60 * 60, // 1 hour
  user: "user_123",
  role: "user"
});

const session = await unsealSession(token);

if (!session) {
  console.log("Invalid or expired session");
} else {
  console.log("Hello", session.user);
}
```

---

## 🧩 Payload

You can put **any data you need** inside the session.

Example:

```ts
{
  v: 1,
  exp: Date.now() + 3600000,

  user: "user_123",
  role: "admin"
}
```

### Required fields

* `v` → version (must be 1)
* `exp` → expiration timestamp (in milliseconds)

Everything else is flexible.

---

## 🍪 Typical usage

Store the token in a cookie:

```
Set-Cookie: session=TOKEN; HttpOnly; Secure; SameSite=Strict
```

Then read and decrypt it on each request.

---

## ⚠️ Notes

* Secret key is hardcoded in the example → **use environment variables in production**
* Tokens **cannot be revoked** (stateless)
* **Expiration** is required for safety

---

## 🌍 Runtime Support

* Node.js (v18+)
* Other environments with Web Crypto API

---

## 🧠 Concept

This implements:

* Stateless session
* Encrypted token (similar to JWE)
* AEAD (AES-GCM)

---

## ✅ Advantages

* Stateless → no server storage needed
* Encrypted → client cannot read payload
* Minimal → simple API
* Flexible → payload can include any data

---

## ❌ Limitations / Trade-offs

* **Cannot be revoked**
  Once a token is issued, it stays valid until it expires.
* **No server-side control**
  Cannot force logout, track active sessions, or limit concurrent sessions.
* **Token size is larger than simple IDs**
  Encrypted payload + IV makes tokens longer than typical session IDs or JWT.
* **Secret rotation is tricky**
  Changing the secret invalidates all existing sessions unless you implement key rotation.
* **No built-in audience/issuer validation**
  Unlike JWT, standard claims like `iss`, `aud` are missing.
* **Replay attacks possible** (within expiration window)
* **Clock dependency**
  Expiration relies on server time; clock drift may affect validity.
* **No partial invalidation**
  Cannot invalidate a specific user/session without changing the global secret.
* **Debugging is harder**
  Payload is encrypted → cannot be inspected easily.
* **Requires secure secret management**
  If the secret leaks, all sessions are compromised.

---

## 📄 License

MIT

---
