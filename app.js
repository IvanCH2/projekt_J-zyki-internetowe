const clientId = '99951e666c4f4ece84de60599399da2b';
const redirectUri = 'http://127.0.0.1:5500/index.html'; // Update with your URL
const scopes = 'playlist-modify-public';

let accessToken = null;
let userId = null;

document.getElementById('login').addEventListener('click', () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=token`;
    window.location = authUrl;
});

window.addEventListener('load', () => {
    const hash = window.location.hash;
    if (hash) {
        const token = new URLSearchParams(hash.substring(1)).get('access_token');
        if (token) {
            accessToken = token;
            document.getElementById('login').style.display = 'none';
            getUserInfo();
            displayUserPlaylists();
        }
    }
});

document.getElementById('search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const query = document.getElementById('search-query').value;
    searchTracks(query);
});

document.getElementById('playlist-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const playlistName = document.getElementById('playlist-name').value;
    createPlaylist(playlistName);
});

document.getElementById('playlists').addEventListener('change', () => {
    const selectedPlaylistId = document.getElementById('playlists').value;
    if (selectedPlaylistId !== '') {
        displayPlaylistTracks(selectedPlaylistId);
    }
});

async function getUserInfo() {
    const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    const data = await response.json();
    userId = data.id;
}

async function displayUserPlaylists() {
    const response = await fetch(`https://api.spotify.com/v1/me/playlists`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    const data = await response.json();
    const playlistsDropdown = document.getElementById('playlists');
    playlistsDropdown.innerHTML = '<option value="">Select a playlist</option>';
    data.items.forEach(playlist => {
        const option = document.createElement('option');
        option.value = playlist.id;
        option.textContent = playlist.name;
        playlistsDropdown.appendChild(option);
    });
}

async function displayPlaylistTracks(playlistId) {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    const data = await response.json();
    const tracksContainer = document.getElementById('playlist-tracks');
    tracksContainer.innerHTML = '';
    data.items.forEach(item => {
        const track = item.track;
        const div = document.createElement('div');
        div.innerHTML = `
            <p>${track.name} - ${track.artists.map(artist => artist.name).join(', ')}</p>
        `;
        tracksContainer.appendChild(div);
    });
}

async function searchTracks(query) {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    const data = await response.json();
    displayResults(data.tracks.items);
}

function displayResults(tracks) {
    const results = document.getElementById('results');
    results.innerHTML = '';
    tracks.forEach(track => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `
            <img src="${track.album.images[0]?.url}" alt="${track.name}" width="150">
            <p>${track.name}</p>
            <p>${track.artists[0].name}</p>
            <button onclick="addToPlaylist('${track.id}')">Add to Playlist</button>
        `;
        results.appendChild(div);
    });
}

async function createPlaylist(name) {
    const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
    });
    const data = await response.json();
    alert(`Playlist "${data.name}" created!`);
    displayUserPlaylists();
}

async function addToPlaylist(trackId) {
    const selectedPlaylistId = document.getElementById('playlists').value;
    if (!selectedPlaylistId) {
        alert('Please select a playlist first.');
        return;
    }

    const response = await fetch(`https://api.spotify.com/v1/playlists/${selectedPlaylistId}/tracks`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: [`spotify:track:${trackId}`] })
    });
    const data = await response.json();
    alert(`Track added to playlist!`);
    displayPlaylistTracks(selectedPlaylistId);
}
