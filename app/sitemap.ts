import type { MetadataRoute } from "next";

const siteUrl = "https://goforeign.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/lifestyle`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/brand-ambassadors`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/brand-ambassadors/katherine`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
