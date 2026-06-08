(() => {
  const RULES_URL = "public_suffix_list.dat";
  const DOMAIN_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
  let rulePromise = null;

  function getRuntimeUrl(path) {
    if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
      return chrome.runtime.getURL(path);
    }

    return path;
  }

  function isIpAddress(hostname) {
    return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":");
  }

  function normalizeHostname(input) {
    const rawValue = String(input || "").trim();

    if (!rawValue) {
      return "";
    }

    let value = rawValue.replace(/[\u0000-\u001f\u007f]/g, "").trim();
    value = value.replace(/\\/g, "/");

    try {
      const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`);
      value = url.hostname;
    } catch (_error) {
      value = value.split(/[/?#]/)[0] || "";
      value = value.split("@").pop() || "";
      value = value.replace(/:\d+$/, "");
    }

    value = value.toLowerCase().replace(/\.$/, "");

    if (value.startsWith("www.")) {
      value = value.slice(4);
    }

    return value;
  }

  function hasValidLabels(hostname) {
    const labels = hostname.split(".");

    return labels.length >= 2 && labels.every((label) => DOMAIN_LABEL.test(label));
  }

  async function loadRules() {
    if (!rulePromise) {
      rulePromise = fetch(getRuntimeUrl(RULES_URL))
        .then((response) => {
          if (!response.ok) {
            throw new Error("Unable to load public suffix list.");
          }

          return response.text();
        })
        .then((text) => {
          const exact = new Set();
          const wildcard = new Set();
          const exception = new Set();

          for (const rawLine of text.split(/\r?\n/)) {
            const line = rawLine.trim().toLowerCase();

            if (!line || line.startsWith("//")) {
              continue;
            }

            if (line.startsWith("!")) {
              exception.add(line.slice(1));
            } else if (line.startsWith("*.")) {
              wildcard.add(line.slice(2));
            } else {
              exact.add(line);
            }
          }

          return { exact, wildcard, exception };
        });
    }

    return rulePromise;
  }

  function findPublicSuffixMatch(hostname, rules) {
    const labels = hostname.split(".");
    let bestRule = null;
    let bestRuleLabelCount = 0;

    for (let index = 0; index < labels.length; index += 1) {
      const candidate = labels.slice(index).join(".");

      if (rules.exception.has(candidate)) {
        return {
          isException: true,
          labelCount: candidate.split(".").length
        };
      }

      if (rules.exact.has(candidate)) {
        const labelCount = candidate.split(".").length;
        if (labelCount > bestRuleLabelCount) {
          bestRule = candidate;
          bestRuleLabelCount = labelCount;
        }
      }

      if (index > 0) {
        const wildcardCandidate = labels.slice(index).join(".");
        if (rules.wildcard.has(wildcardCandidate)) {
          const labelCount = wildcardCandidate.split(".").length + 1;
          if (labelCount > bestRuleLabelCount) {
            bestRule = `*.${wildcardCandidate}`;
            bestRuleLabelCount = labelCount;
          }
        }
      }
    }

    return {
      isException: false,
      labelCount: bestRule ? bestRuleLabelCount : 0
    };
  }

  async function getWholeSiteDomainFromInput(input) {
    const hostname = normalizeHostname(input);

    if (!hostname || hostname === "localhost" || isIpAddress(hostname) || !hasValidLabels(hostname)) {
      return null;
    }

    const rules = await loadRules();
    const labels = hostname.split(".");
    const match = findPublicSuffixMatch(hostname, rules);

    if (match.isException) {
      return labels.slice(-match.labelCount).join(".");
    }

    if (!match.labelCount || labels.length <= match.labelCount) {
      return null;
    }

    return labels.slice(-(match.labelCount + 1)).join(".");
  }

  function normalizeExcludedSite(site) {
    const domain = normalizeHostname(site?.domain || site);

    return {
      domain,
      createdAt: Number(site?.createdAt) || Date.now()
    };
  }

  function normalizeExcludedSites(sites = []) {
    const seen = new Set();
    const normalized = [];

    for (const site of Array.isArray(sites) ? sites : []) {
      const nextSite = normalizeExcludedSite(site);

      if (!nextSite.domain || seen.has(nextSite.domain)) {
        continue;
      }

      seen.add(nextSite.domain);
      normalized.push(nextSite);
    }

    return normalized;
  }

  window.GlowsaryDomains = {
    getWholeSiteDomainFromInput,
    normalizeExcludedSites
  };
})();
