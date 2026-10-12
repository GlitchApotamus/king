import { eventModule, EventType, Services } from "@sern/handler";
import {
    ChannelType,
    DiscordAPIError,
    EmbedBuilder,
    Events,
    PermissionsBitField,
} from "discord.js";
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
            PermissionsBitField.Flags.EmbedLinks,
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
                message: `Could not send setup instructions in ${guild.name}: no text channel is available with View Channel, Send Messages, and Embed Links permissions.`,
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
        const embed = new EmbedBuilder()
            .setTitle("Getting started with King")
            .setDescription([
                "1. Run the command below with `enable: true`.",
                "2. Choose the channel where the gift-code checker should post.",
                "3. Make sure King has View Channel, Send Messages, and Embed Links permissions in that channel.",
                "",
                managerRole && !canMentionRole
                    ? "The role was named but could not be notified directly because it isn't mentionable."
                    : null,
            ].filter(Boolean).join("\n"))
            .addFields({
                name: "Command",
                value: command,
            })
            .setFooter({
                text: "You can safely delete this message at any time, or wait for it to be deleted automatically after 30 minutes.",
            });

        const welcomeMessage = await channel.send({
            content: `Thanks for adding King! ${roleAddress}`,
            embeds: [embed],
            allowedMentions: {
                roles: canMentionRole && managerRole ? [managerRole.id] : [],
            },
        }).catch((err: Error) => {
            logger.error({
                message: `Failed to send setup instructions in ${guild.name}: ${err.message}`,
            });
        });
        if (!welcomeMessage) return;

        setTimeout(() => {
            void welcomeMessage.delete().catch((err: Error) => {
                if (err instanceof DiscordAPIError && err.code === 10008) return;
                logger.error({
                    message: `Failed to delete setup instructions in ${guild.name}: ${err.message}`,
                });
            });
        }, 30 * 60 * 1000);
    }
});