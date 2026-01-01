
const STORAGE_KEY = 'splite_style_prompts';

export const DEFAULT_STYLES: Record<string, string> = {
    mascot: "aggressive vector mascot, thick bold contour, professional esports shading, animal head logo",
    minimalist: "ultra-clean vector icon, flat geometric design, modern minimalist aesthetic, simplified shapes",
    badge: "shield emblem, detailed crest, varsity championship badge, traditional sports shield",
    typography: "extreme stylized team lettering, sharp razor angles, custom esports font type",
    monogram: "professional interlocking letters, geometric initials, symmetrical typography design, luxury esports branding",
    cyber: "cyberpunk futuristic aesthetic, neon circuits, high-tech glitch effects, sci-fi geometric vectors",
    fantasy: "medieval rpg theme, ornate heraldry, magical glow, fantasy weaponry and scrolls, epic heraldic art",
    glossy: "3D render style, glossy plastic/metal finish, high-end highlights and shadows, mobile game logo style"
};

export const getStylePrompts = (): Record<string, string> => {
    if (typeof window === 'undefined') return DEFAULT_STYLES;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_STYLES;

    try {
        return { ...DEFAULT_STYLES, ...JSON.parse(stored) };
    } catch (e) {
        console.error("Failed to parse stored styles", e);
        return DEFAULT_STYLES;
    }
};

export const saveStylePrompt = (key: string, prompt: string) => {
    const current = getStylePrompts();
    const updated = { ...current, [key]: prompt };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
};

export const deleteStylePrompt = (key: string) => {
    const current = getStylePrompts();
    if (DEFAULT_STYLES[key]) {
        console.warn("Cannot delete default style");
        return current;
    }
    const { [key]: deleted, ...rest } = current;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    return rest;
};

export const resetStylePrompts = () => {
    localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_STYLES;
};
