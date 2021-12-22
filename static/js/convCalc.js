var x = 0;
var timeoutID = "";

var ixSelOut = 0;
var iySelOut = 0;
var izSelOut = 0;
var selected = [];

class Path {
    constructor(idStr, pts, isGrid) {
        this.idStr = idStr;
        this.pts = pts;
        this.isGrid = isGrid;
    }

    // Method
    svgStr() {
        var s = '';

        s += '<path id="' + this.idStr + '"';

        if (this.isGrid) {
            s += ' style="fill-rule:nonzero;fill:rgb(0%,0%,0%);fill-opacity:0;stroke-width:0.2;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:10;"';
        } else {
            s += ' style="fill-opacity:0;fill:rgb(0%,0%,100%);stroke-width:0.1;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(0%,0%,0%);stroke-opacity:0;stroke-miterlimit:10;"';
        }

        if (this.pts.length > 0) {
            s += ' d="';

            this.pts.forEach(function(item, index, array) {
                if (index == 0) {
                    s += 'M ';
                } else {
                    s += 'L ';
                }

                s += item[0] + ' ' + item[1] + ' ';
            });

            s += '"';
        }

        s += '/>';

        return s;
    }
}

class Face {
    constructor(w_translate, h_translate, box_dim) {
        this.w_translate = w_translate;
        this.h_translate = h_translate;
        this.box_dim = box_dim;
    }
}

let nx = 3;
let ny = 9;
let nz = 9;

let ny_pad = 0;
let nz_pad = 0;

let face = new Face(30, 20, 50);
let w_top_left_canvas = 100;
let h_top_left_canvas = 100;

let padding = 0;
let nFilters = 2;
let filter_size = 3;
let stride = 2;

function drawFaceTop(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz, face, isGrid) {
    let w_top_left = w_top_left_canvas + ix*face.box_dim + iz*face.w_translate;
    let h_top_left = h_top_left_canvas + iy*face.box_dim + iz*face.h_translate;

    let pts = [
        [w_top_left, h_top_left],
        [w_top_left + face.box_dim, h_top_left],
        [w_top_left + face.box_dim + face.w_translate, h_top_left + face.h_translate],
        [w_top_left + face.w_translate, h_top_left + face.h_translate],
        [w_top_left, h_top_left]
        ];
    return new Path(idStr, pts, isGrid);
}

function drawFaceLeft(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz, face, isGrid) {
    let w_top_left = w_top_left_canvas + iz*face.w_translate + ix*face.box_dim;
    let h_top_left = h_top_left_canvas + iz*face.h_translate + iy*face.box_dim;

    let pts = [
        [w_top_left, h_top_left],
        [w_top_left + face.w_translate, h_top_left + face.h_translate],
        [w_top_left + face.w_translate, h_top_left + face.h_translate + face.box_dim],
        [w_top_left, h_top_left + face.box_dim],
        [w_top_left, h_top_left]
        ];
    return new Path(idStr, pts, isGrid);
}

function drawFaceFront(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz, face, isGrid) {
    let w_top_left = w_top_left_canvas + ix*face.box_dim + (1+iz) * face.w_translate;
    let h_top_left = h_top_left_canvas + iy*face.box_dim + (1+iz) * face.h_translate;

    let pts = [
        [w_top_left, h_top_left],
        [w_top_left + face.box_dim, h_top_left],
        [w_top_left + face.box_dim, h_top_left + face.box_dim],
        [w_top_left, h_top_left + face.box_dim],
        [w_top_left, h_top_left]
        ];
    return new Path(idStr, pts, isGrid);
}

function startTimer() {
    x = x + 1;
    $( "#to_display" ).html( "Next: " + x )
    /*
    var password = document.getElementById('password').value;
    if (password == "123")
        top.location.href="./file.pdf";
    else 
        window.location.reload();
    */

    /*
  // get the contents of the link that was clicked
    var linkText = $(this).text();
    */

    timeoutID = setTimeout(startTimer, 1000);
}

function stopTimer() {
    clearTimeout(timeoutID);
}

function loadSVG() {
    $('#ccSVG').load('img/convCalc.svg');
}

function svgUnselectAll() {
    selected.forEach(function(item, index, array) {
        $(item).css("fill-opacity","0");
        $(item).css("stroke-opacity","0");
    })

    selected = [];
}

function svgSelect(ix, iy, iz, loc, inOut) {
    var idStr = '#' + getIdStr(ix,iy,iz,loc,'sel',inOut);
    $(idStr).css("fill-opacity","0.25");
    $(idStr).css("stroke-opacity","1");
    selected.push(idStr);
}

function svgAnimateStart() {
    if (timeoutID != "") {
        return;
    }
    svgAnimateLoop();
}

