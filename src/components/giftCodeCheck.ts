import { commandModule, CommandType } from "@sern/handler";
import { buildGiftCodeCheckerMessage } from "../utils/giftCodeChecker";

export default commandModule({
    name: "giftCodeCheck",
    description: "",
    type: CommandType.Button,
    execute: async (interaction, { deps }) => {
        const logger = deps["@sern/logger"];
        try {
            const giftCodes = (await deps["kingshot-api"].getGiftCodes()).data.giftCodes;
            await interaction.update(
                buildGiftCodeCheckerMessage(giftCodes, `Checked by ${interaction.user.displayName}`),
            );
        } catch (error) {
            logger?.error({
                message: `Gift code refresh button failed for Discord user ${interaction.user.id}: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            });

            const response = {
                content: "Could not refresh gift codes right now. Please try again later.",
                ephemeral: true,
            };
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp(response).catch((replyError: unknown) => {
                    logger?.error({
                        message: `Could not send gift code refresh error response: ${
                            replyError instanceof Error ? replyError.message : String(replyError)
                        }`,
                    });
                });
            } else {
                await interaction.reply(response).catch((replyError: unknown) => {
                    logger?.error({
                        message: `Could not send gift code refresh error response: ${
                            replyError instanceof Error ? replyError.message : String(replyError)
                        }`,
                    });
                });
            }
        }
    }
})