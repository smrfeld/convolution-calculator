var timeoutID = "";

let gridFillRGB = 'rgb(90%,90%,90%)';
let gridFillOpacity = '0.8';
let gridStrokeOpacity = '1';

let gridFillInvalidRGB = 'rgb(100%,80%,80%)';
let gridFillInvalidOpacity = '0.8';

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
    constructor(idStr, pts, isGrid, isGridInvalid, isPadding) {
        this.idStr = idStr;
        this.pts = pts;
        this.isGrid = isGrid;
        this.isGridInvalid = isGridInvalid;
        this.isPadding = isPadding;
    }

    // Method
    svgStr() {
        var s = '';

        s += '<path id="' + this.idStr + '"';

        if (this.isGrid) {
            if (this.isGridInvalid) {
                s += ' style="fill-rule:nonzero;fill:'
                    +gridFillInvalidRGB+';fill-opacity:'
                    +gridFillInvalidOpacity+';stroke-width:0.1;stroke-linecap:butt;\
                    stroke-linejoin:miter;stroke:rgb(0%,0%,0%);stroke-opacity:'
                    +gridStrokeOpacity+';stroke-miterlimit:10;"';
            } else if (this.isPadding) {
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
        
        console.log("Changed params: (nx, nyInput, nzInput, padding, nFilters, filterSize, stride) = ",
            this.nx, this.nyInput, this.nzInput, this.padding, this.nFilters, this.filterSize, this.stride);

        this.recalculate();
    }

    recalculate() {
        // Padding for output is always nil
        this.paddingOut = 0;

        // Input dimensions to draw
        this.nyIn = this.nyInput + 2*this.padding;
        this.nzIn = this.nzInput + 2*this.padding;

        // Sub-cube sizes
        this.nyInSubcube = this.stride + this.filterSize;
        this.nzInSubcube = this.stride + this.filterSize;
        this.nyOutSubcube = 2; // always
        this.nzOutSubcube = 2; // always
        console.log("Subcube: (ny,nz) = ", this.nyInSubcube, this.nzInSubcube);

        // Face
        let faceBoxDim = 50;
        let faceDx = 20;
        let faceDy = 15;
        this.face = new Face(faceDx, faceDy, faceBoxDim);

        // Seperation in x between subcubes
        this.leftRightSepSubcubes = 10;
        this.topBottomSepSubcubes = 10;

        // Output dimensions
        this.nzOut = Math.ceil((this.nzInput - this.filterSize + 2*this.padding)/this.stride + 1);
        this.nyOut = Math.ceil((this.nyInput - this.filterSize + 2*this.padding)/this.stride + 1);
        this.nxOut = this.nFilters;

        // If nyOut > 4, split ny, same for z
        this.splitYdir = (this.nyOut > 4);
        this.splitZdir = (this.nzOut > 4);

        // Padding for drawing hidden parts on the input
        let nyInCalculatedFromNyOut = this.stride*this.nyOut + this.filterSize;
        let nzInCalculatedFromNzOut = this.stride*this.nzOut + this.filterSize;
        console.log('nyInCalculatedFromNyOut',nyInCalculatedFromNyOut);
        console.log('nyIn',this.nyIn);
        this.nyPadSelEndIn = nyInCalculatedFromNyOut - this.nyIn;
        this.nzPadSelEndIn = nzInCalculatedFromNzOut - this.nzIn;
        this.nyPadSelEndOut = 0;
        this.nzPadSelEndOut = 0;

        // Selection
        this.ixSelOut = 0;
        this.iySelOut = 0;
        this.izSelOut = -1;

        // Drawing parameters
        this.wTopLeftCanvas = 100;
        this.hTopLeftCanvas = 100;
    }
    
    /*
    checkHowManyPieces() {
        // Check how many pieces to draw
        if ((2*this.nzInSubcube >= this.nzIn) && (2*this.nyInSubcube >= this.nyIn)) {
            // Only draw one
            return "one";
        } else if (2*this.nzInSubcube >= this.nzIn) {
            // Only draw vertical
            return "twoVertical";
        } else if (2*this.nyInSubcube >= this.nyIn) {
            // Only draw horizontal
            return "twoHorizontal";
        } else {
            // Draw all 4 pieces
            return "four";
        }
    }
    */

    checkSelectionValid() {
        this.ixSelOut = Math.min(this.ixSelOut, this.nFilters-1);
        this.iySelOut = Math.min(this.iySelOut, this.nyOut-1);
        this.izSelOut = Math.min(this.izSelOut, this.nzOut-1);
    }

    svgIncrementSelz() {    
        this.izSelOut += 1;
        if (this.splitZdir) {
            // Break in z direction
            // Only allowed indexes are 0,1 or nzOut-2, nzOut-1
            if ((this.izSelOut > 1) && (this.izSelOut < this.nzOut-2)) {
                this.izSelOut = this.nzOut-2;
            } 
        }
    }    

    svgIncrementSely() {    
        this.iySelOut += 1;
        if (this.splitYdir) {
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

        // Sticking out?
        if (izSelIn + p.filterSize > p.nzIn) {
            isValid = false;
        } else if (iySelIn + p.filterSize > p.nyIn) {
            isValid = false;
        }

        // Padding is greater (or equal) than filterSize and we're in the padding zone
        if (p.padding >= p.filterSize) {
            if (iySelIn + p.filterSize <= p.padding) {
                isValid = false;
            } else if (izSelIn + p.filterSize <= p.padding) {
                isValid = false;
            } else if (p.nyIn - iySelIn <= p.padding) {
                isValid = false;
            } else if (p.nzIn - izSelIn <= p.padding) {
                isValid = false;
            }
        }

        // Input top
        let iyTop = iySelIn;
        for (let ix = 0; ix < p.nx; ix++) { 
            for (let iz = izSelIn; iz < (izSelIn+p.filterSize); iz++) {
                this.svgSelect(ix, iyTop, iz, 'top', 'in', iFilter, p.nFilters, isValid);
    
                // Hide if top face
                if (iyTop == 0) {
                    this.svgGridHide(ix, iyTop, iz, 'top', 'in');
                }

                // Hide if top face of a bottom cube
                if (p.splitYdir) {
                    if (iyTop == p.nyIn - p.nyInSubcube) {
                        this.svgGridHide(ix, iyTop, iz, 'top', 'in');
                    }
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

                // Hide if front face of left cube
                if (p.splitZdir) {
                    if (izFront == p.nzInSubcube-1) {
                        this.svgGridHide(ix, iy, p.nzInSubcube-1, 'front', 'in');
                    }
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
            this.svgGridHide(p.ixSelOut, p.iySelOut, p.izSelOut, 'front', 'out');
        }
        if (p.splitZdir) {
            if (p.izSelOut == p.nzOutSubcube-1) {
                this.svgGridHide(p.ixSelOut, p.iySelOut, p.izSelOut, 'front', 'out');
            }
        }
    
        if (p.iySelOut == 0) {
            this.svgGridHide(p.ixSelOut, p.iySelOut, p.izSelOut, 'top', 'out');
        }
        if (p.splitYdir) {
            if (p.iySelOut == p.nyOut - p.nyOutSubcube) {
                this.svgGridHide(p.ixSelOut, p.iySelOut, p.izSelOut, 'top', 'out');
            }
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

let nx=3, nyInput=9, nzInput=9, padding=0, nFilters=2, filterSize=4, stride=2;
var p = new Params(nx, nyInput, nzInput, padding, nFilters, filterSize, stride);
var ds = new DrawingSelections();

function updateParams() {
    var nxNew = parseInt($("#ccnx").val());
    if (isNaN(nxNew)) {
        nxNew = p.nx;
    }

    var nyInputNew = parseInt($("#ccnyInput").val());
    if (isNaN(nyInputNew)) {
        nyInputNew = p.nyInput;
    }

    var nzInputNew = parseInt($("#ccnzInput").val());
    if (isNaN(nzInputNew)) {
        nzInputNew = p.nzInput;
    }

    paddingNew = parseInt($("#ccpadding").text());
    if (isNaN(paddingNew)) {
        paddingNew = p.padding;
    }

    nFiltersNew = parseInt($("#ccnFilters").text());
    if (isNaN(nFiltersNew)) {
        nFiltersNew = p.nFilters;
    }

    filterSizeNew = parseInt($("#ccfilterSize").text());
    if (isNaN(filterSizeNew)) {
        filterSizeNew = p.filterSize;
    }

    strideNew = parseInt($("#ccstride").text());
    if (isNaN(strideNew)) {
        strideNew = p.stride;
    }

    // Update params
    p = new Params(nxNew, nyInputNew, nzInputNew, paddingNew, nFiltersNew, filterSizeNew, strideNew);

    // Errors
    var errs = "";
    if (p.stride > p.filterSize) {
        errs += "Stride is larger than the filter size => data in the input is skipped.<br />";
    }
    
    if (p.padding >= p.filterSize) {
        errs += "Padding is greater or equal to filter size => some filters are not covering any data at all, only padding.<br />"
    }

    let nzOutTheory = (p.nzIn - p.filterSize + 2*p.padding)/p.stride + 1;
    if (!Number.isInteger(nzOutTheory)) {
        errs += "Filter does not evenly cover data in horizontal direction.<br />";
    }

    let nyOutTheory = (p.nyIn - p.filterSize + 2*p.padding)/p.stride + 1;
    if (!Number.isInteger(nyOutTheory)) {
        errs += "Filter does not evenly cover data in vertical direction.<br />";
    }
    $("#ccError").html(errs);

    // Redraw
    svgDraw();
}

function filterSizeAdd() {
    p.filterSize += 1;
    $('#ccfilterSize').html(String(p.filterSize));
    updateParams();
}

function filterSizeSub() {
    p.filterSize -= 1;
    p.filterSize = Math.max(p.filterSize,1);
    $('#ccfilterSize').html(String(p.filterSize));
    updateParams();

}

function strideAdd() {
    p.stride += 1;
    $('#ccstride').html(String(p.stride));
    updateParams();
}

function strideSub() {
    p.stride -= 1;
    p.stride = Math.max(p.stride,1);
    $('#ccstride').html(String(p.stride));
    updateParams();
}

function paddingAdd() {
    p.padding += 1;
    $('#ccpadding').html(String(p.padding));
    updateParams();
}

function paddingSub() {
    p.padding -= 1;
    p.padding = Math.max(p.padding,0);
    $('#ccpadding').html(String(p.padding));
    updateParams();
}

function nFiltersAdd() {
    p.nFilters += 1;
    $('#ccnFilters').html(String(p.nFilters));
    updateParams();
}

function nFiltersSub() {
    p.nFilters -= 1;
    p.nFilters = Math.max(p.nFilters,1);
    $('#ccnFilters').html(String(p.nFilters));
    updateParams();
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

function drawFaceTop(idStr, wTopLeftCanvas, hTopLeftCanvas, ix, iy, iz, isGrid, isGridInvalid, isPadding) {
    let wTopLeft = wTopLeftCanvas + ix*p.face.boxDim + iz*p.face.wTranslate;
    let hTopLeft = hTopLeftCanvas + iy*p.face.boxDim + iz*p.face.hTranslate;

    let pts = [
        [wTopLeft, hTopLeft],
        [wTopLeft + p.face.boxDim, hTopLeft],
        [wTopLeft + p.face.boxDim + p.face.wTranslate, hTopLeft + p.face.hTranslate],
        [wTopLeft + p.face.wTranslate, hTopLeft + p.face.hTranslate],
        [wTopLeft, hTopLeft]
        ];
    return new Path(idStr, pts, isGrid, isGridInvalid, isPadding);
}

function drawFaceLeft(idStr, wTopLeftCanvas, hTopLeftCanvas, ix, iy, iz, isGrid, isGridInvalid, isPadding) {
    let wTopLeft = wTopLeftCanvas + iz*p.face.wTranslate + ix*p.face.boxDim;
    let hTopLeft = hTopLeftCanvas + iz*p.face.hTranslate + iy*p.face.boxDim;

    let pts = [
        [wTopLeft, hTopLeft],
        [wTopLeft + p.face.wTranslate, hTopLeft + p.face.hTranslate],
        [wTopLeft + p.face.wTranslate, hTopLeft + p.face.hTranslate + p.face.boxDim],
        [wTopLeft, hTopLeft + p.face.boxDim],
        [wTopLeft, hTopLeft]
        ];
    return new Path(idStr, pts, isGrid, isGridInvalid, isPadding);
}

function drawFaceFront(idStr, wTopLeftCanvas, hTopLeftCanvas, ix, iy, iz, isGrid, isGridInvalid, isPadding) {
    let wTopLeft = wTopLeftCanvas + ix*p.face.boxDim + (1+iz) * p.face.wTranslate;
    let hTopLeft = hTopLeftCanvas + iy*p.face.boxDim + (1+iz) * p.face.hTranslate;

    let pts = [
        [wTopLeft, hTopLeft],
        [wTopLeft + p.face.boxDim, hTopLeft],
        [wTopLeft + p.face.boxDim, hTopLeft + p.face.boxDim],
        [wTopLeft, hTopLeft + p.face.boxDim],
        [wTopLeft, hTopLeft]
        ];
    return new Path(idStr, pts, isGrid, isGridInvalid, isPadding);
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
    let isGridInvalid = true;

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
            paths.set(idStr, drawFaceTop(idStr, wTopLeftCanvas, hTopLeftCanvas, ix, iyLevel, iz, isGrid, isGridInvalid, isPadding));
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
            paths.set(idStr, drawFaceLeft(idStr, wTopLeftCanvas, hTopLeftCanvas, ixLevel, iy, iz, isGrid, isGridInvalid, isPadding));
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
            paths.set(idStr, drawFaceFront(idStr, wTopLeftCanvas, hTopLeftCanvas, ix, iy, izLevel, isGrid, isGridInvalid, isPadding));
        }
    }

    return paths;
}

function svgDrawSel(nxDraw, nyDraw, nzDraw, nyPadSelEndInDraw, nzPadSelEndInDraw, wTopLeftCanvas, hTopLeftCanvas, inOut, iyStartForId, izStartForId) {
    const paths = new Map();

    let isGrid = false;
    var idStr = "";
    let isPadding = false;
    let isGridInvalid = false;

    for (let ix = 0; ix < nxDraw; ix++) { 
        for (let iy = 0; iy < nyDraw+nyPadSelEndInDraw; iy++) { 
            for (let iz = 0; iz < nzDraw+nzPadSelEndInDraw; iz++) {
                idStr = getIdStr(ix,iyStartForId+iy,izStartForId+iz,'top','sel',inOut);
                paths.set(idStr, drawFaceTop(idStr, wTopLeftCanvas, hTopLeftCanvas, ix, iy, iz, isGrid, isGridInvalid, isPadding));
                
                idStr = getIdStr(ix,iyStartForId+iy,izStartForId+iz,'left','sel',inOut);
                paths.set(idStr, drawFaceLeft(idStr, wTopLeftCanvas, hTopLeftCanvas, ix, iy, iz, isGrid, isGridInvalid, isPadding));
                
                idStr = getIdStr(ix,iyStartForId+iy,izStartForId+iz,'front','sel',inOut);
                paths.set(idStr, drawFaceFront(idStr, wTopLeftCanvas, hTopLeftCanvas, ix, iy, iz, isGrid, isGridInvalid, isPadding));
            }
        }
    }

    return paths;
}

function svgDraw() {
    // Check how many pieces to draw
    if ((!p.splitYdir) && (!p.splitZdir)) {
        svgDraw1(p);
    } else if ((p.splitYdir) && (!p.splitZdir)) {
        svgDraw2vert(p);
    } else if ((!p.splitYdir) && (p.splitZdir)) {
        svgDraw2horiz(p);
    } else if ((p.splitYdir) && (p.splitZdir)) {
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
    let pathsSelIn = svgDrawSel(p.nx, p.nyIn, p.nzIn, p.nyPadSelEndIn, p.nzPadSelEndIn, p.wTopLeftCanvas, p.hTopLeftCanvas, 'in', iyStartForId, izStartForId);

    // Draw output
    paddingyTop = 0;
    paddingyBottom = 0;
    paddingzLeft = 0;
    paddingzRight = 0;
    let nInHiddenPadDraw = 0;
    let pathsGridOut = svgDrawGrid(p.nxOut, p.nyOut, p.nzOut, p.wTopLeftCanvas+500, p.hTopLeftCanvas, 'out', iyStartForId, izStartForId,
        paddingyTop, paddingyBottom, paddingzLeft, paddingzRight);
    let pathsSelOut = svgDrawSel(p.nxOut, p.nyOut, p.nzOut, nInHiddenPadDraw, nInHiddenPadDraw, p.wTopLeftCanvas+500, p.hTopLeftCanvas, 'out', iyStartForId, izStartForId);

    // Draw
    let pathsGrid = new Map(function*() { yield* pathsGridIn; yield* pathsGridOut; }());
    let pathsSel = new Map(function*() { yield* pathsSelIn; yield* pathsSelOut; }());
    let svgStr = svgCreateStr(1000,800,pathsGrid,pathsSel);
    $('#ccSVG').html(svgStr);
}

function svgDraw4(p) {
    console.log("drawing four");

    let pathsIn = svgDraw4InOut(
        p.nx, p.nyIn, p.nzIn,
        p.nyInSubcube, p.nzInSubcube,
        p.face,
        p.wTopLeftCanvas, p.hTopLeftCanvas,
        p.padding,
        p.nyPadSelEndIn, p.nzPadSelEndIn,
        p.leftRightSepSubcubes, p.topBottomSepSubcubes,
        'in'
        )
    let pathsOut = svgDraw4InOut(
        p.nxOut, p.nyOut, p.nzOut,
        p.nyOutSubcube, p.nzOutSubcube,
        p.face,
        p.wTopLeftCanvas + 500, p.hTopLeftCanvas + 0,
        p.paddingOut,
        p.nyPadSelEndOut, p.nzPadSelEndOut,
        p.leftRightSepSubcubes, p.topBottomSepSubcubes,
        'out'
        )

    let pathsGrid = new Map(function*() { yield* pathsIn.pathsGrid; yield* pathsOut.pathsGrid; }());
    let pathsSel = new Map(function*() { yield* pathsIn.pathsSel; yield* pathsOut.pathsSel; }());
    let svgStr = svgCreateStr(1000,800,pathsGrid,pathsSel);
    $('#ccSVG').html(svgStr);
}

function svgDraw4InOut(
    nx, ny, nz, 
    nySubcube, nzSubcube, 
    face, 
    wTopLeftCanvas, hTopLeftCanvas, 
    padding, 
    nyPadSelEnd, nzPadSelEnd,
    leftRightSepSubcubes, topBottomSepSubcubes,
    inOut
    ) {

    // Top-left
    var paddingyTop = padding;
    var paddingyBottom = 0;
    var paddingzLeft = padding;
    var paddingzRight = 0;

    var iyStartForId = 0;
    var izStartForId = 0;
    var nyPadSelEndUse = 0;
    var nzPadSelEndUse = 0;
    let pathsGridInTL = svgDrawGrid(nx, nySubcube, nzSubcube, wTopLeftCanvas, hTopLeftCanvas, inOut, iyStartForId, izStartForId,
        paddingyTop, paddingyBottom, paddingzLeft, paddingzRight);
    let pathsSelInTL = svgDrawSel(nx, nySubcube, nzSubcube, nyPadSelEndUse, nzPadSelEndUse, wTopLeftCanvas, hTopLeftCanvas, 
        inOut, iyStartForId, izStartForId);

    // Top right
    paddingyTop = padding;
    paddingyBottom = 0;
    paddingzLeft = 0;
    paddingzRight = padding;

    let deltaRightW = nzSubcube*face.wTranslate + nx*face.boxDim + leftRightSepSubcubes;
    let deltaRightH = nzSubcube*face.hTranslate + (face.hTranslate/face.wTranslate)*(nx*face.boxDim + leftRightSepSubcubes);

    var wTopLeftCanvasSubcube = wTopLeftCanvas + deltaRightW;
    var hTopLeftCanvasSubcube = hTopLeftCanvas + deltaRightH;
    iyStartForId = 0;
    izStartForId = nz - nzSubcube;
    nyPadSelEndUse = 0;
    nzPadSelEndUse = nzPadSelEnd;
    let pathsGridInTR = svgDrawGrid(nx, nySubcube, nzSubcube, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, inOut, iyStartForId, izStartForId,
        paddingyTop, paddingyBottom, paddingzLeft, paddingzRight);
    let pathsSelInTR = svgDrawSel(nx, nySubcube, nzSubcube, nyPadSelEndUse, nzPadSelEndUse, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, 
        inOut, iyStartForId, izStartForId);

    // Bottom-left
    let deltaDownW = 0;
    let deltaDownH = nySubcube*face.boxDim + nzSubcube*face.hTranslate + topBottomSepSubcubes;

    paddingyTop = 0;
    paddingyBottom = padding;
    paddingzLeft = padding;
    paddingzRight = 0;

    wTopLeftCanvasSubcube = wTopLeftCanvas + deltaDownW;
    hTopLeftCanvasSubcube = hTopLeftCanvas + deltaDownH;
    iyStartForId = ny - nySubcube;
    izStartForId = 0;
    nyPadSelEndUse = nyPadSelEnd;
    nzPadSelEndUse = 0;
    let pathsGridInBL = svgDrawGrid(nx, nySubcube, nzSubcube, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, inOut, iyStartForId, izStartForId,
        paddingyTop, paddingyBottom, paddingzLeft, paddingzRight);
    let pathsSelInBL = svgDrawSel(nx, nySubcube, nzSubcube, nyPadSelEndUse, nzPadSelEndUse, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, 
        inOut, iyStartForId, izStartForId);

    // Bottom-right
    paddingyTop = 0;
    paddingyBottom = padding;
    paddingzLeft = 0;
    paddingzRight = padding;

    wTopLeftCanvasSubcube = wTopLeftCanvas + deltaDownW + deltaRightW;
    hTopLeftCanvasSubcube = hTopLeftCanvas + deltaDownH + deltaRightH;
    iyStartForId = ny - nySubcube;
    izStartForId = nz - nzSubcube;
    nyPadSelEndUse = nyPadSelEnd;
    nzPadSelEndUse = nzPadSelEnd;
    let pathsGridInBR = svgDrawGrid(nx, nySubcube, nzSubcube, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, inOut, iyStartForId, izStartForId,
        paddingyTop, paddingyBottom, paddingzLeft, paddingzRight);
    let pathsSelInBR = svgDrawSel(nx, nySubcube, nzSubcube, nyPadSelEndUse, nzPadSelEndUse, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, 
        inOut, iyStartForId, izStartForId);

    // Draw
    let pathsGrid = new Map(function*() { yield* pathsGridInTL; yield* pathsGridInTR; yield* pathsGridInBL; yield* pathsGridInBR; }());
    let pathsSel = new Map(function*() { yield* pathsSelInTL; yield* pathsSelInTR; yield* pathsSelInBL; yield* pathsSelInBR; }());
    return { pathsGrid, pathsSel };
}

function svgDraw2vert(p) {
    console.log("drawing 2 vertical");

    let pathsIn = svgDraw2vertInOut(
        p.nx, p.nyIn, p.nzIn,
        p.nyInSubcube,
        p.face,
        p.wTopLeftCanvas, p.hTopLeftCanvas,
        p.padding,
        p.nyPadSelEndIn, p.nzPadSelEndIn,
        p.topBottomSepSubcubes,
        'in'
        )
    let pathsOut = svgDraw2vertInOut(
        p.nxOut, p.nyOut, p.nzOut,
        p.nyOutSubcube,
        p.face,
        p.wTopLeftCanvas + 500, p.hTopLeftCanvas + 0,
        p.paddingOut,
        p.nyPadSelEndOut, p.nzPadSelEndOut,
        p.topBottomSepSubcubes,
        'out'
        )

    let pathsGrid = new Map(function*() { yield* pathsIn.pathsGrid; yield* pathsOut.pathsGrid; }());
    let pathsSel = new Map(function*() { yield* pathsIn.pathsSel; yield* pathsOut.pathsSel; }());
    let svgStr = svgCreateStr(1000,800,pathsGrid,pathsSel);
    $('#ccSVG').html(svgStr);
}

function svgDraw2vertInOut(
    nx, ny, nz, 
    nySubcube, 
    face, 
    wTopLeftCanvas, hTopLeftCanvas, 
    padding, 
    nyPadSelEnd, nzPadSelEnd,
    topBottomSepSubcubes,
    inOut
    ) {

    // Top left
    var paddingyTop = padding;
    var paddingyBottom = 0;
    var paddingzLeft = padding;
    var paddingzRight = padding;

    var nyPadSelEndUse = 0;
    var nzPadSelEndUse = nzPadSelEnd;
    var iyStartForId = 0;
    var izStartForId = 0;
    let pathsGridInTL = svgDrawGrid(nx, nySubcube, nz, wTopLeftCanvas, hTopLeftCanvas, inOut, iyStartForId, izStartForId,
        paddingyTop, paddingyBottom, paddingzLeft, paddingzRight);
    let pathsSelInTL = svgDrawSel(nx, nySubcube, nz, nyPadSelEndUse, nzPadSelEndUse, wTopLeftCanvas, 
        hTopLeftCanvas, inOut, iyStartForId, izStartForId);

    let deltaDownW = 0;
    let deltaDownH = nySubcube*face.boxDim + nz*face.hTranslate + topBottomSepSubcubes;

    // Bottom-left
    paddingyTop = 0;
    paddingyBottom = padding;
    paddingzLeft = padding;
    paddingzRight = padding;

    wTopLeftCanvasSubcube = wTopLeftCanvas + deltaDownW;
    hTopLeftCanvasSubcube = hTopLeftCanvas + deltaDownH;
    iyStartForId = ny - nySubcube;
    izStartForId = 0;
    nyPadSelEndUse = nyPadSelEnd;
    nzPadSelEndUse = nzPadSelEnd;
    let pathsGridInBL = svgDrawGrid(nx, nySubcube, nz, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, inOut, iyStartForId, izStartForId,
        paddingyTop, paddingyBottom, paddingzLeft, paddingzRight);
    let pathsSelInBL = svgDrawSel(nx, nySubcube, nz, nyPadSelEndUse, nzPadSelEndUse, 
        wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, inOut, iyStartForId, izStartForId);

    // Draw
    let pathsGrid = new Map(function*() { yield* pathsGridInTL; yield* pathsGridInBL; }());
    let pathsSel = new Map(function*() { yield* pathsSelInTL; yield* pathsSelInBL; }());
    return {pathsGrid, pathsSel};
}

function svgDraw2horiz(p) {
    console.log("drawing 2 horizontal");

    let pathsIn = svgDraw2horizInOut(
        p.nx, p.nyIn, p.nzIn,
        p.nzInSubcube,
        p.face,
        p.wTopLeftCanvas, p.hTopLeftCanvas,
        p.padding,
        p.nyPadSelEndIn, p.nzPadSelEndIn,
        p.leftRightSepSubcubes,
        'in'
        )
    let pathsOut = svgDraw2horizInOut(
        p.nxOut, p.nyOut, p.nzOut,
        p.nzOutSubcube,
        p.face,
        p.wTopLeftCanvas + 500, p.hTopLeftCanvas + 0,
        p.paddingOut,
        p.nyPadSelEndOut, p.nzPadSelEndOut,
        p.leftRightSepSubcubes,
        'out'
        )

    let pathsGrid = new Map(function*() { yield* pathsIn.pathsGrid; yield* pathsOut.pathsGrid; }());
    let pathsSel = new Map(function*() { yield* pathsIn.pathsSel; yield* pathsOut.pathsSel; }());
    let svgStr = svgCreateStr(1000,800,pathsGrid,pathsSel);
    $('#ccSVG').html(svgStr);
}

function svgDraw2horizInOut(
    nx, ny, nz, 
    nzSubcube, 
    face, 
    wTopLeftCanvas, hTopLeftCanvas, 
    padding, 
    nyPadSelEnd, nzPadSelEnd,
    leftRightSepSubcubes,
    inOut
    ) {

    // Top left
    var paddingyTop = padding;
    var paddingyBottom = padding;
    var paddingzLeft = padding;
    var paddingzRight = 0;

    var nyPadSelEndUse = nyPadSelEnd;
    var nzPadSelEndUse = 0;
    var iyStartForId = 0;
    var izStartForId = 0;
    let pathsGridInTL = svgDrawGrid(nx, ny, nzSubcube, wTopLeftCanvas, hTopLeftCanvas, inOut, iyStartForId, izStartForId,
        paddingyTop, paddingyBottom, paddingzLeft, paddingzRight);
    let pathsSelInTL = svgDrawSel(nx, ny, nzSubcube, nyPadSelEndUse, nzPadSelEndUse, wTopLeftCanvas, hTopLeftCanvas, 
        inOut, iyStartForId, izStartForId);

    let deltaRightW = nzSubcube*face.wTranslate + nx*face.boxDim + leftRightSepSubcubes;
    let deltaRightH = nzSubcube*face.hTranslate + (face.hTranslate/face.wTranslate)*(nx*face.boxDim + leftRightSepSubcubes);

    // Top right
    paddingyTop = padding;
    paddingyBottom = padding;
    paddingzLeft = 0;
    paddingzRight = padding;

    var wTopLeftCanvasSubcube = wTopLeftCanvas + deltaRightW;
    var hTopLeftCanvasSubcube = hTopLeftCanvas + deltaRightH;
    iyStartForId = 0;
    izStartForId = nz - nzSubcube;
    nyPadSelEndUse = nyPadSelEnd;
    nzPadSelEndUse = nzPadSelEnd;
    let pathsGridInTR = svgDrawGrid(nx, ny, nzSubcube, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, 
        inOut, iyStartForId, izStartForId,
        paddingyTop, paddingyBottom, paddingzLeft, paddingzRight);
    let pathsSelInTR = svgDrawSel(nx, ny, nzSubcube, nyPadSelEndUse, nzPadSelEndUse, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, 
        inOut, iyStartForId, izStartForId);

    // Draw
    let pathsGrid = new Map(function*() { yield* pathsGridInTL; yield* pathsGridInTR; }());
    let pathsSel = new Map(function*() { yield* pathsSelInTL; yield* pathsSelInTR; }());
    return { pathsGrid, pathsSel };
}
