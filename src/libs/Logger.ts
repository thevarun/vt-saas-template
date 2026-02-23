// NOTE(security): @logtail/pino@0.5.7 → @logtail/node → minimatch@9.0.5 has ReDoS (GHSA-3ppc-4f35-3m26).
// No upstream fix as of 2026-02-23. Risk is LOW: minimatch is used for log-level filtering,
// not on user-controlled input. Track: https://github.com/betterstack-community/logtail-node/issues
import logtail from '@logtail/pino';
import type { DestinationStream } from 'pino';
import pino from 'pino';
import pretty from 'pino-pretty';

import { Env } from './Env';

let stream: DestinationStream;

if (Env.LOGTAIL_SOURCE_TOKEN) {
  stream = pino.multistream([
    await logtail({
      sourceToken: Env.LOGTAIL_SOURCE_TOKEN,
      options: {
        sendLogsToBetterStack: true,
      },
    }),
    {
      stream: pretty(), // Prints logs to the console
    },
  ]);
} else {
  stream = pretty({
    colorize: true,
  });
}

export const logger = pino({ base: undefined }, stream);
