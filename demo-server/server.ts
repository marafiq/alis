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

function validationErrorHtml(title: string, errors: Record<string, string[]>) {
  const errorList = Object.entries(errors)
    .map(([field, messages]) => `<li><strong>${field}:</strong> ${messages.join(', ')}</li>`)
    .join('');
  
  return htmlResponse(`
    <div class="validation-summary">
      <div class="validation-icon">⚠️</div>
      <div class="validation-content">
        <h4>${title}</h4>
        <ul>${errorList}</ul>
      </div>
    </div>
  `, 200); // Return 200 so swap works, errors shown in UI
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
    
    if (!query.trim()) {
      return htmlResponse(`
        <div class="empty-state">
          <span class="empty-icon">💡</span>
          <span>Start typing to see live search results</span>
        </div>
      `);
    }
    
    const results = [...users, ...products]
      .filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        ("email" in item && item.email.toLowerCase().includes(query.toLowerCase()))
      )
      .slice(0, 5);
    
    if (results.length === 0) {
      return htmlResponse(`
        <div class="empty-state">
          <span class="empty-icon">🔍</span>
          <span>No results for "${query}"</span>
        </div>
      `);
    }
    
    const html = results.map(item => {
      const isUser = "email" in item;
      return `
        <div class="search-result-item">
          <span class="result-name">${item.name}</span>
          <span class="result-type ${isUser ? 'user' : 'product'}">${isUser ? "User" : "Product"}</span>
        </div>
      `;
    }).join("");
    
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
      <tr>
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td><span class="role-badge role-${user.role.toLowerCase()}">${user.role}</span></td>
        <td><span class="status-badge status-${user.status}">${user.status}</span></td>
        <td>
          <div class="action-btns">
            <button class="action-btn" 
                    onclick="showEditUserModal(${user.id}, '${user.name}', '${user.email}', '${user.role}')">
              Edit
            </button>
            <button class="action-btn delete" 
                    data-alis-delete="/api/users/${user.id}" 
                    data-alis-target="#users-table"
                    data-alis-confirm="deleteUser">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join("");
    
    return htmlResponse(html || '<tr><td colspan="6" class="loading-cell">No users found</td></tr>');
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
      // Return ProblemDetails - ALIS will populate data-valmsg-for spans
      return problemDetails("Please fix the errors below", errors);
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
    
    // Return JSON success - hook will handle modal close and refresh
    return jsonResponse({
      success: true,
      message: `User "${user.name}" created successfully!`,
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
    
    // Return JSON success - hook will handle modal close and refresh
    return jsonResponse({
      success: true,
      message: 'User updated successfully!',
      user: users[userIndex]
    });
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
      <tr>
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td><span class="role-badge role-${user.role.toLowerCase()}">${user.role}</span></td>
        <td><span class="status-badge status-${user.status}">${user.status}</span></td>
        <td>
          <div class="action-btns">
            <button class="action-btn" 
                    onclick="showEditUserModal(${user.id}, '${user.name}', '${user.email}', '${user.role}')">
              Edit
            </button>
            <button class="action-btn delete" 
                    data-alis-delete="/api/users/${user.id}" 
                    data-alis-target="#users-table"
                    data-alis-confirm="deleteUser">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join("");
    
    return htmlResponse(html || '<tr><td colspan="6" class="loading-cell">No users found</td></tr>');
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

  // Contact form with comprehensive validation - returns ProblemDetails for ALIS validation display
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
      // Return ProblemDetails - ALIS will populate data-valmsg-for spans
      return problemDetails("Please fix the errors below", errors);
    }
    
    return htmlResponse(`
      <div class="success-result">
        <div class="success-icon">✓</div>
        <h4>Message Sent!</h4>
        <p>Thank you, ${body.name}! We'll get back to you at ${body.email} soon.</p>
      </div>
    `);
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
    return htmlResponse(`
      <div class="success-message">
        <span class="success-icon">✓</span>
        <span>Success! Request completed after retry.</span>
      </div>
    `);
  },

  // Validation demo endpoint
  "POST /api/validate-demo": async (req) => {
    await delay(300);
    const body = parseBody(await req.text(), req.headers.get("content-type") || "");
    
    const errors: Record<string, string[]> = {};
    
    if (!body.username?.trim()) errors.username = ["Username is required"];
    else if (body.username.length < 3) errors.username = ["Username must be at least 3 characters"];
    
    if (!body.email?.trim()) errors.email = ["Email is required"];
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.email = ["Invalid email format"];
    
    if (body.age) {
      const age = parseInt(body.age);
      if (isNaN(age) || age < 18 || age > 120) {
        errors.age = ["Age must be between 18 and 120"];
      }
    }
    
    if (!body.password?.trim()) errors.password = ["Password is required"];
    else if (body.password.length < 8) errors.password = ["Password must be at least 8 characters"];
    
    if (Object.keys(errors).length > 0) {
      return problemDetails("Validation failed", errors);
    }
    
    return htmlResponse(`
      <div class="success-message">
        <span class="success-icon">✓</span>
        <span>All fields validated successfully!</span>
      </div>
    `);
  },

  // Demo delete endpoint
  "DELETE /api/demo-delete": async () => {
    await delay(300);
    return htmlResponse(`
      <div class="success-message">
        <span class="success-icon">✓</span>
        <span>Item deleted successfully!</span>
      </div>
    `);
  },

  // Hook demo endpoint
  "GET /api/hook-demo": async () => {
    await delay(200);
    return htmlResponse(`
      <div class="success-message">
        <span class="success-icon">✓</span>
        <span>Hook demo completed at ${new Date().toLocaleTimeString()}</span>
      </div>
    `);
  },

  // Custom values demo endpoint
  "POST /api/custom-values": async (req) => {
    await delay(200);
    const body = parseBody(await req.text(), req.headers.get("content-type") || "");
    
    return htmlResponse(`
      <div class="success-message">
        <span class="success-icon">✓</span>
        <div>
          <strong>Received values:</strong><br>
          Slider: ${body.sliderValue || 'N/A'}<br>
          Hidden: ${body.hiddenValue || 'N/A'}
        </div>
      </div>
    `);
  },

  // Island demo - returns interactive HTML with ALIS attributes
  "GET /api/island": async () => {
    const now = new Date().toLocaleTimeString();
    return htmlResponse(`
      <div class="island">
        <h2>🏝️ Dynamic Island</h2>
        <p style="color: var(--text-muted); margin-bottom: 16px;">
          This content was loaded dynamically. The buttons below use ALIS attributes and work immediately!
        </p>
        
        <div id="time-display" class="time-display">${now}</div>
        
        <div class="btn-row">
          <button class="btn"
                  data-alis-get="/api/time"
                  data-alis-target="#time-display"
                  data-alis-indicator="is-loading">
            🔄 Update Time
          </button>
          
          <button class="btn btn-secondary"
                  data-alis-post="/api/island/action"
                  data-alis-target="#island-message"
                  data-alis-indicator="is-loading">
            📤 Send Action
          </button>
        </div>
        
        <div id="island-message"></div>
      </div>
    `);
  },

  // Get current time
  "GET /api/time": async () => {
    await delay(300);
    const now = new Date().toLocaleTimeString();
    return htmlResponse(now);
  },

  // Island action endpoint
  "POST /api/island/action": async () => {
    await delay(500);
    const timestamp = new Date().toISOString();
    return htmlResponse(`
      <div class="message success">
        ✓ Action completed at ${timestamp}
      </div>
    `);
  },

  // Counter increment endpoint for islands demo
  "POST /api/counter/increment": async () => {
    await delay(100);
    // Simulate a counter (in real app, would be session-based)
    const count = Math.floor(Math.random() * 100) + 1;
    return htmlResponse(String(count));
  },

  // Parallel requests demo endpoints
  "GET /api/parallel/time": async () => {
    await delay(800 + Math.random() * 400); // 800-1200ms
    const now = new Date();
    return htmlResponse(`
      <strong>${now.toLocaleTimeString()}</strong>
      <br><small>${now.toLocaleDateString()}</small>
    `);
  },

  "GET /api/parallel/random": async () => {
    await delay(500 + Math.random() * 500); // 500-1000ms
    const num = Math.floor(Math.random() * 1000000);
    return htmlResponse(`
      <strong>${num.toLocaleString()}</strong>
      <br><small>Random integer</small>
    `);
  },

  "GET /api/parallel/quote": async () => {
    await delay(1000 + Math.random() * 500); // 1000-1500ms
    const quotes = [
      "The best code is no code at all.",
      "First, solve the problem. Then, write the code.",
      "Code is like humor. When you have to explain it, it's bad.",
      "Simplicity is the soul of efficiency.",
      "Make it work, make it right, make it fast.",
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    return htmlResponse(`
      <em>"${quote}"</em>
    `);
  },

  "GET /api/parallel/stats": async () => {
    await delay(600 + Math.random() * 400); // 600-1000ms
    const cpu = Math.floor(Math.random() * 100);
    const mem = Math.floor(Math.random() * 100);
    return htmlResponse(`
      <div style="display: flex; gap: 16px; justify-content: center;">
        <span>CPU: <strong>${cpu}%</strong></span>
        <span>MEM: <strong>${mem}%</strong></span>
      </div>
    `);
  },

  // Employee registration with nested properties (Client-side validation demo)
  "POST /api/employees": async (req) => {
    await delay(400);
    const body = parseBody(await req.text(), req.headers.get("content-type") || "");
    
    // Server-side validation (should not trigger if client-side passes)
    const errors: Record<string, string[]> = {};
    
    // Nested property validation using dot notation
    if (!body["Employee.FirstName"]?.trim()) errors["Employee.FirstName"] = ["First name is required"];
    if (!body["Employee.LastName"]?.trim()) errors["Employee.LastName"] = ["Last name is required"];
    if (!body["Employee.Email"]?.trim()) errors["Employee.Email"] = ["Email is required"];
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body["Employee.Email"])) {
      errors["Employee.Email"] = ["Invalid email format"];
    }
    
    if (!body["Employee.Address.Street"]?.trim()) errors["Employee.Address.Street"] = ["Street is required"];
    if (!body["Employee.Address.City"]?.trim()) errors["Employee.Address.City"] = ["City is required"];
    if (!body["Employee.Address.ZipCode"]?.trim()) errors["Employee.Address.ZipCode"] = ["Zip code is required"];
    
    if (!body["Employee.Department"]) errors["Employee.Department"] = ["Department is required"];
    if (!body["Employee.Salary"]) errors["Employee.Salary"] = ["Salary is required"];
    
    if (!body["Password"]?.trim()) errors["Password"] = ["Password is required"];
    if (body["Password"] !== body["ConfirmPassword"]) errors["ConfirmPassword"] = ["Passwords do not match"];
    
    if (Object.keys(errors).length > 0) {
      return problemDetails("Server validation failed", errors);
    }
    
    // Success - return the employee data
    return jsonResponse({
      success: true,
      message: "Employee registered successfully!",
      employee: {
        firstName: body["Employee.FirstName"],
        lastName: body["Employee.LastName"],
        email: body["Employee.Email"],
        address: {
          street: body["Employee.Address.Street"],
          city: body["Employee.Address.City"],
          zipCode: body["Employee.Address.ZipCode"]
        },
        department: body["Employee.Department"],
        salary: body["Employee.Salary"],
        startDate: body["Employee.StartDate"],
        emergencyContact: {
          name: body["Employee.EmergencyContacts[0].Name"],
          phone: body["Employee.EmergencyContacts[0].Phone"]
        }
      }
    });
  },

  // Syncfusion order form (Syncfusion validation demo)
  "POST /api/order": async (req) => {
    await delay(400);
    const body = parseBody(await req.text(), req.headers.get("content-type") || "");
    
    const errors: Record<string, string[]> = {};
    
    if (!body["Order.Category"]) errors["Order.Category"] = ["Category is required"];
    if (!body["Order.Quantity"]) errors["Order.Quantity"] = ["Quantity is required"];
    else {
      const qty = parseInt(body["Order.Quantity"]);
      if (isNaN(qty) || qty < 1 || qty > 100) {
        errors["Order.Quantity"] = ["Quantity must be between 1 and 100"];
      }
    }
    if (!body["Order.DeliveryDate"]) errors["Order.DeliveryDate"] = ["Delivery date is required"];
    if (!body["Order.CustomerName"]?.trim()) errors["Order.CustomerName"] = ["Customer name is required"];
    if (!body["Order.Phone"]?.trim()) errors["Order.Phone"] = ["Phone is required"];
    if (body["Order.AcceptTerms"] !== "true") errors["Order.AcceptTerms"] = ["You must accept the terms"];
    
    if (Object.keys(errors).length > 0) {
      return problemDetails("Order validation failed", errors);
    }
    
    return jsonResponse({
      success: true,
      message: "Order placed successfully!",
      order: {
        id: Math.floor(Math.random() * 10000),
        category: body["Order.Category"],
        quantity: parseInt(body["Order.Quantity"]),
        deliveryDate: body["Order.DeliveryDate"],
        customerName: body["Order.CustomerName"],
        phone: body["Order.Phone"],
        total: (Math.random() * 500 + 50).toFixed(2)
      }
    });
  },

  // Cascading selects - States by country
  "GET /api/states": async (req, url) => {
    await delay(200);
    const country = url.searchParams.get("country");
    
    const statesByCountry: Record<string, Array<{value: string, label: string}>> = {
      US: [
        { value: "CA", label: "🌴 California" },
        { value: "NY", label: "🗽 New York" },
        { value: "TX", label: "🤠 Texas" },
        { value: "FL", label: "🌊 Florida" },
        { value: "WA", label: "🌲 Washington" },
      ],
      CA: [
        { value: "ON", label: "🍁 Ontario" },
        { value: "BC", label: "🏔️ British Columbia" },
        { value: "QC", label: "⚜️ Quebec" },
        { value: "AB", label: "🛢️ Alberta" },
      ],
      UK: [
        { value: "ENG", label: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England" },
        { value: "SCO", label: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland" },
        { value: "WAL", label: "🏴󠁧󠁢󠁷󠁬󠁳󠁿 Wales" },
        { value: "NIR", label: "☘️ Northern Ireland" },
      ],
      AU: [
        { value: "NSW", label: "🦘 New South Wales" },
        { value: "VIC", label: "🏏 Victoria" },
        { value: "QLD", label: "🐨 Queensland" },
        { value: "WA", label: "🏜️ Western Australia" },
      ],
    };
    
    const states = statesByCountry[country || ""] || [];
    
    if (!country || states.length === 0) {
      return htmlResponse(`<option value="">Select country first...</option>`);
    }
    
    const options = states.map(s => `<option value="${s.value}">${s.label}</option>`).join("");
    return htmlResponse(`<option value="">Select a state...</option>${options}`);
  },

  // Cascading selects - Cities by state
  "GET /api/cities": async (req, url) => {
    await delay(200);
    const state = url.searchParams.get("state");
    
    const citiesByState: Record<string, Array<{value: string, label: string}>> = {
      // US States
      CA: [
        { value: "LA", label: "🌴 Los Angeles" },
        { value: "SF", label: "🌉 San Francisco" },
        { value: "SD", label: "☀️ San Diego" },
        { value: "SJ", label: "💻 San Jose" },
      ],
      NY: [
        { value: "NYC", label: "🗽 New York City" },
        { value: "BUF", label: "🦬 Buffalo" },
        { value: "ALB", label: "🏛️ Albany" },
      ],
      TX: [
        { value: "HOU", label: "🚀 Houston" },
        { value: "DAL", label: "🤠 Dallas" },
        { value: "AUS", label: "🎸 Austin" },
        { value: "SA", label: "🌮 San Antonio" },
      ],
      FL: [
        { value: "MIA", label: "🌴 Miami" },
        { value: "ORL", label: "🏰 Orlando" },
        { value: "TAM", label: "⚡ Tampa" },
      ],
      WA: [
        { value: "SEA", label: "☕ Seattle" },
        { value: "TAC", label: "🌲 Tacoma" },
        { value: "SPO", label: "🏔️ Spokane" },
      ],
      // Canada
      ON: [
        { value: "TOR", label: "🏙️ Toronto" },
        { value: "OTT", label: "🏛️ Ottawa" },
        { value: "HAM", label: "🏭 Hamilton" },
      ],
      BC: [
        { value: "VAN", label: "🌲 Vancouver" },
        { value: "VIC", label: "🏛️ Victoria" },
        { value: "KEL", label: "🍷 Kelowna" },
      ],
      QC: [
        { value: "MTL", label: "🥐 Montreal" },
        { value: "QUE", label: "🏰 Quebec City" },
      ],
      AB: [
        { value: "CAL", label: "🤠 Calgary" },
        { value: "EDM", label: "🛢️ Edmonton" },
      ],
      // UK
      ENG: [
        { value: "LON", label: "🎡 London" },
        { value: "MAN", label: "⚽ Manchester" },
        { value: "BIR", label: "🏭 Birmingham" },
        { value: "LIV", label: "🎸 Liverpool" },
      ],
      SCO: [
        { value: "EDI", label: "🏰 Edinburgh" },
        { value: "GLA", label: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Glasgow" },
      ],
      WAL: [
        { value: "CAR", label: "🏴󠁧󠁢󠁷󠁬󠁳󠁿 Cardiff" },
        { value: "SWA", label: "🌊 Swansea" },
      ],
      NIR: [
        { value: "BEL", label: "🏛️ Belfast" },
        { value: "DER", label: "☘️ Derry" },
      ],
      // Australia
      NSW: [
        { value: "SYD", label: "🌉 Sydney" },
        { value: "NEW", label: "🏖️ Newcastle" },
      ],
      VIC: [
        { value: "MEL", label: "☕ Melbourne" },
        { value: "GEE", label: "🏖️ Geelong" },
      ],
      QLD: [
        { value: "BRI", label: "🌴 Brisbane" },
        { value: "GC", label: "🏄 Gold Coast" },
      ],
      // Note: WA is both US state and AU state, using AU cities
    };
    
    const cities = citiesByState[state || ""] || [];
    
    if (!state || cities.length === 0) {
      return htmlResponse(`<option value="">Select state first...</option>`);
    }
    
    const options = cities.map(c => `<option value="${c.value}">${c.label}</option>`).join("");
    return htmlResponse(`<option value="">Select a city...</option>${options}`);
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

