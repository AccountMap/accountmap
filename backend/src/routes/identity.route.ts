import express from "express";
import { IdentityType } from '@prisma/client';
import { prisma } from "../lib/prisma";
import { get_default_user } from "../lib/utils";
import { MAX_IDENTITIES } from "../lib/limits";

const router = express.Router();

// POST /add
// Accepts body: { value, type }
// Creates a new identity for the default user
router.post("/add", async (req: any, res: any) => {
	const { value, type } = req.body || {};

	if (!value || !type)
		return res.status(400).json({ message: "Missing required fields: value and type" });

	if (typeof value !== "string" || typeof type !== "string")
		return res.status(400).json({ message: "Fields value and type must be strings" });

	try {
		const user = await get_default_user();
		if (!user) return res.status(500).json({ message: "Default user not found" });

		// Validate and normalize type to enum
		const typeVal = String(type).toUpperCase() as IdentityType;
		const validTypes: IdentityType[] = ["MAIL", "PHONE", "AUTH"];
		if (!validTypes.includes(typeVal))
			return res
				.status(400)
				.json({ message: `Invalid type. Must be one of: ${validTypes.join(", ")}` });

		const identityCount = await prisma.identity.count({ where: { userid: user.id } });
		if (identityCount >= MAX_IDENTITIES) {
			return res.status(403).json({
				message: `Connection limit reached. Maximum ${MAX_IDENTITIES} connections allowed to preserve the cheapest tier database.`,
				limit: MAX_IDENTITIES,
			});
		}

		// Check for duplicate (same userid, type, value)
		const existing = await prisma.identity.findFirst({
			where: { userid: user.id, type: typeVal, value: String(value).trim() },
		});
		if (existing) return res.status(409).json({ message: "Identity already exists" });

		// Create identity
		const identity = await prisma.identity.create({
			data: { value: String(value).trim(), type: typeVal, userid: user.id },
		});

		return res.status(201).json({
			message: "Identity created",
			id: identity.id,
			value: identity.value,
			type: identity.type,
			userid: identity.userid,
		});
	} catch (error) {
		console.error("Error in POST /identities/add", error);
		return res.status(500).json({ message: "Error creating identity" });
	}
});

// GET /map
// Retrieves all identities for the default user with their connections
router.get("/map", async (req: any, res: any) => {
	try {
		const user = await get_default_user();
		if (!user) return res.status(500).json({ message: "Default user not found" });

		// Fetch all identities for this user with their connections and accounts
		const identities = await prisma.identity.findMany({
			where: { userid: user.id },
			include: {
				connections: {
					include: { account: true },
				},
			},
		});

		const accounts = await prisma.account.findMany({
			where: { userid: user.id },
			include: { connections: true },
		});
		const unlinkedAccounts = accounts
			.filter((account) => account.connections.length === 0)
			.map(({ connections, ...account }) => account);

		const response = identities.map((identity) => ({
			...identity,
			connections: identity.connections.map((connection) => connection.account),
		}));

		response.push({
			id: "",
			value: "",
			type: "",
			notes: null,
			userid: user.id,
			connections: unlinkedAccounts,
		} as any);

		return res.status(200).json(response);
	} catch (error) {
		console.error("Error in GET /identities/map", error);
		return res.status(500).json({ message: "Error retrieving identities" });
	}
});

// PATCH /:id
// Updates an identity's value and/or type
router.patch("/:id", async (req: any, res: any) => {
	const identityId = req.params.id;
	const { value, type } = req.body || {};

	if (!identityId) return res.status(400).json({ message: "Missing identity id in params" });
	if (value === undefined && type === undefined)
		return res.status(400).json({ message: "Provide value and/or type to update" });

	if (value !== undefined && typeof value !== "string")
		return res.status(400).json({ message: "Field value must be a string" });
	if (type !== undefined && typeof type !== "string")
		return res.status(400).json({ message: "Field type must be a string" });

	try {
		const user = await get_default_user();
		if (!user) return res.status(500).json({ message: "Default user not found" });

		const existing = await prisma.identity.findUnique({ where: { id: identityId } });
		if (!existing) return res.status(404).json({ message: "Identity not found" });
		if (existing.userid !== user.id)
			return res.status(403).json({ message: "Identity ownership mismatch" });

		const updateData: any = {};
		if (value !== undefined) updateData.value = String(value).trim();
		if (type !== undefined) {
			const typeVal = String(type).toUpperCase() as IdentityType;
			const validTypes: IdentityType[] = ["MAIL", "PHONE", "AUTH"];
			if (!validTypes.includes(typeVal))
				return res
					.status(400)
					.json({ message: `Invalid type. Must be one of: ${validTypes.join(", ")}` });
			updateData.type = typeVal;
		}

		const updated = await prisma.identity.update({
			where: { id: identityId },
			data: updateData,
		});

		return res.status(200).json({
			message: "Identity updated",
			id: updated.id,
			value: updated.value,
			type: updated.type,
			userid: updated.userid,
		});
	} catch (error) {
		console.error("Error in PATCH /identities/:id", error);
		return res.status(500).json({ message: "Error updating identity" });
	}
});

// DELETE /:id
// Deletes an identity and its connections
router.delete("/:id", async (req: any, res: any) => {
	const identityId = req.params.id;

	if (!identityId) return res.status(400).json({ message: "Missing identity id in params" });

	try {
		const user = await get_default_user();
		if (!user) return res.status(500).json({ message: "Default user not found" });

		const existing = await prisma.identity.findUnique({ where: { id: identityId } });
		if (!existing) return res.status(404).json({ message: "Identity not found" });
		if (existing.userid !== user.id)
			return res.status(403).json({ message: "Identity ownership mismatch" });

		await prisma.connections.deleteMany({ where: { identityId } });
		await prisma.identity.delete({ where: { id: identityId } });

		return res.status(200).json({ message: "Identity deleted", id: identityId });
	} catch (error) {
		console.error("Error in DELETE /identities/:id", error);
		return res.status(500).json({ message: "Error deleting identity" });
	}
});

// GET /:id
// Retrieves an identity and all its connections (linked accounts)
router.get("/:id", async (req: any, res: any) => {
	const identityId = req.params.id;

	if (!identityId) return res.status(400).json({ message: "Missing identity id in params" });

	try {
		const user = await get_default_user();
		if (!user) return res.status(500).json({ message: "Default user not found" });

		const identity = await prisma.identity.findUnique({
			where: { id: identityId },
			include: {
				connections: {
					include: { account: true },
				},
			},
		});

		if (!identity) return res.status(404).json({ message: "Identity not found" });

		if (identity.userid !== user.id)
			return res.status(403).json({ message: "Identity ownership mismatch" });

		return res.status(200).json(identity);
	} catch (error) {
		console.error("Error in GET /identities/:id", error);
		return res.status(500).json({ message: "Error retrieving identity" });
	}
});

export default router;
