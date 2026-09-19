import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "3001");
const JWT_SECRET = "campus-service-secret-key";

const dbPath = path.join(__dirname, "db.json");
const defaultData = {
    users: [],
    market: [],
    lostFound: [],
    claims: [],
    announcements: [],
    feedback: [],
    cart: [],
    nextUserId: 1,
    nextMarketId: 1,
    nextLostFoundId: 1,
    nextClaimId: 1,
    nextAnnouncementId: 1,
    nextFeedbackId: 1,
    nextCartId: 1
};
const adapter = new JSONFile(dbPath);
const db = new Low(adapter, defaultData);

await db.read();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: "Invalid token" });
        }
        req.user = user;
        next();
    });
}

app.post("/api/register", async (req, res) => {
    const { username, password, role = "student" } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password required" });
    }
    await db.read();
    const existingUser = db.data.users.find(u => u.username === username);
    if (existingUser) {
        return res.status(400).json({ success: false, message: "Username already exists" });
    }
    const hashedPassword = bcrypt.hashSync(password, 8);
    const newUser = {
        id: db.data.nextUserId++,
        username,
        password: hashedPassword,
        role
    };
    db.data.users.push(newUser);
    await db.write();
    res.json({ success: true, data: { id: newUser.id, username: newUser.username, role: newUser.role } });
});

app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    await db.read();
    const user = db.data.users.find(u => u.username === username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET);
    res.json({ success: true, data: { id: user.id, username: user.username, role: user.role, token } });
});

// Get current user info
app.get("/api/auth/me", authenticateToken, async (req, res) => {
    await db.read();
    const user = db.data.users.find(u => u.id === req.user.userId);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({
        success: true,
        data: {
            id: user.id,
            username: user.username,
            role: user.role,
            avatar: user.avatar || "",
            phone: user.phone || "",
            email: user.email || "",
            bio: user.bio || ""
        }
    });
});

// Update user profile
app.put("/api/user/profile", authenticateToken, async (req, res) => {
    const { avatar, phone, email, bio } = req.body;
    await db.read();
    const user = db.data.users.find(u => u.id === req.user.userId);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    if (avatar !== undefined) user.avatar = avatar;
    if (phone !== undefined) user.phone = phone;
    if (email !== undefined) user.email = email;
    if (bio !== undefined) user.bio = bio;
    user.updatedAt = new Date().toISOString();
    await db.write();
    res.json({
        success: true,
        data: {
            id: user.id,
            username: user.username,
            role: user.role,
            avatar: user.avatar || "",
            phone: user.phone || "",
            email: user.email || "",
            bio: user.bio || ""
        }
    });
});

// Change password
app.put("/api/user/password", authenticateToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ success: false, message: "Old and new password required" });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }
    await db.read();
    const user = db.data.users.find(u => u.id === req.user.userId);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    if (!bcrypt.compareSync(oldPassword, user.password)) {
        return res.status(400).json({ success: false, message: "Old password is incorrect" });
    }
    user.password = bcrypt.hashSync(newPassword, 8);
    user.updatedAt = new Date().toISOString();
    await db.write();
    res.json({ success: true, message: "Password updated successfully" });
});

