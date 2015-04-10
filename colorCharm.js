/**
 * Created by Alex on 1/16/2015.
 */

function ColorCharm() {}
ColorCharm.prototype.convert = {};
ColorCharm.prototype.math = {};
ColorCharm.prototype.interpolation = {};

/**
 *
 * @param colorArray
 * @returns {Array}
 * @private
 */
ColorCharm.prototype._generalize = function(colorArray) {
  var generalizedColorArray = [];
  for (var i = 0; i < colorArray.length; i++) {
    var generalizedObject = {};
    var counter = 0;
    for (var key in colorArray[i]) {
      generalizedObject[counter] = colorArray[i][key];
      counter++;
    }
    generalizedColorArray.push(generalizedObject);
  }
  return generalizedColorArray;
};

/**
 *
 * @param generalizedColorArray
 * @returns {Array}
 * @private
 */
ColorCharm.prototype._degeneralize = function(generalizedColorArray, colorSpace) {
  var colorArray = [];
  for (var i = 0; i < generalizedColorArray.length; i++) {
    var colorObject;

    var generalizedColor = generalizedColorArray[i];
    if (colorSpace == "HSV") {
      colorObject = {h:generalizedColor[0], s:generalizedColor[1], v:generalizedColor[2]};
    }
    else if (colorSpace == "HSL") {
      colorObject = {h:generalizedColor[0], s:generalizedColor[1], l:generalizedColor[2]};
    }
    else if (colorSpace == "RGB") {
      colorObject = {r:generalizedColor[0], g:generalizedColor[1], b:generalizedColor[2]};
    }
    else { // HCL
      colorObject = {h:generalizedColor[0], c:generalizedColor[1], l:generalizedColor[2]};
    }
    colorArray.push(colorObject);
  }
  return colorArray;
};

/**
 *
 * @param [Array] colors | in HEX
 * @param colorSpace
 * @returns {Array}
 * @private
 */
ColorCharm.prototype._getPoints = function(colors,colorSpace) {
  var points = [];
  var me = this;
  colors.map(function(colorArray) {
    for (var i = 0; i < colorArray.length - 1; i++) {
      var fromRGB = me.convert.hex2rgb(colorArray[i]);
      var toRGB = me.convert.hex2rgb(colorArray[i + 1]);

      var fromConverted;
      var toConverted;

      if (colorSpace == "HCL" || colorSpace === undefined) {
        fromConverted = me.convert.rgb2hcl(fromRGB);
        toConverted = me.convert.rgb2hcl(toRGB);

        // avoid problems with the -1 in h for stepping
        if (fromConverted.h < 0) {
          fromConverted.h = toConverted.h;
        }
        if (toConverted.h < 0) {
          toConverted.h = fromConverted.h;
        }
      }
      else if (colorSpace == "HSV") {
        fromConverted = me.convert.rgb2hsv(fromRGB);
        toConverted = me.convert.rgb2hsv(toRGB);
      }
      else if (colorSpace == "HSL") {
        fromConverted = me.convert.rgb2hsl(fromRGB);
        toConverted = me.convert.rgb2hsl(toRGB);
      }
      else if (colorSpace == "RGB") {
        fromConverted = fromRGB;
        toConverted = toRGB;
      }

      // get points
      if (i == 0) {
        points.push(fromConverted);
      }
      points.push(toConverted);
    }
  });
  return points;
};

ColorCharm.prototype._preparePoints = function(points,colorSpace) {
  switch (colorSpace) {
    case "RGB":
      return points;
    case "HSV":
    case "HSL":
    case "HCL":
    default: {
      var preparedPoints = [];
      preparedPoints.push(points[0]);
      var b = points[0][0];
      for (var i = 0; i < points.length - 1; i++) {
        var a = b;
        b = points[i+1][0];
        var diff = a - b;
        if (diff > 180.0) {
          b += 360;
        }
        else if (diff < -180) {
          b -= 360;
        }
        preparedPoints.push({0:b,1:points[i+1][1],2:points[i+1][2]});
      }
      return preparedPoints;
    }
  }
}

ColorCharm.prototype.linear = function(colors,colorSegments,colorSpace) {
  return this._interpolate(colors,colorSegments,colorSpace.toUpperCase(),'linear');
};

ColorCharm.prototype.bezier = function(colors,colorSegments,colorSpace) {
  return this._interpolate(colors,colorSegments,colorSpace.toUpperCase(),'bezier');
};

