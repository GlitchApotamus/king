import { eventModule, EventType, Services } from "@sern/handler";
import { Events } from "discord.js";
import { PrismaClientError } from "../../prisma";

export default eventModule({
    name: Events.GuildDelete,
    type: EventType.Discord,
    execute: async (guild) => {
        const [logger, db] = Services("@sern/logger", "prisma-client");
        logger.info({ message: `Guild deleted: ${guild.name}` });
        await db.guild.delete({
            where: {
                id: guild.id,
            }
        }).catch((err: PrismaClientError) => {
            logger.error({ message: "Failed to delete guild from the database: " + err.message });
        });
    }
});