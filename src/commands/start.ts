import { commandModule, CommandType } from "@sern/handler";
import {
    ApplicationCommandOptionType,
    ChannelType,
    PermissionsBitField,
} from "discord.js";
import { upsertGiftCodeCheckerMessage } from "../utils/giftCodeChecker";

const giftCodeChannelPermissions = [
    PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.EmbedLinks,
];

export default commandModule({
    name: "start",
    description: "Start the bot",
    type: CommandType.Slash,
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "gift-code-checker",
            description: "Check for new gift codes",
            options: [
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: "enable",
                    description: "Enable or disable the gift code checker",
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: "channel",
                    description: "Select the channel for the gift code checker",
                    autocomplete: true,
                    command: {
                        execute: async (autocomplete) => {
                            const guild = autocomplete.guild;
                            const botMember = guild?.members.me;
                            if (!guild || !botMember) {
                                await autocomplete.respond([]);
                                return;
                            }

                            const focused = autocomplete.options.getFocused().toLowerCase();
                            const choices = guild.channels.cache
                                .filter((channel) => (
                                    channel.type === ChannelType.GuildText
                                    || channel.type === ChannelType.GuildAnnouncement
                                ))
                                .filter((channel) => (
                                    channel.permissionsFor(botMember)?.has(giftCodeChannelPermissions) ?? false
                                ))
                                .filter((channel) => channel.name.toLowerCase().includes(focused))
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .first(25)
                                .map((channel) => ({
                                    name: `#${channel.name}`.slice(0, 100),
                                    value: channel.id,
                                }));

                            await autocomplete.respond(choices);
                        },
                    },
                }
            ]
        }
    ],
    execute: async ({ interaction }, { deps }) => {
        const [prisma, kingshotApi] = [deps['prisma-client'], deps['kingshot-api']];
        const logger = deps["@sern/logger"];

        try {
            await interaction.deferReply({ flags: 64 });
            const subcommand = interaction.options.getSubcommand() as "gift-code-checker";

            const subs = {
                "gift-code-checker": async () => {
                    const enable = interaction.options.getBoolean("enable") as boolean;

                    if (!enable) {
                        await prisma.guild.update({
                            where: {
                                id: interaction.guildId!,
                            },
                            data: {
                                codeCheckerEnabled: false,
                                codeCheckerChannelId: null,
                                codeCheckerMessageId: null,
                            },
                        });
                        await interaction.editReply("Gift code checker has been disabled.");
                    } else {
                        const channelId = interaction.options.getString("channel", true);
                        const channel = await interaction.guild?.channels.fetch(channelId);
                        const botMember = interaction.guild?.members.me;
                        if (
                            !channel
                            || !botMember
                            || (channel.type !== ChannelType.GuildText
                                && channel.type !== ChannelType.GuildAnnouncement)
                        ) {
                            await interaction.editReply(
                                "Select an available text or announcement channel from the autocomplete list.",
                            );
                            return;
                        }

                        const permissions = channel.permissionsFor(botMember);
                        if (!permissions?.has(giftCodeChannelPermissions)) {
                            await interaction.editReply(
                                "I need View Channel, Send Messages, and Embed Links permissions in that channel.",
                            );
                            return;
                        }

                        const giftCodes = (await kingshotApi.getGiftCodes()).data.giftCodes;
                        const currentGuild = await prisma.guild.findUnique({
                            where: { id: interaction.guildId! },
                            select: {
                                codeCheckerChannelId: true,
                                codeCheckerMessageId: true,
                            },
                        });
                        const existingMessageId = currentGuild?.codeCheckerChannelId === channel.id
                            ? currentGuild.codeCheckerMessageId
                            : null;
                        const message = await upsertGiftCodeCheckerMessage(
                            channel,
                            giftCodes,
                            existingMessageId,
                        );

                        await prisma.guild.update({
                            where: {
                                id: interaction.guildId!,
                            },
                            data: {
                                codeCheckerEnabled: true,
                                codeCheckerChannelId: channel.id,
                                codeCheckerMessageId: message.id,
                            },
                        });
                        await interaction.editReply("Gift code checker has been enabled.");
                    }
                }
            };
            await subs[subcommand]();
        } catch (error) {
            logger?.error({
                message: `Start command failed for Discord user ${interaction.user.id}: ${error instanceof Error ? error.message : String(error)
                    }`,
            });
            await interaction.editReply(
                "The command could not be completed due to a temporary error. Please try again later. Make sure I have the necessary permissions for the channel.",
            ).catch((replyError: unknown) => {
                logger?.error({
                    message: `Could not send start command error response: ${replyError instanceof Error ? replyError.message : String(replyError)
                        }`,
                });
            });
        }
    }
});