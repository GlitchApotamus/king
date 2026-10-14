import { scheduledTask } from "@sern/handler";
import { ChannelType } from "discord.js";
import type { GiftCode } from "../api/types";
import { upsertGiftCodeCheckerMessage } from "../utils/giftCodeChecker";

export default scheduledTask({
    name: "giftCodeChecker",
    trigger: "0 * * * *", // Runs every hour
    execute: async (_, { deps }) => {
        const [kingshotApi, { guild: guildModel }, client] = [deps['kingshot-api'], deps['prisma-client'], deps['@sern/client']];
        const logger = deps["@sern/logger"];
        let giftCodes: GiftCode[];
        let guilds: Awaited<ReturnType<typeof guildModel.findMany>>;

        try {
            giftCodes = (await kingshotApi.getGiftCodes()).data.giftCodes;
            guilds = await guildModel.findMany();
        } catch (error) {
            logger?.error({
                message: `Gift code checker could not load codes or guilds: ${error instanceof Error ? error.message : String(error)
                    }`,
            });
            return;
        }

        for (const guild of guilds) {
            if (!guild.codeCheckerEnabled || !guild.codeCheckerChannelId) {
                continue;
            }
            try {
                const channel = await client.channels.fetch(guild.codeCheckerChannelId);
                if (!channel || (
                    channel.type !== ChannelType.GuildText
                    && channel.type !== ChannelType.GuildAnnouncement
                )) {
                    continue;
                }
                const message = await upsertGiftCodeCheckerMessage(
                    channel,
                    giftCodes,
                    guild.codeCheckerMessageId,
                );
                if (message.id !== guild.codeCheckerMessageId) {
                    await guildModel.update({
                        where: { id: guild.id },
                        data: { codeCheckerMessageId: message.id },
                    });
                }
            } catch (error) {
                logger?.error({
                    message: `Gift code checker failed for guild ${guild.id}: ${error instanceof Error ? error.message : String(error)
                        }`,
                });
            }
        }
    }
});