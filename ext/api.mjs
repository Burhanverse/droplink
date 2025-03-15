import fetch from 'node-fetch';

const BASE_URL = 'https://droplink.co/api';

export async function shortenUrl(apiKey, url, alias = null) {
    try {
        let apiUrl = `${BASE_URL}?api=${apiKey}&url=${encodeURIComponent(url)}`;

        if (alias) {
            apiUrl += `&alias=${encodeURIComponent(alias)}`;
        }

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.status === 'success') {
            return { success: true, shortUrl: data.shortenedUrl };
        } else {
            return { success: false, error: data.message || 'Unknown error' };
        }
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: 'Failed to connect to DropLink API' };
    }
}

// Validation function
export async function validateApiKey(apiKey) {
    try {
        const testUrl = 'https://example.com';
        const apiUrl = `${BASE_URL}?api=${apiKey}&url=${encodeURIComponent(testUrl)}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        return data.status === 'success';
    } catch (error) {
        console.error('API Validation Error:', error);
        return false;
    }
}