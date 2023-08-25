chrome.tabs.onActivated.addListener(function (activeInfo) {
    // storing tabs id in array
});

chrome.runtime.onMessage.addListener((request, sender, senderResponse) => {
    console.log("listener", request, sender, senderResponse)
})