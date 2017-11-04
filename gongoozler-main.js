
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
    background: '#000',
  });
  
  var zone1 = document.createSVGElement('rect');
  zone1.x.baseVal.value = 50;
  zone1.y.baseVal.value = 50;
  zone1.width.baseVal.value = 100;
  zone1.height.baseVal.value = 20;
  Object.assign(zone1.style, {
    fill: '#f00',
  });
  screen.appendChild(zone1);
  
  var zone2 = document.createSVGElement('rect');
  zone2.x.baseVal.value = 75;
  zone2.y.baseVal.value = 60;
  zone2.width.baseVal.value = 30;
  zone2.height.baseVal.value = 100;
  Object.assign(zone2.style, {
    fill: '#0f0',
  });
  screen.appendChild(zone2);
  
  var screenWidth = 320, screenHeight = 200, screenScale = 1, screenX = 0, screenY = 0;
  
  document.body.appendChild(screen);
  
  var cursor = document.createSVGElement('rect');
  Object.assign(cursor.style, {
    width: 16,
    height: 16,
    fill: '#fff',
    visibility: 'hidden',
    pointerEvents: 'none',
  });
  screen.appendChild(cursor);
  
  screen.onmousemove = function(e) {
    var mouseoverRect = this.createSVGRect();
    mouseoverRect.x = Math.floor((e.clientX - screenX) / screenScale);
    mouseoverRect.y = Math.floor((e.clientY - screenY) / screenScale);
    mouseoverRect.width = mouseoverRect.height = 1;
    cursor.x.baseVal.value = mouseoverRect.x;
    cursor.y.baseVal.value = mouseoverRect.y;
    cursor.style.visibility = 'visible';
  };
  
  screen.onmouseleave = function(e) {
    if (e.target === this) {
      cursor.style.visibility = 'hidden';
    }
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
      left: screenX = Math.max(0, Math.floor((w - screenScale*screenWidth) / 2)),
      top: screenY = Math.max(0, Math.floor((h - screenScale*screenHeight) / 2)),
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
