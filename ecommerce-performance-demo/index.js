const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');

const app = express();
app.use(express.json());

// Initialize database
const db = new sqlite3.Database('./database.sqlite');

// Create sample tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        stock INTEGER DEFAULT 0
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        order_date TEXT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    )`);
    
    // Insert sample data
    db.run(`INSERT OR IGNORE INTO users (name, email) VALUES 
        ('Alice Johnson', 'alice@example.com'),
        ('Bob Smith', 'bob@example.com'),
        ('Charlie Brown', 'charlie@example.com')`);
    
    db.run(`INSERT OR IGNORE INTO products (name, price, stock) VALUES 
        ('Laptop', 999.99, 10),
        ('Phone', 599.99, 25),
        ('Tablet', 299.99, 15),
        ('Headphones', 199.99, 30),
        ('Watch', 399.99, 20)`);
    
    db.run(`INSERT OR IGNORE INTO orders (user_id, order_date, total_amount) VALUES 
        (1, '2024-01-15', 1199.98),
        (2, '2024-01-16', 799.98),
        (3, '2024-01-17', 1499.97)`);
    
    db.run(`INSERT OR IGNORE INTO order_items (order_id, product_id, quantity, price) VALUES 
        (1, 1, 1, 999.99),
        (1, 2, 1, 599.99),
        (2, 3, 1, 299.99),
        (2, 4, 1, 199.99),
        (3, 1, 1, 999.99),
        (3, 5, 1, 399.99),
        (3, 3, 1, 299.99)`);
});

// N+1 Problem: Get all users with their orders (inefficient)
app.get('/api/users-with-orders', (req, res) => {
    db.all('SELECT * FROM users', (err, users) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        const usersWithOrders = [];
        
        // This creates N+1 queries - one for users, then one for each user's orders
        users.forEach(user => {
            db.all('SELECT * FROM orders WHERE user_id = ?', [user.id], (err, orders) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                // For each order, get order items (another N+1 problem)
                const ordersWithItems = [];
                orders.forEach(order => {
                    db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id], (err, items) => {
                        if (err) {
                            return res.status(500).json({ error: err.message });
                        }
                        
                        ordersWithItems.push({
                            ...order,
                            items: items
                        });
                        
                        // This callback structure makes it complex
                        if (ordersWithItems.length === orders.length) {
                            usersWithOrders.push({
                                ...user,
                                orders: ordersWithItems
                            });
                            
                            // Check if we've processed all users
                            if (usersWithOrders.length === users.length) {
                                res.json(usersWithOrders);
                            }
                        }
                    });
                });
            });
        });
    });
});

// N+1 Problem: Get all orders with product details (inefficient)
app.get('/api/orders-with-products', (req, res) => {
    db.all('SELECT * FROM orders', (err, orders) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        const ordersWithProducts = [];
        
        // This creates N+1 queries - one for orders, then one for each order's items
        orders.forEach(order => {
            db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id], (err, items) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                // For each item, get product details (another N+1 problem)
                const itemsWithProducts = [];
                items.forEach(item => {
                    db.get('SELECT * FROM products WHERE id = ?', [item.product_id], (err, product) => {
                        if (err) {
                            return res.status(500).json({ error: err.message });
                        }
                        
                        itemsWithProducts.push({
                            ...item,
                            product: product
                        });
                        
                        // Complex callback structure
                        if (itemsWithProducts.length === items.length) {
                            ordersWithProducts.push({
                                ...order,
                                items: itemsWithProducts
                            });
                            
                            // Check if we've processed all orders
                            if (ordersWithProducts.length === orders.length) {
                                res.json(ordersWithProducts);
                            }
                        }
                    });
                });
            });
        });
    });
});

// Another N+1 Problem: Get user order statistics
app.get('/api/user-stats', (req, res) => {
    db.all('SELECT * FROM users', (err, users) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        const userStats = [];
        
        // N+1: One query for users, then one for each user's orders
        users.forEach(user => {
            db.all('SELECT * FROM orders WHERE user_id = ?', [user.id], (err, orders) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                const totalOrders = orders.length;
                const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
                
                userStats.push({
                    user: user,
                    total_orders: totalOrders,
                    total_spent: totalSpent,
                    average_order_value: totalOrders > 0 ? totalSpent / totalOrders : 0
                });
                
                // Check if we've processed all users
                if (userStats.length === users.length) {
                    res.json(userStats);
                }
            });
        });
    });
});

// Helper function to get user by ID (potential N+1 problem in other endpoints)
app.get('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // This creates N+1 if called multiple times
        db.all('SELECT * FROM orders WHERE user_id = ?', [user.id], (err, orders) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            res.json({
                ...user,
                orders: orders
            });
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`N+1 performance issues available at:`);
    console.log(`- GET /api/users-with-orders`);
    console.log(`- GET /api/orders-with-products`);
    console.log(`- GET /api/user-stats`);
    console.log(`- GET /api/users/:id`);
});