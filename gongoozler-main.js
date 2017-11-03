
requirejs.config({
  waitSeconds: Infinity,
});

require(
['domReady!'],
function(domReady) {

  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  
  var fullSizeElement = document.createElement('DIV');
  Object.assign(fullSizeElement.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    visibility: 'hidden',
  });
  document.body.appendChild(fullSizeElement);

  document.createSVGElement = function(name) {
    return this.createElementNS(SVG_NS, name);
  };

  var screen = document.createSVGElement('svg');
  Object.assign(screen.style, {
    position: 'fixed',
  });
  
  var screenWidth = 320, screenHeight = 200;
  
  document.body.appendChild(screen);

  function reframe() {
    screen.viewBox.baseVal.width = screenWidth;
    screen.viewBox.baseVal.height = screenHeight;
    var rect = fullSizeElement.getBoundingClientRect();
    var w = rect.right - rect.left, h = rect.bottom - rect.top;
    var scale = 1;
    while ((scale+1)*screenWidth <= w && (scale+1)*screenHeight <= h) {
      scale++;
    }
    Object.assign(screen.style, {
      left: Math.max(0, Math.floor((w - scale*screenWidth) / 2)),
      top: Math.max(0, Math.floor((h - scale*screenHeight) / 2)),
      width: scale*screenWidth,
      height: scale*screenHeight,
    });
  }
  
  window.addEventListener('resize', reframe);
  
  Object.defineProperties(screen, {
    screenWidth: {
      enumerable: true,
      get: function(){ return screenWidth; },
      set: function(v) {
        v = Math.floor(v);
        if (isNaN(v) || !isFinite(v) || v < 1) {
          throw new TypeError('invalid width');
        }
        screenWidth = v;
        reframe();
      },
    },
  });
  
  Object.defineProperties(screen, {
    screenHeight: {
      enumerable: true,
      get: function(){ return screenHeight; },
      set: function(v) {
        v = Math.floor(v);
        if (isNaN(v) || !isFinite(v) || v < 1) {
          throw new TypeError('invalid height');
        }
        screenHeight = v;
        reframe();
      },
    },
  });
  
  reframe();
  
});
