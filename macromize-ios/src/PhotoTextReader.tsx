import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { File } from 'expo-file-system';
import { WebView } from 'react-native-webview';

/** Image bytes stay in this embedded runtime. Network requests only download OCR code/language files. */
export function PhotoTextReader({ uri, onRead, onError, onProgress }: { uri: string; onRead: (text: string) => void; onError: (message: string) => void; onProgress: (progress: string) => void }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const callbacks = useRef({ onRead, onError, onProgress });
  callbacks.current = { onRead, onError, onProgress };
  const finished = useRef(false);
  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => { if (!finished.current) { finished.current = true; callbacks.current.onError('Reading this photo took too long. Try a clearer photo, or enter its text manually.'); } }, 90000);
    void (async () => {
      try {
        const file = new File(uri);
        if (file.size > 20 * 1024 * 1024) throw new Error('This photo is too large. Choose a photo smaller than 20 MB.');
        const mime = /^image\/[a-z0-9.+-]+$/i.test(file.type) ? file.type : /\.png$/i.test(uri) ? 'image/png' : 'image/jpeg';
        const encoded = await file.base64();
        if (active) setDataUrl(`data:${mime};base64,${encoded}`);
      } catch (error) { if (active) { finished.current = true; callbacks.current.onError(error instanceof Error ? error.message : 'The photo could not be read.'); } }
    })();
    return () => { active = false; clearTimeout(timeout); };
  }, [uri]);
  if (!dataUrl) return null;
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net; worker-src blob: https://cdn.jsdelivr.net; connect-src https://cdn.jsdelivr.net; img-src data: blob:; style-src 'unsafe-inline'"></head><body><script>
    const send = (type, value) => window.ReactNativeWebView.postMessage(JSON.stringify({type, value}));
    window.onerror = () => send('error', 'Photo recognition could not start. You can still enter the menu text manually.');
    async function readPhoto() {
      let worker;
      try {
        worker = await Tesseract.createWorker('eng+deu', 1, { logger: p => send('progress', p.status + (typeof p.progress === 'number' ? ' ' + Math.round(p.progress * 100) + '%' : '')) });
        const result = await worker.recognize(${JSON.stringify(dataUrl)});
        send('result', result.data.text.slice(0, 10000));
      } catch (error) { send('error', 'This photo could not be read. Try a clearer image or enter its text manually.'); }
      finally { if (worker) await worker.terminate(); }
    }
  </script><script src="https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js" onload="readPhoto()" onerror="send('error', 'Recognition files could not be downloaded. Check your connection or enter the menu text manually.')"></script></body></html>`;
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 1, height: 1, overflow: 'hidden', opacity: 0 }}><WebView source={{ html, baseUrl: 'https://macromize.local/' }} originWhitelist={['*']} javaScriptEnabled scrollEnabled={false} setSupportMultipleWindows={false} onShouldStartLoadWithRequest={request => request.url === 'about:blank' || request.url.startsWith('https://macromize.local/')} onError={() => { if (!finished.current) { finished.current = true; callbacks.current.onError('Photo recognition is unavailable. Enter the menu text manually.'); } }} onMessage={event => {
    if (finished.current) return;
    try {
      const message: unknown = JSON.parse(event.nativeEvent.data);
      if (typeof message !== 'object' || message === null) return;
      const { type, value } = message as { type?: unknown; value?: unknown };
      if (typeof value !== 'string') return;
      if (type === 'progress') callbacks.current.onProgress(value.slice(0, 160));
      if (type === 'result') { finished.current = true; value.trim() ? callbacks.current.onRead(value.slice(0, 10000)) : callbacks.current.onError('No text was found. Try a sharper photo or enter the menu text manually.'); }
      if (type === 'error') { finished.current = true; callbacks.current.onError(value.slice(0, 300)); }
    } catch { /* Ignore messages that do not follow the local OCR protocol. */ }
  }} /></View>;
}
