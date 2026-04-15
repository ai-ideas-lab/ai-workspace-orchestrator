const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');

const app = express();
app.use(express.json());

// Simple in-memory cache for user stats (5 minute TTL)
const userStatsCache = {
    data: null,
    timestamp: null,
    ttl: 5 * 60 * 1000 // 5 minutes
};

// Initialize database
const db = new sqlite3.Database('./database.sqlite');

// Create sample tables with proper indexes
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
    
    // Add indexes for better performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_orders_user_date ON orders(user_id, order_date)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_order_items_product_order ON order_items(product_id, order_id)`);
    
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

// Helper function to process user orders data (extracted to eliminate code duplication)
function processUserOrdersData(rows) {
    const usersWithOrders = {};
    
    rows.forEach(row => {
        if (!usersWithOrders[row.user_id]) {
            usersWithOrders[row.user_id] = {
                id: row.user_id,
                name: row.user_name,
                email: row.email,
                orders: []
            };
        }
        
        if (row.order_id) {
            // Check if order already exists to avoid duplicates
            let order = usersWithOrders[row.user_id].orders.find(o => o.id === row.order_id);
            if (!order) {
                order = {
                    id: row.order_id,
                    order_date: row.order_date,
                    total_amount: row.total_amount,
                    items: []
                };
                usersWithOrders[row.user_id].orders.push(order);
            }
            
            if (row.item_id) {
                order.items.push({
                    id: row.item_id,
                    product_id: row.product_id,
                    quantity: row.quantity,
                    price: row.item_price,
                    product: {
                        id: row.product_id,
                        name: row.product_name,
                        price: row.product_price
                    }
                });
            }
        }
    });
    
    return Object.values(usersWithOrders);
}

// OPTIMIZED: Get all users with their orders (fixed N+1 problem)
app.get('/api/users-with-orders', (req, res) => {
    // Use JOIN to get users with orders in a single query
    const query = `
        SELECT 
            u.id as user_id, u.name as user_name, u.email,
            o.id as order_id, o.order_date, o.total_amount,
            oi.id as item_id, oi.product_id, oi.quantity, oi.price as item_price,
            p.name as product_name, p.price as product_price
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        ORDER BY u.id, o.id, oi.id
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        const result = processUserOrdersData(rows);
        res.json(result);
    });
});

// OPTIMIZED: Get all orders with product details (fixed N+1 problem)
app.get('/api/orders-with-products', (req, res) => {
    // Use JOIN to get orders with product details in a single query
    const query = `
        SELECT 
            o.id as order_id, o.user_id, o.order_date, o.total_amount,
            oi.id as item_id, oi.product_id, oi.quantity, oi.price as item_price,
            u.name as user_name,
            p.name as product_name, p.price as product_price
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN products p ON oi.product_id = p.id
        ORDER BY o.id, oi.id
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Group results by order
        const ordersWithProducts = {};
        
        rows.forEach(row => {
            if (!ordersWithProducts[row.order_id]) {
                ordersWithProducts[row.order_id] = {
                    id: row.order_id,
                    user_id: row.user_id,
                    user_name: row.user_name,
                    order_date: row.order_date,
                    total_amount: row.total_amount,
                    items: []
                };
            }
            
            if (row.item_id) {
                ordersWithProducts[row.order_id].items.push({
                    id: row.item_id,
                    product_id: row.product_id,
                    quantity: row.quantity,
                    price: row.item_price,
                    product: {
                        id: row.product_id,
                        name: row.product_name,
                        price: row.product_price
                    }
                });
            }
        });
        
        // Convert object to array
        const result = Object.values(ordersWithProducts);
        res.json(result);
    });
});

// OPTIMIZED: Get user order statistics (fixed N+1 problem) with caching
app.get('/api/user-stats', (req, res) => {
    const now = Date.now();
    
    // Check if cache is valid
    if (userStatsCache.data && userStatsCache.timestamp && (now - userStatsCache.timestamp) < userStatsCache.ttl) {
        return res.json({
            data: userStatsCache.data,
            cached: true,
            cache_age_ms: now - userStatsCache.timestamp
        });
    }
    
    // Use JOIN and aggregation to get stats in a single query
    const query = `
        SELECT 
            u.id, u.name, u.email,
            COUNT(o.id) as total_orders,
            COALESCE(SUM(o.total_amount), 0) as total_spent,
            CASE 
                WHEN COUNT(o.id) > 0 THEN COALESCE(SUM(o.total_amount), 0) / COUNT(o.id)
                ELSE 0 
            END as average_order_value
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        GROUP BY u.id, u.name, u.email
        ORDER BY u.id
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Format the result as expected
        const userStats = rows.map(row => ({
            user: {
                id: row.id,
                name: row.name,
                email: row.email
            },
            total_orders: row.total_orders,
            total_spent: row.total_spent,
            average_order_value: row.average_order_value
        }));
        
        // Update cache
        userStatsCache.data = userStats;
        userStatsCache.timestamp = now;
        
        res.json({
            data: userStats,
            cached: false,
            cache_age_ms: 0
        });
    });
});

// OPTIMIZED: Get user by ID with orders (fixed N+1 problem)
app.get('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    
    // Use JOIN to get user with orders in a single query
    const query = `
        SELECT 
            u.id, u.name, u.email,
            o.id as order_id, o.order_date, o.total_amount,
            oi.id as item_id, oi.product_id, oi.quantity, oi.price as item_price,
            p.name as product_name, p.price as product_price
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE u.id = ?
        ORDER BY o.id, oi.id
    `;
    
    db.all(query, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Use the shared helper function to eliminate code duplication
        const usersWithOrders = processUserOrdersData(rows);
        const user = usersWithOrders[0]; // Get the first (and only) user
        
        res.json(user);
    });
});

// Performance test endpoint - OPTIMIZED: Uses shared helper function
app.get('/api/performance-test', (req, res) => {
    const startTime = Date.now();
    
    // Test the optimized users-with-orders endpoint using the same query
    const query = `
        SELECT 
            u.id as user_id, u.name as user_name, u.email,
            o.id as order_id, o.order_date, o.total_amount,
            oi.id as item_id, oi.product_id, oi.quantity, oi.price as item_price,
            p.name as product_name, p.price as product_price
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        ORDER BY u.id, o.id, oi.id
    `;
    
    db.all(query, [], (err, rows) => {
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Use the shared helper function to eliminate code duplication
        const usersWithOrders = processUserOrdersData(rows);
        
        res.json({
            execution_time_ms: executionTime,
            records_processed: rows.length,
            users_returned: usersWithOrders.length,
            optimization_note: "Uses shared helper function to eliminate code duplication"
        });
    });
});

// New endpoint to show database indexes
app.get('/api/indexes', (req, res) => {
    const query = `
        SELECT 
            m.tbl_name as table_name,
            i.name as index_name,
            il.name as column_name
        FROM sqlite_master m
        JOIN sqlite_master i ON m.tbl_name = i.tbl_name
        JOIN sqlite_master il ON i.name = il.name
        WHERE i.type = 'index'
        AND m.type = 'table'
        ORDER BY m.tbl_name, i.name
    `;
    
    db.all(query, [], (err, indexes) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(indexes);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`N+1 performance issues FIXED at:`);
    console.log(`- GET /api/users-with-orders`);
    console.log(`- GET /api/orders-with-products`);
    console.log(`- GET /api/user-stats`);
    console.log(`- GET /api/users/:id`);
    console.log(`Performance test at: GET /api/performance-test`);
    console.log(`Database indexes at: GET /api/indexes`);
});