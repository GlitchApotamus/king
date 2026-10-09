import 'dotenv/config'
import * as config from './config'
import { Client, GatewayIntentBits } from 'discord.js';
import { prisma } from './prisma';
import { Sern, makeDependencies } from '@sern/handler';
import { Publisher } from '@sern/publisher';
import { api } from './api';
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, //Make sure this is enabled for text commands!
    ],
});


/**
 * Where all of your dependencies are composed.
 * '@sern/client' is usually your Discord Client.
 * Use this function to access all of your dependencies.
 * This is used for external event modules as well
 */
await makeDependencies(({ add }) => {
    add('@sern/client', client);
    add('publisher', deps => new Publisher(
        deps['@sern/modules'],
        deps['@sern/emitter'],
        deps['@sern/logger']!
    ));
    add('kingshot-api', api);
    add('prisma-client', prisma);
});

//View docs for all options
Sern.init(config);

await client.login()
