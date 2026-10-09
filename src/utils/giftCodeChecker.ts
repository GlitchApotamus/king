import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    NewsChannel,
    type MessageEditOptions,
    TextChannel,
} from "discord.js";
import type { GiftCode } from "../api/types";

export function buildGiftCodeCheckerMessage(
    giftCodes: GiftCode[],
    footerText?: string,
): MessageEditOptions {
    const embed = new EmbedBuilder()
        .setTitle("Current Gift Codes")
        .setDescription("Here are the current gift codes.")
        .setColor(0x00FF00)
        .setTimestamp();

    embed.addFields({
        name: "Gift Codes",
        value: giftCodes.length
            ? giftCodes.map((giftCode) => {
                const expiration = giftCode.expiresAt
                    ? `<t:${Math.floor(new Date(giftCode.expiresAt).getTime() / 1000)}:F>`
                    : "No expiration";
                return `**${giftCode.code}** — Expires: ${expiration}`;
            }).join("\n")
            : "No gift codes available",
        inline: false,
    });

    if (footerText) {
        embed.setFooter({ text: footerText });
    }

    const button = new ButtonBuilder()
        .setCustomId("giftCodeCheck")
        .setLabel("Check for New Gift Codes")
        .setStyle(ButtonStyle.Primary);
    const components = [
        new ActionRowBuilder<ButtonBuilder>().addComponents(button),
    ];

    return { embeds: [embed], components };
}

function isUnknownMessageError(error: unknown): boolean {
    return typeof error === "object"
        && error !== null
        && "code" in error
        && error.code === 10008;
}

export async function upsertGiftCodeCheckerMessage(
    channel: TextChannel | NewsChannel,
    giftCodes: GiftCode[],
    messageId?: string | null,
) {
    const messageOptions = buildGiftCodeCheckerMessage(giftCodes);

    if (messageId) {
        try {
            const message = await channel.messages.fetch(messageId);
            return message.edit(messageOptions);
        } catch (error) {
            if (!isUnknownMessageError(error)) {
                throw error;
            }
        }
    }

    return channel.send({
        embeds: messageOptions.embeds,
        components: messageOptions.components,
    });
}
