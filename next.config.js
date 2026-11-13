/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * The newsletter admin routes compose email bodies from the same markdown
   * the site is built from, so they read `_content/` at request time. Next
   * cannot trace a `fs.readFileSync(join(process.cwd(), ...))` call, so the
   * markdown has to be declared explicitly or it never ships with the lambda.
   */
  // Still under `experimental` on Next 14; it graduates to a top-level key in
  // Next 15, so this moves when the framework does.
  experimental: {
    outputFileTracingIncludes: {
      "/api/newsletter/admin/**": [
        "./src/app/blog/_content/**",
        "./src/app/poetry/_content/**",
      ],
    },
  },
};

module.exports = nextConfig;
