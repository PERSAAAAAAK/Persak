async function render() {
    const res = await fetch("data/release.json");
    if (!res.ok) return;
    const release = await res.json();
    if (!release || !release.name) return;

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
