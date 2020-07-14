
let scopes = 'user-library-modify';
let redirectURI = 'https://www.spotify.com/us/';
let vidTitle, searchParam;

// checks authorization code and if extension has been authorized to use Spotify
function checkStoredSettings() {
  let getItem = browser.storage.local.get();

  getItem.then(res => {
      let authCode = res.authorization_code;
      let authCheck = res.authorization_check;
      console.log(authCheck);
      if (authCheck === 'yes' && authCode == undefined) {
        let spotURL = 'https://accounts.spotify.com/authorize?client_id='+clientID+'&redirect_uri='+redirectURI+'&scope='+scopes+'&response_type=code&state=123';
        window.open(spotURL);
        setTimeout(getAuthCode, 2000);
      } 
      else if (authCheck == undefined) {
          authorize();
      } 
      else {
          refreshAccessToken();
      } 
  })
} // check if addify has been authorized

// gets video title from Youtube api
function getVidTitle(accessToken) {

  let tab = browser.tabs.query({currentWindow: true, active: true})  
  tab.then((tab) => {
    let url = 'https://www.youtube.com/oembed?url=' + tab[0].url + '&format=json';

    fetch(url).then(response => response.json())
    .then(data => {
    vidTitle = data.title;
    
    searchParam = vidTitle.replace(/[()]/g,''); // remove parentheses
    searchParam = vidTitle.replace(/[^a-zA-Z0-9]/g,' '); // remove all special characters
    document.getElementById("vid-name").innerHTML = searchParam;
    getSpotifyInfo(accessToken, vidTitle, searchParam);
    })
  }) 
}

// opens Spotify authorize page
function authorize() {

  document.getElementById("vid-name").innerHTML = 'Allow Addify to access some account info.';
  let spotURL = 'https://accounts.spotify.com/authorize?client_id='+clientID+'&redirect_uri='+redirectURI+'&scope='+scopes+'&response_type=code&state=123';
  window.open(spotURL);
  browser.storage.local.set({
    authorization_check: 'yes'
    })
}

// reads authorization code from URL address
function getAuthCode() {

  browser.tabs.query({currentWindow: true, active: true})
  .then(function(tabs) {
    let url = tabs[0].url;
    let authCode = url.substr(33,198);
  
    browser.storage.local.set({
    authorization_code: authCode
    })
    document.getElementById("vid-name").innerHTML = 'Authorization code received.';
    getRefreshToken();
  })
}

// send authorization code to Spotify api to get refresh token
function getRefreshToken() {

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

// request info from Spotify api
function getSpotifyInfo(accessToken) {

  fetch('https://api.spotify.com/v1/search?q='+searchParam+'&type=track&limit=3', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  }).then(res => res.json())
  .then(res => {
    console.log(searchParam);
    if (res.tracks.items[0] === undefined) {
      document.getElementById('song-not-found').innerHTML = 'No song found';
      let refineSearchBtn = document.createElement('button');
      refineSearchBtn.innerHTML = 'Refine search';
      document.getElementById('song-not-found').appendChild(refineSearchBtn);

      document.getElementById('song-not-found').addEventListener('click', refineSearch.bind(null, accessToken));
    }
    if (res.tracks.items.length >= 1) {
      document.getElementById('song-not-found').innerHTML = '';
      document.getElementById('track').innerHTML = 'Song';
      document.getElementById('artist').innerHTML = 'Artist';

      document.getElementById('track1').innerHTML = res.tracks.items[0].name;
      document.getElementById('artist1').innerHTML = res.tracks.items[0].album.artists[0].name;
      let trackID1 = res.tracks.items[0].id;
      let btn1 = document.createElement('button');
      btn1.innerHTML = '+';

      document.getElementById('add1').appendChild(btn1);
      document.getElementById('add1').addEventListener('click', addToLibrary.bind(null, accessToken, trackID1));
    }
    if (res.tracks.items.length >= 2) {
      document.getElementById('track2').innerHTML = res.tracks.items[1].name;
      document.getElementById('artist2').innerHTML = res.tracks.items[1].album.artists[0].name;
      let trackID2 = res.tracks.items[1].id;
      let btn2 = document.createElement('button');
      btn2.innerHTML = '+';

      document.getElementById('add2').appendChild(btn2);
      document.getElementById('add2').addEventListener('click', addToLibrary.bind(null, accessToken, trackID2));
    }
    if (res.tracks.items.length == 3) {
      document.getElementById('track3').innerHTML = res.tracks.items[2].name;
      document.getElementById('artist3').innerHTML = res.tracks.items[2].album.artists[0].name;
      let trackID3 = res.tracks.items[2].id;
      let btn3 = document.createElement('button');
      btn3.innerHTML = '+';

      document.getElementById('add3').appendChild(btn3);
      document.getElementById('add3').addEventListener('click', addToLibrary.bind(null, accessToken, trackID3));
    }
  })
}

// modify video title for better search results
function refineSearch(accessToken) {
  //console.log('refineSearch');
  searchParam = vidTitle.replace(/ *\([^)]*\) */g, ''); // remove text in parentheses
  //console.log(searchParam);
  searchParam = searchParam.replace(/[^a-zA-Z0-9]/g,' '); // remove all special characters
  searchParam = searchParam.replace(/Nightcore/gi, '');
  searchParam = searchParam.replace(/Lyrics/gi, '');
  //console.log(searchParam);
  document.getElementById("vid-name").innerHTML = searchParam;
  getSpotifyInfo(accessToken, searchParam);
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