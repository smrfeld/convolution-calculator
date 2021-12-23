var x = 0;
var timeoutID = "";

let gridFillRGB = 'rgb(90%,90%,90%)';
let gridFillOpacity = '0.8';
let gridStrokeOpacity = '1';

let selFillOpacity = '1';
let selStrokeOpacity = '1';
let selFillInvalidRGB = "rgb(100%,50%,50%)";

function selFillValidRGB(iFilter, nFilters) {
    let blueVal = 70 + 30*((nFilters-iFilter-1)/(nFilters-1));
    return 'rgb(50%,50%,' + String(blueVal) + '%)';
}

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
            s += ' style="fill-rule:nonzero;fill:'+gridFillRGB+';fill-opacity:'+gridFillOpacity+';stroke-width:0.1;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(0%,0%,0%);stroke-opacity:'+gridStrokeOpacity+';stroke-miterlimit:10;"';
        } else {
            s += ' style="fill-opacity:0;fill:rgb(0%,0%,100%);stroke-width:0.2;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(0%,0%,0%);stroke-opacity:0;stroke-miterlimit:10;"';
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

let n_pad_end = 1;

let face = new Face(30, 20, 50);
let w_top_left_canvas = 100;
let h_top_left_canvas = 100;

let padding = 0;
let nFilters = 2;
let filter_size = 4;
let stride = 2;

var ixSelOut = 0;
var iySelOut = 0;
var izSelOut = -1;

var selected = [];
var gridHidden = [];

var idsBottomLayer = [];

function nFiltersAdd() {
    svgAnimateStop();

    nFilters += 1;
    $('#ccnFilters').html(String(nFilters));

    // Draw & animate
    svgResetAndRedraw();
}

function nFiltersSub() {
    svgAnimateStop();

    nFilters -= 1;
    nFilters = Math.max(nFilters,1);
    $('#ccnFilters').html(String(nFilters));

    // Draw & animate
    svgResetAndRedraw();
}

function svgResetAndRedraw() {
    svgDraw();

    // Check filter selection
    ixSelOut = Math.min(ixSelOut,nFilters-1);

    if (timeoutID != "") {  
        // Restart animate
        svgAnimateStart();
    } else {
        // Redraw
        svgAnimateLoopDraw();
    }
}

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

function svgSelect(ix, iy, iz, loc, inOut, iFilter, isValid) {
    var idStr = '#' + getIdStr(ix,iy,iz,loc,'sel',inOut);

    // Turn opacity on
    $(idStr).css("fill-opacity",selFillOpacity);
    $(idStr).css("stroke-opacity",selStrokeOpacity);

    // Color
    if (isValid) {
        $(idStr).css("fill",selFillValidRGB(iFilter, nFilters));
    } else {
        // If invalid, color = red
        $(idStr).css("fill",selFillInvalidRGB);
    }

    selected.push(idStr);
}

function svgGridHide(ix, iy, iz, loc, inOut) {
    var idStr = '#' + getIdStr(ix,iy,iz,loc,'grid',inOut);
    $(idStr).css("fill-opacity","0");
    $(idStr).css("stroke-opacity","0");
    
    gridHidden.push(idStr);
}

function svgAnimateStart() {
    if (timeoutID != "") {
        return;
    }
    svgAnimateLoop();
}

function svgAnimateLoopIncrement() {
    // Output dimensions
    let nzOut = Math.ceil((nz - filter_size + 2*padding)/stride + 1);
    let nyOut = Math.ceil((ny - filter_size + 2*padding)/stride + 1);
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
}

function svgAnimateLoopDraw() {

    // Selection in input
    iySelIn = stride * iySelOut;
    izSelIn = stride * izSelOut;

    // Correct the order of the grid drawing
    var idsBottomLayerNew = []
    // IF the selection is sticking out in the z direction
    if (izSelIn + filter_size > nz) {
        // Hide all the grid front elements below
        for (let ix = 0; ix < nx; ix++) { 
            for (let iy=iySelIn+filter_size; iy < ny; iy++) {
                idsBottomLayerNew.push(getIdStr(ix,iy,nz-1,'front','grid','in'));
            }
        }
    }
    if (idsBottomLayerNew.toString() != idsBottomLayer.toString()) {
        // Redraw grid to correct order for selection that is sticking out the front
        console.log("Redrawing grid to correct order for selection that is sticking out the front");
        console.log('idsBottomLayer',idsBottomLayer);
        console.log('idsBottomLayerNew',idsBottomLayerNew);

        idsBottomLayer = idsBottomLayerNew;
        svgDraw();
    }

    // Undo existing drawing
    selected.forEach(function(item, index, array) {
        $(item).css("fill-opacity","0");
        $(item).css("stroke-opacity","0");
    });
    selected = [];

    gridHidden.forEach(function(item, index, array) {
        $(item).css("fill-opacity",gridFillOpacity);
        $(item).css("stroke-opacity",gridStrokeOpacity);
    });
    gridHidden = [];

    // Filter index
    let iFilter = ixSelOut;    

    // Check if valid
    if (izSelIn + filter_size > nz) {
        // Not valid
        isValid = false;
    } else if (iySelIn + filter_size > ny) {
        // Not valid
        isValid = false;
    } else {
        // Valid
        isValid = true;
    }

    // Input top
    let iy_top = iySelIn;
    for (let ix = 0; ix < nx; ix++) { 
        for (let iz = izSelIn; iz < (izSelIn+filter_size); iz++) {
            svgSelect(ix, iy_top, iz, 'top', 'in', iFilter, isValid);

            if (iy_top == 0) {
                svgGridHide(ix, 0, iz, 'top', 'in');
            }
        }
    }

    // Input left
    let ix_left = 0;
    for (let iy = iySelIn; iy < (iySelIn+filter_size); iy++) {
        for (let iz = izSelIn; iz < (izSelIn+filter_size); iz++) {
            svgSelect(ix_left, iy, iz, 'left', 'in', iFilter, isValid);
            svgGridHide(ix_left, iy, iz, 'left', 'in');
        }
    }

    // Input front
    let iz_front = izSelIn + filter_size - 1;
    for (let ix = 0; ix < nx; ix++) { 
        for (let iy = iySelIn; iy < (iySelIn+filter_size); iy++) {
            svgSelect(ix, iy, iz_front, 'front', 'in', iFilter, isValid);

            // Hide if over the edge
            if (iz_front > nz-1) {
                svgGridHide(ix, iy, nz-1, 'front', 'in');
            }
        }
    }

    // Output side
    svgSelect(ixSelOut, iySelOut, izSelOut, 'front', 'out', iFilter, isValid);
    svgSelect(ixSelOut, iySelOut, izSelOut, 'left', 'out', iFilter, isValid);
    svgSelect(ixSelOut, iySelOut, izSelOut, 'top', 'out', iFilter, isValid);

    if (ixSelOut == 0) {
        svgGridHide(0, iySelOut, izSelOut, 'left', 'out');
    }

    let nzOut = Math.ceil((nz - filter_size + 2*padding)/stride + 1);
    if (izSelOut == nzOut-1) {
        svgGridHide(ixSelOut, iySelOut, nzOut-1, 'front', 'out');
    }

    if (iySelOut == 0) {
        svgGridHide(ixSelOut, 0, izSelOut, 'top', 'out');
    }
}

function svgAnimateLoopStep() {
    // Increment
    svgAnimateLoopIncrement();

    // Draw
    svgAnimateLoopDraw();
}

function svgAnimateLoop() {
    svgAnimateLoopStep();
    timeoutID = setTimeout(svgAnimateLoop, 100);
}

function svgAnimateStop() {
    if (timeoutID != "") {
        clearTimeout(timeoutID);
    }
    timeoutID = "";
}

function svgCreateStr(width, height, pathsGridIn, pathsSelIn, pathsGridOut, pathsSelOut) {
    var svgStr = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n';
    svgStr += '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" viewBox="0 0 ' + String(width) + ' ' + String(height) + '">\n';
    
    // Bottom paths first
    idsBottomLayer.forEach(function(item, index, array) {
        if (pathsGridIn.has(item)) {
            svgStr += pathsGridIn.get(item).svgStr() + '\n';
            pathsGridIn.delete(item);
        } else if (pathsSelIn.has(item)) {
            svgStr += pathsSelIn.get(item).svgStr() + '\n';
            pathsSelIn.delete(item);
        } else if (pathsGridOut.has(item)) {
            svgStr += pathsGridOut.get(item).svgStr() + '\n';
            pathsGridOut.delete(item);
        } else if (pathsSelOut.has(item)) {
            svgStr += pathsSelOut.get(item).svgStr() + '\n';
            pathsSelOut.delete(item);
        }
    });

    // Draw selection first, then grid on top
    pathsSelIn.forEach(function(value,key) {
        svgStr += value.svgStr() + '\n';
    });
    pathsSelOut.forEach(function(value,key) {
        svgStr += value.svgStr() + '\n';
    });
    pathsGridIn.forEach(function(value,key) {
        svgStr += value.svgStr() + '\n';
    });
    pathsGridOut.forEach(function(value,key) {
        svgStr += value.svgStr() + '\n';
    });
    
    svgStr += '</svg>';

    return svgStr;
}

function getIdStr(ix, iy, iz, loc, obj, inOut) {
    return String(ix).padStart(3, '0') + '_' + String(iy).padStart(3, '0') + '_' + String(iz).padStart(3, '0') + '_' + inOut + '_' + loc + '_' + obj;
}

function svgDrawGrid(nx, ny, nz, face, w_top_left_canvas, h_top_left_canvas, inOut) {
    const paths = new Map();

    let isGrid = true;
    var idStr = "";

    // Top
    let iy_level = 0;
    for (let ix = 0; ix < nx; ix++) { 
        for (let iz = 0; iz < nz; iz++) {
            idStr = getIdStr(ix,iy_level,iz,'top','grid',inOut);
            paths.set(idStr, drawFaceTop(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy_level, iz, face, isGrid));
        }
    }

    // Left
    let ix_level = 0;
    for (let iy = 0; iy < ny; iy++) { 
        for (let iz = 0; iz < nz; iz++) {
            idStr = getIdStr(ix_level,iy,iz,'left','grid',inOut);
            paths.set(idStr, drawFaceLeft(idStr, w_top_left_canvas, h_top_left_canvas, ix_level, iy, iz, face, isGrid));
        }
    }

    // Front
    let iz_level =  nz - 1;
    for (let ix = 0; ix < nx; ix++) { 
        for (let iy = 0; iy < ny; iy++) { 
            idStr = getIdStr(ix,iy,iz_level,'front','grid',inOut);
            paths.set(idStr, drawFaceFront(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz_level, face, isGrid));
        }
    }

    return paths;
}

function svgDrawSel(nx, ny, nz, n_pad_end, face, w_top_left_canvas, h_top_left_canvas, inOut) {
    const paths = new Map();

    let isGrid = false;
    var idStr = "";

    for (let ix = 0; ix < nx; ix++) { 
        for (let iy = 0; iy < ny+n_pad_end; iy++) { 
            for (let iz = 0; iz < nz+n_pad_end; iz++) {
                idStr = getIdStr(ix,iy,iz,'top','sel',inOut);
                paths.set(idStr, drawFaceTop(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz, face, isGrid));
                
                idStr = getIdStr(ix,iy,iz,'left','sel',inOut);
                paths.set(idStr, drawFaceLeft(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz, face, isGrid));
                
                idStr = getIdStr(ix,iy,iz,'front','sel',inOut);
                paths.set(idStr, drawFaceFront(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz, face, isGrid));
            }
        }
    }

    return paths;
}

function svgDraw() {

    // Draw input
    let pathsGridIn = svgDrawGrid(nx, ny, nz, face, w_top_left_canvas, h_top_left_canvas, 'in');
    let pathsSelIn = svgDrawSel(nx, ny, nz, n_pad_end, face, w_top_left_canvas, h_top_left_canvas, 'in');

    // Draw output
    let nzOut = Math.ceil((nz - filter_size + 2*padding)/stride + 1);
    let nyOut = Math.ceil((ny - filter_size + 2*padding)/stride + 1);
    let nxOut = nFilters;
    let nPadEndOut = 0;

    let pathsGridOut = svgDrawGrid(nxOut, nyOut, nzOut, face, w_top_left_canvas+500, h_top_left_canvas, 'out');
    let pathsSelOut = svgDrawSel(nxOut, nyOut, nzOut, nPadEndOut, face, w_top_left_canvas+500, h_top_left_canvas, 'out');

    // Draw
    let svgStr = svgCreateStr(1000,800,pathsGridIn,pathsSelIn,pathsGridOut,pathsSelOut);
    $('#ccSVG').html(svgStr);
}