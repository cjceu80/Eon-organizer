# API Reference

## Authentication Endpoints

All endpoints except `/api/auth/login` and `/api/auth/register` require authentication via Bearer token in the Authorization header.

### POST /api/auth/register
Create a new user account.

**Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

### POST /api/auth/login
Login and get authentication token.

**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "jwt-token",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string"
  }
}
```

### GET /api/auth/me
Get current authenticated user info.

---

## World Endpoints

### POST /api/worlds
Create a new world. User becomes the admin.

**Headers:** `Authorization: Bearer {token}`

**Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "isPublic": boolean (optional),
  "settings": {} (optional)
}
```

### GET /api/worlds/my-worlds
Get all worlds where user is admin or has characters.

### GET /api/worlds/:worldId
Get a specific world by ID. User must be admin or have access.

### PUT /api/worlds/:worldId
Update a world. **Admin only.**

**Body:**
```json
{
  "name": "string",
  "description": "string",
  "isPublic": boolean,
  "settings": {}
}
```

### DELETE /api/worlds/:worldId
Delete a world and all its characters. **Admin only.**

### GET /api/worlds/:worldId/characters
Get all characters in a world. User must have access to the world.

---

## Character Endpoints

### POST /api/characters
Create a new character in a world.

**Headers:** `Authorization: Bearer {token}`

**Body:**
```json
{
  "name": "string (required)",
  "worldId": "string (required)",
  "bio": "string (optional)",
  "stats": {} (optional),
  "inventory": [] (optional)
}
```

### GET /api/characters/my-characters
Get all characters owned by the authenticated user.

### GET /api/characters/:characterId
Get a specific character. User must own it or be world admin.

### PUT /api/characters/:characterId
Update a character. **Owner or world admin.**

**Body:**
```json
{
  "name": "string",
  "bio": "string",
  "stats": {},
  "inventory": [],
  "isActive": boolean
}
```

### DELETE /api/characters/:characterId
Delete a character. **Owner or world admin.**

---

## Permission Model

### World Admin
- Can edit/delete their own worlds
- Can view and modify all characters in their worlds
- Full access to world settings

### Character Owner
- Can view and modify their own characters
- Can create characters in worlds they have access to
- Cannot modify other users' characters (unless world admin)

### World Access
- Public worlds: Anyone can view and create characters
- Private worlds: Only admin and users who already have characters can access

