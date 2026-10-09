import { commandModule, CommandType } from "@sern/handler";
import { ApplicationCommandOptionType, ChannelType, NewsChannel, TextChannel } from "discord.js";
import { upsertGiftCodeCheckerMessage } from "../utils/giftCodeChecker";

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
                    type: ApplicationCommandOptionType.Channel,
                    channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
                    name: "channel",
                    description: "Select the channel for the gift code checker",
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
                        const channel = interaction.options.getChannel("channel") as TextChannel | NewsChannel | null;
                        if (!channel) {
                            await interaction.editReply(
                                "Select a text or announcement channel to enable the gift code checker.",
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
                message: `Start command failed for Discord user ${interaction.user.id}: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            });
            await interaction.editReply(
                "The command could not be completed due to a temporary error. Please try again later.",
            ).catch((replyError: unknown) => {
                logger?.error({
                    message: `Could not send start command error response: ${
                        replyError instanceof Error ? replyError.message : String(replyError)
                    }`,
                });
            });
        }
    }
});