function svgAnimateLoop() {
    svgUnselectAll();

    // Output dimensions
    let nzOut = (nz - filter_size + 2*padding)/stride + 1;
    let nyOut = (ny - filter_size + 2*padding)/stride + 1;
    let nxOut = nFilters;

    // Next in z direction
    izSelOut += 1;

    // Check in bounds
    if (izSelOut >= nzOut) {
        // Next in y direction
        iySelOut += 1;
        izSelOut = 0;
    }
    if (iySelOut >= nyOut) {
        // Next in x direction
        ixSelOut += 1;
        iySelOut = 0;
        izSelOut = 0;
    }
    if (ixSelOut >= nxOut) {
        // Reset
        ixSelOut = 0;
        iySelOut = 0;
        izSelOut = 0;
    }

    // Selection in input
    iySelIn = stride * iySelOut;
    izSelIn = stride * izSelOut;

    // Select all filters

    // Top
    let iy_top = iySelIn;
    for (let ix = 0; ix < nx; ix++) { 
        for (let iz = izSelIn; iz < (izSelIn+filter_size); iz++) {
            svgSelect(ix, iy_top, iz, 'top', 'in');
        }
    }

    // Left
    let ix_left = 0;
    for (let iy = iySelIn; iy < (iySelIn+filter_size); iy++) {
        for (let iz = izSelIn; iz < (izSelIn+filter_size); iz++) {
            svgSelect(ix_left, iy, iz, 'left', 'in');
        }
    }

    // Front
    let iz_front = izSelIn + filter_size - 1;
    for (let ix = 0; ix < nx; ix++) { 
        for (let iy = iySelIn; iy < (iySelIn+filter_size); iy++) {
            svgSelect(ix, iy, iz_front, 'front', 'in');
        }
    }

    // Output side
    svgSelect(ixSelOut, iySelOut, izSelOut, 'front', 'out');
    svgSelect(ixSelOut, iySelOut, izSelOut, 'left', 'out');
    svgSelect(ixSelOut, iySelOut, izSelOut, 'top', 'out');

    timeoutID = setTimeout(svgAnimateLoop, 500);
}

function svgAnimateStop() {
    clearTimeout(timeoutID);
    timeoutID = "";
}

function svgCreateStr(width, height, paths) {
    var svgStr = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n';
    svgStr += '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" viewBox="0 0 ' + String(width) + ' ' + String(height) + '">\n';
    
    paths.forEach(function(item, index, array) {
        svgStr += item.svgStr() + '\n';
    })
    
    svgStr += '</svg>';

    return svgStr;
}

function getIdStr(ix, iy, iz, loc, obj, inOut) {
    return String(ix).padStart(3, '0') + '_' + String(iy).padStart(3, '0') + '_' + String(iz).padStart(3, '0') + '_' + inOut + '_' + loc + '_' + obj;
}

function svgDrawGrid(nx, ny, nz, ny_pad, nz_pad, face, w_top_left_canvas, h_top_left_canvas, inOut) {
    var paths = [];
    let isGrid = true;
    var idStr = "";

    // Top
    let iy_level = ny_pad;
    for (let ix = 0; ix < nx; ix++) { 
        for (let iz = nz_pad; iz < nz+nz_pad; iz++) {
            idStr = getIdStr(ix,iy_level,iz,'top','grid',inOut);
            paths.push(drawFaceTop(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy_level, iz, face, isGrid));
        }
    }

    // Left
    let ix_level = 0;
    for (let iy = ny_pad; iy < ny+ny_pad; iy++) { 
        for (let iz = nz_pad; iz < nz+nz_pad; iz++) {
            idStr = getIdStr(ix_level,iy,iz,'left','grid',inOut);
            paths.push(drawFaceLeft(idStr, w_top_left_canvas, h_top_left_canvas, ix_level, iy, iz, face, isGrid));
        }
    }

    // Front
    let iz_level = nz_pad + nz - 1;
    for (let ix = 0; ix < nx; ix++) { 
        for (let iy = ny_pad; iy < ny+ny_pad; iy++) { 
            idStr = getIdStr(ix,iy,iz_level,'front','grid',inOut);
            paths.push(drawFaceFront(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz_level, face, isGrid));
        }
    }

    return paths;
}

function svgDrawSel(nx, ny, nz, ny_pad, nz_pad, face, w_top_left_canvas, h_top_left_canvas, inOut) {
    var paths = [];
    let isGrid = false;
    var idStr = "";

    for (let ix = 0; ix < nx; ix++) { 
        for (let iy = 0; iy < ny+2*ny_pad; iy++) { 
            for (let iz = 0; iz < nz+2*nz_pad; iz++) {
                idStr = getIdStr(ix,iy,iz,'top','sel',inOut);
                paths.push(drawFaceTop(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz, face, isGrid));
                
                idStr = getIdStr(ix,iy,iz,'left','sel',inOut);
                paths.push(drawFaceLeft(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz, face, isGrid));
                
                idStr = getIdStr(ix,iy,iz,'front','sel',inOut);
                paths.push(drawFaceFront(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz, face, isGrid));
            }
        }
    }

    return paths;
}

function svgDraw() {

    // Draw input
    let pathsGrid = svgDrawGrid(nx, ny, nz, ny_pad, nz_pad, face, w_top_left_canvas, h_top_left_canvas, 'in');
    let pathsSel = svgDrawSel(nx, ny, nz, ny_pad, nz_pad, face, w_top_left_canvas, h_top_left_canvas, 'in');
    var paths = pathsSel.concat(pathsGrid);

    // Draw output
    let nzOut = (nz - filter_size + 2*padding)/stride + 1;
    let nyOut = (ny - filter_size + 2*padding)/stride + 1;
    console.log('nzOut', nzOut);
    console.log('nyOut', nyOut);
    let nxOut = nFilters;
    let nyPadOut = 0;
    let nzPadOut = 0;

    let pathsGridOut = svgDrawGrid(nxOut, nyOut, nzOut, nyPadOut, nzPadOut, face, w_top_left_canvas+500, h_top_left_canvas, 'out');
    let pathsSelOut = svgDrawSel(nxOut, nyOut, nzOut, nyPadOut, nzPadOut, face, w_top_left_canvas+500, h_top_left_canvas, 'out');
    paths = paths.concat(pathsSelOut);
    paths = paths.concat(pathsGridOut);

    // Draw
    let svgStr = svgCreateStr(1000,800,paths);
    $('#ccSVG').html(svgStr);
}