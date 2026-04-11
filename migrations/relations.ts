import { relations } from "drizzle-orm/relations";
import { users, connections, notifications, qrCodes } from "./schema";

export const connectionsRelations = relations(connections, ({one, many}) => ({
	user_businessId: one(users, {
		fields: [connections.businessId],
		references: [users.id],
		relationName: "connections_businessId_users_id"
	}),
	user_customerId: one(users, {
		fields: [connections.customerId],
		references: [users.id],
		relationName: "connections_customerId_users_id"
	}),
	notifications: many(notifications),
}));

export const usersRelations = relations(users, ({many}) => ({
	connections_businessId: many(connections, {
		relationName: "connections_businessId_users_id"
	}),
	connections_customerId: many(connections, {
		relationName: "connections_customerId_users_id"
	}),
	qrCodes: many(qrCodes),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	connection: one(connections, {
		fields: [notifications.connectionId],
		references: [connections.id]
	}),
}));

export const qrCodesRelations = relations(qrCodes, ({one}) => ({
	user: one(users, {
		fields: [qrCodes.userId],
		references: [users.id]
	}),
}));