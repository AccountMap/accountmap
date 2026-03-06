import express from "express";
import { Account, Identity } from '@prisma/client';
import { prisma } from "../lib/prisma";
import { get_default_user } from "../lib/utils";
import { MAX_ACCOUNTS, MAX_IDENTITIES } from "../lib/limits";

const router = express.Router();

router.get("/map", async (req: any, res: any) => {
	try {
		const user = await get_default_user();
		if (!user) {
			return res.status(500).json({ error: "Default user not found" });
		}
		const accounts = await prisma.account.findMany({
			where: { userid: user.id },
			include: {
				connections: {
					select: {
						identity: true,
					},
				},
			},
		});
		res.status(200);
		return res.json(accounts);
	} catch (error) {
		console.error("Error fetching map accounts:", error);
		return res.status(500).json({ error: "An error occurred while fetching accounts." });
	}
});

// GET /:id
// Retrieves an account and its connections (linked identities)
router.get("/:id", async (req: any, res: any) => {
	const accountId = req.params.id;
	if (!accountId) return res.status(400).json({ message: "Missing account id in params" });

	try {
		const user = await get_default_user();
		if (!user) return res.status(500).json({ message: "Default user not found" });

		const account = await prisma.account.findUnique({
			where: { id: accountId },
			include: {
				connections: {
					select: {
						identity: true,
					},
				},
			},
		});
		if (!account) return res.status(404).json({ message: "Account not found" });
		if (account.userid !== user.id)
			return res.status(403).json({ message: "Account ownership mismatch" });

		return res.status(200).json(account);
	} catch (error) {
		console.error("Error in GET /accounts/:id", error);
		return res.status(500).json({ message: "Error retrieving account" });
	}
});

type PostAccounts = Omit<Account, "id" | "userid"> & {
	identities?: Omit<Identity, "id" | "userid">[];
};

async function get_or_create_identities(
	userid: string,
	identities: Omit<Identity, "id" | "userid">[] = [],
) {
	if (!identities.length) return [] as string[];

	const promises = identities.map((identity) =>
		prisma.identity.findFirst({
			where: { userid, type: identity.type, value: identity.value },
		}),
	);
	const completed = await Promise.all(promises);
	const ids: string[] = [];
	const need_creating: Omit<Identity, "id">[] = [];

	for (let i = 0; i < completed.length; i++) {
		const complete = completed[i];
		if (complete) {
			ids.push(complete.id);
			continue;
		}
		need_creating.push({ ...identities[i], userid });
	}

	if (need_creating.length) {
		const identityCount = await prisma.identity.count({ where: { userid } });
		const afterCreate = identityCount + need_creating.length;
		if (afterCreate > MAX_IDENTITIES) {
			throw new Error(
				`Connection limit reached. Maximum ${MAX_IDENTITIES} connections allowed to preserve the cheapest tier database.`,
			);
		}
		const created_ids = await prisma.identity.createManyAndReturn({
			data: need_creating,
		});
		created_ids.forEach((id) => ids.push(id.id));
	}

	return ids;
}

router.post("/add", async (req: any, res: any) => {
	const body: PostAccounts = req.body;
	if (!body || typeof body.name !== "string" || body.name.trim() === "") {
		return res.status(400).json({ error: "Field 'name' is required." });
	}
	if (body.identities && !Array.isArray(body.identities)) {
		return res.status(400).json({ error: "Field 'identities' must be an array." });
	}

	try {
		const user = await get_default_user();
		if (!user) {
			return res.status(500).json({ error: "Default user not found" });
		}
		const userid = user.id;

		const accountCount = await prisma.account.count({ where: { userid } });
		if (accountCount >= MAX_ACCOUNTS) {
			return res.status(403).json({
				error: "Account limit reached",
				message: `Maximum ${MAX_ACCOUNTS} accounts allowed to preserve the cheapest tier database.`,
				limit: MAX_ACCOUNTS,
			});
		}

		const existingAccount = await prisma.account.findFirst({
			where: {
				userid,
				name: body.name.trim(),
				username: body.username ?? null,
			},
		});
		if (existingAccount) {
			return res.status(409).json({
				error: "Account already exists",
				account: existingAccount,
			});
		}

		const identities = await get_or_create_identities(userid, body.identities ?? []);
		const account = await prisma.account.create({
			data: {
				name: body.name.trim(),
				username: body.username,
				categories: body.categories,
				notes: body.notes,
				userid,
			},
		});
		const connections = identities.map((identityId) => ({
			accountId: account.id,
			identityId,
		}));
		if (connections.length) {
			await prisma.connections.createMany({ data: connections });
		}

		return res.status(201).json({ message: "Account Created Successfully", account });
	} catch (error: any) {
		if (error?.message?.includes("limit")) {
			return res.status(403).json({
				error: "Connection limit reached",
				message: error.message,
				limit: MAX_IDENTITIES,
			});
		}
		console.error("Error creating account:", error);
		return res.status(500).json({ error: "Error creating account" });
	}
});

