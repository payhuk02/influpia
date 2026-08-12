import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://influpia.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/brand", "/influencer", "/dashboard", "/messages", "/analytics", "/settings", "/onboarding", "/mock-checkout"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
