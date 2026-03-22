const CLIENT_ID = "fafd1ec7c0934680869f0da9b962537b";
const CLIENT_SECRET = "16ad3737833746caa572a70ecc4becf8";

async function getToken() {
    const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + btoa(CLIENT_ID + ":" + CLIENT_SECRET),
        },
        body: "grant_type=client_credentials",
    });
    const data = await res.json();
    return data.access_token;
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
    const token = await getToken();
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
