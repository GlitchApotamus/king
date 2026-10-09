import { commandModule, CommandType } from "@sern/handler";
import { buildGiftCodeCheckerMessage } from "../utils/giftCodeChecker";

export default commandModule({
    name: "giftCodeCheck",
    description: "",
    type: CommandType.Button,
    execute: async (interaction, { deps }) => {
        const giftCodes = (await deps["kingshot-api"].getGiftCodes()).data.giftCodes;
        await interaction.update(
            buildGiftCodeCheckerMessage(giftCodes, `Checked by ${interaction.user.displayName}`),
        );
    }
})