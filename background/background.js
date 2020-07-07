
 // call this function only once after extension installs
function firstLoad() {
    authorize();
    // wait until tab changes
    getAuthCode();
}

firstLoad();


