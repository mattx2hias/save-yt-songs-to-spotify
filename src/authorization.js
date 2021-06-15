
/**
 * Authorization Code Flow with Proof Key for Code Exchange (PKCE)
 * https://developer.spotify.com/documentation/general/guides/authorization-guide/#authorization-code-flow-with-proof-key-for-code-exchange-pkce
 */

const sha256 = require('sha256')
const randomState = window.crypto.getRandomValues(new Uint32Array(1)).toString()
const clientID = '97c3e5d4f7e142f7b11c0daf2b19793d'

// /**
//  * Generate string for authorization URI
//  * @returns cryptographically random string that has been SHA256 hashed and base-64 encoded
//  */
 function generateCodeChallenge() {
     const array = window.crypto.getRandomValues(new Int32Array()).toString
     let codeVerifier = ''
     let i = 0
 
     while(codeVerifier.length <= 50) {
         codeVerifier += array[i] 
         i++
     }
 
     return window.btoa(sha256(codeVerifier))
 }
 
 /**
  * Retrieve browser's local storage and checks if it has the authorization code
  */
async function getStoredSettings() {
  let storageContainer = await browser.storage.local.get()
  let authorizationCode = storageContainer.authorization_code

  if (authorizationCode == undefined) {
    checkAuthorizationCode()
  } else console.log('has authorization code')
}

/**
 * Stores state to be checked later and opens the authorization URI
 */
async function checkAuthorizationCode() {
  const scopes = 'user-library-modify'
  const redirectURI = 'https://www.spotify.com'
  const codeChallenge = generateCodeChallenge()
  
  browser.storage.local.set({state: randomState})
  
  const authorizationURL = 'https://accounts.spotify.com/authorize?client_id='+clientID+'&redirect_uri='+redirectURI+'&scope='+
  scopes+'&state='+randomState+'&code_challenge='+codeChallenge+'&code_challenge_method=S256&response_type=code'
  window.open(authorizationURL)
}

getStoredSettings()