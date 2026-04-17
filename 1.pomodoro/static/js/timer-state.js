(function (global) {
  "use strict";

  var PHASE = {
    WORK: "work",
    SHORT_BREAK: "short_break",
    LONG_BREAK: "long_break",
  };

  var defaultSettings = {
    workDuration: 25 * 60,
    shortBreakDuration: 5 * 60,
    longBreakDuration: 15 * 60,
    longBreakInterval: 4,
  };

  function getPhaseDuration(phase, settings) {
    if (phase === PHASE.WORK) {
      return settings.workDuration;
    }
    if (phase === PHASE.SHORT_BREAK) {
      return settings.shortBreakDuration;
    }
    return settings.longBreakDuration;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function calculateRemainingSeconds(state, currentTime) {
    if (!state || !state.phase) {
      return 0;
    }

    if (!state.isRunning) {
      if (typeof state.remainingSeconds === "number") {
        return clamp(Math.floor(state.remainingSeconds), 0, Number.MAX_SAFE_INTEGER);
      }
      return getPhaseDuration(state.phase, defaultSettings);
    }

    var diffMs = state.endTime - currentTime;
    return Math.max(0, Math.ceil(diffMs / 1000));
  }

  function calculateProgressPercent(phase, remaining, duration) {
    if (!phase || duration <= 0) {
      return 0;
    }

    var spent = duration - remaining;
    var rawPercent = (spent / duration) * 100;
    return clamp(rawPercent, 0, 100);
  }

  function getNextPhase(currentPhase, completedSessions, longBreakInterval) {
    if (currentPhase === PHASE.WORK) {
      if (completedSessions > 0 && completedSessions % longBreakInterval === 0) {
        return PHASE.LONG_BREAK;
      }
      return PHASE.SHORT_BREAK;
    }
    return PHASE.WORK;
  }

  function transitionPhase(state, currentTime, settings) {
    if (!state) {
      return startTimer(settings, currentTime);
    }

    if (!state.isRunning) {
      return state;
    }

    var remaining = calculateRemainingSeconds(state, currentTime);
    if (remaining > 0) {
      return Object.assign({}, state, {
        remainingSeconds: remaining,
      });
    }

    var completedSessions = state.completedSessions;
    if (state.phase === PHASE.WORK) {
      completedSessions += 1;
    }

    var nextPhase = getNextPhase(state.phase, completedSessions, settings.longBreakInterval);
    var nextDuration = getPhaseDuration(nextPhase, settings);

    return {
      phase: nextPhase,
      isRunning: true,
      startedAt: currentTime,
      endTime: currentTime + nextDuration * 1000,
      completedSessions: completedSessions,
      remainingSeconds: nextDuration,
    };
  }

  function startTimer(settings, currentTime) {
    var duration = settings.workDuration;
    return {
      phase: PHASE.WORK,
      isRunning: true,
      startedAt: currentTime,
      endTime: currentTime + duration * 1000,
      completedSessions: 0,
      remainingSeconds: duration,
    };
  }

  function pauseTimer(state, currentTime) {
    if (!state || !state.isRunning) {
      return state;
    }

    var now = typeof currentTime === "number" ? currentTime : Date.now();
    var remaining = calculateRemainingSeconds(state, now);

    return Object.assign({}, state, {
      isRunning: false,
      remainingSeconds: remaining,
      startedAt: null,
      endTime: null,
    });
  }

  function resumeTimer(state, currentTime) {
    if (!state || state.isRunning) {
      return state;
    }

    var now = typeof currentTime === "number" ? currentTime : Date.now();
    var remaining =
      typeof state.remainingSeconds === "number"
        ? state.remainingSeconds
        : getPhaseDuration(state.phase, defaultSettings);

    return Object.assign({}, state, {
      isRunning: true,
      startedAt: now,
      endTime: now + remaining * 1000,
      remainingSeconds: remaining,
    });
  }

  function resetTimer(settings, currentTime) {
    var now = typeof currentTime === "number" ? currentTime : Date.now();
    var duration = settings.workDuration;

    return {
      phase: PHASE.WORK,
      isRunning: false,
      startedAt: null,
      endTime: null,
      completedSessions: 0,
      remainingSeconds: duration,
      resetAt: now,
    };
  }

  var api = {
    PHASE: PHASE,
    defaultSettings: defaultSettings,
    getPhaseDuration: getPhaseDuration,
    calculateRemainingSeconds: calculateRemainingSeconds,
    calculateProgressPercent: calculateProgressPercent,
    getNextPhase: getNextPhase,
    transitionPhase: transitionPhase,
    startTimer: startTimer,
    pauseTimer: pauseTimer,
    resumeTimer: resumeTimer,
    resetTimer: resetTimer,
  };

  Object.keys(api).forEach(function (key) {
    global[key] = api[key];
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
