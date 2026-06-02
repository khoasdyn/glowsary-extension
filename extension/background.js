const CONTEXT_MENU_ID = "glowsary-create-note";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Create note",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id) {
    return;
  }

  chrome.tabs.sendMessage(
    tab.id,
    {
      type: "GLOWSARY_OPEN_NOTE",
      selectedText: info.selectionText || ""
    },
    () => {
      chrome.runtime.lastError;
    }
  );
});

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});
