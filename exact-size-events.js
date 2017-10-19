
window.exactWidth = window.innerWidth * window.devicePixelRatio;
window.exactHeight = window.innerHeight * window.devicePixelRatio;

window.matchMedia('screen and (resolution: ' + window.devicePixelRatio + 'dppx)')
.addListener(function listener(e) {
  if (!e.matches) {
    window.exactWidth = window.innerWidth * window.devicePixelRatio;
    window.exactHeight = window.innerHeight * window.devicePixelRatio;
    this.removeListener(listener);
    window.matchMedia('screen and (resolution: ' + window.devicePixelRatio + 'dppx)')
    .addListener(listener);
    window.dispatchEvent(new Event('exact-size-change'));
  }
});

window.addEventListener('resize', function(e) {
  window.exactWidth = window.innerWidth * window.devicePixelRatio;
  window.exactHeight = window.innerHeight * window.devicePixelRatio;
  window.dispatchEvent(new Event('exact-size-change'));
});
