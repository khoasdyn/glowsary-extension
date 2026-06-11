(() => {
  function getSpeechSynthesis() {
    return window.speechSynthesis || null;
  }

  function getEnglishVoice(synth) {
    const voices = synth.getVoices?.() || [];
    const normalizeLanguage = (voice) => String(voice.lang || "").replace("_", "-").toLowerCase();
    const voiceName = (voice) => String(voice.name || "").toLowerCase();

    return voices.find((voice) => normalizeLanguage(voice).startsWith("en-us"))
      || voices.find((voice) => normalizeLanguage(voice).startsWith("en"))
      || voices.find((voice) => voiceName(voice).includes("english"))
      || null;
  }

  function speakEnglish(text) {
    const phrase = String(text || "").trim();
    const synth = getSpeechSynthesis();

    if (!phrase || !synth || typeof window.SpeechSynthesisUtterance !== "function") {
      return;
    }

    const voice = getEnglishVoice(synth);

    if (!voice) {
      return;
    }

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.voice = voice;
    utterance.lang = voice.lang || "en-US";
    synth.speak(utterance);
  }

  getSpeechSynthesis()?.getVoices?.();

  window.GlowsarySpeech = {
    speakEnglish
  };
})();
