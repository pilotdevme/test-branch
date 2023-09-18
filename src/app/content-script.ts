// Define the styles as a JavaScript object, for styling the content html element body
const iframeStyles = {
    border: '0',
    height: '40px',
    width: '135px',
    position: 'fixed',
    top: '7%',
    right: '10px',
    zIndex: '9999',
    textAlign: 'center',
};

/*
 * Imports in this file needs to be relative for gulp build to work.
 * In case if you move or rename this file, don't forget to change it's path in gulpfile.js.
 */

class ContentScript {
    // Add <iframe> with ContentComponent page to the body.
    public constructor() {

        chrome.storage.local.get(data => {
            let showContent = false;
            let { allowedSites, token } = data;

            if (!token) {
                return
            }

            if (!allowedSites) {
                allowedSites = { 'github': true };
            }

            for (const key in allowedSites) {
                if (window.location.hostname.includes(key) && allowedSites[key]) {
                    showContent = true
                }
            }

            if (!showContent) {
                return
            }

            /*append HTML container for content script*/
            const contentPageUrl: string = chrome.runtime.getURL('index.html#/content');
            const contentPageFrame: HTMLIFrameElement = document.createElement('iframe');
            contentPageFrame.src = contentPageUrl;

            /*append HTML container body*/
            const contentPageFrameParent: HTMLElement = document.body;
            contentPageFrameParent.append(contentPageFrame);

            // Apply the styles to the iframe element
            Object.assign(contentPageFrame.style, iframeStyles);    
        })
    }
}

// tslint:disable-next-line:no-unused-expression
new ContentScript();
