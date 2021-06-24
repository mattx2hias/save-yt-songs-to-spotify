
/**
 * Call to see UI without sending request to Spotify API
 */
function testUI() {

    document.getElementById('artHead').textContent = '( ͡° ͜ʖ ͡°)'
    document.getElementById('albumHead').textContent = 'ALBUM'
    document.getElementById('trackHead').textContent = 'TRACK'
    document.getElementById('buttonHead').textContent = '( ͡° ͜ʖ ͡°)'
    document.getElementById('spotLogo').style.display = 'flex'

    const art = document.createElement('li')
    const artImg = document.createElement('img')

    const albumWrap = document.createElement('li')
    const album = document.createElement('h2')

    const trackArtistWrap = document.createElement('li')
    const trackArtistList = document.createElement('ul')
    const track = document.createElement('h2')
    const artist = document.createElement('h3')
    
    const button = document.createElement('li')
  
    artImg.src = 'pual'
    track.textContent = 'Track Name'
    artist.textContent = 'Artist Name'
    album.textContent = 'Album Name'
  
    trackArtistList.appendChild(track)
    trackArtistList.appendChild(artist)
    trackArtistWrap.appendChild(trackArtistList)
    albumWrap.appendChild(album)
  
    button.textContent = '+'
    
    art.appendChild(artImg)
    document.getElementById('artList').appendChild(art)
    document.getElementById('trackList').appendChild(trackArtistWrap)
    document.getElementById('albumList').appendChild(albumWrap)
    document.getElementById('buttonList').appendChild(button)  
}