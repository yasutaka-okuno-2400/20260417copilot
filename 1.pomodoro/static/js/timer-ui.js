(function (global) {
  "use strict";

  var RING_CIRCUMFERENCE = 2 * Math.PI * 80;

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function formatSeconds(totalSeconds) {
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    return pad2(minutes) + ":" + pad2(seconds);
  }

  function getPhaseText(phase) {
    if (phase === PHASE.WORK) {
      return "作業中";
    }
    if (phase === PHASE.SHORT_BREAK) {
      return "短休憩";
    }
    return "長休憩";
  }

  function updateTimerDisplay(remainingSeconds) {
    var timerEl = document.getElementById("timerDisplay");
    if (!timerEl) {
      return;
    }
    timerEl.textContent = formatSeconds(Math.max(0, remainingSeconds));
  }

  function updateProgressRing(progressPercent) {
    var ringEl = document.getElementById("progressRing");
    if (!ringEl) {
      return;
    }

    var clamped = Math.max(0, Math.min(100, progressPercent));
    var dashOffset = RING_CIRCUMFERENCE * (1 - clamped / 100);
    ringEl.style.strokeDasharray = RING_CIRCUMFERENCE + " " + RING_CIRCUMFERENCE;
    ringEl.style.strokeDashoffset = String(dashOffset);
  }

  function updatePhaseDisplay(phase) {
    var phaseEl = document.getElementById("phaseLabel");
    if (!phaseEl) {
      return;
    }
    phaseEl.textContent = getPhaseText(phase);
  }

  function updateStartButtonText(isRunning) {
    var startBtn = document.getElementById("startBtn");
    if (!startBtn) {
      return;
    }
    startBtn.textContent = isRunning ? "停止" : "開始";
  }

  function updateDisplay(state, settings) {
    var now = Date.now();
    var remaining = calculateRemainingSeconds(state, now);
    var duration = getPhaseDuration(state.phase, settings);
    var progress = calculateProgressPercent(state.phase, remaining, duration);

    updateTimerDisplay(remaining);
    updateProgressRing(progress);
    updatePhaseDisplay(state.phase);
    updateStartButtonText(state.isRunning);
  }

  function setEventListeners() {
    var startBtn = document.getElementById("startBtn");
    var resetBtn = document.getElementById("resetBtn");

    if (startBtn) {
      startBtn.addEventListener("click", function () {
        var now = Date.now();
        if (!global.timerState || global.timerState.isRunning) {
          global.timerState = pauseTimer(global.timerState, now);
        } else {
          global.timerState = resumeTimer(global.timerState, now);
        }
        updateDisplay(global.timerState, global.timerSettings);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        global.timerState = resetTimer(global.timerSettings, Date.now());
        updateDisplay(global.timerState, global.timerSettings);
      });
    }
  }

  global.updateDisplay = updateDisplay;
  global.updateTimerDisplay = updateTimerDisplay;
  global.updateProgressRing = updateProgressRing;
  global.updatePhaseDisplay = updatePhaseDisplay;
  global.setEventListeners = setEventListeners;
})(window);
