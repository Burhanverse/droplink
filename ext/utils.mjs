export function isValidUrl(string) {
    try {
        const url = new URL(string);

        if (url.hostname === 'droplink.co' || url.hostname.endsWith('.droplink.co')) {
            return false;
        }

        return true;
    } catch (_) {
        return false;
    }
}

export function extractUrls(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
}

export async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}