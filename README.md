# How to use

Set `KINGSHOT_API_BASE_URL` in `.env` to the absolute API URL (defaults to
`https://kingshot.net/api`). Relative URLs such as `/api` only work in browsers
and cannot be used by this Node/Bun bot.

When the Docker container starts, it runs `prisma generate`, then `prisma db push`,
before starting the bot. Make sure `DATABASE_URL` is available in the container.
`db push` syncs the Prisma schema directly to the database on every startup;
for production deployments, use migrations when you need controlled schema changes.

## Using the bot in Discord

When King joins a server, it posts setup instructions in the server's system
channel, or the first text channel where it can view and send messages if the
system channel is unavailable. King needs View Channel, Send Messages, and
Embed Links permissions in the channel where it posts. The instructions are
formatted as a numbered list in an embed. King mentions the lowest-position,
non-managed role with the Manage Server permission. The role must be
mentionable, or King must have permission to mention roles, for Discord to
notify its members. If no qualifying role is available, the message is
addressed to server admins.
The welcome message can be deleted at any time and is automatically deleted
after 30 minutes.

To enable the gift-code checker, run `/start gift-code-checker` with
`enable: true` and select a channel. King needs View Channel, Send Messages,
and Embed Links permissions in that channel.

1.) Build
```bash
#not required
sern build
```
2.) Run
```bash
bun run db:gen
bun run db:push
bun run start
```