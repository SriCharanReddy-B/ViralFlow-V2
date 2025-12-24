
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { VideoAnalysis, GroundingSource } from "../types";

export class ViralFlowService {
  private cleanJsonResponse(text: string): string {
    // Remove markdown code blocks if present
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");
    }
    return cleaned;
  }

  /**
   * Helper to execute API calls with exponential backoff retry logic.
   * This is crucial for handling 429 (Resource Exhausted) errors common with high-volume visual tasks.
   */
  private async withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    let lastError: any;
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        const isQuotaError = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
        const is5xxError = err.message?.includes('500') || err.message?.includes('503');

        if (i < maxRetries && (isQuotaError || is5xxError)) {
          // Exponential backoff: 2s, 4s, 8s...
          const delay = Math.pow(2, i + 1) * 1000;
          console.warn(`Gemini API Quota/Server Error. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  async analyzeVideo(videoBase64: string, mimeType: string, vibe?: string): Promise<VideoAnalysis> {
    return this.withRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = 'gemini-3-flash-preview';
      
      const vibeContext = vibe ? `
        USER CREATIVE VIBE: "${vibe}"
        When generating titles, hooks, and thumbnail styles, lean HEAVILY into this vibe. 
      ` : "Standard high-virality optimization.";

      const prompt = `
        Analyze this video for virality.
        ${vibeContext}
        
        Use Google Search to cross-reference current web trends and viral patterns.
        
        CRITICAL: You MUST return a valid, compact JSON object. 
        Ensure all strings are properly escaped. Do not include any trailing commas.
        
        Provide a JSON response with:
        - 'summary': High-level summary (max 200 words).
        - 'targetAudience': Who is watching this? (short string)
        - 'viralityHook': A scroll-stopping hook (one sentence).
        - 'primaryTrendingTitle': SEO-crushing title (max 70 chars).
        - 'optimizedDescription': Description with timestamps and tags (concise).
        - 'trendingContext': Why this matters right now on the web (max 100 words).
        - 'keyMoments': Array of exactly 5 high-impact moments.
        - 'suggestedTags': List of 10 trending tags.
        - 'thumbnailMoments': Array of exactly 4 high-potential moments for thumbnails.
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: [{ parts: [{ inlineData: { data: videoBase64, mimeType } }, { text: prompt }] }],
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
              viralityHook: { type: Type.STRING },
              primaryTrendingTitle: { type: Type.STRING },
              optimizedDescription: { type: Type.STRING },
              trendingContext: { type: Type.STRING },
              keyMoments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    timestamp: { type: Type.STRING },
                    description: { type: Type.STRING },
                    viralScore: { type: Type.NUMBER }
                  },
                  required: ["timestamp", "description", "viralScore"]
                }
              },
              suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } },
              thumbnailMoments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    seconds: { type: Type.NUMBER },
                    timestamp: { type: Type.STRING },
                    emotion: { type: Type.STRING },
                    prompt: { type: Type.STRING },
                    suggestedText: { type: Type.STRING },
                    fontStyle: { type: Type.STRING },
                    linkedTitle: { type: Type.STRING }
                  },
                  required: ["seconds", "timestamp", "emotion", "prompt", "suggestedText", "fontStyle", "linkedTitle"]
                }
              }
            },
            required: ["summary", "targetAudience", "viralityHook", "primaryTrendingTitle", "optimizedDescription", "trendingContext", "keyMoments", "suggestedTags", "thumbnailMoments"]
          }
        }
      });

      const cleanedText = this.cleanJsonResponse(response.text || "");
      if (!cleanedText) {
        throw new Error("Model returned empty response.");
      }

      const data = JSON.parse(cleanedText);
      
      const sources: GroundingSource[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web) sources.push({ title: chunk.web.title || 'Source', uri: chunk.web.uri });
        });
      }
      return { ...data, sources };
    });
  }

  async enhanceFrame(
    frameBase64: string, 
    prompt: string, 
    text: string, 
    fontStyle: string, 
    emotion: string, 
    vibe?: string
  ): Promise<string> {
    return this.withRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = 'gemini-2.5-flash-image';
      
      const base64Data = frameBase64.includes(',') ? frameBase64.split(',')[1] : frameBase64;

      const creativeDirection = vibe ? `
        CREATIVE DIRECTION: "${vibe}"
        Transform this raw frame into a professional, high-impact thumbnail that embodies this mood. 
        - Adjust color grading.
        - Enhance subject lighting.
        - Add professional depth of field.
        - Place the text "${text}" with the style "${fontStyle}".
      ` : "Create a professional high-impact YouTube thumbnail.";

      const fullPrompt = `
        ${creativeDirection}
        EMOTIONAL CORE: ${emotion}
        TECHNICAL NOTES: ${prompt}
        
        The result should look like a human graphic designer carefully composed it for maximum CTR.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: { 
          parts: [
            { 
              inlineData: { 
                data: base64Data, 
                mimeType: 'image/jpeg'
              } 
            }, 
            { text: fullPrompt }
          ] 
        },
        config: { 
          imageConfig: { 
            aspectRatio: "16:9"
          } 
        }
      });

      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      
      throw new Error("No image data returned in the response.");
    });
  }
}

export const geminiService = new ViralFlowService();
