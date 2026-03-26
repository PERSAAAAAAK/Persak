async function render() {
    const res = await fetch("data/release.json");
    if (!res.ok) return;
    const release = await res.json();
    if (!release || !release.name) return;

    const artista = release.artists.map(a => a.name).join(", ");

    const container = document.querySelector(".ultima-uscita");
    container.innerHTML = `
        <a href="${release.external_urls.spotify}" target="_blank" rel="noopener">
            <div class="release">
                <div class="release__label">Ultima uscita</div>
                <img src="${release.images[0].url}" alt="${release.name}" />
                <div class="release__titolo">${release.name}</div>
                <div class="release__artista">${artista}</div>
            </div>
        </a>
    `;
}

render();
