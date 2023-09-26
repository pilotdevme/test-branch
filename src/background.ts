
type allowedSitesType = { [key: string]: { [key: string]: boolean } }


/* stop timer fetch request api */
async function fetchDataFromAPI(maxDuration: number,url:string) {

    const data = await chrome.storage.local.get();
    const token = data["token"];

    setTimeout(async () => {
        try {
            const response = await fetch(`${url}/me/timetracking/stop`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json', // Set the content type if you're sending JSON data
                }
            });

            const data = await response.json(); // Parse the response JSON

            /* Handle the data or send it to the content script or popup as needed */
            if (data) {
                chrome.runtime.sendMessage({ action: 'stopTimerAPI' })
                await chrome.storage.local.set({
                    running_time: false,
                    timer_start_time: ""
                });
            }
        } catch (error) { }
    }, maxDuration)
}

chrome.tabs.onActivated.addListener(function (activeInfo) {
    // storing tabs id in array
});

chrome.runtime.onMessage.addListener((request, sender, senderResponse) => {
    console.log("listener", request, sender, senderResponse);

    if (request.theme) {
        chrome.storage.local.set({ theme: request.theme });
    }

    switch (request.action) {

        case 'checkTheme':
            if (request.theme) {
                chrome.storage.local.set({ theme: request.theme });
            }
            break;

        case 'loggedIn':
            chrome.storage.local.get((data: { theme: string }) => {
                if (data.theme === 'light') {
                    chrome.action.setIcon({
                        path: {
                            16: '/assets/icons/bot-light-16.png',
                            32: '/assets/icons/bot-light-32.png',
                            48: '/assets/icons/bot-light-48.png',
                            128: '/assets/icons/bot-light-128.png'
                        }
                    });
                } else if (data.theme === 'dark') {
                    chrome.action.setIcon({
                        path: {
                            16: '/assets/icons/bot-white-16.png',
                            32: '/assets/icons/bot-white-32.png',
                            48: '/assets/icons/bot-white-48.png',
                            128: '/assets/icons/bot-white-128.png'
                        }
                    });
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

        case 'timeTrackingLimit':
            const maxDuration = request.data;
            const url = request.url;
            /* Check if maxDuration is zero and call stopTimer if true */
            if (maxDuration === -1) {
                chrome.runtime.sendMessage({ action: 'stopTimer' });
            } else {
                fetchDataFromAPI(maxDuration,url); // Call fetchDataFromAPI function
            }
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
            chrome.storage.local.get((data: { theme: string }) => {
                if (data.theme === 'light') {
                    chrome.action.setIcon({
                        path: {
                            16: '/assets/icons/bot-light-16.png',
                            32: '/assets/icons/bot-light-32.png',
                            48: '/assets/icons/bot-light-48.png',
                            128: '/assets/icons/bot-light-128.png'
                        }
                    });
                } else if (data.theme === 'dark') {
                    chrome.action.setIcon({
                        path: {
                            16: '/assets/icons/bot-white-16.png',
                            32: '/assets/icons/bot-white-32.png',
                            48: '/assets/icons/bot-white-48.png',
                            128: '/assets/icons/bot-white-128.png'
                        }
                    });
                }
            });
            break;

        case 'login-init':
            const redirectUri = chrome.identity.getRedirectURL();
            const auth_url = `${request.url}/accounts/authorize?client_id=${request.clientId}&redirect_uri=${redirectUri}&scope=offline_access&response_type=code&grant_type=authorization_code`;
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
                    chrome.runtime.sendMessage({ action: 'loggedIn' })
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