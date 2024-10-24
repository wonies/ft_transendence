import GET from './http.js'
import * as Utils from '../Utils.js'

export function requestOAuth() {
    let baseUrl = window.location.protocol + "//" + window.location.host;
    const uri = baseUrl + `/oauth/login`;
    console.log("Requesting OAuth from:", uri);

    let clientID, redirectURI;

    GET(uri).then(async response => {
        const json_response = await response.json();

        clientID = json_response.client_id;
        redirectURI = json_response.redirect_uri;

        const authURL = `https://api.intra.42.fr/oauth/authorize?client_id=${clientID}&redirect_uri=${encodeURIComponent(redirectURI)}&response_type=code&scope=public`;
        console.log("authURL: ", authURL);
        Utils.changeURL(authURL);
    });
}

export async function extractToken() {
    const token = new URLSearchParams(window.location.search).get('code');

    if (token) {
        let currentURL = new URL(window.location.href);
        let cleanURL = new URL(currentURL.origin + window.location.hash);
        window.history.replaceState({}, document.title, cleanURL);
    }

    return token;
}

export async function initialToken(token) {
    let baseUrl = window.location.protocol + "//" + window.location.host;
    const uri = baseUrl + `/oauth/login/callback/?code=${encodeURIComponent(token)}`;

    console.log("Requesting token from:", uri);

    try {
        const response = await GET(uri);
        if (response.status === 200) {
            const json_response = await response.json();
            console.log("Received response:", json_response);

            Utils.setTokens(json_response.access_token, json_response.refresh_token, json_response.expires_in);

            // Store user info
            Utils.setStringifiedItem('playerName', json_response.user.name);
            Utils.setStringifiedItem('playerImage', json_response.user.image);

            console.log("Access token stored:", !!Utils.getAccessToken());
            console.log("Refresh token stored:", !!Utils.getRefreshToken());
            
            // Always return requires2FA as true to force 2FA check
            return { requires2FA: true };
        } else {
            console.log("Login failed. Response:", response);
            return { error: "Login failed" };
        }
    } catch (error) {
        console.error("Error during login:", error);
        return { error: "Login error" };
    }
}

export async function refreshToken() {
    const refreshToken = Utils.getRefreshToken();
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    let baseUrl = window.location.protocol + "//" + window.location.host;
    const uri = baseUrl + `/oauth/token/refresh/`;

    try {
        const response = await fetch(uri, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        if (response.ok) {
            const data = await response.json();
            Utils.setTokens(data.access, data.refresh);
            console.log("Tokens refreshed successfully");
        } else {
            throw new Error('Failed to refresh token');
        }
    } catch (error) {
        console.error("Error refreshing token:", error);
        await logout();
        throw error;
    }
}

export async function logout() {
    const refreshToken = Utils.getRefreshToken();
    if (refreshToken) {
        let baseUrl = window.location.protocol + "//" + window.location.host;
        const uri = baseUrl + `/oauth/logout/`;

        try {
            await fetch(uri, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh: refreshToken }),
            });
        } catch (error) {
            console.error("Error during logout:", error);
        }
    }

    Utils.removeTokens();
    Utils.setStringifiedItem('playerName', null);
    Utils.setStringifiedItem('playerImage', null);
    
    console.log("Logout completed");
}

export async function authenticatedFetch(url, options = {}) {
    const token = Utils.getAccessToken();
    if (!token) {
        throw new Error('No access token available');
    }

    const authOptions = {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        },
        redirect: 'follow',
    };

    console.log("Authenticated fetch to URL:", url);
    console.log("Request options:", authOptions);

    try {
        const response = await fetch(url, authOptions);
        console.log("Response status:", response.status);
        console.log("Response:", response);
        
        if (response.status === 401) {
            await refreshToken();
            return authenticatedFetch(url, options);
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const responseData = await response.json();
            console.log("Response data:", responseData);
            return responseData;
        } else {
            const textData = await response.text();
            console.log("Response text:", textData);
            return textData;
        }
    } catch (error) {
        console.error("Error in authenticated request:", error);
        throw error;
    }
}

export async function setup2FA() {
  let baseUrl = window.location.protocol + "//" + window.location.host;
  console.log("Setup 2FA Access Token:", Utils.getAccessToken());

  try {
    const setup2FA_request_url = baseUrl + '/twofa/setup/';
    console.log("setup2FA_request_url: ", setup2FA_request_url)

    const response = await fetch(setup2FA_request_url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${Utils.getAccessToken()}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log("2FA setup response data:", data);
    
    if (!data.qr_url) {
      console.error("QR URL not found in response");
      throw new Error("QR URL not found in response");
    }
    
    return data;
  } catch (error) {
    console.error("Error setting up 2FA:", error);
    throw error;
  }
}

export async function verify2FA(code) {
    try {
        const data = await authenticatedFetch('/twofa/verify/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        });
        
        console.log("2FA verification server response:", data);

        if (data.success) {
            return { success: true, temp_token: data.temp_token };
        } else {
            return { success: false, message: data.message || 'Verification failed' };
        }
    } catch (error) {
        console.error("Error in verify2FA:", error);
        return { success: false, message: 'An error occurred during verification' };
    }
}

export async function check2FAStatus() {
    try {
        const response = await authenticatedFetch('/twofa/status/');
        console.log("2FA status response:", response);
        return {
            is_enabled: response.is_enabled,
            is_verified: response.is_verified
        };
    } catch (error) {
        console.error("Error checking 2FA status:", error);
        return { is_enabled: false, is_verified: false };
    }
}