import { User, InsertUser, Connection, InsertConnection, Notification, InsertNotification, QrCode, users, connections, notifications, qrCodes } from "@shared/schema";
import { nanoid } from "nanoid";
import { add } from "date-fns";
import { db } from "./db";
import { eq, and, or, desc } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

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

  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'session'
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Connection operations
  async createConnection(insertConnection: InsertConnection): Promise<Connection> {
    // Ensure status has a value
    const connectionData = {
      ...insertConnection,
      status: insertConnection.status || "active"
    };
    
    const [connection] = await db.insert(connections).values(connectionData).returning();
    return connection;
  }
  
  async getConnection(id: number): Promise<Connection | undefined> {
    const [connection] = await db.select().from(connections).where(eq(connections.id, id));
    return connection;
  }
  
  async getConnectionsByBusinessId(businessId: number): Promise<Connection[]> {
    return await db.select().from(connections).where(eq(connections.businessId, businessId));
  }
  
  async getConnectionsByCustomerId(customerId: number): Promise<Connection[]> {
    return await db.select().from(connections).where(eq(connections.customerId, customerId));
  }
  
  async getActiveConnections(userId: number): Promise<Connection[]> {
    return await db.select().from(connections).where(
      and(
        or(
          eq(connections.businessId, userId),
          eq(connections.customerId, userId)
        ),
        eq(connections.status, "active")
      )
    );
  }
  
  async closeConnection(id: number): Promise<Connection> {
    const [connection] = await db
      .update(connections)
      .set({
        status: "closed",
        closedAt: new Date()
      })
      .where(eq(connections.id, id))
      .returning();
    
    if (!connection) {
      throw new Error(`Connection with id ${id} not found`);
    }
    
    return connection;
  }
  
  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values({
        ...insertNotification,
        isRead: false
      })
      .returning();
    
    return notification;
  }
  
  async getNotificationsByConnectionId(connectionId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.connectionId, connectionId));
  }
  
  async getNotificationsForUser(userId: number): Promise<Notification[]> {
    // Get all connections for this user
    const userConnections = await db
      .select({ id: connections.id })
      .from(connections)
      .where(
        or(
          eq(connections.businessId, userId),
          eq(connections.customerId, userId)
        )
      );
    
    const connectionIds = userConnections.map(c => c.id);
    
    if (connectionIds.length === 0) {
      return [];
    }
    
    // Get notifications for these connections
    return await db
      .select()
      .from(notifications)
      .where(
        connectionIds.length > 0 ? 
          or(...connectionIds.map(id => eq(notifications.connectionId, id))) 
          : undefined
      )
      .orderBy(desc(notifications.createdAt));
  }
  
  async markNotificationAsRead(id: number): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    
    if (!notification) {
      throw new Error(`Notification with id ${id} not found`);
    }
    
    return notification;
  }
  
  // QR Code operations
  async createQrCode(userId: number): Promise<QrCode> {
    const code = nanoid(10); // Generate a random code
    const expiresAt = add(new Date(), { minutes: 5 }); // QR code expires in 5 minutes
    
    const [qrCode] = await db
      .insert(qrCodes)
      .values({
        userId,
        code,
        expiresAt
      })
      .returning();
    
    return qrCode;
  }
  
  async getQrCodeByCode(code: string): Promise<QrCode | undefined> {
    const [qrCode] = await db
      .select()
      .from(qrCodes)
      .where(eq(qrCodes.code, code));
    
    return qrCode;
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

// Replace MemStorage with DatabaseStorage
export const storage = new DatabaseStorage();