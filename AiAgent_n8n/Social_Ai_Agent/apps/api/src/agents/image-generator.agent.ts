import fs from "node:fs";
import path from "node:path";
import { aiService } from "../services/ai.service.js";

export class ImageGeneratorAgent {
  async run(topic: string, category: string): Promise<{ imagePrompt: string; imagePath: string }> {
    const imagePrompt = await aiService.generateText(
      [
        "Create a single, high-quality image prompt for a LinkedIn cover image.",
        `Topic: ${topic}`,
        `Category: ${category}`,
        "Style: professional, AI-themed, modern, clean composition, strong typography areas, 16:9 format.",
        "Return only the prompt text."
      ].join("\n")
    );

    const { imagePath } = await aiService.generateImage(topic, imagePrompt);

    const absolute = path.resolve("apps/api/public", imagePath.replace(/^\//, ""));
    const dir = path.dirname(absolute);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Placeholder SVG keeps local workflow functional while external image API is optional.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="100%" height="100%" fill="#0b1020"/><text x="80" y="200" fill="#9ef7d7" font-size="56" font-family="Arial">contentForge</text><text x="80" y="300" fill="#ffffff" font-size="44" font-family="Arial">${topic.replace(/&/g, "&amp;")}</text><text x="80" y="380" fill="#cfd6ff" font-size="28" font-family="Arial">${category}</text></svg>`;
    fs.writeFileSync(absolute.replace(/\.txt$/, ".svg"), svg, "utf8");

    return { imagePrompt, imagePath: imagePath.replace(/\.txt$/, ".svg") };
  }
}

export const imageGeneratorAgent = new ImageGeneratorAgent();
