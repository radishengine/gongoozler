
(function() {
  
  'use strict';
  
  const NS_SVG = 'http://www.w3.org/2000/svg';

  function SubPath() {
    this.parts = [];
  }
  SubPath.prototype = {
    toString: function() {
      if (this.parts.length === 0) return 'M0,0';
      var stringified = [this.parts[0].startString];
      for (var i = 0; i < this.parts.length; i++) {
        stringified.push(this.parts[i].continueString);
      }
      return stringified.join(' ');
    },
    createElement: function() {
      var path = document.createElementNS(NS_SVG, 'path');
      path.setAttribute('d', this.toString());
      return path;
    },
  };

  SubPath.Curve = function Curve(x1,y1, x2,y2, x3,y3, x4,y4) {
    this.x1 = +x1;
    this.y1 = +y1;
    this.x2 = +x2;
    this.y2 = +y2;
    this.x3 = +x3;
    this.y3 = +y3;
    this.x4 = +x4;
    this.y4 = +y4;
    Object.freeze(this);
  };
  SubPath.Curve.prototype = {
    get startString() {
      return 'M' + this.x1 + ',' + this.y1;
    },
    get continueString() {
      return 'C' + this.x2 + ',' + this.y2
        + this.x3 + ',' + this.y3
        + this.x4 + ',' + this.y4;
    },
    getPointAt: function(t) {
      const $1_t = 1-t;
      const B0_t = $1_t * $1_t * $1_t,
            B1_t = 3 * t * $1_t * $1_t,
            B2_t = 3 * t*t * $1_t,
            B3_t = t*t*t;
      return {
        x: (B0_t * this.x1) + (B1_t * this.x2) + (B2_t * this.x3) + (B3_t * this.x4),
        y: (B0_t * this.y1) + (B1_t * this.y2) + (B2_t * this.y3) + (B3_t * this.y4),
      };
    },
    splitAt: function(t) {
      var points = [
        {x:this.x1, y:this.y1},
        {x:this.x2, y:this.y2},
        {x:this.x3, y:this.y3},
        {x:this.x4, y:this.y4},
      ];
      var left = [points[0]], right = [points[3]];
      do {
        var newpoints = new Array(points.length-1);
        for (var i = 0; i < newpoints.length; i++) {
          newpoints[i] = {
            x: (1-t) * points[i].x + t * points[i+1].x,
            y: (1-t) * points[i].y + t * points[i+1].y,
          };
        }
        points = newpoints;
        left.push(points[0]);
        right.unshift(points[points.length-1])
      } while (points.length > 1);
      return [
        new SubPath.Curve(
          left[0].x, left[0].y,
          left[1].x, left[1].y,
          left[2].x, left[2].y,
          left[3].x, left[3].y
        ),
        new SubPath.Curve(
          right[0].x, right[0].y,
          right[1].x, right[1].y,
          right[2].x, right[2].y,
          right[3].x, right[3].y
        ),
      ];
    },
  };

  SubPath.Line = function Line(x1,y1, x2,y2) {
    this.x1 = +x1;
    this.y1 = +y1;
    this.x2 = +x2;
    this.y2 = +y2;
    Object.freeze(this);
  };
  SubPath.Line.prototype = {
    get startString() {
      return 'M' + this.x1 + ',' + this.y1;
    },
    get continueString() {
      return 'L' + this.x2 + ',' + this.y2;
    },
    getPointAt: function(t) {
      return {
        x: this.x1 + (this.x2 - this.x1) * t,
        y: this.y1 + (this.y2 - this.y1) * t,
      };
    },
    splitAt: function(t) {
      var pt = this.getPointAt(t);
      return [
        new SubPath.Line(this.x1, this.y1, pt.x, pt.y),
        new SubPath.Line(pt.x, pt.y, this.x2, this.y2),
      ];
    },
  };

  function roundedCorner(x, y, width, height) {
    return {
      type: 'C',
      values: (width < 0) === (height < 0) ? [
        x + width * 0.55228, y,
        x + width, y + height * (1 - 0.55228),
        x + width, y + height,
      ] : [
        x, y + height * 0.55228,
        x + width * (1 - 0.55228), y + height,
        x + width, y + height,
      ],
    };
  }

  SubPath.getFromElement = function getFromElement(el) {
    var parts;
    if (el instanceof SVGPathElement) {
      parts = el.getPathData({normalize:true});
    }
    else if (el instanceof SVGRectElement) {
      var x = el.x.baseVal.value;
      var y = el.y.baseVal.value;
      var width = el.width.baseVal.value;
      var height = el.height.baseVal.value;
      if (width === 0 || height === 0) return [];
      var rx = el.rx.baseVal.value;
      var ry = el.ry.baseVal.value;
      if (rx > 0 && ry > 0) {
        parts = [
          {type:'M', values:[x+rx, y]},
          {type:'L', values:[x+width-rx, y]},
          roundedCorner(x+width-rx, y, rx, ry),
          {type:'L', values:[x+width, y+height-ry]},
          roundedCorner(x+width, y+height-ry, -rx, ry),
          {type:'L', values:[x+rx, y+height]},
          roundedCorner(x+rx, y+height, -rx, -ry),
          {type:'L', values:[x, y+ry]},
          roundedCorner(x, y+ry, rx, -ry),
        ];
      }
      else {
        parts = [
          {type:'M', values:[x, y]},
          {type:'L', values:[x+width, y]},
          {type:'L', values:[x+width, y+height]},
          {type:'L', values:[x, y+height]},
          {type:'L', values:[x, y]},
        ];
      }
    }
    else if (el instanceof SVGCircleElement || el instanceof SVGEllipseElement) {
      var cx = el.cx.baseVal.value;
      var cy = el.cy.baseVal.value;
      var rx, ry;
      if (el instanceof SVGEllipseElement) {
        rx = el.rx.baseVal.value;
        ry = el.ry.baseVal.value;
      }
      else {
        rx = ry = el.r.baseVal.value;
      }
      if (rx === 0 || ry === 0) return [];
      parts = [
        {type:'M', values:[cx+rx, cy]},
        roundedCorner(cx+rx, cy, -rx, ry),
        roundedCorner(cx, cy+ry, -rx, -ry),
        roundedCorner(cx-rx, cy, rx, -ry),
        roundedCorner(cx, cy-ry, rx, ry),
      ];
    }
    else if (el instanceof SVGLineElement) {
      var x1 = el.x1.baseVal.value;
      var x2 = el.x2.baseVal.value;
      var y1 = el.y1.baseVal.value;
      var y2 = el.y2.baseVal.value;
      parts = [
        {type:'M', value:[x1,y1]},
        {type:'L', value:[x2,y2]},
      ];
    }
    else if (el instanceof SVGPolylineElement || el instanceof SVGPolygonElement) {
      parts = [{type:'M', values:[el.points[0].x, el.points[0].y]}];
      for (var i = 1; i < el.points.numberOfItems; i++) {
        var pt = el.points.getItem(i);
        parts.push({type:'L', values:[pt.x, pt.y]});
      }
      if (el instanceof SVGPolygonElement) {
        parts.push({type:'Z'});
      }
    }
    else {
      throw new TypeError('must be SVG path or shape element');
    }
    var subpaths = [], subpath, part;
    var x=0, y=0;
    for (var i = 0; i < parts.length; i++) {
      switch ((part = parts[i]).type) {
        case 'M':
          subpaths.push(subpath = new SubPath);
          x = part.values[0]; y = part.values[1];
          for (var j = 2; j < part.values.length; j += 2) {
            var px = part.values[j], py = part.values[j+1];
            subpath.parts.push(new SubPath.Line(x,y, px,py));
            x = px; y = py;
          }
          break;
        case 'L':
          for (var j = 0; j < part.values.length; j += 2) {
            var px = part.values[j], py = part.values[j+1];
            subpath.parts.push(new SubPath.Line(x,y, px,py));
            x = px; y = py;
          }
          break;
        case 'C':
          for (var j = 0; j < part.values.length; j += 6) {
            var x2 = part.values[j  ], y2 = part.values[j+1];
            var x3 = part.values[j+2], y3 = part.values[j+3];
            var x4 = part.values[j+4], y4 = part.values[j+5];
            subpath.parts.push(new SubPath.Curve(x,y, x2,y2, x3,y3, x4,y4));
            x = x4; y = y4;
          }
          break;
        case 'Z':
          if (subpath && subpath.length > 0) {
            var first = subpath[0],  last = subpath[subpath.length-1];
            if (last.x4 !== first.x1 || last.y4 !== first.y1) {
              subpath.parts.push(new SubPath.Line(
                last.x4, last.y4,
                first.x1, first.y1));
            }
          }
          break;
        default:
          throw new Error('unexpected part in normalized path: ' + part.type);
      }
    }
    return subpaths;
  };

  SubPath.createElement = function createElement(subpaths) {
    var path = document.createElementNS(NS_SVG, 'path');
    path.setAttribute('d', subpaths.join(' '));
    return path;
  };
  
  window.SubPath = SubPath;

})();