app.get("/api/market", async (req, res) => {
    await db.read();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    let filtered = db.data.market.filter(item => item.status === "available");
    const requesterId = req.query.userId ? Number(req.query.userId) : null;
    if (requesterId) {
        const requester = db.data.users.find(u => u.id === requesterId);
        if (requester) {
            if (requester.role === "admin") {
                filtered = filtered.filter(item => item.userRole === "admin" || !item.userRole);
            } else {
                filtered = filtered.filter(item => item.userRole === "student" || !item.userRole);
            }
        }
    }
    // 搜索关键词
    const search = req.query.search;
    if (search) {
        const q = String(search).toLowerCase();
        filtered = filtered.filter(item =>
            item.title.toLowerCase().includes(q) ||
            (item.description && item.description.toLowerCase().includes(q)) ||
            (item.category && item.category.toLowerCase().includes(q))
        );
    }
    // 分类筛选
    const category = req.query.category;
    if (category) {
        filtered = filtered.filter(item => item.category === category);
    }
    // 成色筛选
    const condition = req.query.condition;
    if (condition) {
        filtered = filtered.filter(item => item.condition === condition);
    }
    // 价格区间
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
    if (minPrice !== null) {
        filtered = filtered.filter(item => item.price >= minPrice);
    }
    if (maxPrice !== null) {
        filtered = filtered.filter(item => item.price <= maxPrice);
    }
    // 排序
    const sort = req.query.sort;
    if (sort === "price-asc") {
        filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
        filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else {
        // 默认按创建时间倒序（最新）
        filtered = [...filtered].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
    const paginated = filtered.slice(offset, offset + limit);
    res.json({ success: true, data: paginated, total: filtered.length, page, limit });
});

app.post("/api/market", authenticateToken, async (req, res) => {
    const { title, description, price, images, category, condition } = req.body;
    if (!title || !price) {
        return res.status(400).json({ success: false, message: "Title and price required" });
    }
    await db.read();
    const newProduct = {
        id: db.data.nextMarketId++,
        userId: req.user.userId,
        userRole: req.user.role,
        title,
        description: description || "",
        price: Number(price),
        images: images || [],
        category: category || "其他",
        condition: condition || "全新",
        status: "available",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    db.data.market.push(newProduct);
    await db.write();
    res.json({ success: true, data: newProduct });
});

app.post("/api/market/:id/buy", authenticateToken, async (req, res) => {
    await db.read();
    const product = db.data.market.find(p => p.id === Number(req.params.id));
    if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
    }
    if (product.status !== "available") {
        return res.status(400).json({ success: false, message: "Product already sold" });
    }
    if (product.userId === req.user.userId) {
        return res.status(400).json({ success: false, message: "Cannot buy your own product" });
    }
    product.status = "sold";
    product.buyerId = req.user.userId;
    product.updatedAt = new Date().toISOString();
    await db.write();
    res.json({ success: true, message: "Purchase successful" });
});

// Cart API - Add item to cart
app.post("/api/cart", authenticateToken, async (req, res) => {
    const { productId } = req.body;
    if (!productId) {
        return res.status(400).json({ success: false, message: "Product ID required" });
    }
    await db.read();
    const product = db.data.market.find(p => p.id === productId);
    if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
    }
    if (product.status !== "available") {
        return res.status(400).json({ success: false, message: "Product not available" });
    }
    if (product.userId === req.user.userId) {
        return res.status(400).json({ success: false, message: "Cannot add your own item to cart" });
    }
    // Initialize cart if not exists
    if (!db.data.cart) db.data.cart = [];
    if (!db.data.nextCartId) db.data.nextCartId = 1;
    // Check if already in cart
    const existingItem = db.data.cart.find(c => c.userId === req.user.userId && c.productId === productId);
    if (existingItem) {
        return res.status(400).json({ success: false, message: "Item already in cart" });
    }
    const newCartItem = {
        id: db.data.nextCartId++,
        userId: req.user.userId,
        productId: productId,
        addedAt: new Date().toISOString()
    };
    db.data.cart.push(newCartItem);
    await db.write();
    res.json({ success: true, data: { ...newCartItem, product } });
});

// Get cart items
app.get("/api/cart", authenticateToken, async (req, res) => {
    await db.read();
    if (!db.data.cart) db.data.cart = [];
    const cartItems = db.data.cart
        .filter(c => c.userId === req.user.userId)
        .map(c => {
            const product = db.data.market.find(p => p.id === c.productId);
            if (!product) return null;
            return { ...c, product };
        })
        .filter(c => c !== null && c.product.status === "available");
    res.json({ success: true, data: cartItems });
});

// Remove item from cart
app.delete("/api/cart/:id", authenticateToken, async (req, res) => {
    await db.read();
    if (!db.data.cart) db.data.cart = [];
    const index = db.data.cart.findIndex(c => c.id === Number(req.params.id) && c.userId === req.user.userId);
    if (index === -1) {
        return res.status(404).json({ success: false, message: "Cart item not found" });
    }
    db.data.cart.splice(index, 1);
    await db.write();
    res.json({ success: true });
});

// Checkout cart (batch purchase)
app.post("/api/cart/checkout", authenticateToken, async (req, res) => {
    const { cartItemIds } = req.body;
    if (!cartItemIds || !Array.isArray(cartItemIds) || cartItemIds.length === 0) {
        return res.status(400).json({ success: false, message: "Cart item IDs required" });
    }
    await db.read();
    if (!db.data.cart) db.data.cart = [];
    const purchasedItems = [];
    const errors = [];
    
    for (const cartItemId of cartItemIds) {
        const cartItem = db.data.cart.find(c => c.id === cartItemId && c.userId === req.user.userId);
        if (!cartItem) {
            errors.push({ cartItemId, message: "Cart item not found" });
            continue;
        }
        const product = db.data.market.find(p => p.id === cartItem.productId);
        if (!product) {
            errors.push({ cartItemId, message: "Product not found" });
            const cartIndex = db.data.cart.findIndex(c => c.id === cartItemId);
            if (cartIndex !== -1) db.data.cart.splice(cartIndex, 1);
            continue;
        }
        if (product.status !== "available") {
            errors.push({ cartItemId, message: "Product not available" });
            const cartIndex = db.data.cart.findIndex(c => c.id === cartItemId);
            if (cartIndex !== -1) db.data.cart.splice(cartIndex, 1);
            continue;
        }
        if (product.userId === req.user.userId) {
            errors.push({ cartItemId, message: "Cannot buy your own item" });
            continue;
        }
        // Purchase
        product.status = "sold";
        product.buyerId = req.user.userId;
        product.buyerUsername = req.user.username;
        product.soldAt = new Date().toISOString();
        purchasedItems.push(product);
        // Remove from cart
        const cartIndex = db.data.cart.findIndex(c => c.id === cartItemId);
        if (cartIndex !== -1) db.data.cart.splice(cartIndex, 1);
    }
    
    await db.write();
    res.json({ 
        success: true, 
        data: { 
            purchasedItems, 
            errors,
            totalPurchased: purchasedItems.length,
            totalErrors: errors.length
        } 
    });
});

app.get("/api/market/my-purchases", authenticateToken, async (req, res) => {
    await db.read();
    const purchases = db.data.market
        .filter(p => p.buyerId === req.user.userId)
        .map(p => ({ ...p, seller: db.data.users.find(u => u.id === p.userId) }));
    res.json({ success: true, data: purchases });
});

app.get("/api/market/my-posts", authenticateToken, async (req, res) => {
    await db.read();
    const posts = db.data.market.filter(p => p.userId === req.user.userId);
    res.json({ success: true, data: posts });
});

app.delete("/api/market/:id", authenticateToken, async (req, res) => {
    await db.read();
    const product = db.data.market.find(p => p.id === Number(req.params.id));
    if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
    }
    if (product.userId !== req.user.userId) {
        return res.status(403).json({ success: false, message: "Cannot delete other user's product" });
    }
    if (product.status === "sold") {
        return res.status(400).json({ success: false, message: "Cannot delete sold product" });
    }
    const index = db.data.market.findIndex(p => p.id === Number(req.params.id));
    db.data.market.splice(index, 1);
    await db.write();
    res.json({ success: true });
});