ColorCharm.prototype._interpolate = function(colors,colorSegments,colorSpace,method) {
  var points = this._getPoints(colors,colorSpace);

  var generalizedPoints = this._generalize(points);
  var preparedPoints = this._preparePoints(generalizedPoints, colorSpace);


  if (method == "linear" || preparedPoints.length == 2) {
    var generalizedColorList = this.interpolation.linear.call(this,preparedPoints,colorSegments,colorSpace);
  }
  else { // bezier
    var generalizedColorList = this.interpolation.bezier.call(this,preparedPoints,colorSegments,colorSpace);
  }
  this.colorList = this._degeneralize(generalizedColorList, colorSpace);
  this.colorSpace = colorSpace;
  return this;
}

ColorCharm.prototype.toRGB = function() {
  var generalizedColorList = this._generalize(this.colorList);
  var resultList = [];
  var me = this;
  generalizedColorList.map(function(generalizedColor) {
    var rgbColor;
    if (me.colorSpace == "HSV") {
      rgbColor = me.convert.hsv2rgb(generalizedColor[0],generalizedColor[1],generalizedColor[2]);
    }
    else if (me.colorSpace == "HSL") {
      rgbColor = me.convert.hsl2rgb(generalizedColor[0],generalizedColor[1],generalizedColor[2]);
    }
    else if (me.colorSpace == "RGB") {
      rgbColor = {r: Math.round(generalizedColor[0]), g: Math.round(generalizedColor[1]), b:Math.round(generalizedColor[2])};
    }
    else { // HCL
      rgbColor = me.convert.hcl2rgb(generalizedColor[0],generalizedColor[1],generalizedColor[2]);
    }
    resultList.push(rgbColor);
  })
  return resultList;
}

ColorCharm.prototype.toHex = function() {
  var me = this;
  var rgb = this.toRGB();
  var resultList = rgb.map(function (rgb) {return me.convert.rgb2hex(rgb)})
  return resultList;
}


ColorCharm.prototype.generalize = function() {
  return this._generalize(this.colorList);
}
ColorCharm.prototype.return = function() {
  return this.colorList;
}

/**
 * returns an array of RGB colors, linear interpolated
 */
ColorCharm.prototype.interpolation.linear = function(points, colorSegments, colorSpace) {
  var amountOfColors = points.length;

  // we show amountOfColors-1 (last one is added at the end, pure color) in colorSegments-1 steps (last step is the last color)
  var timesteps = (amountOfColors-1) / (colorSegments-1);
  var colors = [];
  var t = 0;
  for (var i = 0; i < colorSegments - 1; i++) {
    t = i * timesteps;
    var from = points[Math.floor(t)];
    var to = points[Math.floor(t) + 1];
    var dx = {0: to[0] - from[0], 1: to[1] - from[1], 2: to[2] - from[2]};

    var generalizedColor = {0: from[0] + dx[0] * (t % 1), 1: from[1] + dx[1] * (t % 1), 2: from[2] + dx[2] * (t % 1)};
    generalizedColor = this.boundColor(generalizedColor, colorSpace);
    colors.push(generalizedColor);
  }
  //last color, here because to is the +1 color
  colors.push(this.boundColor(points[points.length - 1]));
  return colors;
};

ColorCharm.prototype.boundColor = function(color, colorSpace) {
  switch (colorSpace) {
    case "RGB":
      return color;
    case "HSV":
    case "HSL":
    case "HCL":
    default: {
      var hue = (color[0]) % 360;
      if (hue < 0) {
        hue += 360
      }
      return {0: hue, 1: color[1], 2: color[2]};
    }
  }
}

ColorCharm.prototype.interpolation.bezier = function(points,colorSegments, colorSpace) {
  var colors = [];
  for (var i = 0; i < colorSegments; i++) {
    var generalizedColor = {
      0: this.math.generalBezier.call(this,i / (colorSegments - 1), points, "0"),
      1: this.math.generalBezier.call(this,i / (colorSegments - 1), points, "1"),
      2: this.math.generalBezier.call(this,i / (colorSegments - 1), points, "2")
    };
    colors.push(this.boundColor(generalizedColor, colorSpace));
  }
  return colors;
};



