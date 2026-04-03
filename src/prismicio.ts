import * as prismic from "@prismicio/client";

export const repositoryName =
  process.env.NEXT_PUBLIC_PRISMIC_REPOSITORY || "st-godard-vtour";

export const client = prismic.createClient(repositoryName, {
  accessToken: process.env.PRISMIC_ACCESS_TOKEN,
});