// Lost & Found API
app.get("/api/lost-found", async (req, res) => {
    await db.read();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const filtered = db.data.lostFound.filter(item => item.status !== "returned");
    const paginated = filtered.slice(offset, offset + limit);
    res.json({ success: true, data: paginated, total: filtered.length, page, limit });
});

app.post("/api/lost-found", authenticateToken, async (req, res) => {
    const { type, title, description, images, location, contact } = req.body;
    if (!title || !location || !contact) {
        return res.status(400).json({ success: false, message: "Title, location and contact required" });
    }
    await db.read();
    const newItem = {
        id: db.data.nextLostFoundId++,
        userId: req.user.userId,
        type: type || "lost",
        title,
        description: description || "",
        images: images || [],
        location,
        contact,
        status: "active",
        claimerId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    db.data.lostFound.push(newItem);
    await db.write();
    res.json({ success: true, data: newItem });
});

app.post("/api/lost-found/:id/claim", authenticateToken, async (req, res) => {
    await db.read();
    const item = db.data.lostFound.find(i => i.id === Number(req.params.id));
    if (!item) {
        return res.status(404).json({ success: false, message: "Item not found" });
    }
    if (item.status !== "active") {
        return res.status(400).json({ success: false, message: "Item already claimed" });
    }
    if (item.userId === req.user.userId) {
        return res.status(400).json({ success: false, message: "Cannot claim your own item" });
    }
    item.status = "claimed";
    item.claimerId = req.user.userId;
    item.updatedAt = new Date().toISOString();
    await db.write();
    res.json({ success: true, message: "Claim successful" });
});

app.put("/api/lost-found/:id/confirm", authenticateToken, async (req, res) => {
    await db.read();
    const item = db.data.lostFound.find(i => i.id === Number(req.params.id));
    if (!item) {
        return res.status(404).json({ success: false, message: "Item not found" });
    }
    if (item.status !== "claimed") {
        return res.status(400).json({ success: false, message: "Item not claimed yet" });
    }
    if (item.userId !== req.user.userId) {
        return res.status(403).json({ success: false, message: "Only owner can confirm" });
    }
    item.status = "returned";
    item.returnedAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    const claim = db.data.claims.find(c => c.lostFoundId === item.id);
    if (claim) {
        claim.status = "completed";
        claim.updatedAt = new Date().toISOString();
    }
    await db.write();
    res.json({ success: true, data: item });
});

app.get("/api/lost-found/my-claims", authenticateToken, async (req, res) => {
    await db.read();
    const claims = db.data.lostFound
        .filter(i => i.claimerId === req.user.userId)
        .map(i => {
            const owner = db.data.users.find(u => u.id === i.userId);
            return {
                ...i,
                owner: owner ? { id: owner.id, username: owner.username, role: owner.role } : null
            };
        });
    res.json({ success: true, data: claims });
});

app.delete("/api/lost-found/:id", authenticateToken, async (req, res) => {
    await db.read();
    const item = db.data.lostFound.find(i => i.id === Number(req.params.id));
    if (!item) {
        return res.status(404).json({ success: false, message: "Item not found" });
    }
    if (item.userId !== req.user.userId) {
        return res.status(403).json({ success: false, message: "Cannot delete other user's item" });
    }
    const index = db.data.lostFound.findIndex(i => i.id === Number(req.params.id));
    db.data.lostFound.splice(index, 1);
    await db.write();
    res.json({ success: true });
});

app.get("/api/lost-found/my-posts", authenticateToken, async (req, res) => {
    await db.read();
    const posts = db.data.lostFound
        .filter(i => i.userId === req.user.userId)
        .map(i => {
            const claimer = i.claimerId ? db.data.users.find(u => u.id === i.claimerId) : null;
            return {
                ...i,
                claimer: claimer ? { id: claimer.id, username: claimer.username, role: claimer.role } : null
            };
        });
    res.json({ success: true, data: posts });
});

// Feedback API
app.post("/api/feedback", authenticateToken, async (req, res) => {
    const { category, title, content, images } = req.body;
    if (!title || !content) {
        return res.status(400).json({ success: false, message: "Title and content required" });
    }
    await db.read();
    const newFeedback = {
        id: db.data.nextFeedbackId ? db.data.nextFeedbackId++ : 1,
        userId: req.user.userId,
        category: category || "其他",
        title,
        content,
        images: images || [],
        status: "pending",
        reply: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    if (!db.data.feedback) {
        db.data.feedback = [];
    }
    if (!db.data.nextFeedbackId) {
        db.data.nextFeedbackId = 1;
    }
    db.data.feedback.push(newFeedback);
    await db.write();
    res.json({ success: true, data: newFeedback });
});

app.get("/api/feedback/my", authenticateToken, async (req, res) => {
    await db.read();
    const feedbacks = db.data.feedback ? db.data.feedback.filter(f => f.userId === req.user.userId) : [];
    res.json({ success: true, data: feedbacks });
});

// User stats API
app.get("/api/user/stats", authenticateToken, async (req, res) => {
    await db.read();
    const stats = {
        posts: db.data.market.filter(p => p.userId === req.user.userId).length,
        purchases: db.data.market.filter(p => p.buyerId === req.user.userId).length,
        feedbacks: db.data.feedback ? db.data.feedback.filter(f => f.userId === req.user.userId).length : 0,
        lostFound: db.data.lostFound.filter(i => i.userId === req.user.userId).length,
        claims: db.data.lostFound.filter(i => i.claimerId === req.user.userId).length
    };
    res.json({ success: true, data: stats });
});

app.get("/api/announcements", async (req, res) => {
    try {
        await db.read();
        const announcements = db.data.announcements
            .map(a => ({
                ...a,
                author: db.data.users.find(u => u.id === a.userId)
            }))
            .sort((a, b) => {
                if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
        res.json({ success: true, data: announcements });
    } catch (error) {
        console.error("Error in /api/announcements:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/api/announcements", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Only admin can publish announcements" });
    }
    const { title, content, category, pinned } = req.body;
    if (!title || !content) {
        return res.status(400).json({ success: false, message: "Title and content required" });
    }
    await db.read();
    const newAnnouncement = {
        id: db.data.nextAnnouncementId++,
        userId: req.user.userId,
        title,
        content,
        category: category || "通知",
        pinned: pinned || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    db.data.announcements.push(newAnnouncement);
    await db.write();
    res.json({ success: true, data: newAnnouncement });
});

app.put("/api/announcements/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Only admin can update announcements" });
    }
    const { title, content, category, pinned } = req.body;
    await db.read();
    const announcement = db.data.announcements.find(a => a.id === Number(req.params.id));
    if (!announcement) {
        return res.status(404).json({ success: false, message: "Announcement not found" });
    }
    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (category) announcement.category = category;
    if (pinned !== undefined) announcement.pinned = pinned;
    announcement.updatedAt = new Date().toISOString();
    await db.write();
    res.json({ success: true, data: announcement });
});

app.delete("/api/announcements/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Only admin can delete announcements" });
    }
    await db.read();
    const index = db.data.announcements.findIndex(a => a.id === Number(req.params.id));
    if (index === -1) {
        return res.status(404).json({ success: false, message: "Announcement not found" });
    }
    db.data.announcements.splice(index, 1);
    await db.write();
    res.json({ success: true });
});

const distPath = path.join(__dirname, "../dist");

if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
}

// Handle API 404
app.use("/api", (req, res) => {
    res.status(404).json({ success: false, message: "API endpoint not found" });
});

// Handle non-API routes - serve frontend
app.use((req, res) => {
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("Frontend not built yet. Run 'npm run build' to create dist/, or access via Vite dev server (port 5173).");
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log("Server running on http://0.0.0.0:" + PORT);
    console.log("Database file: " + dbPath);
});
