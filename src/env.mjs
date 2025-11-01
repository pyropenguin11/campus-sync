import { createEnv } from "@t3-oss/env-nextjs";

export const env = createEnv({
  server: {},
  client: {},
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
