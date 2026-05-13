'use client';

import { useEffect, useRef, useState } from 'react';
import { ensureDesignSystem, getModules, getStyleHost, getCssText } from './moduleRegistry';
import { transformUserCode } from './transformCode';

const SHELL_HTML = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    html, body, #root { height: 100%; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fafafa; }
    #__df_err {
      position: fixed; inset: 0; padding: 16px; overflow: auto;
      background: #fff5f5; color: #9b1c1c;
      font: 12px ui-monospace, SFMono-Regular, Menlo, monospace;
      white-space: pre-wrap; display: none;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <pre id="__df_err"></pre>
</body>
</html>`;

const STAGES = { idle: 'idle', loading: 'loading', ready: 'ready', error: 'error' };

// Build a JSX wrapper component that redirects the design system's style
// injection into the iframe's <head>.
const buildStyleWrapper = (dsKey, iframeHead) => {
  const host = getStyleHost(dsKey);
  const M = getModules();
  const React = M['react'];
  if (!host || !React) return ({ children }) => children;

  if (host.type === 'emotion') {
    const cacheModule = M['@emotion/cache'];
    const createCache = (cacheModule && (cacheModule.default || cacheModule)) || null;
    const emotionReact = M['@emotion/react'];
    const CacheProvider = emotionReact && emotionReact.CacheProvider;
    if (!createCache || !CacheProvider) return ({ children }) => children;
    const cache = createCache({ key: host.key, container: iframeHead, prepend: true });

    // For Chakra: also provide a ChakraProvider so theme-dependent hooks
    // (useBreakpointValue, useColorMode, etc.) called at the top of the
    // user's component don't crash on missing theme context. Nested
    // ChakraProviders inside the user's code are fine.
    if (host.key === 'chakra') {
      const chakra = M['@chakra-ui/react'];
      const ChakraProvider = chakra && chakra.ChakraProvider;
      if (ChakraProvider) {
        return ({ children }) =>
          React.createElement(
            CacheProvider,
            { value: cache },
            React.createElement(ChakraProvider, null, children),
          );
      }
    }

    return ({ children }) => React.createElement(CacheProvider, { value: cache }, children);
  }

  if (host.type === 'antd-cssinjs') {
    const cssinjs = M['@ant-design/cssinjs'];
    const StyleProvider = cssinjs && cssinjs.StyleProvider;
    if (!StyleProvider) return ({ children }) => children;
    return ({ children }) =>
      React.createElement(
        StyleProvider,
        { container: iframeHead, hashPriority: 'high' },
        children,
      );
  }

  return ({ children }) => children;
};

const renderInIframe = (iframe, dsKey, compiledCode) => {
  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!win || !doc) return;

  const modules = getModules();
  win.__DF_M = modules;
  win.__DF_DEFAULT = null;

  const showError = (err) => {
    const el = doc.getElementById('__df_err');
    if (!el) return;
    el.style.display = 'block';
    el.textContent = (err && (err.stack || err.message)) || String(err);
  };

  win.onerror = (msg, _src, _line, _col, error) => {
    showError(error || msg);
    return true;
  };
  win.addEventListener('unhandledrejection', (e) => showError(e.reason));

  // Inject CSS-file libraries' captured stylesheet (Mantine, Carbon).
  const host = getStyleHost(dsKey);
  if (host && host.type === 'css-text') {
    const cssText = getCssText(host.cssKey);
    if (cssText) {
      const tag = doc.createElement('style');
      tag.setAttribute('data-df-lib', host.cssKey);
      tag.textContent = cssText;
      doc.head.appendChild(tag);
    }
  }

  try {
    const executor = new win.Function('__DF_M', compiledCode);
    executor(modules);

    const Component = win.__DF_DEFAULT;
    if (typeof Component !== 'function') {
      throw new Error(
        'Generated code did not export a default React component. ' +
          'Expected `export default function GeneratedApp() {}`.',
      );
    }

    const React = modules['react'];
    const { createRoot } = modules['react-dom/client'];
    const container = doc.getElementById('root');

    const StyleWrapper = buildStyleWrapper(dsKey, doc.head);

    if (win.__df_root) win.__df_root.unmount();
    const root = createRoot(container);
    win.__df_root = root;
    root.render(
      React.createElement(StyleWrapper, null, React.createElement(Component)),
    );
  } catch (err) {
    showError(err);
  }
};

const StatusOverlay = ({ message }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#888',
      fontSize: 13,
      background: '#FAFAFA',
    }}
  >
    {message}
  </div>
);

const LoadingOverlay = ({ dsKey }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(250,250,250,0.85)',
      color: '#888',
      fontSize: 13,
    }}
  >
    Loading {dsKey} preview…
  </div>
);

const ErrorOverlay = ({ error }) => {
  const isSyntax =
    error && (error.name === 'SyntaxError' || /Unexpected token|JSX/.test(error.message || ''));
  const summary = isSyntax
    ? "Claude's output had a syntax error. This usually fixes itself on a re-skin."
    : 'Something went wrong rendering the preview.';
  const detail = (error && error.message) || String(error);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: 24,
        overflow: 'auto',
        background: '#fff5f5',
        color: '#7f1d1d',
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 15 }}>{summary}</div>
      <div style={{ marginBottom: 16, color: '#9b1c1c' }}>
        Try clicking <strong>Re-skin</strong> at the top of the UI tab to regenerate.
      </div>
      <details>
        <summary
          style={{
            cursor: 'pointer',
            fontSize: 12,
            color: '#9b1c1c',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Technical detail
        </summary>
        <pre
          style={{
            marginTop: 8,
            padding: 12,
            background: 'rgba(0,0,0,0.04)',
            borderRadius: 6,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 12,
            whiteSpace: 'pre-wrap',
            color: '#7f1d1d',
          }}
        >
          {detail}
        </pre>
      </details>
    </div>
  );
};

const LivePreview = ({ dsKey, code }) => {
  const iframeRef = useRef(null);
  const [stage, setStage] = useState(STAGES.idle);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!code) {
      setStage(STAGES.idle);
      return;
    }
    let cancelled = false;
    setStage(STAGES.loading);
    setError(null);

    ensureDesignSystem(dsKey)
      .then(() => {
        if (cancelled) return;
        const compiled = transformUserCode(code);
        if (cancelled) return;
        requestAnimationFrame(() => {
          if (cancelled) return;
          const iframe = iframeRef.current;
          if (!iframe) return;
          const doc = iframe.contentDocument;
          if (doc && !doc.getElementById('root')) {
            doc.open();
            doc.write(SHELL_HTML);
            doc.close();
          }
          renderInIframe(iframe, dsKey, compiled);
          setStage(STAGES.ready);
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
        setStage(STAGES.error);
      });

    return () => {
      cancelled = true;
    };
  }, [dsKey, code]);

  if (!code) {
    return <StatusOverlay message="No generated code yet — try regenerating." />;
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <iframe
        ref={iframeRef}
        title="Generated app preview"
        srcDoc={SHELL_HTML}
        sandbox="allow-scripts allow-same-origin"
        style={{
          width: '100%',
          height: '100%',
          border: 0,
          background: '#FAFAFA',
          display: stage === STAGES.error ? 'none' : 'block',
        }}
      />
      {stage === STAGES.loading && <LoadingOverlay dsKey={dsKey} />}
      {stage === STAGES.error && <ErrorOverlay error={error} />}
    </div>
  );
};

export default LivePreview;
