(() => {
  "use strict";

  const screens = Array.from(
    document.querySelectorAll(".setup-screen")
  );

  const progressPanel = document.getElementById("progressPanel");
  const progressLabel = document.getElementById("progressLabel");
  const progressCount = document.getElementById("progressCount");
  const progressFill = document.getElementById("progressFill");
  const progressTrack = progressPanel?.querySelector(".progress-track");

  const progressSteps = Array.from(
    document.querySelectorAll("[data-progress-step]")
  );

  const restartButton = document.getElementById(
    "restartSetupButton"
  );

  const launchButton = document.getElementById(
    "launchDisneyOSButton"
  );

  const webAppInstalledCheckbox = document.getElementById(
    "webAppInstalledCheckbox"
  );

  const installContinueButton = document.getElementById(
    "installContinueButton"
  );

  const browserNotice = document.getElementById(
    "browserNotice"
  );

  const totalSteps = screens.length;
  const storageKey = "disneyos-setup-step";

  let currentStep = 0;
  let isTransitioning = false;

  function clampStep(step) {
    const parsedStep = Number.parseInt(step, 10);

    if (Number.isNaN(parsedStep)) {
      return 0;
    }

    return Math.min(
      Math.max(parsedStep, 0),
      totalSteps - 1
    );
  }

  function getStepFromHash() {
    const hash = window.location.hash.replace("#", "");

    if (!hash) {
      return null;
    }

    const matchingScreen = screens.findIndex(
      (screen) => screen.id === hash
    );

    return matchingScreen >= 0
      ? matchingScreen
      : null;
  }

  function getSavedStep() {
    try {
      const savedStep = window.localStorage.getItem(
        storageKey
      );

      return savedStep === null
        ? null
        : clampStep(savedStep);
    } catch (error) {
      return null;
    }
  }

  function saveStep(step) {
    try {
      window.localStorage.setItem(
        storageKey,
        String(step)
      );
    } catch (error) {
      // Setup still works if local storage is unavailable.
    }
  }

  function updateHash(screenId) {
    const newHash = `#${screenId}`;

    if (window.location.hash === newHash) {
      return;
    }

    window.history.replaceState(
      null,
      "",
      newHash
    );
  }

  function updateProgress(step) {
    if (
      !progressLabel ||
      !progressCount ||
      !progressFill ||
      !progressTrack
    ) {
      return;
    }

    const activeScreen = screens[step];

    const stepName =
      activeScreen?.dataset.stepName ||
      `Step ${step + 1}`;

    progressLabel.textContent = stepName;

    progressCount.textContent =
      `Step ${step + 1} of ${totalSteps}`;

    const percentage =
      totalSteps <= 1
        ? 100
        : (step / (totalSteps - 1)) * 100;

    progressFill.style.width = `${percentage}%`;

    progressTrack.setAttribute(
      "aria-valuenow",
      String(step + 1)
    );

    progressSteps.forEach(
      (progressStep, index) => {
        progressStep.classList.toggle(
          "is-complete",
          index < step
        );

        progressStep.classList.toggle(
          "is-active",
          index === step
        );
      }
    );
  }

  function updateChrome(step) {
    const isWelcomeScreen = step === 0;

    if (progressPanel) {
      progressPanel.hidden = isWelcomeScreen;
    }

    if (restartButton) {
      restartButton.hidden = isWelcomeScreen;
    }
  }

  function setScreenVisibility(
    screen,
    isVisible
  ) {
    screen.hidden = !isVisible;

    screen.setAttribute(
      "aria-hidden",
      isVisible ? "false" : "true"
    );
  }

  async function showStep(
    requestedStep,
    options = {}
  ) {
    if (isTransitioning || !screens.length) {
      return;
    }

    const {
      animate = true,
      updateUrl = true,
      saveProgress = true
    } = options;

    const nextStep = clampStep(requestedStep);

    if (
      nextStep === currentStep &&
      screens[nextStep].classList.contains(
        "is-active"
      )
    ) {
      updateProgress(nextStep);
      updateChrome(nextStep);
      return;
    }

    isTransitioning = true;

    const outgoingScreen = screens[currentStep];
    const incomingScreen = screens[nextStep];

    if (
      animate &&
      outgoingScreen &&
      outgoingScreen !== incomingScreen
    ) {
      outgoingScreen.classList.remove("is-active");

      await new Promise((resolve) => {
        window.setTimeout(resolve, 220);
      });
    }

    screens.forEach((screen, index) => {
      const isIncoming = index === nextStep;

      setScreenVisibility(
        screen,
        isIncoming
      );

      screen.classList.toggle(
        "is-active",
        isIncoming
      );
    });

    currentStep = nextStep;

    updateProgress(currentStep);
    updateChrome(currentStep);

    if (updateUrl && incomingScreen) {
      updateHash(incomingScreen.id);
    }

    if (saveProgress) {
      saveStep(currentStep);
    }

    window.scrollTo({
      top: 0,
      behavior: animate ? "smooth" : "auto"
    });

    const heading = incomingScreen?.querySelector(
      "h1, h2"
    );

    if (heading) {
      heading.setAttribute(
        "tabindex",
        "-1"
      );

      heading.focus({
        preventScroll: true
      });
    }

    window.setTimeout(() => {
      isTransitioning = false;
    }, animate ? 260 : 0);
  }

  function goToNextStep() {
    showStep(currentStep + 1);
  }

  function goToPreviousStep() {
    showStep(currentStep - 1);
  }

  function restartSetup() {
    try {
      window.localStorage.removeItem(
        storageKey
      );
    } catch (error) {
      // Ignore storage errors.
    }

    if (webAppInstalledCheckbox) {
      webAppInstalledCheckbox.checked = false;
    }

    updateInstallContinueButton();
    showStep(0);
  }

  function updateInstallContinueButton() {
    if (
      !installContinueButton ||
      !webAppInstalledCheckbox
    ) {
      return;
    }

    installContinueButton.disabled =
      !webAppInstalledCheckbox.checked;
  }

  function detectInstallationBrowser() {
    if (!browserNotice) {
      return;
    }

    const userAgent = navigator.userAgent;

    const isIOS =
      /iPad|iPhone|iPod/i.test(userAgent) ||
      (
        navigator.platform === "MacIntel" &&
        navigator.maxTouchPoints > 1
      );

    const isSafari =
      /Safari/i.test(userAgent) &&
      !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(
        userAgent
      );

    browserNotice.hidden =
      !(isIOS && !isSafari);
  }

  function bindInstallStep() {
    if (webAppInstalledCheckbox) {
      webAppInstalledCheckbox.addEventListener(
        "change",
        updateInstallContinueButton
      );
    }

    updateInstallContinueButton();
    detectInstallationBrowser();
  }

  function bindNavigation() {
    document.addEventListener(
      "click",
      (event) => {
        const nextButton = event.target.closest(
          "[data-next-step]"
        );

        if (nextButton) {
          if (nextButton.disabled) {
            return;
          }

          goToNextStep();
          return;
        }

        const previousButton = event.target.closest(
          "[data-previous-step]"
        );

        if (previousButton) {
          goToPreviousStep();
        }
      }
    );

    restartButton?.addEventListener(
      "click",
      restartSetup
    );

    launchButton?.addEventListener(
      "click",
      () => {
        window.location.href =
          "https://disneyos.github.io/";
      }
    );

    window.addEventListener(
      "hashchange",
      () => {
        const hashStep = getStepFromHash();

        if (
          hashStep !== null &&
          hashStep !== currentStep
        ) {
          showStep(hashStep, {
            updateUrl: false
          });
        }
      }
    );

    document.addEventListener(
      "keydown",
      (event) => {
        const activeElement =
          document.activeElement;

        const isTyping =
          activeElement &&
          (
            activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            activeElement.isContentEditable
          );

        if (isTyping) {
          return;
        }

        if (event.key === "ArrowRight") {
          goToNextStep();
        }

        if (event.key === "ArrowLeft") {
          goToPreviousStep();
        }
      }
    );
  }

  function initialize() {
    if (!screens.length) {
      return;
    }

    bindNavigation();
    bindInstallStep();

    const hashStep = getStepFromHash();
    const savedStep = getSavedStep();

    const initialStep =
      hashStep !== null
        ? hashStep
        : savedStep !== null
          ? savedStep
          : 0;

    currentStep = initialStep;

    screens.forEach((screen, index) => {
      const isInitial =
        index === initialStep;

      setScreenVisibility(
        screen,
        isInitial
      );

      screen.classList.toggle(
        "is-active",
        isInitial
      );
    });

    updateProgress(initialStep);
    updateChrome(initialStep);
    updateHash(screens[initialStep].id);
  }

  initialize();
})();
