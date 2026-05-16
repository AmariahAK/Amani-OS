import { useEffect } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { ChamaContextPanel } from "./components/layout/ChamaContextPanel";
import { Header } from "./components/layout/Header";
import { ChatArea } from "./components/chat/ChatArea";
import { Composer } from "./components/chat/Composer";
import { SummarizingOverlay } from "./components/chat/SummarizingOverlay";
import { HistoryDialog } from "./components/history/HistoryDialog";
import { SettingsDialog } from "./components/settings/SettingsDialog";
import { Toast } from "./components/ui/Toast";
import { useAppStore } from "./store/appStore";

export default function App() {
  const init = useAppStore((s) => s.init);
  const compressing = useAppStore((s) => s.compressing);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="flex h-full">
      <Sidebar />
      <ChamaContextPanel />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <ChatArea />
        <Composer />
      </div>
      <HistoryDialog />
      <SettingsDialog />
      {compressing && <SummarizingOverlay />}
      <Toast />
    </div>
  );
}
