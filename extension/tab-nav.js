(function registerGlowsaryTabNav(root) {
  function getTabs(tabNav) {
    return Array.from(tabNav.querySelectorAll('[role="tab"][data-tab-value]'));
  }

  function selectTab(tabNav, nextTab, shouldFocus = false) {
    const tabs = getTabs(tabNav);

    for (const tab of tabs) {
      const isActive = tab === nextTab;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    }

    if (shouldFocus) {
      nextTab.focus();
    }

    tabNav.dispatchEvent(new CustomEvent("glowsary-tab-change", {
      bubbles: true,
      detail: {
        activeTab: nextTab.dataset.tabValue
      }
    }));
  }

  function getAdjacentTab(tabs, currentTab, direction) {
    const currentIndex = tabs.indexOf(currentTab);

    if (currentIndex === -1) {
      return tabs[0];
    }

    return tabs[(currentIndex + direction + tabs.length) % tabs.length];
  }

  function init(tabNav, options = {}) {
    if (!tabNav || tabNav.dataset.tabNavReady === "true") {
      return null;
    }

    const tabs = getTabs(tabNav);
    const defaultValue = options.defaultValue || "home";
    const defaultTab = tabs.find((tab) => tab.dataset.tabValue === defaultValue) || tabs[0];

    tabNav.dataset.tabNavReady = "true";

    for (const tab of tabs) {
      tab.addEventListener("click", () => selectTab(tabNav, tab));
      tab.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          selectTab(tabNav, getAdjacentTab(tabs, tab, -1), true);
        } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          selectTab(tabNav, getAdjacentTab(tabs, tab, 1), true);
        } else if (event.key === "Home") {
          event.preventDefault();
          selectTab(tabNav, tabs[0], true);
        } else if (event.key === "End") {
          event.preventDefault();
          selectTab(tabNav, tabs[tabs.length - 1], true);
        }
      });
    }

    selectTab(tabNav, defaultTab);

    return {
      get activeTab() {
        return tabs.find((tab) => tab.getAttribute("aria-selected") === "true")?.dataset.tabValue || "";
      },
      select(value) {
        const nextTab = tabs.find((tab) => tab.dataset.tabValue === value);

        if (nextTab) {
          selectTab(tabNav, nextTab);
        }
      }
    };
  }

  root.GlowsaryTabNav = {
    init
  };
})(globalThis);
