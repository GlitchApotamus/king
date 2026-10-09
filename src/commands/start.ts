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
                    })
                    await interaction.reply({ content: "Gift code checker has been disabled.", flags: 64 });
                } else {
                    const channel = interaction.options.getChannel("channel") as TextChannel | NewsChannel;
                    if (!channel) {
                        await interaction.reply({
                            content: "Select a text or announcement channel to enable the gift code checker.",
                            flags: 64,
                        });
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
        }
        await subs[subcommand]();

    }
});