// PATCH /:id
// Updates an account's fields (name, username, notes, categories)
router.patch("/:id", async (req: any, res: any) => {
	const accountId = req.params.id;
	const { name, username, notes, categories } = req.body || {};

	if (!accountId) return res.status(400).json({ message: "Missing account id in params" });
	if (
		name === undefined &&
		username === undefined &&
		notes === undefined &&
		categories === undefined
	)
		return res.status(400).json({ message: "Provide at least one field to update" });

	if (name !== undefined && typeof name !== "string")
		return res.status(400).json({ message: "Field name must be a string" });
	if (username !== undefined && username !== null && typeof username !== "string")
		return res.status(400).json({ message: "Field username must be a string or null" });
	if (notes !== undefined && notes !== null && typeof notes !== "string")
		return res.status(400).json({ message: "Field notes must be a string or null" });
	if (categories !== undefined && !Array.isArray(categories))
		return res.status(400).json({ message: "Field categories must be an array" });

	try {
		const user = await get_default_user();
		if (!user) return res.status(500).json({ message: "Default user not found" });

		const existing = await prisma.account.findUnique({ where: { id: accountId } });
		if (!existing) return res.status(404).json({ message: "Account not found" });
		if (existing.userid !== user.id)
			return res.status(403).json({ message: "Account ownership mismatch" });

		const updateData: Partial<Account> = {};
		if (name !== undefined) updateData.name = String(name).trim();
		if (username !== undefined)
			updateData.username = username === null ? null : String(username).trim();
		if (notes !== undefined) updateData.notes = notes === null ? null : String(notes).trim();
		if (categories !== undefined) {
			const validEnumValues = ["GOOGLE"];
			const normalized = categories
				.map((cat: any) => String(cat).toUpperCase())
				.filter((cat: string) => validEnumValues.includes(cat));
			updateData.categories = normalized as any;
		}

		const candidateName = updateData.name ?? existing.name;
		const candidateUsername =
			updateData.username !== undefined ? updateData.username : (existing.username ?? null);
		const duplicate = await prisma.account.findFirst({
			where: {
				id: { not: existing.id },
				userid: user.id,
				name: candidateName,
				username: candidateUsername,
			},
		});
		if (duplicate) return res.status(409).json({ message: "Account already exists" });

		const updated = await prisma.account.update({
			where: { id: accountId },
			data: updateData,
		});

		return res.status(200).json({
			message: "Account updated",
			id: updated.id,
			name: updated.name,
			username: updated.username,
			notes: updated.notes,
			categories: updated.categories,
			userid: updated.userid,
		});
	} catch (error) {
		console.error("Error in PATCH /accounts/:id", error);
		return res.status(500).json({ message: "Error updating account" });
	}
});

async function delete_connections(accountId: string) {
	await prisma.connections.deleteMany({ where: { accountId } });
}

// DELETE /unlinked
// Deletes all accounts for the default user that have no connections
router.delete("/unlinked", async (_req: any, res: any) => {
	try {
		const user = await get_default_user();
		if (!user) return res.status(500).json({ message: "Default user not found" });

		const removed = await prisma.account.deleteMany({
			where: {
				userid: user.id,
				connections: { none: {} },
			},
		});

		return res.status(200).json({ message: "Unlinked accounts deleted", count: removed.count });
	} catch (error) {
		console.error("Error in DELETE /accounts/unlinked", error);
		return res.status(500).json({ message: "Error deleting unlinked accounts" });
	}
});

// DELETE /:id
// Deletes an account and its connections
router.delete("/:id", async (req: any, res: any) => {
	const accountId = req.params.id;
	if (!accountId) return res.status(400).json({ message: "Missing account id in params" });

	try {
		const user = await get_default_user();
		if (!user) return res.status(500).json({ message: "Default user not found" });

		const existing = await prisma.account.findUnique({ where: { id: accountId } });
		if (!existing) return res.status(404).json({ message: "Account not found" });
		if (existing.userid !== user.id)
			return res.status(403).json({ message: "Account ownership mismatch" });

		await delete_connections(accountId);
		await prisma.account.delete({ where: { id: accountId } });

		return res.status(200).json({ message: "Account deleted", id: accountId });
	} catch (error) {
		console.error("Error in DELETE /accounts/:id", error);
		return res.status(500).json({ message: "Error deleting account" });
	}
});


async function sanitizeAccount(req: any, res: any, next: any) {
    try {
        const payload = req.body;
        if (!Array.isArray(payload)) {
            return res.status(400).json({ error: "Request must be an array" });
        }

        const user = await get_default_user();
        if (!user) return res.status(500).json({ error: "User context missing" });
        const userid = user.id;

        const sanitized = payload.map((item: any, index: number) => {
            const rawName = String(item.name || "").trim();
            
            // Final check to prevent 'undefined' strings or empty names
            if (!rawName || rawName.toLowerCase() === "undefined") {
                throw new Error(`Row ${index + 1}: Service Name (URL) is missing.`);
            }

            return {
                name: rawName,
                username: item.username ? String(item.username).trim() : null,
                userid: userid,
                notes: null, // Hard-coded to null for safety
                categories: []
            };
        });

        req.sanitizedBody = sanitized;
        next();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

router.route("/bulk").post(sanitizeAccount, async (req: any, res: any) => {
    try {
        const user = await get_default_user();
        if (!user) return res.status(500).json({ error: "User context missing" });

        const currentCount = await prisma.account.count({ where: { userid: user.id } });
        const toCreate = req.sanitizedBody as { name: string; username: string | null; userid: string; notes: null; categories: never[] }[];
        const spaceLeft = Math.max(0, MAX_ACCOUNTS - currentCount);
        if (spaceLeft === 0) {
            return res.status(403).json({
                error: "Account limit reached",
                message: `Maximum ${MAX_ACCOUNTS} accounts allowed to preserve the cheapest tier database.`,
                limit: MAX_ACCOUNTS,
            });
        }
        const capped = toCreate.slice(0, spaceLeft);

        const result = await prisma.account.createMany({
            data: capped,
            skipDuplicates: true
        });

        const skipped = toCreate.length - capped.length;
        res.status(200).json({
            message: `Successfully created ${result.count} accounts.` +
                (skipped > 0 ? ` ${skipped} skipped (account limit).` : ""),
            count: result.count,
            limit: MAX_ACCOUNTS,
        });
    } catch (error) {
        console.error("Error in bulk create:", error);
        res.status(500).json({ error: "An error occurred while creating accounts." });
    }
});

export default router;
