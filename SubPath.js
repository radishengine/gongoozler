
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
    makeMonotonic: function() {
      for (var i = 0; i < this.parts.length; i++) {
        var inflections = this.parts[i].getInflections();
        switch (inflections.length) {
          case 0: continue;
          case 1:
            var split = this.parts[i].splitAt(inflections[0]);
            this.parts.splice(i++, 1, split[0], split[1]);
            continue;
        }
        var args = this.parts[i].splitMulti(inflections);
        args.splice(0, 0, i, 1);
        Array.prototype.splice.apply(this.parts, args);
        i += inflections.length;
      }
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
        + ' ' + this.x3 + ',' + this.y3
        + ' ' + this.x4 + ',' + this.y4;
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
      const $1_t = 1-t;
      const ax1 = this.x1,
            ay1 = this.y1;
      const x2=this.x2, y2=this.y2,
            x3=this.x3, y3=this.y3;
      const bx4 = this.x4,
            by4 = this.y4;
      const mx = $1_t * x2 + t * x3,
            my = $1_t * y2 + t * y3;
      const ax2 = $1_t * ax1 + t * x2,
            ay2 = $1_t * ay1 + t * y2;
      const ax3 = $1_t * ax2 + t * mx,
            ay3 = $1_t * ay2 + t * my;
      const bx3 = $1_t * x3 + t * bx4,
            by3 = $1_t * y3 + t * by4;
      const bx2 = $1_t * mx + t * bx3,
            by2 = $1_t * my + t * by3;
      const ax4_bx1 = $1_t * ax3 + t * bx2,
            ay4_by1 = $1_t * ay3 + t * by2;
      return [
        new SubPath.Curve(
          ax1, ay1,
          ax2, ay2,
          ax3, ay3,
          ax4_bx1, ay4_by1,
        ),
        new SubPath.Curve(
          ax4_bx1, ay4_by1,
          bx2, by2,
          bx3, by3,
          bx4, by4,
        ),
      ];
    },
    splitMulti: function(tValues) {
      var parts = [];
      var curve = this;
      var prev_t = 0;
      for (var i = 0; i < tValues.length; i++) {
        var t = tValues[i];
        var split = curve.splitAt((t - prev_t) / (1 - prev_t));
        parts.push(split[0]);
        curve = split[1];
        prev_t = t;
      }
      parts.push(curve);
      return parts;
    },
    getInflections: function() {
      var inflections = [];
      function inflect(t) {
        if (t > 0 && t < 1 && inflections.indexOf(t) === -1) {
          inflections.push(t);
        }
      }
      function cubic_bezier_inflections(v0, v1, v2, v3) {
        const x = v1-v0, y = v2-v1, z = v3-v2;
        const p = x-y, q = y-z;
        const a = p-q, b = -2 * p, c = x;
        const u = b*b, v = 4*a*c;
        if (u > v) {
          const f = -(b + Math.sign(b) * Math.sqrt(u - v)) / 2;
          inflect(f / a);
          inflect(c / f);
        }
        else if (u === v) {
          inflect(-b / (2 * a));
        }
      }
      cubic_bezier_inflections(this.x1, this.x2, this.x3, this.x4);
      cubic_bezier_inflections(this.y1, this.y2, this.y3, this.y4);
      if (inflections.length > 1) {
        inflections.sort(function(a,b) { return a-b; });
      }
      return inflections;
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
    getInflections: function() {
      return [];
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
  
  SubPath.getFromElement = function getFromElement(el, mat) {
    var pt1 = el.ownerSVGElement.createSVGPoint();
    var pt2 = el.ownerSVGElement.createSVGPoint();
    var pt3 = el.ownerSVGElement.createSVGPoint();
    var pt4 = el.ownerSVGElement.createSVGPoint();
    mat = mat || el.ownerSVGElement.createSVGMatrix();
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
    for (var i = 0; i < parts.length; i++) {
      switch ((part = parts[i]).type) {
        case 'M':
          subpaths.push(subpath = new SubPath);
          pt1.x = part.values[0];
          pt1.y = part.values[1];
          pt1 = pt1.matrixTransform(mat);
          for (var j = 2; j < part.values.length; j += 2) {
            pt2.x = part.values[j];
            pt2.y = part.values[j+1];
            pt2 = pt2.matrixTransform(mat);
            subpath.parts.push(new SubPath.Line(pt1.x,pt1.y, pt2.x,pt2.y));
            pt1 = pt2;
          }
          break;
        case 'L':
          for (var j = 0; j < part.values.length; j += 2) {
            pt2.x = part.values[j];
            pt2.y = part.values[j+1];
            pt2 = pt2.matrixTransform(mat);
            subpath.parts.push(new SubPath.Line(pt1.x,pt1.y, pt2.x,pt2.y));
            pt1 = pt2;
          }
          break;
        case 'C':
          for (var j = 0; j < part.values.length; j += 6) {
            pt2.x = part.values[j  ]; pt2.y = part.values[j+1];
            pt3.x = part.values[j+2]; pt3.y = part.values[j+3];
            pt4.x = part.values[j+4]; pt4.y = part.values[j+5];
            pt2 = pt2.matrixTransform(mat);
            pt3 = pt3.matrixTransform(mat);
            pt4 = pt4.matrixTransform(mat);
            subpath.parts.push(new SubPath.Curve(
              pt1.x, pt1.y,
              pt2.x, pt2.y,
              pt3.x, pt3.y,
              pt4.x, pt4.y));
            pt1 = pt4;
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
