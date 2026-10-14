import { languages } from "../config.js";

async function translateText(text: string, locale: string): Promise<string> {
    const { TRANSLATOR_IP, TRANSLATOR_PORT } = process.env;

    if (!TRANSLATOR_IP || !TRANSLATOR_PORT) {
        return `setup env keys!`;
    }
    const endpoint = `http://${TRANSLATOR_IP}:${TRANSLATOR_PORT}/api/generate`;

    const targetLang = languages.find((l) => l.value === locale)?.label || locale;

    try {
        const cleanText = text.replace(/\s+/g, " ").trim();
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "qwen2.5:1.5b",
                system: `You are a professional translator. Translate the user's text to ${targetLang}. Output ONLY the translated text. No notes, no explanations.`,
                prompt: cleanText,
                options: {
                    temperature: 0,
                },
                stream: false,
            }),
        });
        const data = await response.json();
        return data.response.trim();
    } catch (error) {
        console.error("Translation failed:", error);
        return text;
    }
}

export { translateText as t };
