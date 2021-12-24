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
    constructor(wTranslate, hTranslate, boxDim) {
        this.wTranslate = wTranslate;
        this.hTranslate = hTranslate;
        this.boxDim = boxDim;
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
        this.nyInSubcube = this.stride + this.filterSize + 1;
        this.nzInSubcube = this.stride + this.filterSize + 1;
        console.log("Subcube: (ny,nz) = ", this.nyInSubcube, this.nzInSubcube);

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
        this.nyInHiddenPad = nyInCalculatedFromNyOut - this.nyIn;
        this.nzInHiddenPad = nzInCalculatedFromNyOut - this.nzIn;

        // Selection
        this.ixSelOut = 0;
        this.iySelOut = 0;
        this.izSelOut = -1;

        // Drawing parameters
        this.wTopLeftCanvas = 100;
        this.hTopLeftCanvas = 100;
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
        let iyTop = iySelIn;
        for (let ix = 0; ix < p.nx; ix++) { 
            for (let iz = izSelIn; iz < (izSelIn+p.filterSize); iz++) {
                this.svgSelect(ix, iyTop, iz, 'top', 'in', iFilter, p.nFilters, isValid);
    
                if (iyTop == 0) {
                    this.svgGridHide(ix, 0, iz, 'top', 'in');
                }
            }
        }
    
        // Input left
        let ixLeft = 0;
        for (let iy = iySelIn; iy < (iySelIn+p.filterSize); iy++) {
            for (let iz = izSelIn; iz < (izSelIn+p.filterSize); iz++) {
                this.svgSelect(ixLeft, iy, iz, 'left', 'in', iFilter, p.nFilters, isValid);
                this.svgGridHide(ixLeft, iy, iz, 'left', 'in');
            }
        }
    
        // Input front
        let izFront = izSelIn + p.filterSize - 1;
        for (let ix = 0; ix < p.nx; ix++) { 
            for (let iy = iySelIn; iy < (iySelIn+p.filterSize); iy++) {
                this.svgSelect(ix, iy, izFront, 'front', 'in', iFilter, p.nFilters, isValid);
    
                // Hide if over the edge
                if (izFront >= p.nzIn-1) {
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

function drawFaceTop(idStr, wTopLeftCanvas, hTopLeftCanvas, ix, iy, iz, isGrid, isPadding) {
    let wTopLeft = wTopLeftCanvas + ix*p.face.boxDim + iz*p.face.wTranslate;
    let hTopLeft = hTopLeftCanvas + iy*p.face.boxDim + iz*p.face.hTranslate;

    let pts = [
        [wTopLeft, hTopLeft],
        [wTopLeft + p.face.boxDim, hTopLeft],
        [wTopLeft + p.face.boxDim + p.face.wTranslate, hTopLeft + p.face.hTranslate],
        [wTopLeft + p.face.wTranslate, hTopLeft + p.face.hTranslate],
        [wTopLeft, hTopLeft]
        ];
    return new Path(idStr, pts, isGrid, isPadding);
}

function drawFaceLeft(idStr, wTopLeftCanvas, hTopLeftCanvas, ix, iy, iz, isGrid, isPadding) {
    let wTopLeft = wTopLeftCanvas + iz*p.face.wTranslate + ix*p.face.boxDim;
    let hTopLeft = hTopLeftCanvas + iz*p.face.hTranslate + iy*p.face.boxDim;

    let pts = [
        [wTopLeft, hTopLeft],
        [wTopLeft + p.face.wTranslate, hTopLeft + p.face.hTranslate],
        [wTopLeft + p.face.wTranslate, hTopLeft + p.face.hTranslate + p.face.boxDim],
        [wTopLeft, hTopLeft + p.face.boxDim],
        [wTopLeft, hTopLeft]
        ];
    return new Path(idStr, pts, isGrid, isPadding);
}

function drawFaceFront(idStr, wTopLeftCanvas, hTopLeftCanvas, ix, iy, iz, isGrid, isPadding) {
    let wTopLeft = wTopLeftCanvas + ix*p.face.boxDim + (1+iz) * p.face.wTranslate;
    let hTopLeft = hTopLeftCanvas + iy*p.face.boxDim + (1+iz) * p.face.hTranslate;

    let pts = [
        [wTopLeft, hTopLeft],
        [wTopLeft + p.face.boxDim, hTopLeft],
        [wTopLeft + p.face.boxDim, hTopLeft + p.face.boxDim],
        [wTopLeft, hTopLeft + p.face.boxDim],
        [wTopLeft, hTopLeft]
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
    return String(ix).padStart(3, '0') + '_' 
        + String(iy).padStart(3, '0') + '_' 
        + String(iz).padStart(3, '0') + '_' 
        + inOut + '_' + loc + '_' + obj;
}

function svgDrawGrid(nxDraw, nyDraw, nzDraw, wTopLeftCanvas, hTopLeftCanvas, inOut, iyStartForId, izStartForId, 
    paddingyTop, paddingyBottom, paddingzLeft, paddingzRight) {
    const paths = new Map();

    let isGrid = true;
    var idStr = "";

    // Top
    let iyLevel = 0;
    for (let ix = 0; ix < nxDraw; ix++) { 
        for (let iz = 0; iz < nzDraw; iz++) {
            idStr = getIdStr(ix,iyStartForId + iyLevel,izStartForId + iz,'top','grid',inOut);
            if ((paddingyTop > 0) || (iz < paddingzLeft) || (nzDraw-1 - paddingzRight < iz)) {
                isPadding = true;
            } else {
                isPadding = false;
            }
            paths.set(idStr, drawFaceTop(idStr, wTopLeftCanvas, hTopLeftCanvas, ix, iyLevel, iz, isGrid, isPadding));
        }
    }

    // Left
    let ixLevel = 0;
    for (let iy = 0; iy < nyDraw; iy++) { 
        for (let iz = 0; iz < nzDraw; iz++) {
            idStr = getIdStr(ixLevel,iyStartForId + iy,izStartForId + iz,'left','grid',inOut);
            if ((iz < paddingzLeft) || (iy < paddingyTop) || (nzDraw-1 - paddingzRight < iz) || (nyDraw-1 - paddingyBottom < iy)) {
                isPadding = true;
            } else {
                isPadding = false;
            }
            paths.set(idStr, drawFaceLeft(idStr, wTopLeftCanvas, hTopLeftCanvas, ixLevel, iy, iz, isGrid, isPadding));
        }
    }

    // Front
    let izLevel = nzDraw - 1;
    for (let ix = 0; ix < nxDraw; ix++) { 
        for (let iy = 0; iy < nyDraw; iy++) { 
            idStr = getIdStr(ix,iyStartForId + iy,izStartForId + izLevel,'front','grid',inOut);
            if ((paddingzRight > 0) || (iy < paddingyTop) || (nyDraw-1 - paddingyBottom < iy)) {
                isPadding = true;
            } else {
                isPadding = false;
            }
            paths.set(idStr, drawFaceFront(idStr, wTopLeftCanvas, hTopLeftCanvas, ix, iy, izLevel, isGrid, isPadding));
        }
    }

    return paths;
}

function svgDrawSel(nxDraw, nyDraw, nzDraw, nyPadEndDraw, nzPadEndDraw, wTopLeftCanvas, hTopLeftCanvas, inOut, iyStartForId, izStartForId) {
    const paths = new Map();

    let isGrid = false;
    var idStr = "";

    for (let ix = 0; ix < nxDraw; ix++) { 
        for (let iy = 0; iy < nyDraw+nyPadEndDraw; iy++) { 
            for (let iz = 0; iz < nzDraw+nzPadEndDraw; iz++) {
                idStr = getIdStr(ix,iyStartForId+iy,izStartForId+iz,'top','sel',inOut);
                paths.set(idStr, drawFaceTop(idStr, wTopLeftCanvas, hTopLeftCanvas, ix, iy, iz, isGrid));
                
                idStr = getIdStr(ix,iyStartForId+iy,izStartForId+iz,'left','sel',inOut);
                paths.set(idStr, drawFaceLeft(idStr, wTopLeftCanvas, hTopLeftCanvas, ix, iy, iz, isGrid));
                
                idStr = getIdStr(ix,iyStartForId+iy,izStartForId+iz,'front','sel',inOut);
                paths.set(idStr, drawFaceFront(idStr, wTopLeftCanvas, hTopLeftCanvas, ix, iy, iz, isGrid));
            }
        }
    }

    return paths;
}

function svgDraw() {
    // Check how many pieces to draw
    if ((2*p.nzInSubcube >= p.nzIn) && (2*p.nyInSubcube >= p.nyIn)) {
        // Only draw one
        svgDraw1(p);
    } else if (2*p.nzInSubcube >= p.nzIn) {
        // Only draw vertical
        svgDraw2vert(p);
    } else if (2*p.nyInSubcube >= p.nyIn) {
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
    let pathsGridIn = svgDrawGrid(p.nx, p.nyIn, p.nzIn, p.wTopLeftCanvas, p.hTopLeftCanvas, 'in', iyStartForId, izStartForId, 
        paddingyTop, paddingyBottom, paddingzLeft, paddingzRight);
    let pathsSelIn = svgDrawSel(p.nx, p.nyIn, p.nzIn, p.nyInHiddenPad, p.nzInHiddenPad, p.wTopLeftCanvas, p.hTopLeftCanvas, 'in', iyStartForId, izStartForId);

    // Draw output
    paddingyTop = 0;
    paddingyBottom = 0;
    paddingzLeft = 0;
    paddingzRight = 0;
    let nPadEndOut = 0;
    let pathsGridOut = svgDrawGrid(p.nxOut, p.nyOut, p.nzOut, p.wTopLeftCanvas+500, p.hTopLeftCanvas, 'out', iyStartForId, izStartForId,
        paddingyTop, paddingyBottom, paddingzLeft, paddingzRight);
    let pathsSelOut = svgDrawSel(p.nxOut, p.nyOut, p.nzOut, nPadEndOut, nPadEndOut, p.wTopLeftCanvas+500, p.hTopLeftCanvas, 'out', iyStartForId, izStartForId);

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
    let pathsGridInTL = svgDrawGrid(p.nx, p.nyInSubcube, p.nzInSubcube, p.wTopLeftCanvas, p.hTopLeftCanvas, 'in', iyStartForId, izStartForId,
        paddingyTop, paddingyBottom, paddingzLeft, paddingzRight);
    let pathsSelInTL = svgDrawSel(p.nx, p.nyInSubcube, p.nzInSubcube, nyPadEnd, nzPadEnd, p.wTopLeftCanvas, p.hTopLeftCanvas, 'in', iyStartForId, izStartForId);

    // Top right
    paddingyTop = p.padding;
    paddingyBottom = 0;
    paddingzLeft = 0;
    paddingzRight = p.padding;

    let deltaRightW = (p.nzInSubcube+p.nzSep) * p.face.wTranslate;
    let deltaRightH = (p.nzInSubcube+p.nzSep) * p.face.hTranslate;
    let deltaDownW = 0;
    let deltaDownH = p.nzInSubcube * p.face.hTranslate + (p.nyInSubcube+1) * p.face.boxDim;

    var wTopLeftCanvasSubcube = p.wTopLeftCanvas + deltaRightW;
    var hTopLeftCanvasSubcube = p.hTopLeftCanvas + deltaRightH;
    iyStartForId = 0;
    izStartForId = p.nzIn - p.nzInSubcube;
    nyPadEnd = 0;
    nzPadEnd = p.nzInHiddenPad;
    let pathsGridInTR = svgDrawGrid(p.nx, p.nyInSubcube, p.nzInSubcube, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, 'in', iyStartForId, izStartForId,
        paddingyTop, paddingyBottom, paddingzLeft, paddingzRight);
    let pathsSelInTR = svgDrawSel(p.nx, p.nyInSubcube, p.nzInSubcube, nyPadEnd, nzPadEnd, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, 'in', iyStartForId, izStartForId);

    // Bottom-left
    paddingyTop = 0;
    paddingyBottom = p.padding;
    paddingzLeft = p.padding;
    paddingzRight = 0;

    wTopLeftCanvasSubcube = p.wTopLeftCanvas + deltaDownW;
    hTopLeftCanvasSubcube = p.hTopLeftCanvas + deltaDownH;
    iyStartForId = p.nyIn - p.nyInSubcube;
    izStartForId = 0;
    nyPadEnd = p.nyInHiddenPad;
    nzPadEnd = 0;
    let pathsGridInBL = svgDrawGrid(p.nx, p.nyInSubcube, p.nzInSubcube, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, 'in', iyStartForId, izStartForId,
        paddingyTop, paddingyBottom, paddingzLeft, paddingzRight);
    let pathsSelInBL = svgDrawSel(p.nx, p.nyInSubcube, p.nzInSubcube, nyPadEnd, nzPadEnd, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, 'in', iyStartForId, izStartForId);

    // Bottom-right
    paddingyTop = 0;
    paddingyBottom = p.padding;
    paddingzLeft = 0;
    paddingzRight = p.padding;

    wTopLeftCanvasSubcube = p.wTopLeftCanvas + deltaDownW + deltaRightW;
    hTopLeftCanvasSubcube = p.hTopLeftCanvas + deltaDownH + deltaRightH;
    iyStartForId = p.nyIn - p.nyInSubcube;
    izStartForId = p.nzIn - p.nzInSubcube;
    nyPadEnd = p.nyInHiddenPad;
    nzPadEnd = p.nzInHiddenPad;
    let pathsGridInBR = svgDrawGrid(p.nx, p.nyInSubcube, p.nzInSubcube, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, 'in', iyStartForId, izStartForId,
        paddingyTop, paddingyBottom, paddingzLeft, paddingzRight);
    let pathsSelInBR = svgDrawSel(p.nx, p.nyInSubcube, p.nzInSubcube, nyPadEnd, nzPadEnd, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, 'in', iyStartForId, izStartForId);

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
    var nzPadEnd = p.nzInHiddenPad;
    var iyStartForId = 0;
    var izStartForId = 0;
    let pathsGridInTL = svgDrawGrid(p.nx, p.nyInSubcube, p.nzInSubcube, p.wTopLeftCanvas, p.hTopLeftCanvas, 'in', iyStartForId, izStartForId);
    let pathsSelInTL = svgDrawSel(p.nx, p.nyInSubcube, p.nzInSubcube, nyPadEnd, nzPadEnd, p.wTopLeftCanvas, p.hTopLeftCanvas, 'in', iyStartForId, izStartForId);

    let deltaDownW = 0;
    let deltaDownH = p.nzInSubcube * p.face.hTranslate + (p.nyInSubcube+1) * p.face.boxDim;

    wTopLeftCanvasSubcube = p.wTopLeftCanvas + deltaDownW;
    hTopLeftCanvasSubcube = p.hTopLeftCanvas + deltaDownH;
    iyStartForId = p.nyIn - p.nyInSubcube;
    izStartForId = 0;
    nyPadEnd = p.nyPadEndIn;
    nzPadEnd = p.nzPadEndIn;
    let pathsGridInBL = svgDrawGrid(p.nx, p.nyInSubcube, p.nzInSubcube, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, 'in', iyStartForId, izStartForId);
    let pathsSelInBL = svgDrawSel(p.nx, p.nyInSubcube, p.nzInSubcube, nyPadEnd, nzPadEnd, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, 'in', iyStartForId, izStartForId);

    // Draw
    let pathsGrid = new Map(function*() { yield* pathsGridInTL; yield* pathsGridInBL; }());
    let pathsSel = new Map(function*() { yield* pathsSelInTL; yield* pathsSelInBL; }());
    let svgStr = svgCreateStr(1000,800,pathsGrid,pathsSel);
    $('#ccSVG').html(svgStr);
}


function svgDraw2horiz(p) {
    console.log("drawing 2 horizontal");

    // Draw input
    var nyPadEnd = p.nyInHiddenPad;
    var nzPadEnd = 0;
    var iyStartForId = 0;
    var izStartForId = 0;
    let pathsGridInTL = svgDrawGrid(p.nx, p.nyIn, p.nzInSubcube, p.wTopLeftCanvas, p.hTopLeftCanvas, 'in', iyStartForId, izStartForId);
    let pathsSelInTL = svgDrawSel(p.nx, p.nyIn, p.nzInSubcube, nyPadEnd, nzPadEnd, p.wTopLeftCanvas, p.hTopLeftCanvas, 'in', iyStartForId, izStartForId);

    let deltaRightW = (p.nzInSubcube+p.nzSep) * p.face.wTranslate;
    let deltaRightH = (p.nzInSubcube+p.nzSep) * p.face.hTranslate;

    var wTopLeftCanvasSubcube = p.wTopLeftCanvas + deltaRightW;
    var hTopLeftCanvasSubcube = p.hTopLeftCanvas + deltaRightH;
    iyStartForId = 0;
    izStartForId = p.nzIn - p.nzInSubcube;
    nyPadEnd = p.nyInHiddenPad;
    nzPadEnd = p.nzInHiddenPad;
    let pathsGridInTR = svgDrawGrid(p.nx, p.nyIn, p.nzInSubcube, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, 'in', iyStartForId, izStartForId);
    let pathsSelInTR = svgDrawSel(p.nx, p.nyIn, p.nzInSubcube, nyPadEnd, nzPadEnd, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, 'in', iyStartForId, izStartForId);

    // Draw
    let pathsGrid = new Map(function*() { yield* pathsGridInTL; yield* pathsGridInTR; }());
    let pathsSel = new Map(function*() { yield* pathsSelInTL; yield* pathsSelInTR; }());
    let svgStr = svgCreateStr(1000,800,pathsGrid,pathsSel);
    $('#ccSVG').html(svgStr);
}
