chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureScreenshot") {
    captureScreenshot()
      .then(dataUrl => {
        sendResponse({imageDataUrl: dataUrl});
      })
      .catch(error => {
        console.error(error);
        sendResponse({error: error.message});
      });
    return true;  // Will respond asynchronously
  }
});

async function captureScreenshot() {
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {format: "png"});
    return dataUrl;
  } catch (error) {
    throw new Error(`Failed to capture screenshot: ${error.message}`);
  }
}