ColorCharm.prototype._revertToRGB = function(generalizedColorArray, colorSpace) {
  var rgbColor;
  if (colorSpace == "HSV") {
    rgbColor = this.convert.hsv2rgb(generalizedColor[0],generalizedColor[1],generalizedColor[2]);
  }
  else if (colorSpace == "HSL") {
    rgbColor = this.convert.hsl2rgb(generalizedColor[0],generalizedColor[1],generalizedColor[2]);
  }
  else if (colorSpace == "RGB") {
    rgbColor = {r: Math.round(generalizedColor[0]), g: Math.round(generalizedColor[1]), b:Math.round(generalizedColor[2])};
  }
  else { // HCL
    rgbColor = this.convert.hcl2rgb(generalizedColor[0],generalizedColor[1],generalizedColor[2]);
  }

  return rgbColor;
};



/**
 * This is the generalized equation for bezier curves.
 * @param t
 * @param points     an array of points or an array of objects, field is used to get value
 * @param field
 * @returns {number}
 */
ColorCharm.prototype.math.generalBezier = function(t,points,field) {
  var result = 0;
  var n = points.length - 1;
  var orderFac = this.math.factorial(n);
  for (var i = 0; i < points.length; i++) {
    var factorials = (this.math.factorial(i)*this.math.factorial(n-i));
    var binomialCo = factorials == 0 ? 1 : orderFac / factorials;

    var powerCo = Math.pow(1 - t,n - i);

    if (field !== undefined) {
      result += binomialCo * powerCo * Math.pow(t,i) * points[i][field];
    }
    else {
      result += binomialCo * powerCo * Math.pow(t,i) * points[i];
    }

  }
  return result;
};

/**
 * Calculating a factorial like: 5! = 120
 * @param value
 * @returns {number}
 */
ColorCharm.prototype.math.factorial = function(value) {
  value = Math.floor(value);
  var baseValue = value;
  for (var i = value-1; i > 0; i--) {
    baseValue *= i;
  }
  return baseValue;
};



/**
 * Convert RGB to HSV
 * https://gist.github.com/mjijackson/5311256
 *
 * @param r    [0..255] || object {r:[0..255],g:[0..255],b:[0..255]}
 * @param g    [0..255]
 * @param b    [0..255]
 * @returns {{h: [0..360], s: [0..1], v: [0..1]}}
 * @constructor
 */
ColorCharm.prototype.convert.rgb2hsv = function (r,g,b) {
  if (typeof r == "object") {
    b = r.b;
    g = r.g;
    r = r.r;
  }
  r=r/255; g=g/255; b=b/255;
  var minRGB = Math.min(r,Math.min(g,b));
  var maxRGB = Math.max(r,Math.max(g,b));

  // Black-gray-white
  if (minRGB == maxRGB) {
    return {h:0,s:0,v:minRGB};
  }

  // Colors other than black-gray-white:
  var d = (r==minRGB) ? g-b : ((b==minRGB) ? r-g : b-r);
  var h = (r==minRGB) ? 3 : ((b==minRGB) ? 1 : 5);
  var hue = 60*(h - d/(maxRGB - minRGB));
  var saturation = (maxRGB - minRGB)/maxRGB;
  var value = maxRGB;
  return {h:hue,s:saturation,v:value};
};


/**
 * Convert HSV to RGB
 * http://www.javascripter.net/faq/rgb2hsv.htm
 *
 * @param h   [0..360] || object {h:[0..360],s:[0..1],v:[0..1]}
 * @param s   [0..1]
 * @param v   [0..1]
 * @returns {{r: [0..255], g: [0..255], b: [0..255]}}
 * @constructor
 */
ColorCharm.prototype.convert.hsv2rgb = function(h, s, v) {
  if (typeof h == "object") {
    v = h.v;
    s = h.s;
    h = h.h;
  }

  h = h / 360;

  var r, g, b;

  var i = Math.floor(h * 6);
  var f = h * 6 - i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  return {r:Math.floor(r * 255), g:Math.floor(g * 255), b:Math.floor(b * 255) };
};


/**
 * http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
 *
 * @param {String} hex
 * @returns {{r: [0..255], g: [0..255], b: [0..255]}}
 */
ColorCharm.prototype.convert.hex2rgb = function(hex) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    return r + r + g + g + b + b;
  });
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 *
 * @param r       [0..255] || object {r:[0..255],g:[0..255],b:[0..255]}
 * @param g       [0..255]
 * @param b       [0..255]
 * @returns {string}
 * @constructor
 */
