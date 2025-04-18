import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertConnectionSchema, insertNotificationSchema } from "@shared/schema";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email";
import { hashPassword } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // QR Code routes
  app.post("/api/qrcode/generate", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const qrCode = await storage.createQrCode(req.user!.id);
      res.status(201).json(qrCode);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });

  // Connection routes
  app.post("/api/connections", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const qrCodeValidation = z.object({
        code: z.string(),
        serviceName: z.string().min(1)
      }).safeParse(req.body);
      
      if (!qrCodeValidation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: qrCodeValidation.error });
      }
      
      const { code, serviceName } = qrCodeValidation.data;
      
      // Validate QR code
      const qrCode = await storage.validateQrCode(code);
      if (!qrCode) {
        return res.status(400).json({ message: "Invalid or expired QR code" });
      }
      
      // Get customer from QR code
      const customer = await storage.getUser(qrCode.userId);
      if (!customer) {
        return res.status(400).json({ message: "Customer not found" });
      }
      
      // Business is the current user
      const businessId = req.user!.id;
      
      // Create connection
      const connection = await storage.createConnection({
        businessId,
        customerId: qrCode.userId,
        status: "active",
        serviceName
      });
      
      res.status(201).json(connection);
    } catch (error) {
      res.status(500).json({ message: "Failed to create connection" });
    }
  });

  // Get active connections for the current user
  app.get("/api/connections/active", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const connections = await storage.getActiveConnections(req.user!.id);
      
      // For each connection, append the business or customer information
      const enhancedConnections = await Promise.all(connections.map(async (connection) => {
        const business = await storage.getUser(connection.businessId);
        const customer = await storage.getUser(connection.customerId);
        
        return {
          ...connection,
          business: business ? { 
            id: business.id,
            displayName: business.displayName,
            userType: business.userType
          } : undefined,
          customer: customer ? {
            id: customer.id,
            displayName: customer.displayName,
            userType: customer.userType
          } : undefined
        };
      }));
      
      res.status(200).json(enhancedConnections);
    } catch (error) {
      res.status(500).json({ message: "Failed to get active connections" });
    }
  });

  // Close a connection
  app.post("/api/connections/:connectionId/close", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const connectionId = parseInt(req.params.connectionId);
      if (isNaN(connectionId)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }
      
      // Check if connection exists and user has permission
      const connection = await storage.getConnection(connectionId);
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      // Check if user is part of this connection
      if (connection.businessId !== req.user!.id && connection.customerId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to close this connection" });
      }
      
      const closedConnection = await storage.closeConnection(connectionId);
      res.status(200).json(closedConnection);
    } catch (error) {
      res.status(500).json({ message: "Failed to close connection" });
    }
  });

  // Notification routes
  app.post("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const validation = insertNotificationSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid notification data", errors: validation.error });
      }
      
      const notificationData = validation.data;
      
      // Check if connection exists and business has permission
      const connection = await storage.getConnection(notificationData.connectionId);
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      // Only businesses can send notifications
      if (connection.businessId !== req.user!.id) {
        return res.status(403).json({ message: "Only businesses can send notifications" });
      }
      
      // Check if connection is active
      if (connection.status !== "active") {
        return res.status(400).json({ message: "Cannot send notification on a closed connection" });
      }
      
      const notification = await storage.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  // Get notifications for the current user
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const notifications = await storage.getNotificationsForUser(req.user!.id);
      
      // For each notification, get connection details and add business/customer info
      const enhancedNotifications = await Promise.all(notifications.map(async (notification) => {
        const connection = await storage.getConnection(notification.connectionId);
        
        if (!connection) {
          return notification;
        }
        
        // Get business and customer info
        const business = await storage.getUser(connection.businessId);
        const customer = await storage.getUser(connection.customerId);
        
        return {
          ...notification,
          connection: {
            ...connection,
            business: business ? {
              id: business.id,
              displayName: business.displayName,
              userType: business.userType
            } : undefined,
            customer: customer ? {
              id: customer.id,
              displayName: customer.displayName,
              userType: customer.userType
            } : undefined
          }
        };
      }));
      
      res.status(200).json(enhancedNotifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  // Mark notification as read
  app.post("/api/notifications/:notificationId/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const notificationId = parseInt(req.params.notificationId);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.status(200).json(updatedNotification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Email verification routes
  app.post("/api/email/send-verification", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const user = req.user!;
      
      // Generate a verification token
      const token = await storage.createVerificationToken(user.id);
      
      // Send verification email
      const emailSent = await sendVerificationEmail(
        user.email,
        user.displayName,
        token
      );
      
      if (emailSent) {
        res.status(200).json({ message: "Verification email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send verification email" });
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/email/verify", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid token" });
      }
      
      const verified = await storage.verifyEmail(token);
      
      if (verified) {
        res.status(200).json({ message: "Email verified successfully" });
      } else {
        res.status(400).json({ message: "Invalid or expired verification token" });
      }
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Password reset routes
  app.post("/api/password/forgot", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Create password reset token
      const result = await storage.createPasswordResetToken(email);
      
      if (!result) {
        // Don't reveal whether the email exists or not for security reasons
        return res.status(200).json({ message: "If your email is registered, you will receive a password reset link" });
      }
      
      // Send password reset email
      const emailSent = await sendPasswordResetEmail(
        result.user.email,
        result.user.displayName,
        result.token
      );
      
      if (emailSent) {
        res.status(200).json({ message: "Password reset email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send password reset email" });
      }
    } catch (error) {
      console.error("Error sending password reset email:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/password/reset", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid token" });
      }
      
      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Reset the password
      const success = await storage.resetPassword(token, hashedPassword);
      
      if (success) {
        res.status(200).json({ message: "Password reset successfully" });
      } else {
        res.status(400).json({ message: "Invalid or expired reset token" });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
