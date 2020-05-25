
let scopes = 'user-library-modify';
let redirectURI = 'https://www.spotify.com/us/';
let vidTitle;

document.getElementById("add-song").addEventListener("click", getURL);

function getURL() {
    let activeTab = browser.tabs.query({currentWindow: true, active: true});
    activeTab.then(getvidTitle);
}

function getvidTitle(tabs) {
  let url = 'https://www.youtube.com/oembed?url=' + tabs[0].url + '&format=json';
  fetch(url).then(response => response.json())
  .then(data => {
    vidTitle = JSON.stringify(data.title);
    document.getElementById("vid-name").innerHTML = vidTitle;
    authenticate();
  });
}

// opens spotify authorize page
function authenticate() {
  let spotURL = 'https://accounts.spotify.com/authorize?client_id='+clientID+'&redirect_uri='+redirectURI+'&scope='+scopes+'&response_type=token&state=123';
  let winRef = window.open(spotURL);
  setTimeout(() => {
    let tab = browser.tabs.query({currentWindow: true, active: true});
    tab.then(getAccessToken);
  } ,2000); // pause to open spotify page
}

// retrieves url of active tab and gets authentication token using substr on url
function getAccessToken(tab) {
  let url = tab[0].url;
  let accessToken = url.substr(41, 174);
  getSpotifyInfo(accessToken);
}

// request info from Spotify API
function getSpotifyInfo(accessToken) {
  document.getElementById('track').innerHTML = 'Track';
  document.getElementById('artist').innerHTML = 'Artist';
  fetch('https://api.spotify.com/v1/search?q='+vidTitle+'&type=track&limit=3', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  }).then(res => res.json())
  .then(res => {
     document.getElementById("track1").innerHTML = JSON.stringify(res.tracks.items[0].name);
     document.getElementById("artist1").innerHTML = JSON.stringify(res.tracks.items[0].album.artists[0].name);
     document.getElementById("track2").innerHTML = JSON.stringify(res.tracks.items[1].name);
     document.getElementById("artist2").innerHTML = JSON.stringify(res.tracks.items[1].album.artists[0].name);
     document.getElementById("track3").innerHTML = JSON.stringify(res.tracks.items[2].name);
     document.getElementById("artist3").innerHTML = JSON.stringify(res.tracks.items[2].album.artists[0].name);
  })
  // if no results, split title string, do searches on substrings
}