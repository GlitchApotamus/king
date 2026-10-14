import { commandModule, CommandType } from "@sern/handler";
import { buildGiftCodeCheckerMessage } from "../utils/giftCodeChecker";
import { t } from "../utils/translator";

export default commandModule({
    name: "translateMessage",
    description: "",
    type: CommandType.Button,
    execute: async (interaction, { deps }) => {
        const logger = deps["@sern/logger"];
        try {
            const giftCodes = (await deps["kingshot-api"].getGiftCodes()).data.giftCodes;
            const message = buildGiftCodeCheckerMessage(
                giftCodes,
                await t(`checked_by: ${interaction.user.displayName}`, interaction.locale),
            );
            await interaction.reply({
                ...message,
                content: message.content ?? undefined,
                flags: 64,
            });
        } catch (error) {
            logger?.error({
                message: `Gift code refresh button failed for Discord user ${interaction.user.id}: ${error instanceof Error ? error.message : String(error)
                    }`,
            });

            const response = {
                content: await t("refresh_error", interaction.locale),
                ephemeral: true,
            };
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp(response).catch((replyError: unknown) => {
                    logger?.error({
                        message: `Could not send gift code refresh error response: ${replyError instanceof Error ? replyError.message : String(replyError)
                            }`,
                    });
                });
            } else {
                await interaction.reply(response).catch((replyError: unknown) => {
                    logger?.error({
                        message: `Could not send gift code refresh error response: ${replyError instanceof Error ? replyError.message : String(replyError)
                            }`,
                    });
                });
            }
        }
    }
})