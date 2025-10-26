window.custom = function() {
  if (window.imgMag) {
    window.imgMag.remove();
    window.imgMag = null;
    return;
  }
  
  const m = document.createElement('div');
  window.imgMag = m;
  m.style.cssText = 'position:fixed;width:230px;height:230px;border:3px solid #333;border-radius:50%;pointer-events:none;display:none;z-index:2147483647;box-shadow:0 0 10px rgba(0,0,0,0.5);overflow:hidden;background:#fff';
  document.body.appendChild(m);
  
  const c = document.createElement('canvas');
  c.width = 690;
  c.height = 690;
  m.appendChild(c);
  
  const ctx = c.getContext('2d');
  let active = false;
  let currentImg = null;
  
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.altKey && e.metaKey && (e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta')) {
      active = !active;
      m.style.display = active ? 'block' : 'none';
    }
  });
  
  document.addEventListener('mousemove', e => {
    if (!active) return;
    
    m.style.left = e.clientX - 115 + 'px';
    m.style.top = e.clientY - 115 + 'px';
    
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const img = el?.tagName === 'IMG' ? el : el?.querySelector('img');
    
    if (img && img.complete) {
      currentImg = img;
      const rect = img.getBoundingClientRect();
      const scaleX = img.naturalWidth / rect.width;
      const scaleY = img.naturalHeight / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      ctx.clearRect(0, 0, 690, 690);
      ctx.drawImage(img, x - 115, y - 115, 230, 230, 0, 0, 690, 690);
    } else {
      ctx.clearRect(0, 0, 690, 690);
    }
  });
};