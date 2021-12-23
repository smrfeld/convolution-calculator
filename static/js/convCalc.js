var x = 0;
var timeoutID = "";

let gridFillRGB = 'rgb(90%,90%,90%)';
let gridFillOpacity = '0.8';
let gridStrokeOpacity = '1';

let gridPaddingFillRGB = 'rgb(80%,80%,80%)';
let gridPaddingFillOpacity = '0.8';

let selFillOpacity = '1';
let selStrokeOpacity = '1';
let selFillInvalidRGB = "rgb(100%,50%,50%)";

function selFillValidRGB(iFilter, nFilters) {
    let blueVal = 70 + 30*((nFilters-iFilter-1)/(nFilters-1));
    return 'rgb(50%,50%,' + String(blueVal) + '%)';
}

class Path {
    constructor(idStr, pts, isGrid, isPadding) {
        this.idStr = idStr;
        this.pts = pts;
        this.isGrid = isGrid;
        this.isPadding = isPadding;
    }

    // Method
    svgStr() {
        var s = '';

        s += '<path id="' + this.idStr + '"';

        if (this.isGrid) {
            if (this.isPadding) {
                s += ' style="fill-rule:nonzero;fill:'
                    +gridPaddingFillRGB+';fill-opacity:'
                    +gridPaddingFillOpacity+';stroke-width:0.1;stroke-linecap:butt;\
                    stroke-linejoin:miter;stroke:rgb(0%,0%,0%);stroke-opacity:'
                    +gridStrokeOpacity+';stroke-miterlimit:10;"';
            } else {
                s += ' style="fill-rule:nonzero;fill:'
                    +gridFillRGB+';fill-opacity:'
                    +gridFillOpacity+';stroke-width:0.1;stroke-linecap:butt;\
                    stroke-linejoin:miter;stroke:rgb(0%,0%,0%);stroke-opacity:'
                    +gridStrokeOpacity+';stroke-miterlimit:10;"';
                }
        } else {
            s += ' style="fill-opacity:0;fill:rgb(0%,0%,100%);\
                stroke-width:0.2;stroke-linecap:butt;stroke-linejoin:miter;\
                stroke:rgb(0%,0%,0%);stroke-opacity:0;stroke-miterlimit:10;"';
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

class Params {
    constructor(nx, nyInput, nzInput, padding, nFilters, filterSize, stride) {
        this.nx = nx;
        this.nyInput = nyInput;
        this.nzInput = nzInput;
        this.padding = padding;
        this.nFilters = nFilters;
        this.filterSize = filterSize;
        this.stride = stride;

        this.recalculate();
    }

    recalculate() {
        // Input dimensions to draw
        this.nyIn = this.nyInput + 2*this.padding;
        this.nzIn = this.nzInput + 2*this.padding;

        // Sub-cube sizes
        this.nySub = Math.min(this.nyIn, this.stride + this.filterSize + 1);
        this.nzSub = Math.min(this.nzIn, this.stride + this.filterSize + 1);

        // Face
        this.nzSep = 6;
        let wSep = 20;
        let faceBoxDim = 50;
        let faceDx = (this.nx * faceBoxDim + wSep) / this.nzSep;
        let faceDy = 15;
        this.face = new Face(faceDx, faceDy, faceBoxDim);

        // Output dimensions
        this.nzOut = Math.ceil((this.nzIn - this.filterSize + 2*this.padding)/this.stride + 1);
        this.nyOut = Math.ceil((this.nyIn - this.filterSize + 2*this.padding)/this.stride + 1);
        this.nxOut = this.nFilters;

        // Padding for drawing hidden parts
        let nyInCalculatedFromNyOut = this.stride*this.nyOut + this.padding;
        let nzInCalculatedFromNyOut = this.stride*this.nzOut + this.padding;
        this.nyPadEndIn = nyInCalculatedFromNyOut - this.nyIn;
        this.nzPadEndIn = nzInCalculatedFromNyOut - this.nzIn;

        // Selection
        this.ixSelOut = 0;
        this.iySelOut = 0;
        this.izSelOut = -1;

        // Drawing parameters
        this.w_top_left_canvas = 100;
        this.h_top_left_canvas = 100;
    }

    checkSelectionValid() {
        this.ixSelOut = Math.min(this.ixSelOut, this.nFilters-1);
        this.iySelOut = Math.min(this.iySelOut, this.nyOut-1);
        this.izSelOut = Math.min(this.izSelOut, this.nzOut-1);
    }

    svgIncrementSelz() {    
        this.izSelOut += 1;
        if (this.nzOut > 4) {
            // Break in z direction
            // Only allowed indexes are 0,1 or nzOut-2, nzOut-1
            if ((this.izSelOut > 1) && (this.izSelOut < this.nzOut-2)) {
                this.izSelOut = this.nzOut-2;
            } 
        }
    }    

    svgIncrementSely() {    
        this.iySelOut += 1;
        if (this.nyOut > 4) {
            // Break in y direction
            // Only allowed indexes are 0,1 or nyOut-2, nyOut-1
            if ((this.iySelOut > 1) && (this.iySelOut < this.nyOut-2)) {
                this.iySelOut = this.nyOut-2;
            } 
        }
    }

    // svgAnimateLoopIncrement() {
    svgIncrementSel() {

        // Next in z direction
        this.svgIncrementSelz();
    
        // Check in bounds
        if (this.izSelOut >= this.nzOut) {
            // Next in y direction
            this.svgIncrementSely();
            this.izSelOut = 0;
        }
        if (this.iySelOut >= this.nyOut) {
            // Next in x direction
            this.ixSelOut += 1;
            this.iySelOut = 0;
            this.izSelOut = 0;
        }
        if (this.ixSelOut >= this.nxOut) {
            // Reset
            this.ixSelOut = 0;
            this.iySelOut = 0;
            this.izSelOut = 0;
        }
    }
}

class DrawingSelections {
    constructor() {
        // Selection and unselection for drawing
        this.selected = [];
        this.gridHidden = [];
        this.idsBottomLayer = [];
    }

    svgAnimateLoopDraw(p) {

        // Selection in input
        let iySelIn = p.stride * p.iySelOut;
        let izSelIn = p.stride * p.izSelOut;
    
        // Correct the order of the grid drawing
        var idsBottomLayerNew = []
        // IF the selection is sticking out in the z direction
        if (izSelIn + p.filterSize > p.nzIn) {
            console.log("Selection is sticking out in the z direction; hiding some of the grid");
            // Hide all the grid front elements below
            for (let ix = 0; ix < p.nx; ix++) { 
                for (let iy= iySelIn + p.filterSize; iy < p.nyIn; iy++) {
                    idsBottomLayerNew.push(getIdStr(ix,iy,p.nzIn-1,'front','grid','in'));
                }
            }
        }
        if (idsBottomLayerNew.toString() != this.idsBottomLayer.toString()) {
            // Redraw grid to correct order for selection that is sticking out the front
            console.log("Redrawing grid to correct order for selection that is sticking out the front");
            console.log('idsBottomLayer',this.idsBottomLayer);
            console.log('idsBottomLayerNew',idsBottomLayerNew);
    
            this.idsBottomLayer = idsBottomLayerNew;
            svgDraw();
        }
    
        // Undo existing drawing
        this.selected.forEach(function(item, index, array) {
            $(item).css("fill-opacity","0");
            $(item).css("stroke-opacity","0");
        });
        this.selected = [];
    
        this.gridHidden.forEach(function(item, index, array) {
            $(item).css("fill-opacity",gridFillOpacity);
            $(item).css("stroke-opacity",gridStrokeOpacity);
        });
        this.gridHidden = [];
    
        // Filter index
        let iFilter = p.ixSelOut;    
    
        // Check if valid
        var isValid = true;
        if (izSelIn + p.filterSize > p.nzIn) {
            isValid = false;
        } else if (iySelIn + p.filterSize > p.nyIn) {
            isValid = false;
        }
    
        // Input top
        let iy_top = iySelIn;
        for (let ix = 0; ix < p.nx; ix++) { 
            for (let iz = izSelIn; iz < (izSelIn+p.filterSize); iz++) {
                this.svgSelect(ix, iy_top, iz, 'top', 'in', iFilter, p.nFilters, isValid);
    
                if (iy_top == 0) {
                    this.svgGridHide(ix, 0, iz, 'top', 'in');
                }
            }
        }
    
        // Input left
        let ix_left = 0;
        for (let iy = iySelIn; iy < (iySelIn+p.filterSize); iy++) {
            for (let iz = izSelIn; iz < (izSelIn+p.filterSize); iz++) {
                this.svgSelect(ix_left, iy, iz, 'left', 'in', iFilter, p.nFilters, isValid);
                this.svgGridHide(ix_left, iy, iz, 'left', 'in');
            }
        }
    
        // Input front
        let iz_front = izSelIn + p.filterSize - 1;
        for (let ix = 0; ix < p.nx; ix++) { 
            for (let iy = iySelIn; iy < (iySelIn+p.filterSize); iy++) {
                this.svgSelect(ix, iy, iz_front, 'front', 'in', iFilter, p.nFilters, isValid);
    
                // Hide if over the edge
                if (iz_front >= p.nzIn-1) {
                    this.svgGridHide(ix, iy, p.nzIn-1, 'front', 'in');
                }
            }
        }
    
        // Output side
        this.svgSelect(p.ixSelOut, p.iySelOut, p.izSelOut, 'front', 'out', iFilter, p.nFilters, isValid);
        this.svgSelect(p.ixSelOut, p.iySelOut, p.izSelOut, 'left', 'out', iFilter, p.nFilters, isValid);
        this.svgSelect(p.ixSelOut, p.iySelOut, p.izSelOut, 'top', 'out', iFilter, p.nFilters, isValid);
    
        if (p.ixSelOut == 0) {
            this.svgGridHide(0, p.iySelOut, p.izSelOut, 'left', 'out');
        }
    
        if (p.izSelOut == p.nzOut-1) {
            this.svgGridHide(p.ixSelOut, p.iySelOut, p.nzOut-1, 'front', 'out');
        }
    
        if (p.iySelOut == 0) {
            this.svgGridHide(p.ixSelOut, 0, p.izSelOut, 'top', 'out');
        }
    }

    svgSelect(ix, iy, iz, loc, inOut, iFilter, nFilters, isValid) {
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
    
        this.selected.push(idStr);
    }
    
    svgGridHide(ix, iy, iz, loc, inOut) {
        var idStr = '#' + getIdStr(ix,iy,iz,loc,'grid',inOut);
        $(idStr).css("fill-opacity","0");
        $(idStr).css("stroke-opacity","0");
        
        this.gridHidden.push(idStr);
    }
}

let nx=3, nyInput=9, nzInput=9, padding=0, nFilters=2, filterSize=1, stride=2;
var p = new Params(nx, nyInput, nzInput, padding, nFilters, filterSize, stride);
var ds = new DrawingSelections();

function updateParams() {
    var nx = parseInt($("#ccnx").val());
    if (isNaN(nx)) {
        nx = p.nx;
    }

    var nyInput = parseInt($("#ccnyInput").val());
    if (isNaN(nyInput)) {
        nyInput = p.nyInput;
    }

    var nzInput = parseInt($("#ccnzInput").val());
    if (isNaN(nzInput)) {
        nzInput = p.nzInput;
    }

    filterSize = parseInt($("#ccfilterSize").val());
    if (isNaN(filterSize)) {
        filterSize = p.filterSize;
    }

    // Update params
    p = new Params(nx, nyInput, nzInput, padding, nFilters, filterSize, stride);

    // Redraw
    svgDraw();
}

function paddingAdd() {
    p.padding += 1;
    $('#ccpadding').html(String(p.padding));
    p.recalculate();
    svgDraw();
}

function paddingSub() {
    p.padding -= 1;
    $('#ccpadding').html(String(p.padding));
    p.recalculate();
    svgDraw();
}

function nFiltersAdd() {
    svgAnimateStop();

    p.nFilters += 1;
    $('#ccnFilters').html(String(p.nFilters));
    p.recalculate();

    // Draw & animate
    svgResetAndRedraw();
}

function nFiltersSub() {
    svgAnimateStop();

    p.nFilters -= 1;
    p.nFilters = Math.max(p.nFilters,1);
    $('#ccnFilters').html(String(p.nFilters));
    p.recalculate();

    // Draw & animate
    svgResetAndRedraw();
}

function svgResetAndRedraw() {
    svgDraw();

    // Check filter selection is valid
    p.checkSelectionValid();

    if (timeoutID != "") {  
        // Restart animate
        svgAnimateStart();
    } else {
        // Redraw
        ds.svgAnimateLoopDraw(p);
    }
}

function drawFaceTop(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz, isGrid, isPadding) {
    let w_top_left = w_top_left_canvas + ix*p.face.box_dim + iz*p.face.w_translate;
    let h_top_left = h_top_left_canvas + iy*p.face.box_dim + iz*p.face.h_translate;

    let pts = [
        [w_top_left, h_top_left],
        [w_top_left + p.face.box_dim, h_top_left],
        [w_top_left + p.face.box_dim + p.face.w_translate, h_top_left + p.face.h_translate],
        [w_top_left + p.face.w_translate, h_top_left + p.face.h_translate],
        [w_top_left, h_top_left]
        ];
    return new Path(idStr, pts, isGrid, isPadding);
}

function drawFaceLeft(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz, isGrid, isPadding) {
    let w_top_left = w_top_left_canvas + iz*p.face.w_translate + ix*p.face.box_dim;
    let h_top_left = h_top_left_canvas + iz*p.face.h_translate + iy*p.face.box_dim;

    let pts = [
        [w_top_left, h_top_left],
        [w_top_left + p.face.w_translate, h_top_left + p.face.h_translate],
        [w_top_left + p.face.w_translate, h_top_left + p.face.h_translate + p.face.box_dim],
        [w_top_left, h_top_left + p.face.box_dim],
        [w_top_left, h_top_left]
        ];
    return new Path(idStr, pts, isGrid, isPadding);
}

function drawFaceFront(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz, isGrid, isPadding) {
    let w_top_left = w_top_left_canvas + ix*p.face.box_dim + (1+iz) * p.face.w_translate;
    let h_top_left = h_top_left_canvas + iy*p.face.box_dim + (1+iz) * p.face.h_translate;

    let pts = [
        [w_top_left, h_top_left],
        [w_top_left + p.face.box_dim, h_top_left],
        [w_top_left + p.face.box_dim, h_top_left + p.face.box_dim],
        [w_top_left, h_top_left + p.face.box_dim],
        [w_top_left, h_top_left]
        ];
    return new Path(idStr, pts, isGrid, isPadding);
}

function svgAnimateStart() {
    if (timeoutID != "") {
        return;
    }
    svgAnimateLoop();
}

function svgAnimateLoopStep() {
    // Increment
    p.svgIncrementSel();

    // Draw
    ds.svgAnimateLoopDraw(p);
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

function svgCreateStr(width, height, pathsGrid, pathsSel) {
    var svgStr = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n';
    svgStr += '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" viewBox="0 0 ' + String(width) + ' ' + String(height) + '">\n';
    
    // Bottom paths first
    ds.idsBottomLayer.forEach(function(item, index, array) {
        if (pathsGrid.has(item)) {
            svgStr += pathsGrid.get(item).svgStr() + '\n';
            pathsGrid.delete(item);
        } else if (pathsSel.has(item)) {
            svgStr += pathsSel.get(item).svgStr() + '\n';
            pathsSel.delete(item);
        }
    });

    // Draw selection first, then grid on top
    pathsSel.forEach(function(value,key) {
        svgStr += value.svgStr() + '\n';
    });
    pathsGrid.forEach(function(value,key) {
        svgStr += value.svgStr() + '\n';
    });
    
    svgStr += '</svg>';

    return svgStr;
}

function getIdStr(ix, iy, iz, loc, obj, inOut) {
    return String(ix).padStart(3, '0') + '_' + String(iy).padStart(3, '0') + '_' + String(iz).padStart(3, '0') + '_' + inOut + '_' + loc + '_' + obj;
}

function svgDrawGrid(nxDraw, nyDraw, nzDraw, w_top_left_canvas, h_top_left_canvas, inOut, iyStartForId, izStartForId, 
    paddingyTop, paddingyBottom, paddingzLeft, paddingzRight) {
    const paths = new Map();

    let isGrid = true;
    var idStr = "";

    // Top
    let iy_level = 0;
    for (let ix = 0; ix < nxDraw; ix++) { 
        for (let iz = 0; iz < nzDraw; iz++) {
            idStr = getIdStr(ix,iyStartForId + iy_level,izStartForId + iz,'top','grid',inOut);
            if ((paddingyTop > 0) || (iz < paddingzLeft) || (nzDraw-1 - paddingzRight < iz)) {
                isPadding = true;
            } else {
                isPadding = false;
            }
            paths.set(idStr, drawFaceTop(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy_level, iz, isGrid, isPadding));
        }
    }

    // Left
    let ix_level = 0;
    for (let iy = 0; iy < nyDraw; iy++) { 
        for (let iz = 0; iz < nzDraw; iz++) {
            idStr = getIdStr(ix_level,iyStartForId + iy,izStartForId + iz,'left','grid',inOut);
            if ((iz < paddingzLeft) || (iy < paddingyTop) || (nzDraw-1 - paddingzRight < iz) || (nyDraw-1 - paddingyBottom < iy)) {
                isPadding = true;
            } else {
                isPadding = false;
            }
            paths.set(idStr, drawFaceLeft(idStr, w_top_left_canvas, h_top_left_canvas, ix_level, iy, iz, isGrid, isPadding));
        }
    }

    // Front
    let iz_level = nzDraw - 1;
    for (let ix = 0; ix < nxDraw; ix++) { 
        for (let iy = 0; iy < nyDraw; iy++) { 
            idStr = getIdStr(ix,iyStartForId + iy,izStartForId + iz_level,'front','grid',inOut);
            if ((paddingzRight > 0) || (iy < paddingyTop) || (nyDraw-1 - paddingyBottom < iy)) {
                isPadding = true;
            } else {
                isPadding = false;
            }
            paths.set(idStr, drawFaceFront(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz_level, isGrid, isPadding));
        }
    }

    return paths;
}

function svgDrawSel(nxDraw, nyDraw, nzDraw, nyPadEndDraw, nzPadEndDraw, w_top_left_canvas, h_top_left_canvas, inOut, iyStartForId, izStartForId) {
    const paths = new Map();

    let isGrid = false;
    var idStr = "";

    for (let ix = 0; ix < nxDraw; ix++) { 
        for (let iy = 0; iy < nyDraw+nyPadEndDraw; iy++) { 
            for (let iz = 0; iz < nzDraw+nzPadEndDraw; iz++) {
                idStr = getIdStr(ix,iyStartForId+iy,izStartForId+iz,'top','sel',inOut);
                paths.set(idStr, drawFaceTop(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz, isGrid));
                
                idStr = getIdStr(ix,iyStartForId+iy,izStartForId+iz,'left','sel',inOut);
                paths.set(idStr, drawFaceLeft(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz, isGrid));
                
                idStr = getIdStr(ix,iyStartForId+iy,izStartForId+iz,'front','sel',inOut);
                paths.set(idStr, drawFaceFront(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz, isGrid));
            }
        }
    }

    return paths;
}

function svgDraw() {
    console.log(p);
    // Check how many pieces to draw
    if ((2*p.nzSub > p.nzIn) && (2*p.nySub > p.nyIn)) {
        // Only draw one
        svgDraw1(p);
    } else if (2*p.nzSub > p.nzIn) {
        // Only draw vertical
        svgDraw2vert(p);
    } else if (2*p.nySub > p.nyIn) {
        // Only draw horizontal
        svgDraw2horiz(p);
    } else {
        // Draw all 4 pieces
        svgDraw4(p);
    }
}

function svgDraw1(p) {
    console.log("drawing single");

    // Draw input
    var paddingyTop = p.padding;
    var paddingyBottom = p.padding;
    var paddingzLeft = p.padding;
    var paddingzRight = p.padding;

    let iyStartForId = 0;
    let izStartForId = 0;
    let pathsGridIn = svgDrawGrid(p.nx, p.nyIn, p.nzIn, p.w_top_left_canvas, p.h_top_left_canvas, 'in', iyStartForId, izStartForId, 
        paddingyTop, paddingyBottom, paddingzLeft, paddingzRight);
    let pathsSelIn = svgDrawSel(p.nx, p.nyIn, p.nzIn, p.nyPadEndIn, p.nzPadEndIn, p.w_top_left_canvas, p.h_top_left_canvas, 'in', iyStartForId, izStartForId);

    // Draw output
    paddingyTop = 0;
    paddingyBottom = 0;
    paddingzLeft = 0;
    paddingzRight = 0;
    let nPadEndOut = 0;
    let pathsGridOut = svgDrawGrid(p.nxOut, p.nyOut, p.nzOut, p.w_top_left_canvas+500, p.h_top_left_canvas, 'out', iyStartForId, izStartForId,
        paddingyTop, paddingyBottom, paddingzLeft, paddingzRight);
    let pathsSelOut = svgDrawSel(p.nxOut, p.nyOut, p.nzOut, nPadEndOut, nPadEndOut, p.w_top_left_canvas+500, p.h_top_left_canvas, 'out', iyStartForId, izStartForId);

    // Draw
    let pathsGrid = new Map(function*() { yield* pathsGridIn; yield* pathsGridOut; }());
    let pathsSel = new Map(function*() { yield* pathsSelIn; yield* pathsSelOut; }());
    let svgStr = svgCreateStr(1000,800,pathsGrid,pathsSel);
    $('#ccSVG').html(svgStr);
}

function svgDraw4(p) {
    console.log("drawing four");

    // Draw input grids

    // Top-left
    var paddingyTop = p.padding;
    var paddingyBottom = 0;
    var paddingzLeft = p.padding;
    var paddingzRight = 0;

    var iyStartForId = 0;
    var izStartForId = 0;
    var nyPadEnd = 0;
    var nzPadEnd = 0;
    let pathsGridInTL = svgDrawGrid(p.nx, p.nySub, p.nzSub, p.w_top_left_canvas, p.h_top_left_canvas, 'in', iyStartForId, izStartForId,
        paddingyTop, paddingyBottom, paddingzLeft, paddingzRight);
    let pathsSelInTL = svgDrawSel(p.nx, p.nySub, p.nzSub, nyPadEnd, nzPadEnd, p.w_top_left_canvas, p.h_top_left_canvas, 'in', iyStartForId, izStartForId);

    // Top right
    paddingyTop = p.padding;
    paddingyBottom = 0;
    paddingzLeft = 0;
    paddingzRight = p.padding;

    let delta_Right_w = (p.nzSub+p.nzSep) * p.face.w_translate;
    let delta_Right_h = (p.nzSub+p.nzSep) * p.face.h_translate;
    let delta_Down_w = 0;
    let delta_Down_h = p.nzSub * p.face.h_translate + (p.nySub+1) * p.face.box_dim;

    var w_top_left_canvas_sub = p.w_top_left_canvas + delta_Right_w;
    var h_top_left_canvas_sub = p.h_top_left_canvas + delta_Right_h;
    iyStartForId = 0;
    izStartForId = p.nzIn - p.nzSub;
    nyPadEnd = 0;
    nzPadEnd = p.nzPadEndIn;
    let pathsGridInTR = svgDrawGrid(p.nx, p.nySub, p.nzSub, w_top_left_canvas_sub, h_top_left_canvas_sub, 'in', iyStartForId, izStartForId,
        paddingyTop, paddingyBottom, paddingzLeft, paddingzRight);
    let pathsSelInTR = svgDrawSel(p.nx, p.nySub, p.nzSub, nyPadEnd, nzPadEnd, w_top_left_canvas_sub, h_top_left_canvas_sub, 'in', iyStartForId, izStartForId);

    // Bottom-left
    paddingyTop = 0;
    paddingyBottom = p.padding;
    paddingzLeft = p.padding;
    paddingzRight = 0;

    w_top_left_canvas_sub = p.w_top_left_canvas + delta_Down_w;
    h_top_left_canvas_sub = p.h_top_left_canvas + delta_Down_h;
    iyStartForId = p.nyIn - p.nySub;
    izStartForId = 0;
    nyPadEnd = p.nyPadEndIn;
    nzPadEnd = 0;
    let pathsGridInBL = svgDrawGrid(p.nx, p.nySub, p.nzSub, w_top_left_canvas_sub, h_top_left_canvas_sub, 'in', iyStartForId, izStartForId,
        paddingyTop, paddingyBottom, paddingzLeft, paddingzRight);
    let pathsSelInBL = svgDrawSel(p.nx, p.nySub, p.nzSub, nyPadEnd, nzPadEnd, w_top_left_canvas_sub, h_top_left_canvas_sub, 'in', iyStartForId, izStartForId);

    // Bottom-right
    paddingyTop = 0;
    paddingyBottom = p.padding;
    paddingzLeft = 0;
    paddingzRight = p.padding;

    w_top_left_canvas_sub = p.w_top_left_canvas + delta_Down_w + delta_Right_w;
    h_top_left_canvas_sub = p.h_top_left_canvas + delta_Down_h + delta_Right_h;
    iyStartForId = p.nyIn - p.nySub;
    izStartForId = p.nzIn - p.nzSub;
    nyPadEnd = p.nyPadEndIn;
    nzPadEnd = p.nzPadEndIn;
    let pathsGridInBR = svgDrawGrid(p.nx, p.nySub, p.nzSub, w_top_left_canvas_sub, h_top_left_canvas_sub, 'in', iyStartForId, izStartForId,
        paddingyTop, paddingyBottom, paddingzLeft, paddingzRight);
    let pathsSelInBR = svgDrawSel(p.nx, p.nySub, p.nzSub, nyPadEnd, nzPadEnd, w_top_left_canvas_sub, h_top_left_canvas_sub, 'in', iyStartForId, izStartForId);

    // Draw
    let pathsGrid = new Map(function*() { yield* pathsGridInTL; yield* pathsGridInTR; yield* pathsGridInBL; yield* pathsGridInBR; }());
    let pathsSel = new Map(function*() { yield* pathsSelInTL; yield* pathsSelInTR; yield* pathsSelInBL; yield* pathsSelInBR; }());
    let svgStr = svgCreateStr(1000,800,pathsGrid,pathsSel);
    $('#ccSVG').html(svgStr);
}

function svgDraw2vert(p) {
    console.log("drawing 2 vertical");

    // Draw input grids
    var nyPadEnd = 0;
    var nzPadEnd = p.nzPadEndIn;
    var iyStartForId = 0;
    var izStartForId = 0;
    let pathsGridInTL = svgDrawGrid(p.nx, p.nySub, p.nzSub, p.w_top_left_canvas, p.h_top_left_canvas, 'in', iyStartForId, izStartForId);
    let pathsSelInTL = svgDrawSel(p.nx, p.nySub, p.nzSub, nyPadEnd, nzPadEnd, p.w_top_left_canvas, p.h_top_left_canvas, 'in', iyStartForId, izStartForId);

    let delta_Down_w = 0;
    let delta_Down_h = p.nzSub * p.face.h_translate + (p.nySub+1) * p.face.box_dim;

    w_top_left_canvas_sub = p.w_top_left_canvas + delta_Down_w;
    h_top_left_canvas_sub = p.h_top_left_canvas + delta_Down_h;
    iyStartForId = p.nyIn - p.nySub;
    izStartForId = 0;
    nyPadEnd = nyPadEndIn;
    nzPadEnd = nzPadEndIn;
    let pathsGridInBL = svgDrawGrid(p.nx, p.nySub, p.nzSub, w_top_left_canvas_sub, h_top_left_canvas_sub, 'in', iyStartForId, izStartForId);
    let pathsSelInBL = svgDrawSel(p.nx, p.nySub, p.nzSub, nyPadEnd, nzPadEnd, w_top_left_canvas_sub, h_top_left_canvas_sub, 'in', iyStartForId, izStartForId);

    // Draw
    let pathsGrid = new Map(function*() { yield* pathsGridInTL; yield* pathsGridInBL; }());
    let pathsSel = new Map(function*() { yield* pathsSelInTL; yield* pathsSelInBL; }());
    let svgStr = svgCreateStr(1000,800,pathsGrid,pathsSel);
    $('#ccSVG').html(svgStr);
}


function svgDraw2horiz(p) {
    console.log("drawing 2 horizontal");

    // Draw input grids
    var nyPadEnd = p.nyPadEndIn;
    var nzPadEnd = 0;
    var iyStartForId = 0;
    var izStartForId = 0;
    let pathsGridInTL = svgDrawGrid(p.nx, p.nySub, p.nzSub, p.w_top_left_canvas, p.h_top_left_canvas, 'in', iyStartForId, izStartForId);
    let pathsSelInTL = svgDrawSel(p.nx, p.nySub, p.nzSub, nyPadEnd, nzPadEnd, p.w_top_left_canvas, p.h_top_left_canvas, 'in', iyStartForId, izStartForId);

    let delta_Right_w = (p.nzSub+p.nzSep) * p.face.w_translate;
    let delta_Right_h = (p.nzSub+p.nzSep) * p.face.h_translate;

    var w_top_left_canvas_sub = p.w_top_left_canvas + delta_Right_w;
    var h_top_left_canvas_sub = p.h_top_left_canvas + delta_Right_h;
    iyStartForId = 0;
    izStartForId = p.nzIn - p.nzSub;
    nyPadEnd = p.nyPadEndIn;
    nzPadEnd = p.nzPadEndIn;
    let pathsGridInTR = svgDrawGrid(p.nx, p.nySub, p.nzSub, w_top_left_canvas_sub, h_top_left_canvas_sub, 'in', iyStartForId, izStartForId);
    let pathsSelInTR = svgDrawSel(p.nx, p.nySub, p.nzSub, nyPadEnd, nzPadEnd, w_top_left_canvas_sub, h_top_left_canvas_sub, 'in', iyStartForId, izStartForId);

    // Draw
    let pathsGrid = new Map(function*() { yield* pathsGridInTL; yield* pathsGridInTR; }());
    let pathsSel = new Map(function*() { yield* pathsSelInTL; yield* pathsSelInTR; }());
    let svgStr = svgCreateStr(1000,800,pathsGrid,pathsSel);
    $('#ccSVG').html(svgStr);
}
