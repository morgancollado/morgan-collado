/**
 * Sends one post to its subscribers. Run by .github/workflows/newsletter.yml;
 * it can also be run locally with the same variables in the environment:
 *
 *   NEWSLETTER_KIND=poetry NEWSLETTER_SLUG=Lioness NEWSLETTER_DRY_RUN=true \
 *     npm run newsletter:send
 *
 * vite-node runs it so the `@/` imports resolve the same way they do in the
 * app and the tests.
 */
import { runFromEnv } from "@/lib/newsletter/send-cli";

process.exitCode = await runFromEnv(process.env);
