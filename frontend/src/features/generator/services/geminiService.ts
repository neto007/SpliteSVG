
import { GoogleGenAI } from "@google/genai";
import { LogoOptions } from "../../../types";

import { getStylePrompts } from "./promptService";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getClient = (apiKey?: string) => {
  // Priority: Argument > LocalStorage > internal fallback/env
  const key = apiKey || (typeof window !== 'undefined' ? localStorage.getItem("GEMINI_API_KEY") : undefined) || process.env.API_KEY;
  // Note: process.env.API_KEY might be defined by Vite
  return new GoogleGenAI({ apiKey: key });
};

export const generateEsportsLogo = async (options: LogoOptions, apiKey?: string, retryCount = 0): Promise<string> => {
  const ai = getClient(apiKey);

  const styleKeywords = getStylePrompts();

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

  const subjectsList = requests.map((r) => {
    let item = `- Unique ${r.subject}`;
    if (r.description && r.description.trim().length > 0) {
      item += ` (MUST WRITE TEXT: "${r.description}")`;
    }
    return item;
  }).join('\n');
  const first = requests[0];
  const isPro = first.model === 'gemini-3-pro-image-preview';

  const prompt = `
    TASK: Create a UNIFIED COLLECTION SHEET (GRID) of eSports logos.
    GRID CONFIGURATION: ${cols} columns x ${rows} rows.
    ITEMS TO INCLUDE:
    ${subjectsList}
    
    CRITICAL CONSTRAINTS:
    - IMAGE ONLY: Do not write labels like "Logo 1", "Fig A".
    - TEXT HANDLING: If a specific text is requested in the item description, YOU MUST WRITE IT inside the logo. If no text is requested, DO NOT write anything.
    - VISUAL ONLY: Each cell in the grid should contain ONLY the logo icon.
    - STYLE: Consistent ${first.style} esports aesthetic across all items.
    - BACKGROUND: ${first.noBackground ? "SOLID WHITE" : "SOLID BLACK"}.
    - CONSTRAINTS: NO REPETITIONS. Generate exactly ${count} distinct items.
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

  const isSingleView = options.gridSize === '1x1';

  // Logic to handle user-defined views or pose-only focus
  let viewInstruction = "";
  if (isSingleView) {
    viewInstruction = `- DRAWING FOCUS: SINGLE FULL-BODY MASTERPIECE. Do not create a grid. Do not show multiple angles. Just ONE perfect character render.`;
    if (options.poseImage) viewInstruction += " Match the pose from Reference 2 exactly.";
  } else if (options.customViews && options.customViews.length > 0) {
    viewInstruction = `- ANGLES TO DRAW: ${options.customViews.join(', ')}. Render these visually but DO NOT WRITE THEIR NAMES.`;
  } else if (options.poseImage) {
    viewInstruction = `- DRAWING FOCUS: Use the physical pose from Reference 2 for all illustrations. Create multiple renders of the character in that exact pose from different distances/angles (zoom, full body, detail).`;
  } else {
    viewInstruction = `- DRAWING FOCUS: Multiple professional illustrations of the character.`;
  }

  const gridInfo = isSingleView
    ? "GRID LAYOUT: NONE. Single massive character render. Center the character."
    : (options.gridSize ? `GRID LAYOUT: Exactly ${options.gridSize} matrix layout.` : "GRID LAYOUT: Multiple instances on a single canvas.");

  const textPrompt = `
    TASK: Professional eSports Character Asset Pack (Visual Only).
    
    CRITICAL - NO TEXT POLICY:
    - PURE VISUALS: Do not include any letters, words, numbers, labels, titles, or characters from any alphabet.
    - NO HEADERS: No text like "Character Sheet", "VISTA FRONTAL", "FRONT", "SIDE", "LOGO", or any names.
    - CLEAN CANVAS: The entire image must contain only the character drawings and the solid background. 
    - If you are thinking of writing a label, DO NOT.
    - IGNORE STYLE OF POSE REFERENCE: If a pose reference is provided, use ONLY its structure. Do not copy its colors, lighting, or art style.

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
    let mimeType = "image/png";
    let data = options.referenceImage;
    if (options.referenceImage.includes(',')) {
      const [header, base64Data] = options.referenceImage.split(',');
      mimeType = header.match(/:(.*?);/)?.[1] || "image/png";
      data = base64Data.replace(/\s/g, '');
    }

    parts.push({
      inlineData: {
        data: data,
        mimeType: mimeType
      }
    });
    parts[0].text += `
      
      [MASTER VISUAL AUTHORITY - CHARACTER DESIGN]: 
      - This image is the ABSOLUTE REFERENCE for the character's appearance.
      - COPY EXACTLY: Face, Hair, Body Type, Armor, Clothing, Colors, Materials, Footwear, Hand Shape, Accessories.
      - IGNORE TEXTURE/STYLE OF POSE REF: The pose reference is ONLY for the skeleton. All visual details must come from HERE.
      - DETAIL LOCK: If the base character has boots, the output MUST have boots, even if the pose ref has bare feet.
    `;
  }

  if (options.poseImage) {
    let mimeType = "image/png";
    let data = options.poseImage;
    if (options.poseImage.includes(',')) {
      const [header, base64Pose] = options.poseImage.split(',');
      mimeType = header.match(/:(.*?);/)?.[1] || "image/png";
      data = base64Pose.replace(/\s/g, '');
    }
    parts.push({
      inlineData: {
        data: data,
        mimeType: mimeType
      }
    });
    parts[0].text += `
      
      [STRUCTURAL WIREFRAME ONLY - IGNORE STYLE]:
      - TREAT THIS IMAGE AS A COLORLESS SKELETON/STICK-FIGURE.
      - DO NOT COPY: The art style, colors, lighting, background, or rendering of this image.
      - IGNORE ANATOMY DETAILS: Do not copy the foot shape, muscle definition, or hand style from this image.
      - USE ONLY FOR BONE POSITION: Only copy the angles of the limbs.
      - IGNORE PIXELS: Ignore the actual pixels found here, only look at the limb positions.
      - !!! CRITICAL !!!: If this image is a sketch or photo, DO NOT make the result look like a sketch or photo. Keep the main style.
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
