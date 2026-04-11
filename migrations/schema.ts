import { pgTable, unique, serial, text, boolean, timestamp, foreignKey, integer, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const userType = pgEnum("user_type", ['business', 'customer'])


export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	displayName: text("display_name").notNull(),
	email: text().notNull(),
	userType: userType("user_type").notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	verificationToken: text("verification_token"),
	verificationTokenExpires: timestamp("verification_token_expires", { mode: 'string' }),
	resetPasswordToken: text("reset_password_token"),
	resetPasswordExpires: timestamp("reset_password_expires", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_username_unique").on(table.username),
	unique("users_email_unique").on(table.email),
]);

export const connections = pgTable("connections", {
	id: serial().primaryKey().notNull(),
	businessId: integer("business_id").notNull(),
	customerId: integer("customer_id").notNull(),
	status: text().default('active').notNull(),
	serviceName: text("service_name").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	closedAt: timestamp("closed_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [users.id],
			name: "connections_business_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [users.id],
			name: "connections_customer_id_users_id_fk"
		}),
]);

export const notifications = pgTable("notifications", {
	id: serial().primaryKey().notNull(),
	connectionId: integer("connection_id").notNull(),
	title: text().notNull(),
	message: text().notNull(),
	isRead: boolean("is_read").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.connectionId],
			foreignColumns: [connections.id],
			name: "notifications_connection_id_connections_id_fk"
		}),
]);

export const qrCodes = pgTable("qr_codes", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	code: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "qr_codes_user_id_users_id_fk"
		}),
]);
