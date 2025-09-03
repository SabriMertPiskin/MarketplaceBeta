import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import axios from "axios";
import { storage } from "./storage";

// Flask backend URL
const FLASK_BACKEND_URL = process.env.FLASK_BACKEND_URL || "http://localhost:8000";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['.stl', '.obj'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only STL and OBJ files are allowed'));
    }
  }
});

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

// Authentication middleware
const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header required" });
    }

    // Forward the request to Flask backend for authentication
    const response = await axios.post(`${FLASK_BACKEND_URL}/api/auth/verify`, {}, {
      headers: { Authorization: authHeader },
      timeout: 5000,
    });

    if (response.data.success) {
      req.user = response.data.user;
      next();
    } else {
      return res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
};

// Role-based authorization middleware
const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_ORIGINS?.split(",") || ["http://localhost:5173"],
      methods: ["GET", "POST"],
      credentials: false,
    },
    path: "/socket.io/",
  });

  // Initialize WebSocket server for additional real-time features
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    verifyClient: (info: any) => {
      // Basic verification - in production, verify JWT tokens here
      return true;
    }
  });

  // Socket.IO connection handling
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join user-specific room for notifications
    socket.on("join_user_room", (userId: string) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined room`);
    });

    // Join order-specific room for messaging
    socket.on("join_order_room", (orderId: string) => {
      socket.join(`order_${orderId}`);
      console.log(`Joined order room: ${orderId}`);
    });

    // Handle sending messages
    socket.on("send_message", async (data) => {
      try {
        const { order_id, receiver_id, content } = data;
        
        // Save message to database
        const message = await storage.createMessage({
          order_id,
          sender_id: data.sender_id,
          receiver_id,
          content,
          is_read: false,
        });

        // Emit to order room
        io.to(`order_${order_id}`).emit("new_message", message);
        
        // Create notification for receiver
        await storage.createNotification({
          user_id: receiver_id,
          type: "new_message",
          title: "Yeni Mesaj",
          body: content.substring(0, 100),
          order_id,
          is_read: false,
        });

        // Send notification to receiver
        io.to(`user_${receiver_id}`).emit("notification", {
          type: "new_message",
          title: "Yeni Mesaj",
          body: content.substring(0, 100),
          order_id,
        });

      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // WebSocket connection handling for additional features
  wss.on("connection", (ws, request) => {
    console.log("WebSocket client connected");

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log("WebSocket message received:", data);

        // Echo back for now - extend as needed
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "echo", data }));
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // Check Flask backend health
      const flaskResponse = await axios.get(`${FLASK_BACKEND_URL}/api/health`, {
        timeout: 5000,
      });

      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          frontend: "connected",
          backend: flaskResponse.data.status || "connected",
          database: "connected",
          websocket: "connected",
        },
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({
        status: "unhealthy",
        error: "Backend connection failed",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Authentication endpoints - proxy to Flask backend
  app.post("/api/auth/login", async (req, res) => {
    try {
      const response = await axios.post(`${FLASK_BACKEND_URL}/api/login`, req.body, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      res.json(response.data);
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({ error: "Login service unavailable" });
      }
    }
  });

  // File upload endpoint - proxy to Flask backend
  app.post("/api/upload/stl", authenticate, upload.single("file"), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Forward file to Flask backend for processing
      const FormData = require('form-data');
      const fs = require('fs');
      
      const formData = new FormData();
      formData.append('file', fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      const response = await axios.post(`${FLASK_BACKEND_URL}/api/upload/stl`, formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: req.headers.authorization,
        },
        timeout: 60000, // 60 seconds for large files
        maxContentLength: 100 * 1024 * 1024, // 100MB
      });

      // Clean up temporary file
      fs.unlinkSync(req.file.path);

      // Save product to database if upload successful
      if (response.data.success && response.data.analysis) {
        const product = await storage.createProduct({
          user_id: req.user!.id,
          name: req.file.originalname.replace(/\.[^/.]+$/, ""), // Remove extension
          stl_file_url: response.data.file_url,
          ipfs_hash: response.data.ipfs_hash,
          analysis: response.data.analysis,
          status: "pending",
        });

        res.json({
          success: true,
          product_id: product.id,
          analysis: response.data.analysis,
          file_url: response.data.file_url,
          ipfs_hash: response.data.ipfs_hash,
        });
      } else {
        res.json(response.data);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      
      // Clean up temporary file if it exists
      if (req.file) {
        const fs = require('fs');
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error("File cleanup error:", cleanupError);
        }
      }

      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({ error: "Upload service unavailable" });
      }
    }
  });

  // Pricing quote endpoint
  app.post("/api/pricing/quote", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const response = await axios.post(`${FLASK_BACKEND_URL}/api/pricing/quote`, req.body, {
        headers: {
          Authorization: req.headers.authorization,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      res.json(response.data);
    } catch (error: any) {
      console.error("Pricing quote error:", error);
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({ error: "Pricing service unavailable" });
      }
    }
  });

  // Product endpoints
  app.get("/api/products/:id", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Check if user has access to this product
      if (product.user_id !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(product);
    } catch (error) {
      console.error("Get product error:", error);
      res.status(500).json({ error: "Failed to retrieve product" });
    }
  });

  app.get("/api/products", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const products = await storage.getProductsByUser(req.user!.id);
      res.json(products);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ error: "Failed to retrieve products" });
    }
  });

  // Order endpoints
  app.post("/api/orders", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const orderData = {
        ...req.body,
        customer_id: req.user!.id,
        status: "draft",
      };

      const order = await storage.createOrder(orderData);
      
      // Emit notification to relevant users
      if (orderData.producer_id) {
        io.to(`user_${orderData.producer_id}`).emit("notification", {
          type: "new_order",
          title: "Yeni Sipariş",
          body: "Size yeni bir sipariş geldi",
          order_id: order.id,
        });
      }

      res.json(order);
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.get("/api/orders", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      let orders;
      if (req.user!.role === "producer") {
        orders = await storage.getOrdersByProducer(req.user!.id);
      } else if (req.user!.role === "customer") {
        orders = await storage.getOrdersByCustomer(req.user!.id);
      } else if (req.user!.role === "admin") {
        // Admin can see all orders - implement this in storage if needed
        orders = await storage.getOrdersByCustomer(req.user!.id); // Placeholder
      } else {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(orders);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ error: "Failed to retrieve orders" });
    }
  });

  app.get("/api/orders/:id", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check access permissions
      const hasAccess = order.customer_id === req.user!.id || 
                       order.producer_id === req.user!.id || 
                       req.user!.role === "admin";

      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(order);
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ error: "Failed to retrieve order" });
    }
  });

  app.patch("/api/orders/:id", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check permissions for order updates
      const canUpdate = order.customer_id === req.user!.id || 
                       order.producer_id === req.user!.id || 
                       req.user!.role === "admin";

      if (!canUpdate) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updatedOrder = await storage.updateOrder(req.params.id, req.body);
      
      // Emit real-time update
      io.to(`order_${req.params.id}`).emit("order_updated", updatedOrder);

      res.json(updatedOrder);
    } catch (error) {
      console.error("Update order error:", error);
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // Message endpoints
  app.get("/api/orders/:orderId/messages", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const order = await storage.getOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check access permissions
      const hasAccess = order.customer_id === req.user!.id || 
                       order.producer_id === req.user!.id;

      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const messages = await storage.getMessagesByOrder(req.params.orderId);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Failed to retrieve messages" });
    }
  });

  // Notification endpoints
  app.get("/api/notifications", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user!.id);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to retrieve notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Materials endpoint
  app.get("/api/materials", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const materials = await storage.getMaterials();
      res.json(materials);
    } catch (error) {
      console.error("Get materials error:", error);
      res.status(500).json({ error: "Failed to retrieve materials" });
    }
  });

  // Admin endpoints
  app.get("/api/admin/users", authenticate, authorize(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      // Forward to Flask backend for user management
      const response = await axios.get(`${FLASK_BACKEND_URL}/api/admin/users`, {
        headers: {
          Authorization: req.headers.authorization,
        },
        timeout: 10000,
      });

      res.json(response.data);
    } catch (error: any) {
      console.error("Get admin users error:", error);
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({ error: "Admin service unavailable" });
      }
    }
  });

  app.get("/api/admin/analytics", authenticate, authorize(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      // Forward to Flask backend for analytics
      const response = await axios.get(`${FLASK_BACKEND_URL}/api/admin/analytics`, {
        headers: {
          Authorization: req.headers.authorization,
        },
        timeout: 10000,
      });

      res.json(response.data);
    } catch (error: any) {
      console.error("Get admin analytics error:", error);
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({ error: "Analytics service unavailable" });
      }
    }
  });

  // Proxy any unhandled API requests to Flask backend
  app.use("/api/*", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const response = await axios({
        method: req.method.toLowerCase() as any,
        url: `${FLASK_BACKEND_URL}${req.originalUrl}`,
        data: req.body,
        headers: {
          ...req.headers,
          host: undefined, // Remove host header to avoid conflicts
        },
        timeout: 30000,
      });

      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error("Proxy request error:", error);
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({ error: "Backend service unavailable" });
      }
    }
  });

  // Error handling middleware
  app.use((error: any, req: any, res: any, next: any) => {
    console.error("Server error:", error);
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: "Dosya boyutu çok büyük. Maksimum 100MB." });
      }
    }

    res.status(error.status || 500).json({ 
      error: error.message || "Internal server error" 
    });
  });

  return httpServer;
}
