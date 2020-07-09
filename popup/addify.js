
let scopes = 'user-library-modify';
let redirectURI = 'https://www.spotify.com/us/';
let vidTitle;

// call this fcn on every extension button press
function checkStoredSettings() {
  let getItem = browser.storage.local.get();

  getItem.then(res => {
      let authCode = res.authorization_code;
      console.log(authCode);

      if (authCode === undefined || authCode == '' || !authCode.startsWith('A')) {
          authorize();
      } else {
          refreshAccessToken();
      } 
  })
}

function getVidTitle(accessToken) {
  console.log('getVidTitle');
  let tab = browser.tabs.query({currentWindow: true, active: true})  
  tab.then((tab) => {
    let url = 'https://www.youtube.com/oembed?url=' + tab[0].url + '&format=json';

    fetch(url).then(response => response.json())
    .then(data => {
    vidTitle = data.title;
    document.getElementById("vid-name").innerHTML = vidTitle;
    // modify video title for better search results
    vidTitle = vidTitle.replace(/Nightcore/g, '');
    vidTitle = vidTitle.replace(/ *\([^)]*\) */g, ''); // remove text in parentheses
    vidTitle = vidTitle.replace(/[^a-zA-Z0-9]/g,' '); // remove all special characters
    getSpotifyInfo(accessToken, vidTitle);
    })
  }) 
}

// opens spotify authorize page
function authorize() {
  console.log('authorize');
  //document.getElementById("vid-name").innerHTML = 'Allow Addify to access some account info.';
  
  let spotURL = 'https://accounts.spotify.com/authorize?client_id='+clientID+'&redirect_uri='+redirectURI+'&scope='+scopes+'&response_type=code&state=123';
  window.open(spotURL);
  
  setTimeout(getAuthCode, 2000);
}

function getAuthCode() {
  console.log('getAuthCode');
  browser.tabs.query({currentWindow: true, active: true})
  .then(function(tabs) {
    let url = tabs[0].url;
    let authCode = url.substr(33,198);
  
    browser.storage.local.set({
    authorization_code: authCode
    })

    //document.getElementById("vid-name").innerHTML = 'Authorization code received.';

    getRefreshToken();
  })
}

// send authorization code to Spotify api to get refresh token
function getRefreshToken() {
  console.log('getRefreshToken');
  let getItem = browser.storage.local.get();
  getItem.then(res => {
    let authCode = res.authorization_code;
    let payload = 'grant_type=authorization_code&code='+authCode+'&redirect_uri='+redirectURI;
    fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + encodedIDSecret,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: payload
    }).then(res => res.json()).then(res => {
      let refreshToken = res.refresh_token;
      browser.storage.local.set({
        refresh_token: refreshToken
      })
    })
  })
}

// send refresh token to Spotify api to get new access token
function refreshAccessToken() {
  console.log('refreshAccessToken');
  let getItem = browser.storage.local.get();
  getItem.then(res => {
    let refreshToken = res.refresh_token;
    let payload = 'grant_type=refresh_token&refresh_token='+refreshToken;
    fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + encodedIDSecret,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: payload
    }).then(res => res.json()).then(res => {
       
    let accessToken = res.access_token; // new access token
    getVidTitle(accessToken);
    })
  })
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
    if (res.tracks.items[0] === undefined) {
      alert('Song not found.');
    }

     document.getElementById('track1').innerHTML = res.tracks.items[0].name;
     document.getElementById('track2').innerHTML = res.tracks.items[1].name;
     document.getElementById('track3').innerHTML = res.tracks.items[2].name;

     document.getElementById('artist1').innerHTML = res.tracks.items[0].album.artists[0].name;
     document.getElementById('artist2').innerHTML = res.tracks.items[1].album.artists[0].name;
     document.getElementById('artist3').innerHTML = res.tracks.items[2].album.artists[0].name;

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

checkStoredSettings();