
let scopes = 'user-library-modify';
let redirectURI = 'https://www.spotify.com/us/';
let vidTitle;

document.getElementById('add-song').addEventListener('click', getURL);

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
    // modify video title for better search results
    //vidTitle = vidTitle.replace('ft.', '');
    vidTitle = vidTitle.replace(/ *\([^)]*\) */g, ''); // remove text in parentheses
    vidTitle = vidTitle.replace(/[^a-zA-Z0-9]/g,' '); // remove all special characters
    //alert(vidTitle);
    authenticate();
  });
}

// opens spotify authorize page
function authenticate() {
  let spotURL = 'https://accounts.spotify.com/authorize?client_id='+clientID+'&redirect_uri='+redirectURI+'&scope='+scopes+'&response_type=token&state=123';
  window.open(spotURL);
  setTimeout(() => {
    let tab = browser.tabs.query({currentWindow: true, active: true});
    tab.then(getAccessToken);
  }, 1000) // delay for popup window to load
}

// retrieves url of active tab and gets authentication token using substr on url
function getAccessToken(tab) {
  let url = tab[0].url;
  let accessToken = url.substr(41, 174);
  getSpotifyInfo(accessToken);
}

// request info from Spotify API
function getSpotifyInfo(accessToken) {
  document.getElementById('track').innerHTML = 'Song';
  document.getElementById('artist').innerHTML = 'Artist';
  //document.getElementById('add').innerHTML = 'Add Song';
  fetch('https://api.spotify.com/v1/search?q='+vidTitle+'&type=track&limit=3', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  }).then(res => res.json())
  .then(res => {
     document.getElementById('track1').innerHTML = JSON.stringify(res.tracks.items[0].name);
     document.getElementById('track2').innerHTML = JSON.stringify(res.tracks.items[1].name);
     document.getElementById('track3').innerHTML = JSON.stringify(res.tracks.items[2].name);

     document.getElementById('artist1').innerHTML = JSON.stringify(res.tracks.items[0].album.artists[0].name);
     document.getElementById('artist2').innerHTML = JSON.stringify(res.tracks.items[1].album.artists[0].name);
     document.getElementById('artist3').innerHTML = JSON.stringify(res.tracks.items[2].album.artists[0].name);

     let trackID1 = res.tracks.items[0].id;
     let trackID2 = res.tracks.items[1].id;
     let trackID3 = res.tracks.items[2].id;

    let btn1 = document.createElement('button');
    let btn2 = document.createElement('button');
    let btn3 = document.createElement('button');

    btn1.innerHTML = '+';
    btn2.innerHTML = '+';
    btn3.innerHTML = '+';

    document.getElementById('add1').appendChild(btn1);
    document.getElementById('add2').appendChild(btn2);
    document.getElementById('add3').appendChild(btn3);

    document.getElementById('add1').addEventListener('click', addToLibrary.bind(null, accessToken, trackID1));
    document.getElementById('add2').addEventListener('click', addToLibrary.bind(null, accessToken, trackID2));
    document.getElementById('add3').addEventListener('click', addToLibrary.bind(null, accessToken, trackID3));
  })
}

// send access token and track ID to Spotify API to add song to users' library
function addToLibrary(accessToken, trackID) {
  let ID = [String(trackID)];
  let payload = {
    ids: ID
  }
  //alert(payload.ids);
  fetch('https://api.spotify.com/v1/me/tracks', {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  }).then(res => {
    switch(res.status) {
      case 200:
        alert('Song added to your library.'); break;
      default:
        alert('Could not add song.'); break;
    }
  })
    .catch(error => alert('Could not add song'))
}
