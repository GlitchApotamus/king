import { eventModule, EventType, Services } from "@sern/handler";
import { Events } from "discord.js";
import type { PrismaClientError } from "../../prisma";

export default eventModule({
    name: Events.ClientReady,
    type: EventType.Discord,
    execute: async (client) => {
        const [logger, db] = Services("@sern/logger", "prisma-client");
        logger.info({ message: `Client is ready! Logged in as ${client.user.tag}` });
        db.$connect().then(async () => {
            logger.info({ message: "Database connection established." });
            const dbGuilds = await db.guild.findMany();
            for (const guild of client.guilds.cache.values()) {
                if (!dbGuilds.some(dbGuild => dbGuild.id === guild.id)) {
                    await db.guild.create({
                        data: {
                            id: guild.id,
                            name: guild.name,
                        }
                    });
                }
            }
        }).catch((err: PrismaClientError) => {
            logger.error({ message: "Failed to connect to the database: " + err.message });
        });
    }
})