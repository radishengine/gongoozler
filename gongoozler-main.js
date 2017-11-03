
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
    cursor: 'none',
  });
  
  var screenWidth = 320, screenHeight = 200, screenScale = 1;
  
  document.body.appendChild(screen);
  
  var cursor = document.createSVGElement('rect');
  Object.assign(cursor.style, {
    width: 16,
    height: 16,
    fill: '#fff',
  });
  screen.appendChild(cursor);
  
  screen.onmousemove = function(e) {
    var x = Math.floor((e.clientX - screen.offsetLeft) / screenScale);
    var y = Math.floor((e.clientY - screen.offsetLeft) / screenScale);
    cursor.x.baseVal = x;
    cursor.y.baseVal = y;
  };

  function reframe() {
    screen.viewBox.baseVal.width = screenWidth;
    screen.viewBox.baseVal.height = screenHeight;
    var rect = fullSizeElement.getBoundingClientRect();
    var w = rect.right - rect.left, h = rect.bottom - rect.top;
    screenScale = 1;
    while ((screenScale+1)*screenWidth <= w && (screenScale+1)*screenHeight <= h) {
      screenScale++;
    }
    Object.assign(screen.style, {
      left: Math.max(0, Math.floor((w - screenScale*screenWidth) / 2)),
      top: Math.max(0, Math.floor((h - screenScale*screenHeight) / 2)),
      width: screenScale*screenWidth,
      height: screenScale*screenHeight,
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
