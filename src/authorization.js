/**
 * Authorization Code Flow with Proof Key for Code Exchange (PKCE)
 * https://developer.spotify.com/documentation/general/guides/authorization-guide/#authorization-code-flow-with-proof-key-for-code-exchange-pkce
 */

const clientID = '97c3e5d4f7e142f7b11c0daf2b19793d'
const redirectURI = 'https://www.spotify.com'
 
 /**
  * Retrieve browser's local storage and checks if it has the authorization code
  */
async function getStoredSettings() {
  const browStore = await browser.storage.local.get()

  if (browStore.authorization_code === undefined) {
    openAuthorizationPrompt()
  } else if (browStore.refresh_token === undefined) {
    getRefreshToken()
  } else {
    refreshAccessToken()
  }
}

/**
 * Generate state, code verifier and challenge. Open authorization prompt
 */
async function openAuthorizationPrompt() {
  const scopes = 'user-library-modify'
  const codeVerifier = generateRandomString()
  const codeChallenge = await challenge_from_verifier(codeVerifier)
  const randomState = generateRandomString()

  browser.storage.local.set({code_verifier: codeVerifier})
  browser.storage.local.set({state: randomState})
  // wait for script to save the above to local storage
  const s = await browser.storage.local.get()

  const authorizationURL =  'https://accounts.spotify.com/authorize?client_id='+clientID+
                            '&redirect_uri='+redirectURI+
                            '&scope='+scopes+
                            '&state='+randomState+
                            '&code_challenge='+codeChallenge+
                            '&code_challenge_method=S256'+
                            '&response_type=code'
  window.open(authorizationURL)
}

/**
 * POST authorization code to Spotify api, receive access token and refresh token
 */
async function getRefreshToken() {
  const browStore = await browser.storage.local.get()

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'client_id='+clientID+
          '&grant_type=authorization_code'+
          '&code='+browStore.authorization_code+
          '&redirect_uri='+redirectURI+
          '&code_verifier='+browStore.code_verifier
  })
  const data = await res.json()
  const accessToken = data.access_token
  const refreshToken = data.refresh_token

  browser.storage.local.set({refresh_token: refreshToken})
  getVidTitle(accessToken)
}

/**
 * POST refresh token to Spotify api, receive new access and refresh token
 */
async function refreshAccessToken() {
  const browStore = await browser.storage.local.get()

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=refresh_token'+
          '&refresh_token='+browStore.refresh_token+
          '&client_id='+clientID
  })
  const data = await res.json()
  const accessToken = data.access_token
  const refreshToken = data.refresh_token

  browser.storage.local.set({refresh_token: refreshToken})
  getVidTitle(accessToken)
}

getStoredSettings()