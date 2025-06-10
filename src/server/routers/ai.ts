import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/trpc";
import { openai, isAIAvailable, AIServiceError } from "@/lib/ai/openai-client";

export const aiRouter = createTRPCRouter({
  generateClipCopy: publicProcedure
    .input(z.object({ 
      videoContext: z.string().min(1, "Video context is required"),
      targetAudience: z.string().optional(),
      platform: z.enum(["youtube", "tiktok", "instagram", "twitter", "general"]).default("general"),
      tone: z.enum(["professional", "casual", "energetic", "funny", "inspirational"]).default("casual"),
      clipCount: z.number().min(1).max(5).default(1)
    }))
    .mutation(async ({ input }) => {
      console.log("[AI-ROUTER] Generating clip copy for:", input.videoContext);

      // Check if AI is available
      if (!isAIAvailable()) {
        throw new AIServiceError("AI service is not available. Please configure OPENAI_API_KEY.", "MISSING_API_KEY");
      }

      try {
        const client = openai();
        
        // Create a detailed prompt for clip copy generation
        const prompt = `Generate engaging social media content for a video clip with the following context:

Video Context: ${input.videoContext}
Target Platform: ${input.platform}
Target Audience: ${input.targetAudience || "General audience"}
Tone: ${input.tone}
Number of clips needed: ${input.clipCount}

Please provide:
1. ${input.clipCount} compelling title${input.clipCount > 1 ? 's' : ''} (under 100 characters each)
2. ${input.clipCount} engaging description${input.clipCount > 1 ? 's' : ''} (under 2200 characters each, optimized for ${input.platform})
3. 10-15 relevant hashtags for ${input.platform}
4. 3-5 content ideas or hooks to make the clip more engaging

Format the response as JSON with the following structure:
{
  "titles": ["title1", "title2", ...],
  "descriptions": ["description1", "description2", ...],
  "hashtags": ["#hashtag1", "#hashtag2", ...],
  "ideas": ["idea1", "idea2", ...]
}`;

        const completion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system", 
              content: "You are an expert social media content creator who specializes in creating viral, engaging content for video clips. Always respond with valid JSON only."
            },
            {
              role: "user", 
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7,
        });

        const responseContent = completion.choices[0]?.message?.content;
        if (!responseContent) {
          throw new AIServiceError("No response from AI service", "EMPTY_RESPONSE");
        }

        // Parse the JSON response
        let aiResponse;
        try {
          aiResponse = JSON.parse(responseContent);
        } catch {
          console.error("[AI-ROUTER] Failed to parse AI response:", responseContent);
          // Fallback response if JSON parsing fails
          aiResponse = {
            titles: [`Engaging ${input.platform} clip from your video`],
            descriptions: [`Check out this amazing moment! Perfect for ${input.targetAudience || "your audience"} with a ${input.tone} vibe.`],
            hashtags: ["#viral", "#content", "#video", "#clips", `#${input.platform}`],
            ideas: ["Add compelling opening hook", "Include call-to-action", "Use trending music"]
          };
        }

        console.log("[AI-ROUTER] Successfully generated AI content");
        return {
          success: true,
          data: {
            titles: aiResponse.titles || [],
            descriptions: aiResponse.descriptions || [],
            hashtags: aiResponse.hashtags || [],
            ideas: aiResponse.ideas || [],
            platform: input.platform,
            tone: input.tone
          }
        };

      } catch (error) {
        console.error("[AI-ROUTER] Error generating clip copy:", error);
        
        if (error instanceof AIServiceError) {
          throw error;
        }

        throw new AIServiceError(
          `Failed to generate clip copy: ${error instanceof Error ? error.message : 'Unknown error'}`,
          "GENERATION_FAILED"
        );
      }
    }),
});

export type AiRouter = typeof aiRouter;
