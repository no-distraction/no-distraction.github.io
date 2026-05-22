import './styles/global.css';
import { bootstrap } from '$app/shell';

const target = document.getElementById('app');
if (!target) {
  throw new Error('No #app target in document');
}

bootstrap(target).catch((err) => {
  console.error('[bootstrap] failed', err);
  // Construído via DOM API (sem innerHTML) para evitar injeção via mensagem de erro.
  target.textContent = '';
  const wrap = document.createElement('div');
  wrap.style.cssText = 'padding:48px;font-family:system-ui,sans-serif;max-width:560px;margin:auto;';
  const h1 = document.createElement('h1');
  h1.style.fontWeight = '500';
  h1.textContent = 'Algo deu errado.';
  const p = document.createElement('p');
  p.textContent = 'O aplicativo não conseguiu iniciar. Tente recarregar a página.';
  const pre = document.createElement('pre');
  pre.style.cssText = 'background:#eee;padding:12px;overflow:auto;font-family:ui-monospace,monospace;';
  pre.textContent = String(err);
  wrap.append(h1, p, pre);
  target.append(wrap);
});
