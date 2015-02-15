/**
 * Created by Alex on 1/15/2015.
 */
var color;
var container;
var items0 = [];
var items1 = [];
var items2 = [];
var width = 800;
var height = 50;
var colorSegments = 40;
var startTime = new Date().valueOf();

function createDiv(container, color, width, height) {
  var div = document.createElement("div");
  div.style.width = width + 'px';
  div.style.height = height + 'px';
  div.style.backgroundColor = color;
  div.style.float = "left";
  container.appendChild(div);
}


function onDraw() {
  container = document.getElementById("container");


  var colors = [
    //['#ffffff','#fedb00','#ff0000','#000000'],
    //['#000000','#ff0000','#fedb00','#ffffff'],
    //['#ffffe0','#ff4122','#ff1d84','#8b0000'],
    ['#ffffe0','#3f9583','#000086'],
    //['#0c2c84','#ffffcc'],
    //['#005a32','#ffffcc'],
    //['#7a0177','#ffffcc'],
  ]

  color = new ColorCharm();
  //var colorSeriesRGB = color.linear(colors,colorSegments,'rgb').toRGB();
  //var colorSeriesHSV = color.linear(colors,colorSegments,'hsv').toRGB();
  //var colorSeriesHSL = color.linear(colors,colorSegments,'hsl').toRGB();
  var colorSeriesHCL = color.linear(colors,colorSegments,'hcl').toRGB();

  //var colorSeriesRGBbezier = color.bezier(colors,colorSegments,'rgb').toRGB();
  //var colorSeriesHSVbezier = color.bezier(colors,colorSegments,'hsv').toRGB();
  //var colorSeriesHSLbezier = color.bezier(colors,colorSegments,'hsl').toRGB();
  var colorSeriesHCLbezier = color.bezier(colors,colorSegments,'hcl').toRGB();

  //createGradient(color,colorSeriesRGB, container);
  //createGradient(color,colorSeriesHSV, container);
  //createGradient(color,colorSeriesHSL, container);
  createGradient(color,colorSeriesHCL, container);

  //createGradient(color,colorSeriesRGBbezier, container);
  //createGradient(color,colorSeriesHSVbezier, container);
  //createGradient(color,colorSeriesHSLbezier, container);
  createGradient(color,colorSeriesHCLbezier, container);

  //var colorPlot = color.bezier(colors,colorSegments,'hcl').generalize();
  //for (var i = 0; i < colorPlot.length; i++) {
  //  items0.push({x:startTime + i*1e5,y:colorPlot[i][0]})
  //  items1.push({x:startTime + i*1e5,y:colorPlot[i][1]})
  //  items2.push({x:startTime + i*1e5,y:colorPlot[i][2]})
  //}
  //drawGraphs();
}

function createGradient(color, colorSeries, container) {
  var gradientContainer = document.createElement("div"); gradientContainer.className = 'gradient';
  container.appendChild(gradientContainer);
  for (var i = 0; i < colorSeries.length; i++) {
    createDiv(gradientContainer, color.convert.rgb2hex(colorSeries[i]), width/colorSegments, height);
  }
}



function getMinMax(arr, key) {
  var _min = arr[0][key];
  var _max = arr[0][key];
  for (var i = 0; i < arr.length; i++) {
    _min = _min > arr[i][key] ? arr[i][key] : _min;
    _max = _max < arr[i][key] ? arr[i][key] : _max;
  }
  return {min:_min, max:_max};
}

function drawGraphs() {
  var times = getMinMax(items0, 'x');
  var options = {
    start: times.min,
    end: times.max,
    height: '250px',
    catmullRom:false,
    showMajorLabels: false,
    showMinorLabels: false,
    showCurrentTime:false
  };

  var groups = new vis.DataSet();
  groups.add({
    id: 2,
    content: "guide2",
    options: {
      drawPoints: {style:'circle'}
    }});
  groups.add({
    id: 1,
    content: "guide",
    options: {
      drawPoints: false
    }});
  groups.add({
    id: 0,
    content: "data",
    options: {
      drawPoints: {style:'circle'}
    }});

  appendLinearLine(items0);
  appendLinearLine(items1);
  appendLinearLine(items2);

  var graph2dH = new vis.Graph2d(document.getElementById('graph2dH'), items0, groups, options);
  var graph2dS = new vis.Graph2d(document.getElementById('graph2dS'), items1, groups, options);
  var graph2dV = new vis.Graph2d(document.getElementById('graph2dV'), items2, groups, options);
}

function appendLinearLine(data) {
  data.push({x:data[data.length-1].x, y:data[data.length-1].y, group:'1'});
  data.push({x:data[0].x,             y:data[0].y,             group:'1'});
}
