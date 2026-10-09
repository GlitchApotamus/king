import { commandModule, CommandType } from "@sern/handler";
import { ApplicationCommandOptionType } from "discord.js";

export default commandModule({
    name: "link-account",
    description: "Link a Kingshot game account to your Discord account",
    type: CommandType.Slash,
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: "player-id",
            description: "Your Kingshot player ID",
            required: true,
        },
    ],
    execute: async ({ interaction }, { deps }) => {
        const playerId = interaction.options.getString("player-id", true).trim();
        const prisma = deps["prisma-client"];
        const kingshotApi = deps["kingshot-api"];
        const logger = deps["@sern/logger"];

        await interaction.deferReply({ flags: 64 });

        try {
            const player = (await kingshotApi.getPlayerInfo(playerId)).data;
            const result = await prisma.$transaction(async (transaction) => {
                const existingAccount = await transaction.account.findUnique({
                    where: { id: player.playerId },
                });

                if (existingAccount?.userId && existingAccount.userId !== interaction.user.id) {
                    return "linked-to-another-user" as const;
                }

                await transaction.user.upsert({
                    where: { id: interaction.user.id },
                    update: { username: interaction.user.username },
                    create: {
                        id: interaction.user.id,
                        username: interaction.user.username,
                    },
                });

                await transaction.account.upsert({
                    where: { id: player.playerId },
                    update: {
                        playerName: player.name,
                        userId: interaction.user.id,
                    },
                    create: {
                        id: player.playerId,
                        playerName: player.name,
                        userId: interaction.user.id,
                    },
                });

                return "linked" as const;
            });

            if (result === "linked-to-another-user") {
                await interaction.editReply("That game account is already linked to another Discord account.");
                return;
            }

            await interaction.editReply(
                `Linked **${player.name}** (player ID: \`${player.playerId}\`) to your Discord account.`,
            );
        } catch (error) {
            logger?.error({
                message: `Failed to link game account for Discord user ${interaction.user.id}: ${error instanceof Error ? error.message : String(error)
                    }`,
            });
            await interaction.editReply(
                "Could not link that game account. Check the player ID and try again.",
            );
        }
    },
});
