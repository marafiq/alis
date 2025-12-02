/**
 * ALIS Demo Server - Bun
 * A real server demonstrating all ALIS features
 */

import { serve, file } from "bun";
import { join } from "path";

const PORT = 3333;

// In-memory data store
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "pending";
  createdAt: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  status: "available" | "low" | "out";
}

let users: User[] = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Admin", status: "active", createdAt: "2024-01-15" },
  { id: 2, name: "Bob Smith", email: "bob@example.com", role: "Editor", status: "active", createdAt: "2024-02-20" },
  { id: 3, name: "Carol White", email: "carol@example.com", role: "Viewer", status: "pending", createdAt: "2024-03-10" },
  { id: 4, name: "David Brown", email: "david@example.com", role: "Editor", status: "inactive", createdAt: "2024-04-05" },
];

let products: Product[] = [
  { id: 1, name: "Wireless Keyboard", price: 79.99, category: "Electronics", stock: 45, status: "available" },
  { id: 2, name: "USB-C Hub", price: 49.99, category: "Electronics", stock: 3, status: "low" },
  { id: 3, name: "Ergonomic Mouse", price: 59.99, category: "Electronics", stock: 0, status: "out" },
  { id: 4, name: "Monitor Stand", price: 129.99, category: "Furniture", stock: 12, status: "available" },
  { id: 5, name: "Desk Lamp", price: 39.99, category: "Furniture", stock: 28, status: "available" },
];

let nextUserId = 5;
let nextProductId = 6;

// Utility functions
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseBody(body: string, contentType: string): Record<string, any> {
  if (contentType?.includes("application/json")) {
    return JSON.parse(body);
  }
  // URL-encoded
  const params = new URLSearchParams(body);
  const result: Record<string, any> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function problemDetails(title: string, errors: Record<string, string[]>, status = 400) {
  return new Response(JSON.stringify({
    type: "https://tools.ietf.org/html/rfc7807",
    title,
    status,
    errors
  }), {
    status,
    headers: { "Content-Type": "application/problem+json" }
  });
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function htmlResponse(html: string, status = 200) {
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html" }
  });
}

