
import { GoogleGenAI } from "@google/genai";
import { LogoOptions } from "../types";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getClient = (apiKey?: string) => {
  // Priority: Argument > LocalStorage > internal fallback/env
  const key = apiKey || (typeof window !== 'undefined' ? localStorage.getItem("GEMINI_API_KEY") : undefined) || process.env.API_KEY;
  // Note: process.env.API_KEY might be defined by Vite
  return new GoogleGenAI({ apiKey: key });
};

export const generateEsportsLogo = async (options: LogoOptions, apiKey?: string, retryCount = 0): Promise<string> => {
  const ai = getClient(apiKey);

  const styleKeywords = {
    mascot: "aggressive vector mascot, thick bold contour, professional esports shading, animal head logo",
    minimalist: "ultra-clean vector icon, flat geometric design, modern minimalist aesthetic, simplified shapes",
    badge: "shield emblem, detailed crest, varsity championship badge, traditional sports shield",
    typography: "extreme stylized team lettering, sharp razor angles, custom esports font type",
    monogram: "professional interlocking letters, geometric initials, symmetrical typography design, luxury esports branding",
    cyber: "cyberpunk futuristic aesthetic, neon circuits, high-tech glitch effects, sci-fi geometric vectors",
    fantasy: "medieval rpg theme, ornate heraldry, magical glow, fantasy weaponry and scrolls, epic heraldic art",
    glossy: "3D render style, glossy plastic/metal finish, high-end highlights and shadows, mobile game logo style"
  };

  const selectedStyle = styleKeywords[options.style];
  const compositionPrompt = {
    head: "COMPOSITION: Close-up centered view. Focus on portrait/head.",
    body: "COMPOSITION: Dynamic action pose, full figure.",
    symbol: "COMPOSITION: Abstract centered icon, symmetrical balance.",
  }[options.composition || 'head'];

  const backgroundPrompt = options.noBackground
    ? "BACKGROUND: PURE SOLID WHITE (#FFFFFF). No textures, no shadows, no gradients."
    : "BACKGROUND: PURE SOLID PITCH BLACK (#000000).";

  const hasDescription = options.description && options.description.trim().length > 0;
  const textRules = hasDescription
    ? `TEXT CONSTRAINTS: You MUST write the text "${options.description}". The text should be part of the logo design. DO NOT write "${options.subject}".`
    : `TEXT CONSTRAINTS: ABSOLUTELY NO TEXT ALLOWED. Do not write any letters or words.`;

  const prompt = `
    TASK: Professional eSports Logo Design.
    SUBJECT: ${options.subject}
    STYLE: ${selectedStyle}
    THEME/COLORS: ${options.theme}
    ARTISTIC DETAILS: ${options.details}
    ${compositionPrompt}
    ${backgroundPrompt}
    ${textRules}
    TECHNICAL: 4K vector illustration aesthetic, sharp edges, professional gaming brand quality, high contrast.
  `;

  try {
    const isPro = options.model === 'gemini-3-pro-image-preview';

    const response = await ai.models.generateContent({
      model: options.model,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          ...(isPro ? { imageSize: options.resolution } : {}),
          aspectRatio: "1:1"
        },
        seed: options.seed
      },
    });

    const candidate = response.candidates?.[0];
    if (candidate?.finishReason === 'SAFETY') throw new Error("Bloqueado pelo filtro de segurança da IA. Tente outro tema.");

    const parts = candidate?.content?.parts;
    if (!parts) throw new Error("Resposta vazia do modelo.");

    for (const part of parts) {
      if (part.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Nenhuma imagem gerada nos dados da IA.");
  } catch (error: any) {
    if (error.message?.includes("429") && retryCount < 1) {
      await delay(2000);
      return generateEsportsLogo(options, apiKey, retryCount + 1);
    }
    throw error;
  }
};

