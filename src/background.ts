
type allowedSitesType = { [key: string]: { [key: string]: boolean } }


chrome.tabs.onActivated.addListener(function (activeInfo) {
    // storing tabs id in array
});

chrome.runtime.onMessage.addListener((request, sender, senderResponse) => {
    console.log("listener", request, sender, senderResponse);
    switch (request) {
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
            chrome.runtime.sendMessage('stopTimerAPI')
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