ColorCharm.prototype.convert.rgb2hex = function(r,g,b) {
  if (typeof r == "object") {
    b = r.b;
    g = r.g;
    r = r.r;
  }
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};


/**
 * Convert RGB to Hue Choma Luma
 *
 * @param r      [0..255] || object {r:[0..255],g:[0..255],b:[0..255]}
 * @param g      [0..255]
 * @param b      [0..255]
 * @returns {{h: [0..360], -1 as undefined, c: [0..1], l: [0..1]}}
 * @constructor
 */
ColorCharm.prototype.convert.rgb2hcl = function(r,g,b) {
  if (typeof r == "object") {
    b = r.b;
    g = r.g;
    r = r.r;
  }

  var maxRGB = Math.max(r,b,g);
  var minRGB = Math.min(r,b,g);

  var chroma = (maxRGB - minRGB) / 255;
  var luma = (0.3*r + 0.59*g + 0.11*b) / 255;

  //var lightness = 0.5 * (maxVal - minVal);
  var d = (r==minRGB) ? g-b : ((b==minRGB) ? r-g : b-r);
  var h = (r==minRGB) ? 3 : ((b==minRGB) ? 1 : 5);
  var hue;
  if (maxRGB == minRGB) {
    hue = -1;
  }
  else {
    hue = 60*(h - d/(maxRGB - minRGB));
  }

  return {h:hue, c:chroma, l:luma};
};


/**
 * Convert Hue Choma Luma to RGB, some values are out of gamut and are collaped to RGB space
 *
 * @param hue       [0..360], -1 as undefined
 * @param chroma    [0..1]
 * @param luma      [0..1]
 * @returns {{r: [0..255], g: [0..255], b: [0..255]}}
 * @constructor
 */
ColorCharm.prototype.convert.hcl2rgb = function(hue,chroma,luma) {
  if (typeof hue == "object") {
    luma = hue.l;
    chroma = hue.c;
    hue = hue.h;
  }

  var r, g, b;

  if (hue < 0) {
    r = 0; g = 0; b = 0;
  }
  else {
    var dHue = hue/60;
    var C = chroma;
    var X = C * (1 - Math.abs((dHue % 2) - 1));

    if (dHue < 1) {r = C; g = X; b = 0;}
    else if (dHue < 2) {r = X; g = C; b = 0;}
    else if (dHue < 3) {r = 0; g = C; b = X;}
    else if (dHue < 4) {r = 0; g = X; b = C;}
    else if (dHue < 5) {r = X; g = 0; b = C;}
    else if (dHue < 6) {r = C; g = 0; b = X;}
  }
  var m = luma - (0.3*r + 0.59*g + 0.11*b);

  r += m;
  g += m;
  b += m;

  // some values are outside of GAMUT
  r = Math.max(0,Math.min(255,Math.round(255*r)));
  g = Math.max(0,Math.min(255,Math.round(255*g)));
  b = Math.max(0,Math.min(255,Math.round(255*b)));

  return {r:r, g:g, b:b};
};

/**
 * http://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
ColorCharm.prototype.convert.hsl2rgb = function(h, s, l){
  if (typeof h == "object") {
    l = h.l;
    s = h.s;
    h = h.h;
  }
  var r, g, b;
  h = h / 360;

  if(s == 0){
    r = g = b = l; // achromatic
  }else{
    var hue2rgb = function hue2rgb(p, q, t){
      if(t < 0) t += 1;
      if(t > 1) t -= 1;
      if(t < 1/6) return p + (q - p) * 6 * t;
      if(t < 1/2) return q;
      if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {r:Math.round(r * 255), g: Math.round(g * 255), b : Math.round(b * 255)};
}


/**
 * http://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   [Number]  r    |   The red color value
 * @param   [Number]  g    |   The green color value
 * @param   [Number]  b    |   The blue color value
 * @return  [Array]           The HSL representation
 */
ColorCharm.prototype.convert.rgb2hsl = function(r, g, b){
  if (typeof r == "object") {
    b = r.b;
    g = r.g;
    r = r.r;
  }

  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b);
  var min = Math.min(r, g, b);
  var h = (max + min) / 2;
  var s = (max + min) / 2;
  var l = (max + min) / 2;

  if(max == min){
    h = s = 0; // achromatic
  }else{
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max){
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  h *= 360;
  return {h:h, s:s, l:l};
}