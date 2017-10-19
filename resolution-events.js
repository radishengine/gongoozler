
window.matchMedia('screen and (resolution: ' + window.devicePixelRatio + 'dppx)')
.addListener(function listener(e) {
  if (!e.matches) {
    this.removeListener(listener);
    window.matchMedia('screen and (resolution: ' + window.devicePixelRatio + 'dppx)')
    .addListener(listener);
    window.dispatchEvent(new Event('resolution-changed'));
  }
});
