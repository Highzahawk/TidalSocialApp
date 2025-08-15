(function () {
  const id = 'tidal-social-overlay';
  if (document.getElementById(id)) return;
  const panel = document.createElement('div');
  panel.id = id;
  panel.style.position = 'fixed';
  panel.style.top = '0';
  panel.style.right = '0';
  panel.style.width = '360px';
  panel.style.height = '100vh';
  panel.style.background = 'rgba(10,10,12,0.98)';
  panel.style.borderLeft = '1px solid rgba(255,255,255,0.08)';
  panel.style.backdropFilter = 'blur(8px)';
  panel.style.color = '#fff';
  panel.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
  panel.style.zIndex = '999999';
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';
  panel.style.padding = '12px';
  panel.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;">
      <strong>Friends Feed</strong>
      <button id="ts-close" style="margin-left:auto;background:#222;padding:4px 8px;border-radius:6px;color:#fff;border:1px solid #333">×</button>
    </div>
    <div id="ts-feed" style="margin-top:8px;overflow:auto;flex:1">(connect app to see feed)</div>
  `;
  document.body.appendChild(panel);
  document.getElementById('ts-close')?.addEventListener('click', () => panel.remove());
})();
