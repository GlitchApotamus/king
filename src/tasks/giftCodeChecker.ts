import { scheduledTask } from "@sern/handler";
import { ChannelType } from "discord.js";
import { upsertGiftCodeCheckerMessage } from "../utils/giftCodeChecker";

export default scheduledTask({
    name: "giftCodeChecker",
    trigger: "0 0,3,6,9,12,15,18,21 * * *", // Runs every 3 hours
    execute: async (_, { deps }) => {
        const [kingshotApi, { guild: guildModel }, client] = [deps['kingshot-api'], deps['prisma-client'], deps['@sern/client']];
        const giftCodes = (await kingshotApi.getGiftCodes()).data.giftCodes;
        const guilds = await guildModel.findMany();
        for (const guild of guilds) {
            if (!guild.codeCheckerEnabled || !guild.codeCheckerChannelId) {
                continue;
            }
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
        }

    }
});