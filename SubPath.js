
function SubPath() {
  this.parts = [];
}
SubPath.prototype = {
  toString: function() {
    var stringified = ['M' + this.parts[0].x1 + ',' + this.parts[0].y1];
    for (var i = 0; i < this.parts.length; i++) {
      var p = this.parts[i];
      if (p.isLine) stringified.push(
        'L' + p.x4 + ',' + p.y4
      );
      else stringified.push(
          'C' + p.x2 + ',' + p.y2
        + ' ' + p.x3 + ',' + p.y3
        + ' ' + p.x4 + ',' + p.y4
      );
    }
    return stringified.join(' ');
  },
};

SubPath.Part = function PathPart(x1,y1, x2,y2, x3,y3, x4,y4) {
  this.x1 = +x1;
  this.y1 = +y1;
  this.x2 = +x2;
  this.y2 = +y2;
  this.x3 = +x3;
  this.y3 = +y3;
  this.x4 = +x4;
  thix.y4 = +y4;
  Object.freeze(this);
};
SubPath.Part.prototype = {
  get isLine() {
    return this.x1 === this.x2 && this.x3 === this.x3
      && this.y1 === this.y2 && this.y3 === this.y4;
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
    var left = [], right = [];
    function doCurve(points) {
      if (points.length === 1) {
        left.push(points[0]);
        right.unshift(points[0]);
        return;
      }
      var newpoints = new Array(points.length-1);
      for (var i = 0; i < newpoints.length; i++) {
        if (i === 0) {
          left.push(points[i]);
        }
        if (i === newpoints.length-1) {
          right.unshift(points[i+1])
        }
        newpoints[i] = {
          x: (1-t) * points[i].x + t * points[i+1].x,
          y: (1-t) * points[i].y + t * points[i+1].y,
        };
      }
      doCurve(newpoints);
    }
    doCurve([
      {x:this.x1, y:this.y1},
      {x:this.x2, y:this.y2},
      {x:this.x3, y:this.y3},
      {x:this.x4, y:this.y4},
    ]);
    return [
      new SubPath.Part(
        left[0].x, left[0].y,
        left[1].x, left[1].y,
        left[2].x, left[2].y,
        left[3].x, left[3].y
      ),
      new SubPath.Part(
        right[0].x, right[0].y,
        right[1].x, right[1].y,
        right[2].x, right[2].y,
        right[3].x, right[3].y
      ),
    ];
  },
};

SubPath.Part.fromLine = function(fromX, fromY, toX, toY) {
  return new SubPath.Part(fromX,fromY, fromX,fromY, toX,toY, toX,toY);
};

SubPath.getFromElement = function getFromElement(pathElement) {
  var subpaths = [], subpath, part;
  var parts = pathElement.getPathData({normalize:true});
  var x=0, y=0;
  for (var i = 0; i < parts.length; i++) {
    switch ((part = parts[i]).type) {
      case 'M':
        subpaths.push(subpath = []);
        x = part.values[0]; y = part.values[1];
        for (var j = 2; j < part.values.length; j += 2) {
          var px = part.values[j], py = part.values[j+1];
          subpath.push(new SubPath.Part(x,y, x,y, px,py, px,py));
          x = px; y = py;
        }
        break;
      case 'L':
        for (var j = 0; j < part.values.length; j += 2) {
          var px = part.values[j], py = part.values[j+1];
          subpath.push(new SubPath.Part(x,y, x,y, px,py, px,py));
          x = px; y = py;
        }
        break;
      case 'C':
        for (var j = 0; j < part.values.length; j += 6) {
          var x2 = part.values[j  ], y2 = part.values[j+1];
          var x3 = part.values[j+2], y3 = part.values[j+3];
          var x4 = part.values[j+4], y4 = part.values[j+5];
          subpath.push(new SubPath.Part(x,y, x2,y2, x3,y3, x4,y4));
          x = x4; y = y4;
        }
        break;
      case 'Z':
        if (subpath && subpath.length > 0) {
          var first = subpath[0],  last = subpath[subpath.length-1];
          if (last.x4 !== first.x1 || last.y4 !== first.y1) {
            subpath.push(new SubPath.Part(last.x4, last.y4, last.x4, last.x4, first.x1, first.y1, first.x1, first.y1));
          }
        }
        break;
    }
  }
  return subpaths;
};

SubPath.setToElement = function setToElement(pathElement, subpaths) {
  pathElement.setAttribute('d', subpaths.join(' '));
};
