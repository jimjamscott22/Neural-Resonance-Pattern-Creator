import { AppStore } from "../app/store";
import type { AppRefs } from "./renderApp";

interface ClipboardState {
  setTemporaryLabel(button: HTMLButtonElement, label: string): void;
}

export function bindAppControls(refs: AppRefs, store: AppStore, clipboardState: ClipboardState): void {
  refs.seedInput.addEventListener("change", () => {
    store.dispatch({
      type: "set-seed",
      seed: Number(refs.seedInput.value),
    });
  });

  refs.previousSeedButton.addEventListener("click", () => {
    store.dispatch({ type: "offset-seed", delta: -1 });
  });

  refs.nextSeedButton.addEventListener("click", () => {
    store.dispatch({ type: "offset-seed", delta: 1 });
  });

  refs.randomSeedButton.addEventListener("click", () => {
    const seed = Math.floor(Math.random() * 999999) + 1;
    store.dispatch({ type: "randomize-seed", seed });
  });

  refs.playToggleButton.addEventListener("click", () => {
    store.dispatch({ type: "toggle-playing" });
  });

  refs.resetButton.addEventListener("click", () => {
    store.dispatch({ type: "reset-all" });
  });

  refs.copyLinkButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      clipboardState.setTemporaryLabel(refs.copyLinkButton, "Copied");
    } catch {
      clipboardState.setTemporaryLabel(refs.copyLinkButton, "Copy failed");
    }
  });

  refs.sliderInputs.forEach((input, key) => {
    input.addEventListener("input", () => {
      store.dispatch({
        type: "set-param",
        key,
        value: Number(input.value),
        rebuild: AppStore.requiresRebuild(key),
      });
    });
  });

  refs.presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const presetId = button.dataset.preset;
      if (!presetId) {
        return;
      }
      store.dispatch({ type: "apply-preset", presetId });
    });
  });
}

export function createClipboardState(): ClipboardState {
  let timeoutId: number | undefined;

  return {
    setTemporaryLabel(button: HTMLButtonElement, label: string) {
      const original = button.dataset.originalLabel ?? button.textContent ?? "";
      button.dataset.originalLabel = original;
      button.textContent = label;

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        button.textContent = original;
      }, 1200);
    },
  };
}
