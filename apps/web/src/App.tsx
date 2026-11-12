import { useEffect, useRef, useState } from "react";
import { House, Boxes, Printer, Ellipsis } from "lucide-react";
import { Viewer } from "./three/viewer";
import { useStore, selectedModel, type Screen, type EditorTab } from "./store";
import { t } from "./i18n";
import { runSlicer, type SliceResult } from "./slicer/pipeline";
import { A1_DEFAULTS, type MachineSettings } from "./slicer/estimate";
import { SlicePreview } from "./SlicePreview";
import { NavBar } from "./ui/kit";
import { HomeScreen } from "./screens/HomeScreen";
import { EditorScreen } from "./screens/EditorScreen";
import { PrinterScreen } from "./screens/PrinterScreen";
import { MoreScreen } from "./screens/MoreScreen";

export function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const s = useStore();
  const sel = useStore(selectedModel);
  const [cutting, setCutting] = useState(false);
  const slicePos = useRef<Float32Array | null>(null);
  const [sliceResult, setSliceResult] = useState<SliceResult | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sliceSettings, setSliceSettings] = useState<MachineSettings>(A1_DEFAULTS);
  const [layer, setLayer] = useState(0);
  const [slicing, setSlicing] = useState(false);

  // The 3D viewer lives in the editor screen and stays alive across navigation.
  useEffect(() => {
    if (!containerRef.current) return;
    const v = new Viewer(containerRef.current, s.setModels, s.setCut);
    setViewer(v);
    (window as unknown as { __viewer?: Viewer }).__viewer = v; // for E2E checks
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      v.resize(r.width, r.height);
    });
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      v.dispose();
      setViewer(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow the phone's light/dark setting when the look is "auto".
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const on = () => s.setSystemDark(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", s.theme);
    viewer?.applyTheme(s.theme);
  }, [s.theme, viewer]);

  const go = (screen: Screen, tab?: EditorTab) => {
    if (tab) s.setEditorTab(tab);
    s.setScreen(screen);
    window.scrollTo(0, 0);
  };

  const openFiles = () => fileRef.current?.click();

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0 || !viewer) return;
    s.setError(null);
    s.setLoading(true);
    go("editor", "info");
    try {
      for (const f of Array.from(files)) await viewer.load(f);
    } catch (e) {
      console.error(e);
      s.setError(t.loadError);
    } finally {
      s.setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function applyCut() {
    s.setError(null);
    setCutting(true);
    try {
      await viewer?.applyCut();
    } catch (e) {
      const msg = e instanceof Error && e.message === "no-split" ? t.cutNoSplit : t.cutError;
      viewer?.cancelCut();
      s.setError(msg);
    } finally {
      setCutting(false);
    }
  }

  async function runSlice(settings: MachineSettings, usePos: Float32Array | null) {
    if (!sel || !viewer) return;
    const pos = usePos ?? viewer.worldPositions(sel.id);
    if (!pos || pos.length === 0) {
      s.setError(t.sliceErr);
      return;
    }
    slicePos.current = pos;
    setSlicing(true);
    s.setError(null);
    await new Promise((r) => setTimeout(r, 20)); // let the spinner paint
    try {
      const res = runSlicer(pos, settings);
      if (res.layers.length === 0) {
        s.setError(t.sliceErr);
      } else {
        setSliceResult(res);
        setLayer(res.layers.length - 1); // open on the finished print
        setPreviewOpen(true);
      }
    } catch (err) {
      console.error(err);
      s.setError(t.sliceErr);
    } finally {
      setSlicing(false);
    }
  }

  async function exportStl() {
    const blob = viewer?.exportSTL();
    if (!blob) return;
    const name = (sel?.name ?? "scene") + ".stl";
    // Inside the Android APK there is no browser download; hand bytes to native.
    const bridge = (window as unknown as {
      AndroidBridge?: { saveBase64: (n: string, b: string, m: string) => void };
    }).AndroidBridge;
    if (bridge?.saveBase64) {
      bridge.saveBase64(name, await blobToBase64(blob), "model/stl");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  const sliceSelected = () => {
    if (!sel) {
      openFiles();
      return;
    }
    runSlice(sliceSettings, null);
  };

  const onEditor = s.screen === "editor";

  return (
    <div className={`app ${onEditor ? "in-editor" : ""}`}>
      <div className="backdrop" aria-hidden />

      <input
        ref={fileRef}
        type="file"
        accept=".stl,.3mf,.obj,.step,.stp,model/stl,model/3mf,model/step"
        multiple
        hidden
        onChange={(e) => onFiles(e.target.files)}
      />

      {s.screen === "home" && (
        <HomeScreen
          models={s.models}
          onOpen={openFiles}
          go={go}
          onSelect={(id) => viewer?.select(id)}
          onSlice={sliceSelected}
        />
      )}

      <EditorScreen
        visible={onEditor}
        containerRef={containerRef}
        viewer={viewer}
        models={s.models}
        sel={sel}
        tab={s.editorTab}
        setTab={s.setEditorTab}
        cut={s.cut}
        slicing={slicing}
        onBack={() => go("home")}
        onOpen={openFiles}
        onSlice={sliceSelected}
        onExport={exportStl}
        onApplyCut={applyCut}
      />

      {s.screen === "printer" && <PrinterScreen />}
      {s.screen === "more" && <MoreScreen look={s.look} setLook={s.setLook} />}

      {!onEditor && (
        <NavBar<Screen>
          value={s.screen}
          onChange={(v) => go(v)}
          items={[
            { value: "home", label: t.navHome, icon: House },
            { value: "editor", label: t.navEditor, icon: Boxes },
            { value: "printer", label: t.navPrinter, icon: Printer },
            { value: "more", label: t.navMore, icon: Ellipsis },
          ]}
        />
      )}

      {previewOpen && sliceResult && (
        <SlicePreview
          result={sliceResult}
          layer={layer}
          setLayer={setLayer}
          settings={sliceSettings}
          setSettings={setSliceSettings}
          onUpdate={() => runSlice(sliceSettings, slicePos.current)}
          onClose={() => setPreviewOpen(false)}
          busy={slicing}
        />
      )}

      {(s.loading || cutting) && <div className="loading-pill">{cutting ? t.cutting : t.loading}</div>}
      {s.error && (
        <div className="toast" role="alert">
          <span>{s.error}</span>
          <button onClick={() => s.setError(null)} aria-label={t.close}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => {
      const str = String(r.result);
      resolve(str.slice(str.indexOf(",") + 1));
    };
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
