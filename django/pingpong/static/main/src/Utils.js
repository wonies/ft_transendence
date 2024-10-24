// Constants
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';

export function getParsedItem(key) {
    const value = sessionStorage.getItem(key);
    try {
        return JSON.parse(value);
    } catch (error) {
        console.error(`Error parsing item with key ${key}:`, error);
        return null;
    }
}

export function setStringifiedItem(key, value) {
    const stringifiedValue = JSON.stringify(value);
    sessionStorage.setItem(key, stringifiedValue);
}

export function changeURL(url) {
    window.location.href = url;
}

export function changeFragment(fragment) {
    window.location.hash = fragment;
}

// Enhanced JWT handling functions
export function setTokens(accessToken, refreshToken, expiresIn) {
    console.log("Setting tokens:");
    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);
    console.log("Expires In:", expiresIn);

    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    
    const expiryTime = Date.now() + (expiresIn * 1000); // Convert seconds to milliseconds
    sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    console.log("Current time:", new Date().toISOString());
    console.log("Token expiry:", new Date(expiryTime).toISOString());
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch (e) {
        console.error('Error parsing JWT:', e);
        return null;
    }
}

export function getAccessToken() {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}
export function set2FAToken(token) {
    sessionStorage.setItem('2FAToken', token);
}
export function get2FAToken() {
    return sessionStorage.getItem('2FAToken');
}
export function set2FAVerified(verified) {
    sessionStorage.setItem('2FAVerified', JSON.stringify(verified));
}

export function is2FAVerified() {
    return JSON.parse(sessionStorage.getItem('2FAVerified')) || false;
}

export function removeTokens() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    sessionStorage.removeItem('2FAVerified');
}

export function isAuthenticated() {
    const token = getAccessToken();
    const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!token || !expiry) {
        // console.log("Authentication failed: Missing token or expiry");
        return false;
    }

    const now = Date.now();
    const expiryTime = parseInt(expiry, 10);
    
    
    if (isNaN(expiryTime)) {
        console.error("Invalid expiry time stored");
        return false;
    }
    return now < expiryTime;
}


export function isTokenExpiringSoon(minutesThreshold = 5) {
    const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiry) return true;

    const expiryTime = parseInt(expiry, 10);
    const timeUntilExpiry = expiryTime - Date.now();
    return timeUntilExpiry < (minutesThreshold * 60 * 1000);
}

export function clearAuthData() {
    removeTokens();
    sessionStorage.removeItem('playerName');
    sessionStorage.removeItem('playerImage');
}



async function refreshTokenIfNeeded() {
    const expiryTime = parseInt(sessionStorage.getItem(TOKEN_EXPIRY_KEY), 10);
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;

    // Refresh token if it's about to expire in the next 5 minutes
    if (timeUntilExpiry < 5 * 60 * 1000) {
        try {
            const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
            const response = await fetch('/api/token/refresh/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh: refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                setTokens(data.access, data.refresh, data.expires_in);
                console.log("Token refreshed successfully");
            } else {
                throw new Error('Failed to refresh token');
            }
        } catch (error) {
            console.error("Error refreshing token:", error);
            // Handle logout or other error scenarios
        }
    }
}