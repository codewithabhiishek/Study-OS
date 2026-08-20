import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Download, ExternalLink, X, Sparkles, Terminal } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const APP_VERSION = 'v1.0.1';
const GITHUB_REPO = 'codewithabhiishek/Study-OS';

export default function UpdateModal({ open, onOpenChange }) {
  const [checking, setChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isLatest, setIsLatest] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const isTauri = typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__);

  const checkForUpdates = async () => {
    setChecking(true);
    setErrorMsg('');
    try {
      // 1. If in Tauri desktop app, use native updater check
      if (isTauri) {
        try {
          const { check } = await import('@tauri-apps/plugin-updater');
          const tauriUpdate = await check();
          if (tauriUpdate?.available) {
            setUpdateInfo({
              version: tauriUpdate.version,
              body: tauriUpdate.body || 'New optimizations and features are ready.',
              date: tauriUpdate.date || new Date().toISOString(),
              tauriUpdateInstance: tauriUpdate,
            });
            setIsLatest(false);
            setChecking(false);
            return;
          }
        } catch (e) {
          console.debug('[Tauri Updater check]', e);
        }
      }

      // 2. Fallback / GitHub API check
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
      });

      if (res.ok) {
        const release = await res.json();
        const latestTag = release.tag_name || release.name || '';
        const cleanTag = latestTag.replace(/^v/, '');
        const currentClean = APP_VERSION.replace(/^v/, '');

        if (cleanTag && cleanTag !== currentClean) {
          setUpdateInfo({
            version: latestTag,
            body: release.body || 'New features and performance improvements pushed to GitHub.',
            date: release.published_at || release.created_at,
            htmlUrl: release.html_url,
          });
          setIsLatest(false);
          setChecking(false);
          return;
        }
      }

      // No newer release found
      setIsLatest(true);
      setUpdateInfo(null);
    } catch (err) {
      console.error('[Update check error]', err);
      setIsLatest(true);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (open) {
      checkForUpdates();
    }
  }, [open]);

  const handleInstallTauriUpdate = async () => {
    if (!updateInfo?.tauriUpdateInstance) {
      window.open(`https://github.com/${GITHUB_REPO}/releases/latest`, '_blank');
      return;
    }

    try {
      setDownloading(true);
      let downloaded = 0;
      let contentLength = 0;

      await updateInfo.tauriUpdateInstance.downloadAndInstall((event) => {
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

      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (err) {
      console.error('[Install failed]', err);
      setErrorMsg('Failed to apply update automatically. You can download the latest DMG from GitHub.');
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-md bg-black border-[#00FF87] text-white font-mono p-6"
        style={{ boxShadow: '8px 8px 0 #FF006E' }}
      >
        <DialogHeader className="mb-4">
          <DialogTitle className="text-[#00FF87] font-mono text-base tracking-widest flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#00FF87]" />
            <span>SYSTEM // UPDATE CENTER</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Version Card */}
          <div className="p-3 border border-[#00FF87]/30 bg-[#00FF87]/5 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-zinc-400 uppercase">Installed Build</div>
              <div className="text-sm font-bold text-[#00FF87] tracking-wider">{APP_VERSION}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-zinc-400 uppercase">Environment</div>
              <div className="text-xs text-white font-bold">{isTauri ? 'macOS Native App' : 'Web / Cloud'}</div>
            </div>
          </div>

          {/* Status Box */}
          {checking ? (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-center border border-zinc-800">
              <RefreshCw className="w-6 h-6 text-[#00FF87] animate-spin" />
              <div className="text-xs text-zinc-300 tracking-wider">CONNECTING TO GITHUB...</div>
            </div>
          ) : updateInfo ? (
            <div className="p-4 border border-[#FF006E] bg-[#FF006E]/5 space-y-3">
              <div className="flex items-center gap-2 text-[#FF006E]">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-bold tracking-widest uppercase">NEW UPDATE AVAILABLE ({updateInfo.version})</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed max-h-24 overflow-y-auto">
                {updateInfo.body}
              </p>

              {downloading ? (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[10px] text-[#00FF87]">
                    <span className="flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> DOWNLOADING UPDATE...
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-900 border border-[#00FF87]/40 overflow-hidden">
                    <div
                      className="h-full bg-[#00FF87] transition-all duration-150"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  {isTauri && updateInfo.tauriUpdateInstance ? (
                    <button
                      onClick={handleInstallTauriUpdate}
                      className="w-full py-2.5 px-3 text-xs font-bold tracking-widest bg-[#00FF87] text-black hover:bg-[#00FF87]/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      style={{ boxShadow: '2px 2px 0 #FF006E' }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ONE-CLICK UPDATE & RESTART</span>
                    </button>
                  ) : (
                    <a
                      href={updateInfo.htmlUrl || `https://github.com/${GITHUB_REPO}/releases/latest`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 px-3 text-xs font-bold tracking-widest bg-[#FF006E] text-white hover:bg-[#FF006E]/90 transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
                      style={{ boxShadow: '2px 2px 0 #00FF87' }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>DOWNLOAD LATEST UPDATE (.DMG)</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 border border-[#00FF87]/50 bg-black flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#00FF87] flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-white tracking-wider">UP TO DATE</div>
                <div className="text-[10px] text-zinc-400">You are running the latest StudyOS build.</div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="text-[10px] text-[#FF006E] font-mono">{errorMsg}</div>
          )}

          {/* Action Footer */}
          <div className="flex gap-2 pt-2 border-t border-zinc-800">
            <button
              onClick={checkForUpdates}
              disabled={checking || downloading}
              className="flex-1 py-2 text-[11px] font-bold tracking-wider border border-[#00FF87] text-[#00FF87] hover:bg-[#00FF87] hover:text-black transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
              <span>RE-CHECK GITHUB</span>
            </button>
            <a
              href={`https://github.com/${GITHUB_REPO}/releases`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 text-[11px] font-bold tracking-wider border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-all flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>RELEASES</span>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
