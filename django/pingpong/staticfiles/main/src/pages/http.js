import * as Utils from '../Utils.js'
import { refreshToken } from './Account.js'

const request = async (params) => {
    const { method = 'GET', url, headers = {}, body } = params;

    const config = {
        method,
        headers: new window.Headers(headers),
    }

    if (body)
        config.body = JSON.stringify(body);

    // Add JWT token to headers
    const token = Utils.getAccessToken();
    if (token) {
        config.headers.append('Authorization', `Bearer ${token}`);
    }

    try {
        let response = await window.fetch(url, config);

        // If token is expired, try to refresh it
        if (response.status === 401) {
            await refreshToken();
            const newToken = Utils.getAccessToken();
            config.headers.set('Authorization', `Bearer ${newToken}`);
            response = await window.fetch(url, config);
        }

        return response;
    } catch (error) {
        console.error('Request failed:', error);
        throw error;
    }
}

export default async function get(url, headers) {
    const response = await request({
        url,
        headers,
        method: 'GET',
    });

    return response;
}

// You might want to add POST, PUT, DELETE methods here as well