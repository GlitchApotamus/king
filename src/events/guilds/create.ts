import { eventModule, EventType, Services } from "@sern/handler";
import { Events } from "discord.js";
import { PrismaClientError } from "../../prisma";

export default eventModule({
    name: Events.GuildCreate,
    type: EventType.Discord,
    execute: async (guild) => {
        const [logger, db] = Services("@sern/logger", "prisma-client");
        logger.info({ message: `Guild created: ${guild.name}` });
        await db.guild.create({
            data: {
                id: guild.id,
                name: guild.name,
            }
        }).catch((err: PrismaClientError) => {
            logger.error({ message: "Failed to create guild in the database: " + err.message });
        });
    }
});