import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, X, Sparkles } from 'lucide-react';

export default function UpdateNotifier() {
  const [updateAvailable, setUpdateAvailable] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only check for updates when running inside the Tauri native desktop app
    if (typeof window === 'undefined' || !window.__TAURI_INTERNALS__) {
      return;
    }

    let isMounted = true;

    async function checkForUpdates() {
      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const update = await check();
        if (isMounted && update?.available) {
          setUpdateAvailable(update);
        }
      } catch (err) {
        // Silently catch network / dev environment update check errors
        console.debug('[Updater] Check skipped or failed:', err);
      }
    }

    // Check on startup after a small delay
    const timer = setTimeout(checkForUpdates, 3000);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  if (!updateAvailable || dismissed) return null;

  const handleUpdate = async () => {
    try {
      setDownloading(true);
      let downloaded = 0;
      let contentLength = 0;

      await updateAvailable.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setProgress(Math.round((downloaded / contentLength) * 100));
            }
            break;
          case 'Finished':
            setProgress(100);
            break;
        }
      });

      // Relaunch the app to apply the update
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (err) {
      console.error('[Updater] Install failed:', err);
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 bg-black border border-[#00FF87] animate-in fade-in slide-in-from-bottom-5 duration-300"
      style={{
        boxShadow: '0 0 25px rgba(0,255,135,0.25), 4px 4px 0 #FF006E',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#00FF87] animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-widest text-[#00FF87]">
            UPDATE AVAILABLE (v{updateAvailable.version})
          </span>
        </div>
        {!downloading && (
          <button
            onClick={() => setDismissed(true)}
            className="text-zinc-400 hover:text-[#FF006E] transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <p className="text-[11px] font-mono text-zinc-300 mb-3">
        {updateAvailable.body || 'A new update with improvements is ready to install.'}
      </p>

      {downloading ? (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-mono text-[#00FF87]">
            <span className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> DOWNLOADING...
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-900 border border-[#00FF87]/30 overflow-hidden">
            <div
              className="h-full bg-[#00FF87] transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <button
          onClick={handleUpdate}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-mono font-bold tracking-widest bg-[#00FF87] text-black hover:bg-[#00FF87]/90 transition-all cursor-pointer"
          style={{ boxShadow: '2px 2px 0 #FF006E' }}
        >
          <Download className="w-3.5 h-3.5" />
          <span>UPDATE & RESTART</span>
        </button>
      )}
    </div>
  );
}
