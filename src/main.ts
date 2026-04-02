import "./styles.css";

import { AppStore, type AppAction } from "./app/store";
import { DEFAULT_PARAMS, mergeParams } from "./config/params";
import { loadPersistedParams, persistParams } from "./features/persistence";
import type { RendererController } from "./render/p5Renderer";
import { bindAppControls, createClipboardState } from "./ui/bindApp";
import { renderApp, syncAppUi } from "./ui/renderApp";

void bootstrap();

async function bootstrap(): Promise<void> {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) {
    throw new Error("Missing #app root.");
  }

  const initialParams = mergeParams({
    ...DEFAULT_PARAMS,
    ...loadPersistedParams(),
  });

  const store = new AppStore(initialParams);
  const refs = renderApp(root);
  const clipboardState = createClipboardState();
  const { createP5Renderer } = await import("./render/p5Renderer");

  const renderer = createP5Renderer({
    container: refs.canvasMount,
    initialParams,
    getParams: () => store.getState().params,
    getPlaying: () => store.getState().isPlaying,
    onStats: (stats) => {
      store.dispatch({ type: "set-stats", stats });
    },
  });

  bindAppControls(refs, store, clipboardState);
  refs.exportButton.addEventListener("click", () => {
    renderer.exportFrame();
    clipboardState.setTemporaryLabel(refs.exportButton, "Saved!");
  });

  store.subscribe((state, action) => {
    syncAppUi(refs, state);
    handleAppAction(renderer, action, state.params);

    if (action.type !== "set-stats") {
      persistParams(state.params);
    }
  });

  syncAppUi(refs, store.getState());

  window.addEventListener("beforeunload", () => {
    renderer.destroy();
  });
}

function handleAppAction(
  renderer: RendererController,
  action: AppAction,
  params: typeof DEFAULT_PARAMS,
): void {
  switch (action.type) {
    case "set-param":
      renderer.setParams(params, action.rebuild);
      break;
    case "set-seed":
    case "offset-seed":
    case "randomize-seed":
    case "reset-all":
    case "apply-preset":
      renderer.setParams(params, true);
      break;
    case "set-playing":
    case "toggle-playing":
    case "set-stats":
      break;
  }
}
