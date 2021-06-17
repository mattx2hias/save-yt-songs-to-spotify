
/**
 * Check URL, get title of Youtube video, apply regex to video title.
 * @param {*} accessToken 
 */
async function getVidTitle(accessToken) {
  let tab = await browser.tabs.query({currentWindow: true, active: true})  

  if(!(tab[0].url).includes('www.youtube.com/watch')) {
    document.getElementById('song-not-found').innerHTML = 'Open a Youtube video to search'
    return null
  }

  let url = 'https://www.youtube.com/oembed?url=' + tab[0].url + '&format=json'
  let promise = await fetch(url)
  let data = await promise.json()
  vidTitle = data.title;

  searchParam = vidTitle.replace(/[^a-zA-Z0-9\'\()]/g,' ')
                        .replace(/(\(|\[)?(official\s)?music\svideo(\)|\])?/i, '')
                        .replace(/(\(|\[)?(official\s)?lyric(s)?\svideo(\)|\])?/i, '')
                        .replace(/(\(|\[)?official\s((lyric(s)?)|video)(\)|\])?/i, '')
                        .replace(/(\(|\[)lyrics(\)|\])/i, '')
                        .replace(/(\(|\[)?(slow(ed)?(\sdown)?)(\s*(and|n|\+)?\s*(reverb))?(\)|\])?/i, '')
                        .replace(/high\squality/i, '')
                        .replace(/hd|hq/i, '')

  console.log(searchParam)
  getSpotifyInfo(accessToken, vidTitle, searchParam);
}

/**
 * GET song info from Spotify API, display in extension popup.
 * @param {*} accessToken 
 */
async function getSpotifyInfo(accessToken) {
  let promise = await fetch('https://api.spotify.com/v1/search?q='+searchParam+'&type=track&limit=3', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  });
  let data = await promise.json()
  if (data.tracks == undefined) {
    console.log(JSON.stringify(data))
  }
  if (data.tracks.items[0] === undefined) {
    //remove text in parentheses or brackets automatically and search again
    console.log('no song found')
    document.getElementById('song-not-found').innerHTML = 'No song found'
    let refineSearchBtn = document.createElement('button')
    refineSearchBtn.innerHTML = 'Refine search'
    document.getElementById('refine-search-btn').appendChild(refineSearchBtn)
    document.getElementById('refine-search-btn').addEventListener('click', refineSearch.bind(null, accessToken, refineSearchBtn))
  } else {
    document.getElementById('content').style.width = '500px'
  }
  if (data.tracks.items.length >= 1) {
    document.getElementById('song-not-found').innerHTML = ''
    let t = document.getElementById('refine-search-btn')
    t.parentNode.removeChild(t)
    document.getElementById('track').innerHTML = 'TRACK'
    document.getElementById('artist').innerHTML = 'ARTIST'

    document.getElementById('track1').innerHTML = data.tracks.items[0].name
    document.getElementById('artist1').innerHTML = data.tracks.items[0].album.artists[0].name
    let trackID1 = data.tracks.items[0].id
    let btn1 = document.createElement('button')
    btn1.innerHTML = '+';
    document.getElementById('add1').appendChild(btn1)
    document.getElementById('add1').addEventListener('click', addToLibrary.bind(null, accessToken, trackID1))
  }
  if (data.tracks.items.length >= 2) {
    document.getElementById('track2').innerHTML = data.tracks.items[1].name
    document.getElementById('artist2').innerHTML = data.tracks.items[1].album.artists[0].name
    let trackID2 = data.tracks.items[1].id
    let btn2 = document.createElement('button')
    btn2.innerHTML = '+'
    document.getElementById('add2').appendChild(btn2)
    document.getElementById('add2').addEventListener('click', addToLibrary.bind(null, accessToken, trackID2))
  }
  if (data.tracks.items.length == 3) {
    document.getElementById('track3').innerHTML = data.tracks.items[2].name
    document.getElementById('artist3').innerHTML = data.tracks.items[2].album.artists[0].name
    let trackID3 = data.tracks.items[2].id
    let btn3 = document.createElement('button')
    btn3.innerHTML = '+';
    document.getElementById('add3').appendChild(btn3)
    document.getElementById('add3').addEventListener('click', addToLibrary.bind(null, accessToken, trackID3))
  }
}

/**
 * Modify video title for less accurate, but greater likelihood of returning songs.
 * @param {*} accessToken 
 * @param {*} refineSearchBtn 
 */
function refineSearch(accessToken, refineSearchBtn) {
  searchParam = vidTitle.replace(/ *\([^)]*\) */g, '')
                        .replace(/ *\[[^\]]*]/g, '')
                        .replace(/[^a-zA-Z0-9]/g,' ')
                        .replace(/lyrics/i, '')
                        .replace(/nightcore/i, '')

  console.log(searchParam)
  document.getElementById('refine-search-btn').removeChild(refineSearchBtn)
  document.getElementById('song-not-found').innerHTML = ''
  getSpotifyInfo(accessToken, searchParam)
}

/**
 * PUT accessToken, trackID to Spotify API, which then adds the song to users' library.
 * @param {*} accessToken 
 * @param {*} trackID 
 */
async function addToLibrary(accessToken, trackID) {
  let ID = [String(trackID)]
  let payload = {
    ids: ID
  }
  let promise = await fetch('https://api.spotify.com/v1/me/tracks', {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  switch(promise.status) {
    case 200:
      alert('Song added to your library.')
      break
    default:
      alert('Could not add song.')
      break
  }
}