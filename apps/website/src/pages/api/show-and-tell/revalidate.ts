import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "@/env/server.mjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check for secret to confirm this is a valid request
  if (req.query.secret !== env.ACTION_API_SECRET) {
    return res.status(401).json({ message: "Invalid token" });
  }

  try {
    // revalidate index page
    await res.revalidate("/show-and-tell");

    // revalidate individual post page if postId is provided
    if (req.query.postId) {
      await res.revalidate(`/show-and-tell/posts/${req.query.postId}`);
    }

    return res.json({ revalidated: true });
  } catch (err) {
    console.error("Error revalidating show and tell posts", err);
  }

  return res.status(500).send("Error revalidating");
}