// Route handlers
const routes: Record<string, (req: Request, url: URL) => Promise<Response> | Response> = {
  // Search with debounce demo
  "GET /api/search": async (req, url) => {
    const query = url.searchParams.get("q") || "";
    await delay(200); // Simulate network delay
    
    const results = [...users, ...products]
      .filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        ("email" in item && item.email.toLowerCase().includes(query.toLowerCase()))
      )
      .slice(0, 5);
    
    if (results.length === 0) {
      return htmlResponse(`<div class="search-empty">No results for "${query}"</div>`);
    }
    
    const html = results.map(item => `
      <div class="search-result" data-id="${item.id}">
        <span class="search-result-name">${item.name}</span>
        <span class="search-result-type">${"email" in item ? "User" : "Product"}</span>
      </div>
    `).join("");
    
    return htmlResponse(html);
  },

  // Users CRUD
  "GET /api/users": async (req, url) => {
    await delay(100);
    const status = url.searchParams.get("status");
    const role = url.searchParams.get("role");
    
    let filtered = users;
    if (status) filtered = filtered.filter(u => u.status === status);
    if (role) filtered = filtered.filter(u => u.role === role);
    
    const html = filtered.map(user => `
      <tr class="user-row" data-user-id="${user.id}">
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td><span class="badge badge-${user.role.toLowerCase()}">${user.role}</span></td>
        <td><span class="status status-${user.status}">${user.status}</span></td>
        <td>
          <button class="btn btn-sm btn-edit" 
                  data-alis-get="/api/users/${user.id}/edit" 
                  data-alis-target="#modal-body"
                  data-alis-swap="innerHTML">Edit</button>
          <button class="btn btn-sm btn-danger" 
                  data-alis-delete="/api/users/${user.id}" 
                  data-alis-target="#users-table"
                  data-alis-confirm="deleteUser">Delete</button>
        </td>
      </tr>
    `).join("");
    
    return htmlResponse(html || '<tr><td colspan="6" class="empty">No users found</td></tr>');
  },

  "POST /api/users": async (req) => {
    await delay(300);
    const body = parseBody(await req.text(), req.headers.get("content-type") || "");
    
    // Validation
    const errors: Record<string, string[]> = {};
    if (!body.name?.trim()) errors.name = ["Name is required"];
    if (!body.email?.trim()) errors.email = ["Email is required"];
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.email = ["Invalid email format"];
    else if (users.some(u => u.email === body.email)) errors.email = ["Email already exists"];
    if (!body.role) errors.role = ["Role is required"];
    
    if (Object.keys(errors).length > 0) {
      return problemDetails("Validation Failed", errors);
    }
    
    const user: User = {
      id: nextUserId++,
      name: body.name.trim(),
      email: body.email.trim(),
      role: body.role,
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0]
    };
    users.push(user);
    
    return jsonResponse({ 
      success: true, 
      message: `User "${user.name}" created successfully`,
      user 
    });
  },

  "GET /api/users/:id/edit": async (req, url) => {
    const id = parseInt(url.pathname.split("/")[3]);
    const user = users.find(u => u.id === id);
    
    if (!user) {
      return htmlResponse('<div class="error">User not found</div>', 404);
    }
    
    return htmlResponse(`
      <h3>Edit User</h3>
      <form data-alis data-alis-target="#modal-body" action="/api/users/${user.id}" method="put">
        <div class="form-group">
          <label for="edit-name">Name</label>
          <input type="text" id="edit-name" name="name" value="${user.name}" required>
          <span data-valmsg-for="name" class="error-text"></span>
        </div>
        <div class="form-group">
          <label for="edit-email">Email</label>
          <input type="email" id="edit-email" name="email" value="${user.email}" required>
          <span data-valmsg-for="email" class="error-text"></span>
        </div>
        <div class="form-group">
          <label for="edit-role">Role</label>
          <select id="edit-role" name="role">
            <option value="Admin" ${user.role === "Admin" ? "selected" : ""}>Admin</option>
            <option value="Editor" ${user.role === "Editor" ? "selected" : ""}>Editor</option>
            <option value="Viewer" ${user.role === "Viewer" ? "selected" : ""}>Viewer</option>
          </select>
        </div>
        <div class="form-group">
          <label for="edit-status">Status</label>
          <select id="edit-status" name="status">
            <option value="active" ${user.status === "active" ? "selected" : ""}>Active</option>
            <option value="inactive" ${user.status === "inactive" ? "selected" : ""}>Inactive</option>
            <option value="pending" ${user.status === "pending" ? "selected" : ""}>Pending</option>
          </select>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `);
  },

  "PUT /api/users/:id": async (req, url) => {
    await delay(300);
    const id = parseInt(url.pathname.split("/")[3]);
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return jsonResponse({ success: false, message: "User not found" }, 404);
    }
    
    const body = parseBody(await req.text(), req.headers.get("content-type") || "");
    
    // Validation
    const errors: Record<string, string[]> = {};
    if (!body.name?.trim()) errors.name = ["Name is required"];
    if (!body.email?.trim()) errors.email = ["Email is required"];
    else if (users.some(u => u.email === body.email && u.id !== id)) errors.email = ["Email already exists"];
    
    if (Object.keys(errors).length > 0) {
      return problemDetails("Validation Failed", errors);
    }
    
    users[userIndex] = {
      ...users[userIndex],
      name: body.name.trim(),
      email: body.email.trim(),
      role: body.role || users[userIndex].role,
      status: body.status || users[userIndex].status
    };
    
    return htmlResponse(`
      <div class="success-message">
        <span class="icon">✓</span>
        <span>User updated successfully!</span>
      </div>
      <script>
        setTimeout(() => {
          closeModal();
          document.querySelector('#refresh-users')?.click();
        }, 1000);
      </script>
    `);
  },

  "DELETE /api/users/:id": async (req, url) => {
    await delay(200);
    const id = parseInt(url.pathname.split("/")[3]);
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return jsonResponse({ success: false, message: "User not found" }, 404);
    }
    
    const deleted = users.splice(userIndex, 1)[0];
    
    // Return updated table
    const html = users.map(user => `
      <tr class="user-row" data-user-id="${user.id}">
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td><span class="badge badge-${user.role.toLowerCase()}">${user.role}</span></td>
        <td><span class="status status-${user.status}">${user.status}</span></td>
        <td>
          <button class="btn btn-sm btn-edit" 
                  data-alis-get="/api/users/${user.id}/edit" 
                  data-alis-target="#modal-body"
                  data-alis-swap="innerHTML">Edit</button>
          <button class="btn btn-sm btn-danger" 
                  data-alis-delete="/api/users/${user.id}" 
                  data-alis-target="#users-table"
                  data-alis-confirm="deleteUser">Delete</button>
        </td>
      </tr>
    `).join("");
    
    return htmlResponse(html || '<tr><td colspan="6" class="empty">No users found</td></tr>');
  },

  // Products with filtering
  "POST /api/products/filter": async (req) => {
    await delay(150);
    const body = parseBody(await req.text(), req.headers.get("content-type") || "");
    
    let filtered = products;
    
    if (body.name) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(body.name.toLowerCase()));
    }
    if (body.category) {
      filtered = filtered.filter(p => p.category === body.category);
    }
    if (body.minPrice) {
      filtered = filtered.filter(p => p.price >= parseFloat(body.minPrice));
    }
    if (body.maxPrice) {
      filtered = filtered.filter(p => p.price <= parseFloat(body.maxPrice));
    }
    if (body.status) {
      filtered = filtered.filter(p => p.status === body.status);
    }
    
    const html = filtered.map(p => `
      <div class="product-card">
        <div class="product-header">
          <h4>${p.name}</h4>
          <span class="product-status status-${p.status}">${p.status}</span>
        </div>
        <div class="product-body">
          <p class="product-category">${p.category}</p>
          <p class="product-price">$${p.price.toFixed(2)}</p>
          <p class="product-stock">Stock: ${p.stock}</p>
        </div>
        <div class="product-actions">
          <button class="btn btn-sm btn-primary"
                  data-alis-post="/api/cart/add"
                  data-alis-target="#cart-count"
                  data-alis-swap="innerHTML">Add to Cart</button>
        </div>
      </div>
    `).join("");
    
    return htmlResponse(html || '<div class="empty">No products match your filters</div>');
  },

  // Cart
  "POST /api/cart/add": async (req) => {
    await delay(100);
    // Simulate cart count
    const count = Math.floor(Math.random() * 10) + 1;
    return htmlResponse(`<span class="cart-badge">${count}</span>`);
  },

  // Contact form with comprehensive validation
  "POST /api/contact": async (req) => {
    await delay(400);
    const body = parseBody(await req.text(), req.headers.get("content-type") || "");
    
    const errors: Record<string, string[]> = {};
    
    if (!body.name?.trim()) errors.name = ["Name is required"];
    else if (body.name.length < 2) errors.name = ["Name must be at least 2 characters"];
    
    if (!body.email?.trim()) errors.email = ["Email is required"];
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.email = ["Please enter a valid email address"];
    
    if (!body.subject?.trim()) errors.subject = ["Subject is required"];
    
    if (!body.message?.trim()) errors.message = ["Message is required"];
    else if (body.message.length < 10) errors.message = ["Message must be at least 10 characters"];
    
    if (!body.agree) errors.agree = ["You must agree to the terms"];
    
    if (Object.keys(errors).length > 0) {
      return problemDetails("Please fix the errors below", errors);
    }
    
    return jsonResponse({
      success: true,
      message: "Thank you! Your message has been sent successfully."
    });
  },

  // Slow endpoint for testing indicators
  "GET /api/slow": async () => {
    await delay(2000);
    return htmlResponse('<div class="success">Loaded after 2 seconds!</div>');
  },

  // Endpoint that sometimes fails (for retry demo)
  "GET /api/unreliable": async () => {
    if (Math.random() < 0.5) {
      return new Response("Server Error", { status: 500 });
    }
    return htmlResponse('<div class="success">Success! (50% chance)</div>');
  },
};