export const generateLogoCollection = async (requests: LogoOptions[], apiKey?: string): Promise<string> => {
  const ai = getClient(apiKey);
  const count = requests.length;
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  const subjectsList = requests.map((r) => `- Unique ${r.subject}`).join('\n');
  const first = requests[0];
  const isPro = first.model === 'gemini-3-pro-image-preview';

  const prompt = `
    TASK: Create a UNIFIED COLLECTION SHEET (GRID) of eSports logos.
    GRID CONFIGURATION: ${cols} columns x ${rows} rows.
    ITEMS TO INCLUDE:
    ${subjectsList}
    
    CRITICAL CONSTRAINTS:
    - ABSOLUTELY NO TEXT: Do not include any labels, numbers, tags, or names inside the image.
    - NO CAPTIONS: Do not write "[LOGO #1]" or any other identifiers.
    - VISUAL ONLY: Each cell in the grid should contain ONLY the logo icon.
    - STYLE: Consistent ${first.style} esports aesthetic across all items.
    - BACKGROUND: ${first.noBackground ? "SOLID WHITE" : "SOLID BLACK"}.
    - CONSTRAINTS: NO REPETITIONS. Generate exactly ${count} distinct items without any surrounding text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: first.model,
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { ...(isPro ? { imageSize: first.resolution } : {}), aspectRatio: "1:1" } },
    });
    const data = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    if (!data) throw new Error("Falha ao gerar coleção.");
    return `data:image/png;base64,${data}`;
  } catch (error: any) { throw error; }
};

export const generateCharacterSheet = async (options: LogoOptions, apiKey?: string): Promise<string> => {
  const ai = getClient(apiKey);
  const isPro = options.model === 'gemini-3-pro-image-preview';

  // Logic to handle user-defined views or pose-only focus
  let viewInstruction = "";
  if (options.customViews && options.customViews.length > 0) {
    viewInstruction = `- ANGLES TO DRAW: ${options.customViews.join(', ')}. Render these visually but DO NOT WRITE THEIR NAMES.`;
  } else if (options.poseImage) {
    viewInstruction = `- DRAWING FOCUS: Use the physical pose from Reference 2 for all illustrations. Create multiple renders of the character in that exact pose from different distances/angles (zoom, full body, detail).`;
  } else {
    viewInstruction = `- DRAWING FOCUS: Multiple professional illustrations of the character.`;
  }

  const gridInfo = options.gridSize ? `GRID LAYOUT: Exactly ${options.gridSize} matrix layout.` : "GRID LAYOUT: Multiple instances on a single canvas.";

  const textPrompt = `
    TASK: Professional eSports Character Asset Pack (Visual Only).
    
    CRITICAL - NO TEXT POLICY:
    - PURE VISUALS: Do not include any letters, words, numbers, labels, titles, or characters from any alphabet.
    - NO HEADERS: No text like "Character Sheet", "VISTA FRONTAL", "FRONT", "SIDE", "LOGO", or any names.
    - CLEAN CANVAS: The entire image must contain only the character drawings and the solid background. 
    - If you are thinking of writing a label, DO NOT.

    ARTISTIC SPECIFICATIONS:
    - SUBJECT: ${options.subject}
    - STYLE: ${options.style} eSports character concept art.
    - THEME: ${options.theme}
    - DETAILS: ${options.details}
    - COHERENCE: The character must have 100% consistent gear, face, and colors across all panels.
    - ${gridInfo}
    ${viewInstruction}
    
    TECHNICAL:
    - Background: ${options.noBackground ? "SOLID PURE WHITE (#FFFFFF)" : "SOLID PITCH BLACK (#000000)"}.
    - Quality: High-contrast professional gaming aesthetic, clean vector-like lines.
  `;

  const parts: any[] = [{ text: textPrompt }];

  if (options.referenceImage) {
    const base64Data = options.referenceImage.split(',')[1] || options.referenceImage;
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: "image/png"
      }
    });
    parts[0].text += `
      
      [CHARACTER DESIGN SOURCE]: 
      - Use this image for character IDENTITY (Face, Hair, Gear, Armor, Colors).
      - Replicate this design exactly.
    `;
  }

  if (options.poseImage) {
    const base64Pose = options.poseImage.split(',')[1] || options.poseImage;
    parts.push({
      inlineData: {
        data: base64Pose,
        mimeType: "image/png"
      }
    });
    parts[0].text += `
      
      [POSE SOURCE - MANNEQUIN ONLY]:
      - Use ONLY the skeleton, posture, and physical stance of the body in this second image.
      - !!! MANDATORY !!!: IGNORE all clothes, accessories, hair, and items from this second image.
      - This image is a body-posture reference ONLY.
      - Apply the identity from the CHARACTER DESIGN SOURCE onto this body posture.
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: options.model,
      contents: { parts },
      config: {
        imageConfig: {
          ...(isPro ? { imageSize: options.resolution } : {}),
          aspectRatio: "1:1"
        }
      },
    });
    const data = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    if (!data) throw new Error("Falha ao gerar Character Sheet.");
    return `data:image/png;base64,${data}`;
  } catch (error: any) { throw error; }
};
