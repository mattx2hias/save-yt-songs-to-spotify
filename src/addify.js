
/**
 * Check URL, get title of Youtube video, apply regex to video title.
 * @param {*} accessToken 
 */
async function getVidTitle(accessToken) {
  let tab = await browser.tabs.query({currentWindow: true, active: true})  

  if(!(tab[0].url).includes('www.youtube.com/watch')) {
    const text = document.createElement('h3')
    text.innerHTML = 'Open a Youtube video to search'
    document.getElementById('songNotFound').appendChild(text)
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
 * Create new row with track name, artist and button to add song.
 * @param {*} data 
 * @param {*} index 
 * @param {*} accessToken 
 */
function displaySong(data, index, accessToken) {
  const track = document.createElement('li')
  const artist = document.createElement('li')
  const button = document.createElement('li')

  track.innerHTML = data.tracks.items[0].name
  artist.innerHTML = data.tracks.items[0].album.artists[0].name
  button.innerHTML = '+'

  button.addEventListener('click', addToLibrary.bind(null, accessToken, data.tracks.items[index].id))

  document.getElementById('trackList').appendChild(track)
  document.getElementById('artistList').appendChild(artist)  
  document.getElementById('buttonList').appendChild(button)  
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
    const text = document.createElement('h3')
    text.innerHTML = 'No song found'
    document.getElementById('songNotFound').appendChild(text)

    let refineSearchBtn = document.createElement('button')
    refineSearchBtn.innerHTML = 'Refine search'
    document.getElementById('songNotFound').appendChild(refineSearchBtn)
    document.getElementById('songNotFound').addEventListener('click', refineSearch.bind(null, accessToken, refineSearchBtn))
    return null
  } else {
    document.getElementById('trackHead').innerHTML = 'TRACK'
    document.getElementById('artistHead').innerHTML = 'ARTIST'
    document.getElementById('buttonHead').innerHTML = '( ͡° ͜ʖ ͡°)'
  }

  let numOfResults = 3
  if(data.tracks.items.length < numOfResults) numOfResults = data.tracks.items.length
  for(let i = 0; i < numOfResults; i++) {
    displaySong(data, i, accessToken)
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
  document.getElementById('songNotFound').removeChild(refineSearchBtn)
  document.getElementById('songNotFound').innerHTML = ''
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
  let text
  switch(promise.status) {
    case 200:
      text = document.createElement('h3')
      text.innerHTML = 'Song added to library'
      document.getElementById('wrapper').style.display = 'none'
      document.getElementById('songNotFound').appendChild(text)
      break
    default:
      text = document.createElement('h3')
      text.innerHTML = 'Failed to add song to library'
      document.getElementById('wrapper').style.display = 'none'
      document.getElementById('songNotFound').appendChild(text)
      break
  }
}