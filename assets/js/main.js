const CLIENT_ID = "fafd1ec7c0934680869f0da9b962537b";
const REDIRECT_URI = window.location.origin + window.location.pathname;

function generateCodeVerifier(length = 128) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array).map(x => chars[x % chars.length]).join("");
}

async function generateCodeChallenge(verifier) {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function redirectToAuth() {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    localStorage.setItem("pkce_verifier", verifier);

    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        code_challenge_method: "S256",
        code_challenge: challenge,
    });

    window.location.href = "https://accounts.spotify.com/authorize?" + params;
}

async function exchangeCodeForToken(code) {
    const verifier = localStorage.getItem("pkce_verifier");
    const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: verifier,
        }),
    });
    const data = await res.json();
    if (data.access_token) {
        localStorage.setItem("spotify_token", data.access_token);
        localStorage.setItem("spotify_token_expiry", Date.now() + data.expires_in * 1000);
        localStorage.removeItem("pkce_verifier");
    }
    return data.access_token;
}

function getStoredToken() {
    const token = localStorage.getItem("spotify_token");
    const expiry = localStorage.getItem("spotify_token_expiry");
    if (token && expiry && Date.now() < Number(expiry)) return token;
    localStorage.removeItem("spotify_token");
    localStorage.removeItem("spotify_token_expiry");
    return null;
}

async function getArtistId(token, name) {
    const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    return data.artists.items[0]?.id;
}

async function getLatestRelease(token, artistId) {
    const [albumsRes, singlesRes] = await Promise.all([
        fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album&market=IT&limit=5`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=single&market=IT&limit=5`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const [albums, singles] = await Promise.all([albumsRes.json(), singlesRes.json()]);
    const all = [...(albums.items || []), ...(singles.items || [])];
    return all.sort((a, b) => new Date(b.release_date) - new Date(a.release_date))[0];
}

async function render() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    let token = getStoredToken();

    if (code) {
        token = await exchangeCodeForToken(code);
        window.history.replaceState({}, "", window.location.pathname);
    }

    if (!token) {
        await redirectToAuth();
        return;
    }

    const artistId = await getArtistId(token, "Persak");
    const release = await getLatestRelease(token, artistId);
    if (!release) return;

    const container = document.querySelector(".ultima-uscita");
    const date = new Date(release.release_date);
    const dateStr = date.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
    const type = release.album_type === "album" ? "Album" : "Singolo";

    container.innerHTML = `
        <a href="${release.external_urls.spotify}" target="_blank" rel="noopener">
            <div class="giornale">
                <div class="giornale__testata">
                    <span class="giornale__label">${type} — Ultima uscita</span>
                    <span class="giornale__data">${dateStr}</span>
                </div>
                <div class="giornale__separatore"></div>
                <div class="giornale__titolo">${release.name}</div>
                <div class="giornale__separatore"></div>
                <div class="giornale__foto">
                    <img src="${release.images[0].url}" alt="${release.name}" />
                </div>
                <div class="giornale__separatore"></div>
                <div class="giornale__footer">PERSAK — ascolta ora su Spotify</div>
            </div>
        </a>
    `;
}

render();
