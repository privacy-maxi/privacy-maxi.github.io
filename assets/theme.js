/* runs before first paint so the page never flashes the wrong theme */
(function () {
  var t = null;
  try { t = localStorage.getItem('pm-theme'); } catch (e) { t = null; }
  if (t !== 'light' && t !== 'dark') {
    t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  }
  document.documentElement.setAttribute('data-theme', t);
})();
