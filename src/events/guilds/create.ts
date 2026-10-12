import { eventModule, EventType, Services } from "@sern/handler";
import { ChannelType, Events, PermissionsBitField } from "discord.js";
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

        const botMember = guild.members.me;
        if (!botMember) {
            logger.info({
                message: `Could not send setup instructions in ${guild.name}: bot member is unavailable.`,
            });
            return;
        }

        const sendPermissions = [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
        ];
        const systemChannel = guild.systemChannel;
        const canSendTo = (channel: typeof systemChannel) =>
            channel?.permissionsFor(botMember)?.has(sendPermissions) ?? false;
        const fallbackChannel = guild.channels.cache
            .filter((channel) => (
                channel.type === ChannelType.GuildText
                || channel.type === ChannelType.GuildAnnouncement
            ))
            .sort((a, b) => a.rawPosition - b.rawPosition || a.id.localeCompare(b.id))
            .find((channel) => channel.permissionsFor(botMember)?.has(sendPermissions));
        const channel = canSendTo(systemChannel) ? systemChannel : fallbackChannel;

        if (!channel) {
            logger.info({
                message: `Could not send setup instructions in ${guild.name}: no text channel is available with View Channel and Send Messages permissions.`,
            });
            return;
        }

        const channelPermissions = channel.permissionsFor(botMember);
        const managerRole = guild.roles.cache
            .filter((role) => role.id !== guild.id && !role.managed)
            .filter((role) => role.permissions.has(PermissionsBitField.Flags.ManageGuild))
            .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
            .first();
        const canMentionRole = managerRole
            && (managerRole.mentionable
                || channelPermissions.has(PermissionsBitField.Flags.MentionEveryone));

        const roleAddress = managerRole
            ? canMentionRole
                ? `<@&${managerRole.id}>`
                : `**${managerRole.name}**`
            : "Server admins";
        const command = "</start gift-code-checker:1558244004917805118>";
        const message = managerRole && !canMentionRole
            ? `Thanks for adding King! ${roleAddress}, please run ${command} with \`enable: true\` and choose a channel to get started. I need View Channel, Send Messages, and Embed Links there. I couldn't notify the role directly because it isn't mentionable.`
            : `Thanks for adding King! ${roleAddress}, run ${command} with \`enable: true\` and choose a channel to get started. I need View Channel, Send Messages, and Embed Links there.`;

        await channel.send({
            content: message,
            allowedMentions: {
                roles: canMentionRole && managerRole ? [managerRole.id] : [],
            },
        }).catch((err: Error) => {
            logger.error({
                message: `Failed to send setup instructions in ${guild.name}: ${err.message}`,
            });
        });
    }
});