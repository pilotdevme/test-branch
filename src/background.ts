
type allowedSitesType = { [key: string]: { [key: string]: boolean } }


chrome.tabs.onActivated.addListener(function (activeInfo) {
    // storing tabs id in array
});

chrome.runtime.onMessage.addListener((request, sender, senderResponse) => {
    console.log("listener", request, sender, senderResponse);
    switch (request.action) {
        case 'loggedIn':
            chrome.action.setIcon({
                path: {
                    16: '/assets/icons/bot-light-16.png',
                    32: '/assets/icons/bot-light-32.png',
                    48: '/assets/icons/bot-light-48.png',
                    128: '/assets/icons/bot-light-128.png'
                }
            });
            break;
        case 'loggedOut':
            chrome.action.setIcon({
                path: {
                    16: '/assets/icons/bot-16.png',
                    32: '/assets/icons/bot-32.png',
                    48: '/assets/icons/bot-48.png',
                    128: '/assets/icons/bot-128.png'
                }
            });
            break;
        case 'timerStart':
            chrome.action.setIcon({
                path: {
                    16: '/assets/icons/bot-dark-16.png',
                    32: '/assets/icons/bot-dark-32.png',
                    48: '/assets/icons/bot-dark-48.png',
                    128: '/assets/icons/bot-dark-128.png'
                }
            });
            break;
        case 'timerStop':
            chrome.action.setIcon({
                path: {
                    16: '/assets/icons/bot-light-16.png',
                    32: '/assets/icons/bot-light-32.png',
                    48: '/assets/icons/bot-light-48.png',
                    128: '/assets/icons/bot-light-128.png'
                }
            });
            break;
        case 'stopTimer':
            chrome.runtime.sendMessage({ action: 'stopTimerAPI' })
            break;
        case 'login-init':
            const redirectUri = chrome.identity.getRedirectURL();
            const auth_url = `https://api.awork.io/api/v1/accounts/authorize?client_id=awork-ext-1&redirect_uri=${redirectUri}&scope=offline_access&response_type=code&grant_type=authorization_code`;
            chrome.identity.launchWebAuthFlow({ url: auth_url, interactive: true }, (redirect_Url) => {
                if (chrome.runtime?.lastError || !redirect_Url) {
                    console.error('Authorization failed:', chrome.runtime?.lastError);
                    return;
                } else if (!redirect_Url) {
                    return console.error('Authorization failed: Redirect URL is empty');
                }
                //get authroization code from redirect url
                const url = new URL(redirect_Url);
                const authorizationCode = url.searchParams.get('code');
                if (authorizationCode) {
                    chrome.storage.local.set({ authorizationCode })
                    chrome.runtime.sendMessage({action: 'loggedIn'})
                }
            });
            break;
        default:
            senderResponse('')
            break
    }
})

// function run on install
chrome.runtime.onInstalled.addListener(async function (details) {
    const data: allowedSitesType = await chrome.storage.local.get();
    const allowedSites = data['allowedSites'] || { github: true }
    chrome.storage.local.set({ allowedSites })
});
