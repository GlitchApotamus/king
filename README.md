# How to use

Set `KINGSHOT_API_BASE_URL` in `.env` to the absolute API URL (defaults to
`https://kingshot.net/api`). Relative URLs such as `/api` only work in browsers
and cannot be used by this Node/Bun bot.

When the Docker container starts, it runs `prisma generate`, then `prisma db push`,
before starting the bot. Make sure `DATABASE_URL` is available in the container.
`db push` syncs the Prisma schema directly to the database on every startup;
for production deployments, use migrations when you need controlled schema changes.

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