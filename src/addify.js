
/**
 * Check URL, get title of Youtube video, apply regex to video title.
 * @param {*} accessToken 
 */
async function getVidTitle(accessToken) {
  let tab = await browser.tabs.query({currentWindow: true, active: true})  

  if(!(tab[0].url).includes('www.youtube.com/watch')) {
    const text = document.createElement('h3')
    text.textContent = 'Open a Youtube video to search'
    document.getElementById('songNotFound').appendChild(text)
    return null
  }

  let url = 'https://www.youtube.com/oembed?url=' + tab[0].url + '&format=json'
  let promise = await fetch(url)
  let data = await promise.json()

  let searchOBJ = {}
  searchOBJ.vidTitle = ''
  searchOBJ.searchParam = ''
  searchOBJ.refineSearchNum = 0 // Counts video title regex passes

  searchOBJ.vidTitle = data.title;
  // NOTE: Spotify search regex removes parenthesis
  searchOBJ.searchParam = searchOBJ.vidTitle.replace(/[^a-zA-Z0-9\'\(\)\[\]\-\s]/g,'')
                        .replace(/(official\s)?music\svideo/i, '')
                        .replace(/(official\s)?lyric(s)?\svideo/i, '')
                        .replace(/official\s((lyric(s)?)|video|audio)/i, '')
                        .replace(/lyric(s)?(\)|\])/i, '')
                        .replace(/(slow(ed)?(\sdown)?)(\s*(and|n|\+)?\s*(reverb))?/i, '')
                        .replace(/(\(|\[)high\squality(\)|\])/i, '')
                        .replace(/(\(|\[)(hd|hq)(\)|\])/i, '')
                        .replace(/(\(|\[)audio(\)|\])/i, '')
  searchOBJ.refineSearchNum = 1

  console.log('pass 1: ' + searchOBJ.searchParam)
  getSpotifyInfo(accessToken, searchOBJ);
}

/**
 * If no songs are found initially, apply more regex to the search parameter, send GET request again.
 * @param {*} accessToken 
 */
 function autoRefine(accessToken, searchOBJ) {
  searchOBJ.searchParam = searchOBJ.searchParam.replace(/(\(|\[)?(feat|ft)[^-)]*(\)|\])?/i, '')
                                                .replace(/((nightcore|night\score)\s(mix)?)/i, '')
                                                .replace(/version/i, '')
  searchOBJ.refineSearchNum = 2
  console.log('pass 2: ' + searchOBJ.searchParam)
  getSpotifyInfo(accessToken, searchOBJ)
}

/**
 * Even more regex for less accurate, but greater likelihood of returning songs.
 * @param {*} accessToken 
 * @param {*} searchOBJ
 */
 function finalRefine(accessToken, searchOBJ) {
  searchOBJ.searchParam = searchOBJ.searchParam.replace(/ *\([^)]*\) */g, '')
                        .replace(/ *\[[^\]]*]/g, '')
                        .replace(/[^a-zA-Z0-9]/g,' ')
                        .replace(/lyrics/i, '')
  searchOBJ.refineSearchNum = 3
  console.log('final pass: ' + searchOBJ.searchParam)
  getSpotifyInfo(accessToken, searchOBJ)
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

  track.textContent = data.tracks.items[0].name
  artist.textContent = data.tracks.items[0].album.artists[0].name
  button.textContent = '+'

  button.addEventListener('click', addToLibrary.bind(null, accessToken, data.tracks.items[index].id))

  document.getElementById('trackList').appendChild(track)
  document.getElementById('artistList').appendChild(artist)  
  document.getElementById('buttonList').appendChild(button)  
}

/**
 * GET song info from Spotify API, display in extension popup.
 * @param {*} accessToken 
 * @param {*} searchOBJ 
 * @returns 
 */
async function getSpotifyInfo(accessToken, searchOBJ) {
  let promise = await fetch('https://api.spotify.com/v1/search?q='+searchOBJ.searchParam+'&type=track&limit=3', {
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

    switch(searchOBJ.refineSearchNum) {
      case 1: autoRefine(accessToken, searchOBJ); break
      case 2: finalRefine(accessToken, searchOBJ); break
      case 3: {
        const text = document.createElement('h3')
        text.textContent = 'No song found'
        document.getElementById('songNotFound').appendChild(text)
        break
      }
      default: return null
    }
  } else {
    document.getElementById('trackHead').textContent = 'TRACK'
    document.getElementById('artistHead').textContent = 'ARTIST'
    document.getElementById('buttonHead').textContent = '( ͡° ͜ʖ ͡°)'
    document.getElementById('spotLogo').style.display = 'block'
  }

  let numOfResults = 3
  if(data.tracks.items.length < numOfResults) numOfResults = data.tracks.items.length

  for(let i = 0; i < numOfResults; i++) {
    displaySong(data, i, accessToken)
  }
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
      text.textContent = 'Song added to library'
      document.getElementById('wrapper').style.display = 'none'
      document.getElementById('songNotFound').appendChild(text)
      break
    default:
      text = document.createElement('h3')
      text.textContent = 'Failed to add song to library'
      document.getElementById('wrapper').style.display = 'none'
      document.getElementById('songNotFound').appendChild(text)
      break
  }
}