// Static file serving
async function serveStatic(pathname: string): Promise<Response | null> {
  const staticPaths = [
    { prefix: "/dist/", dir: "../dist" },
    { prefix: "/demo/", dir: "." },
    { prefix: "/", dir: "public" },
  ];
  
  for (const { prefix, dir } of staticPaths) {
    if (pathname.startsWith(prefix)) {
      const filePath = join(import.meta.dir, dir, pathname.slice(prefix.length) || "index.html");
      const f = file(filePath);
      if (await f.exists()) {
        return new Response(f);
      }
    }
  }
  
  // Try index.html for root
  if (pathname === "/") {
    const f = file(join(import.meta.dir, "public/index.html"));
    if (await f.exists()) {
      return new Response(f);
    }
  }
  
  return null;
}

// Main server
serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;
    const pathname = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    
    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Try API routes first
    const routeKey = `${method} ${pathname}`;
    
    // Check exact match
    if (routes[routeKey]) {
      const response = await routes[routeKey](req, url);
      // Add CORS headers
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }
    
    // Check parameterized routes
    for (const [pattern, handler] of Object.entries(routes)) {
      const [routeMethod, routePath] = pattern.split(" ");
      if (routeMethod !== method) continue;
      
      // Convert :param to regex
      const regex = new RegExp("^" + routePath.replace(/:(\w+)/g, "([^/]+)") + "$");
      if (regex.test(pathname)) {
        const response = await handler(req, url);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }
    }
    
    // Try static files
    const staticResponse = await serveStatic(pathname);
    if (staticResponse) {
      return staticResponse;
    }
    
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║  🚀 ALIS Demo Server running at http://localhost:${PORT}    ║
║                                                           ║
║   Features demonstrated:                                  ║
║   • Form submission with validation                       ║
║   • Debounced search                                      ║
║   • CRUD operations (Users)                               ║
║   • Product filtering                                     ║
║   • Modal dialogs                                         ║
║   • Toast notifications                                   ║
║   • Loading indicators                                    ║
║   • Retry mechanism                                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

