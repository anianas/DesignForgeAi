// Lazy module registry for the live preview.
// Each design system's libs are loaded on first use and exposed on
// window.__DF_MODULES so the sandboxed iframe can access them via window.parent.
//
// We also track per-DS "style host" config — how each library's styles need to
// be redirected into the iframe's head (emotion CacheProvider, antd
// StyleProvider, or static CSS text captured at load time).

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';

const MODULES = {};
const STYLE_HOSTS = {};
const CSS_TEXT = {};

const registerModule = (name, mod) => {
  if (mod && typeof mod === 'object' && !('default' in mod)) {
    MODULES[name] = { ...mod, default: mod };
  } else {
    MODULES[name] = mod;
  }
};

registerModule('react', React);
registerModule('react-dom', ReactDOM);
registerModule('react-dom/client', ReactDOMClient);

// Capture <style> tags injected into document.head while `fn` runs — used to
// extract a library's CSS-file content (Mantine, Carbon) so we can re-inject
// it into the iframe's head.
const captureStylesAround = async (key, fn) => {
  const before = new Set(Array.from(document.head.querySelectorAll('style')));
  await fn();
  const after = Array.from(document.head.querySelectorAll('style'));
  const newStyles = after.filter((s) => !before.has(s));
  CSS_TEXT[key] = newStyles.map((s) => s.textContent).join('\n');
};

const loaders = {
  material: async () => {
    const [mui, emotionReact, emotionStyled, emotionCache] = await Promise.all([
      import('@mui/material'),
      import('@emotion/react'),
      import('@emotion/styled'),
      import('@emotion/cache'),
    ]);
    registerModule('@mui/material', mui);
    registerModule('@emotion/react', emotionReact);
    registerModule('@emotion/styled', emotionStyled);
    registerModule('@emotion/cache', emotionCache);
    STYLE_HOSTS.material = { type: 'emotion', key: 'mui' };
  },
  ant: async () => {
    const [antd, cssinjs] = await Promise.all([
      import('antd'),
      import('@ant-design/cssinjs'),
    ]);
    registerModule('antd', antd);
    registerModule('@ant-design/cssinjs', cssinjs);
    STYLE_HOSTS.ant = { type: 'antd-cssinjs' };
  },
  carbon: async () => {
    await captureStylesAround('carbon', async () => {
      const [carbon] = await Promise.all([
        import('@carbon/react'),
        import('@carbon/styles/css/styles.css'),
      ]);
      registerModule('@carbon/react', carbon);
    });
    STYLE_HOSTS.carbon = { type: 'css-text', cssKey: 'carbon' };
  },
  chakra: async () => {
    const [chakra, emotionReact, emotionStyled, framer, emotionCache] = await Promise.all([
      import('@chakra-ui/react'),
      import('@emotion/react'),
      import('@emotion/styled'),
      import('framer-motion'),
      import('@emotion/cache'),
    ]);
    registerModule('@chakra-ui/react', chakra);
    registerModule('@emotion/react', emotionReact);
    registerModule('@emotion/styled', emotionStyled);
    registerModule('framer-motion', framer);
    registerModule('@emotion/cache', emotionCache);
    STYLE_HOSTS.chakra = { type: 'emotion', key: 'chakra' };
  },
  mantine: async () => {
    await captureStylesAround('mantine', async () => {
      const [mantine, mantineHooks] = await Promise.all([
        import('@mantine/core'),
        import('@mantine/hooks'),
        import('@mantine/core/styles.css'),
      ]);
      registerModule('@mantine/core', mantine);
      registerModule('@mantine/hooks', mantineHooks);
    });
    STYLE_HOSTS.mantine = { type: 'css-text', cssKey: 'mantine' };
  },
};

const loadingPromises = {};

export const ensureDesignSystem = (dsKey) => {
  const loader = loaders[dsKey] || loaders.material;
  if (!loadingPromises[dsKey]) {
    loadingPromises[dsKey] = loader().then(() => {
      if (typeof window !== 'undefined') {
        window.__DF_MODULES = MODULES;
      }
      return MODULES;
    });
  }
  return loadingPromises[dsKey];
};

export const getModules = () => MODULES;
export const getStyleHost = (dsKey) => STYLE_HOSTS[dsKey];
export const getCssText = (key) => CSS_TEXT[key] || '';
