/**
 * Storage & Cookie Management Utility
 * Handles authentication tokens (cookies) and UI/App state (localStorage).
 */

// --- Cookie Management (For User Logins & Auth) ---

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    // Secure, Lax SameSite cookie configuration keeps auth safe
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax; Secure";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function deleteCookie(name) {
    // Setting an expiration date in the past deletes the cookie
    setCookie(name, "", -1);
}

// --- Local Storage Management (For UI Changes & App Data) ---

function saveLocalData(storageKey, dataObject) {
    try {
        localStorage.setItem(storageKey, JSON.stringify(dataObject));
        return true;
    } catch (e) {
        console.error(`Failed to save ${storageKey} to device storage`, e);
        return false;
    }
}

function loadLocalData(storageKey) {
    try {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            return JSON.parse(savedData);
        }
    } catch (e) {
        console.error(`Failed to load ${storageKey} from device storage`, e);
    }
    return null;
}
