import { 
  users, type User, type InsertUser,
  connections, type Connection, type InsertConnection,
  notifications, type Notification, type InsertNotification,
  qrCodes, type QrCode, type InsertQrCode
} from "@shared/schema";
import { nanoid } from "nanoid";
import { add } from "date-fns";

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Connection operations
  createConnection(connection: InsertConnection): Promise<Connection>;
  getConnection(id: number): Promise<Connection | undefined>;
  getConnectionsByBusinessId(businessId: number): Promise<Connection[]>;
  getConnectionsByCustomerId(customerId: number): Promise<Connection[]>;
  getActiveConnections(userId: number): Promise<Connection[]>;
  closeConnection(id: number): Promise<Connection>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByConnectionId(connectionId: number): Promise<Notification[]>;
  getNotificationsForUser(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification>;
  
  // QR Code operations
  createQrCode(userId: number): Promise<QrCode>;
  getQrCodeByCode(code: string): Promise<QrCode | undefined>;
  validateQrCode(code: string): Promise<QrCode | undefined>;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private connections: Map<number, Connection>;
  private notifications: Map<number, Notification>;
  private qrCodes: Map<number, QrCode>;
  
  userCurrentId: number;
  connectionCurrentId: number;
  notificationCurrentId: number;
  qrCodeCurrentId: number;

  constructor() {
    this.users = new Map();
    this.connections = new Map();
    this.notifications = new Map();
    this.qrCodes = new Map();
    
    this.userCurrentId = 1;
    this.connectionCurrentId = 1;
    this.notificationCurrentId = 1;
    this.qrCodeCurrentId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  // Connection operations
  async createConnection(insertConnection: InsertConnection): Promise<Connection> {
    const id = this.connectionCurrentId++;
    const createdAt = new Date();
    const connection: Connection = { 
      ...insertConnection, 
      id, 
      createdAt, 
      closedAt: null,
      status: insertConnection.status || "active" 
    };
    this.connections.set(id, connection);
    return connection;
  }
  
  async getConnection(id: number): Promise<Connection | undefined> {
    return this.connections.get(id);
  }
  
  async getConnectionsByBusinessId(businessId: number): Promise<Connection[]> {
    return Array.from(this.connections.values()).filter(
      (connection) => connection.businessId === businessId
    );
  }
  
  async getConnectionsByCustomerId(customerId: number): Promise<Connection[]> {
    return Array.from(this.connections.values()).filter(
      (connection) => connection.customerId === customerId
    );
  }
  
  async getActiveConnections(userId: number): Promise<Connection[]> {
    return Array.from(this.connections.values()).filter(
      (connection) => 
        (connection.businessId === userId || connection.customerId === userId) &&
        connection.status === "active"
    );
  }
  
  async closeConnection(id: number): Promise<Connection> {
    const connection = this.connections.get(id);
    if (!connection) {
      throw new Error(`Connection with id ${id} not found`);
    }
    
    const updatedConnection = {
      ...connection,
      status: "closed",
      closedAt: new Date()
    };
    
    this.connections.set(id, updatedConnection);
    return updatedConnection;
  }
  
  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationCurrentId++;
    const createdAt = new Date();
    // Create a correctly typed notification object with default isRead value
    const notification: Notification = { 
      id, 
      title: insertNotification.title,
      message: insertNotification.message,
      connectionId: insertNotification.connectionId,
      createdAt, 
      isRead: false 
    };
    this.notifications.set(id, notification);
    return notification;
  }
  
  async getNotificationsByConnectionId(connectionId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(
      (notification) => notification.connectionId === connectionId
    );
  }
  
  async getNotificationsForUser(userId: number): Promise<Notification[]> {
    // First get all connections for this user
    const connections = Array.from(this.connections.values()).filter(
      (connection) => connection.businessId === userId || connection.customerId === userId
    );
    
    const connectionIds = connections.map(connection => connection.id);
    
    // Then get all notifications for these connections
    return Array.from(this.notifications.values())
      .filter(notification => connectionIds.includes(notification.connectionId))
      .sort((a, b) => {
        // Handle potentially null dates by defaulting to current time
        const timeA = a.createdAt?.getTime() || Date.now();
        const timeB = b.createdAt?.getTime() || Date.now();
        return timeB - timeA; // Sort newest first
      });
  }
  
  async markNotificationAsRead(id: number): Promise<Notification> {
    const notification = this.notifications.get(id);
    if (!notification) {
      throw new Error(`Notification with id ${id} not found`);
    }
    
    const updatedNotification = {
      ...notification,
      isRead: true
    };
    
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
  
  // QR Code operations
  async createQrCode(userId: number): Promise<QrCode> {
    const id = this.qrCodeCurrentId++;
    const code = nanoid(10); // Generate a random code
    const createdAt = new Date();
    const expiresAt = add(createdAt, { minutes: 5 }); // QR code expires in 5 minutes
    
    const qrCode: QrCode = {
      id,
      userId,
      code,
      expiresAt,
      createdAt
    };
    
    this.qrCodes.set(id, qrCode);
    return qrCode;
  }
  
  async getQrCodeByCode(code: string): Promise<QrCode | undefined> {
    return Array.from(this.qrCodes.values()).find(
      (qrCode) => qrCode.code === code
    );
  }
  
  async validateQrCode(code: string): Promise<QrCode | undefined> {
    const qrCode = await this.getQrCodeByCode(code);
    
    if (!qrCode) {
      return undefined;
    }
    
    // Check if QR code has expired
    if (qrCode.expiresAt < new Date()) {
      return undefined;
    }
    
    return qrCode;
  }
}

export const storage = new MemStorage();
