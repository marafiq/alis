# ALIS Demo Server

A beautiful, full-featured demo application showcasing all ALIS capabilities with a real Bun server.

## Features Demonstrated

### 🔍 Debounced Search
- Real-time search with 300ms debounce
- Searches users and products
- Loading indicator during search

### 👥 User Management (CRUD)
- List users with filtering
- Create new users with validation
- Edit users in modal dialog
- Delete with confirmation modal
- Real-time table updates

### 📦 Product Filtering
- Container-based data collection (`data-alis-collect="closest:#container"`)
- Multiple filter criteria
- Grid layout with product cards

### 📧 Contact Form
- Full form validation
- ASP.NET-style error messages (`data-valmsg-for`)
- Loading indicators
- Success/error feedback

### 🎨 UI Features
- Dark/Light theme toggle
- Toast notifications
- Modal dialogs
- Loading states
- Beautiful animations

## Running the Demo

### Prerequisites
- [Bun](https://bun.sh) installed
- ALIS built (`npm run build` in root)

### Start the Server

```bash
cd demo-server
bun run start
```

Or with hot reload:

```bash
bun run dev
```

Then open http://localhost:3000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search?q=` | Search users and products |
| GET | `/api/users` | List users (supports `?role=` and `?status=`) |
| POST | `/api/users` | Create user |
| GET | `/api/users/:id/edit` | Get edit form HTML |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |
| POST | `/api/products/filter` | Filter products |
| POST | `/api/contact` | Submit contact form |
| GET | `/api/slow` | Slow endpoint (2s delay) |
| GET | `/api/unreliable` | 50% failure rate for retry demo |

## ALIS Attributes Used

```html
<!-- Debounced search -->
<input data-alis-get="/api/search"
       data-alis-trigger="input delay:300ms"
       data-alis-target="#results"
       data-alis-collect="self">

<!-- Form with validation -->
<form data-alis 
      data-alis-target="#result"
      action="/api/contact" 
      method="post">

<!-- Container collection -->
<button data-alis-post="/api/filter"
        data-alis-collect="closest:#filters"
        data-alis-target="#grid">

<!-- Confirmation dialog -->
<button data-alis-delete="/api/users/1"
        data-alis-confirm="deleteUser">

<!-- Loading indicator -->
<button data-alis-get="/api/slow"
        data-alis-indicator="is-loading">
```

## Project Structure

```
demo-server/
├── server.ts        # Bun server with all API endpoints
├── public/
│   ├── index.html   # Main demo page
│   ├── styles.css   # Beautiful dark/light theme CSS
│   └── app.js       # Client-side JavaScript
├── package.json
└── README.md
```

