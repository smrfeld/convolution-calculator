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

let heightCanvasFixed = 400;

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
        this.angle = Math.atan(hTranslate / wTranslate)  * 180.0 / Math.PI;
    }
}

class Params {
    constructor(nx, nyInput, nzInput, padding, nFilters, filterSize, stride, widthCanvas) {
        this.nx = nx;
        this.nyInput = nyInput;
        this.nzInput = nzInput;
        this.padding = padding;
        this.nFilters = nFilters;
        this.filterSize = filterSize;
        this.stride = stride;

        this.widthCanvas = widthCanvas;
        console.log("Using width, height for canvas:", this.widthCanvas, heightCanvasFixed);

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

        // Face
        let faceBoxDim = 50;
        let faceDx = 20;
        let faceDy = 15;
        this.face = new Face(faceDx, faceDy, faceBoxDim);

        // Seperation in x between subcubes
        this.leftRightSepSubcubes = 20;
        this.topBottomSepSubcubes = 20;

        // Output dimensions
        this.nyOutTheory = (this.nyInput - this.filterSize + 2*this.padding)/this.stride + 1;
        this.nzOutTheory = (this.nzInput - this.filterSize + 2*this.padding)/this.stride + 1;
        this.nyOut = Math.ceil(this.nyOutTheory);
        this.nzOut = Math.ceil(this.nzOutTheory);
        this.nxOut = this.nFilters;

        // If nyOut > 4, split ny, same for z
        this.splitYdir = (this.nyOut > 4);
        this.splitZdir = (this.nzOut > 4);

        // Padding for drawing hidden parts on the input
        let nyInCalculatedFromNyOut = this.stride*this.nyOut + this.filterSize;
        let nzInCalculatedFromNzOut = this.stride*this.nzOut + this.filterSize;
        this.nyPadSelEndIn = nyInCalculatedFromNyOut - this.nyIn;
        this.nzPadSelEndIn = nzInCalculatedFromNzOut - this.nzIn;
        this.nyPadSelEndOut = 0;
        this.nzPadSelEndOut = 0;

        // Selection
        this.ixSelOut = 0;
        this.iySelOut = 0;
        this.izSelOut = -1;

        // Drawing parameters
        this.wTopLeftCanvasIn = 0;
        this.hTopLeftCanvasIn = 0;
        this.wTopLeftCanvasOut = 0;
        this.hTopLeftCanvasOut = 0;

        // Padding planes
        this.paddingPlanesConstYIn = [];
        this.paddingPlanesConstZIn = [];
        this.paddingPlanesConstYOut = []; // never padded
        this.paddingPlanesConstZOut = []; // never padded
        for (let iy = 0; iy < this.padding; iy++) { 
            this.paddingPlanesConstYIn.push(iy);
        }
        for (let iy = this.nyIn - this.padding; iy < this.nyIn; iy++) {
            this.paddingPlanesConstYIn.push(iy);
        }
        for (let iz = 0; iz < this.padding; iz++) { 
            this.paddingPlanesConstZIn.push(iz);
        }
        for (let iz = this.nzIn - this.padding; iz < this.nzIn; iz++) {
            this.paddingPlanesConstZIn.push(iz);
        }

        // Error planes
        this.invalidPlanesConstYIn = [];
        this.invalidPlanesConstZIn = [];
        this.invalidPlanesConstYOut = [];
        this.invalidPlanesConstZOut = [];
        // Filter does not evenly cover
        for (let iy=Math.floor(this.nyOutTheory); iy<this.nyOut; iy++) {
            this.invalidPlanesConstYOut.push(iy);
        }
        for (let iz=Math.floor(this.nzOutTheory); iz<this.nzOut; iz++) {
            this.invalidPlanesConstZOut.push(iz);
        }   
        // Skipped inputs
        if (this.stride > this.filterSize) {
            for (let iy=this.filterSize; iy<this.nyIn; iy+=this.stride) {
                for (let iy0=iy; iy0<iy+this.stride-this.filterSize; iy0++) {
                    this.invalidPlanesConstYIn.push(iy0);
                }
            }
            for (let iz=this.filterSize; iz<this.nzIn; iz+=this.stride) {
                for (let iz0=iz; iz0<iz+this.stride-this.filterSize; iz0++) {
                    this.invalidPlanesConstZIn.push(iz0);
                }
            }
        }

        // Rescale
        this.rescale(this.widthCanvas);
    }

    rescale(widthCanvas) {
        this.widthCanvas = widthCanvas;
        
        // Get current width, height
        let curr = this.getWidthHeight();

        // Height should be 80% of possible height
        // Width should be 80 % of half of page width for in,out
        let drawingHeight = 0.75 * heightCanvasFixed;
        let drawingWidth = 0.75 * 0.5*this.widthCanvas;
        
        // Scaling
        // Find smallest rescaling factor
        var scaleHeightIn = drawingHeight / curr.heightIn;
        var scaleHeightOut = drawingHeight / curr.heightOut;
        var scaleWidthIn = drawingWidth / curr.widthIn;
        var scaleWidthOut = drawingWidth / curr.widthOut;
        let scale = Math.min(scaleHeightIn, scaleHeightOut, scaleWidthIn, scaleWidthOut);
        
        // Scale everything
        this.leftRightSepSubcubes *= scale;
        this.topBottomSepSubcubes *= scale;
        this.face.boxDim *= scale;
        this.face.wTranslate *= scale;
        this.face.hTranslate *= scale;

        // Offset
        let resWidthIn = scale * curr.widthIn;
        let marginWidthIn = 0.5 * (0.5*this.widthCanvas - resWidthIn);
        this.wTopLeftCanvasIn = marginWidthIn;

        let resWidthOut = scale * curr.widthOut;
        let marginWidthOut = 0.5 * (0.5*this.widthCanvas - resWidthOut);
        this.wTopLeftCanvasOut = 0.5*this.widthCanvas + marginWidthOut;

        let resHeightIn = scale * curr.heightIn;
        let marginHeightIn = 0.5 * (heightCanvasFixed - resHeightIn);
        this.hTopLeftCanvasIn = marginHeightIn;

        let resHeightOut = scale * curr.heightOut;
        let marginHeightOut = 0.5 * (heightCanvasFixed - resHeightOut);
        this.hTopLeftCanvasOut = marginHeightOut;
    }

    getPadding(inOut) {
        if (inOut == 'in') {
            return this.padding;
        } else {
            return 0;
        }
    }

    getN(inOut) {
        if (inOut == 'in') {
            return { 
                nx: this.nx, 
                ny: this.nyIn, 
                nz: this.nzIn,
                nySubcube: this.nyInSubcube,
                nzSubcube: this.nzInSubcube
            };
        } else {
            return { 
                nx: this.nxOut, 
                ny: this.nyOut, 
                nz: this.nzOut,
                nySubcube: this.nyOutSubcube,
                nzSubcube: this.nzOutSubcube
            };
        }
    }

    getSplitParams(inOut) {
        let n = this.getN(inOut);
        var nx, ny, nz;
        if (this.splitYdir && this.splitZdir) {
            // Four pieces
            nx = n.nx;
            ny = n.nySubcube;
            nz = n.nzSubcube;
        } else if (this.splitYdir && !this.splitZdir) {
            // Two vertical
            nx = n.nx;
            ny = n.nySubcube;
            nz = n.nz;
        } else if (!this.splitYdir && this.splitZdir) {
            // Two horizontal
            nx = n.nx;
            ny = n.ny;
            nz = n.nzSubcube;
        } else {
            // One piece
            nx = n.nx;
            ny = n.ny;
            nz = n.nz;
        }

        return { nx, ny, nz };
    }

    getwTopLeftCanvas(inOut) {
        if (inOut == 'in') {
            return this.wTopLeftCanvasIn;
        } else {
            return this.wTopLeftCanvasOut;
        }
    }

    gethTopLeftCanvas(inOut) {
        if (inOut == 'in') {
            return this.hTopLeftCanvasIn;
        } else {
            return this.hTopLeftCanvasOut;
        }
    }

    getBottomRightOfSubcube(subCube, inOut, localGlobal) {
        let n = this.getSplitParams(inOut);
        let bottomRight = getBottomRightOfSubcube(subCube, 
            n.nx, n.ny, n.nz, 
            this.face, this.leftRightSepSubcubes, this.topBottomSepSubcubes);
        if (localGlobal == 'local') {
            return bottomRight;
        } else {
            let wBottomRight = bottomRight.wBottomRight + this.getwTopLeftCanvas(inOut);
            let hBottomRight = bottomRight.hBottomRight + this.gethTopLeftCanvas(inOut);
            return { wBottomRight, hBottomRight };
        }
    }

    getTopLeftOfSubcube(subCube, inOut, localGlobal) {
        let n = this.getSplitParams(inOut);
        let topLeft = getTopLeftOfSubcube(subCube, 
            n.nx, n.ny, n.nz, 
            this.face, this.leftRightSepSubcubes, this.topBottomSepSubcubes);
        if (localGlobal == 'local') {
            return topLeft;
        } else {
            let wTopLeft = topLeft.wTopLeft + this.getwTopLeftCanvas(inOut);
            let hTopLeft = topLeft.hTopLeft + this.gethTopLeftCanvas(inOut);
            return { wTopLeft, hTopLeft };
        }
    }

    getBoxWidthHeight(inOut) {
        let n = this.getSplitParams(inOut);
        return getBoxWidthHeight(n.nx, n.ny, n.nz, this.face);
    }

    getWidthHeight() {
        var subCube;        
        if (this.splitYdir && this.splitZdir) {
            // Four pieces
            subCube = 'BR';
        } else if (this.splitYdir && !this.splitZdir) {
            // Two vertical
            subCube = 'BL';
        } else if (!this.splitYdir && this.splitZdir) {
            // Two horizontal
            subCube = 'TR';
        } else {
            // One piece
            subCube = 'TL';
        }

        let brIn = this.getBottomRightOfSubcube(subCube, 'in', 'local');
        let brOut = this.getBottomRightOfSubcube(subCube, 'out', 'local');

        let widthIn = brIn.wBottomRight;
        let heightIn = brIn.hBottomRight;
        let widthOut = brOut.wBottomRight;
        let heightOut = brOut.hBottomRight;

        return { widthIn, heightIn, widthOut, heightOut };
    }

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

    svgDecrementSelz() {    
        this.izSelOut -= 1;
        if (this.splitZdir) {
            // Break in z direction
            // Only allowed indexes are 0,1 or nzOut-2, nzOut-1
            if ((this.izSelOut > 1) && (this.izSelOut < this.nzOut-2)) {
                this.izSelOut = 1;
            } 
        }
    }    

    svgDecrementSely() {    
        this.iySelOut -= 1;
        if (this.splitYdir) {
            // Break in y direction
            // Only allowed indexes are 0,1 or nyOut-2, nyOut-1
            if ((this.iySelOut > 1) && (this.iySelOut < this.nyOut-2)) {
                this.iySelOut = 1;
            } 
        }
    }

    svgDecrementSel() {

        // Next in z direction
        this.svgDecrementSelz();
    
        // Check in bounds
        if (this.izSelOut < 0) {
            // Next in y direction
            this.svgDecrementSely();
            this.izSelOut = this.nzOut-1;
        }
        if (this.iySelOut < 0) {
            // Next in x direction
            this.ixSelOut -= 1;
            this.iySelOut = this.nyOut-1;
            this.izSelOut = this.nzOut-1;
        }
        if (this.ixSelOut < 0) {
            // Reset
            this.ixSelOut = this.nxOut-1;
            this.iySelOut = this.nyOut-1;
            this.izSelOut = this.nzOut-1;
        }
    }
}

function getBoxWidthHeight(nx, ny, nz, face) {
    let width = nx * face.boxDim + nz * face.wTranslate;
    let height = ny * face.boxDim + nz * face.hTranslate;
    return { width, height };
}

function getTopLeftOfSubcube(subCube, nx, ny, nz, face, leftRightSepSubcubes, topBottomSepSubcubes) {
    var wTopLeft, hTopLeft;
    if (subCube == 'TR') {
        wTopLeft = nz * face.wTranslate + nx * face.boxDim + leftRightSepSubcubes;
        hTopLeft = nz * face.hTranslate + (face.hTranslate / face.wTranslate) * (nx * face.boxDim + leftRightSepSubcubes);
    } else if (subCube == 'BL') {
        wTopLeft = 0;
        hTopLeft = ny * face.boxDim + nz * face.hTranslate + topBottomSepSubcubes;    
    } else if (subCube == 'BR') {
        let wTopLeftTR = nz * face.wTranslate + nx * face.boxDim + leftRightSepSubcubes;
        let hTopLeftTR = nz * face.hTranslate + (face.hTranslate / face.wTranslate) * (nx * face.boxDim + leftRightSepSubcubes);
        let wTopLeftBL = 0;
        let hTopLeftBL = ny * face.boxDim + nz * face.hTranslate + topBottomSepSubcubes;    
        wTopLeft = wTopLeftTR + wTopLeftBL;
        hTopLeft = hTopLeftTR + hTopLeftBL;
    } else if (subCube == 'TL') {
        wTopLeft = 0;
        hTopLeft = 0;
    }
    return { wTopLeft, hTopLeft };
}

function getBottomRightOfSubcube(subCube, nx, ny, nz, face, leftRightSepSubcubes, topBottomSepSubcubes) {
    let topLeft = getTopLeftOfSubcube(subCube, nx, ny, nz, face, leftRightSepSubcubes, topBottomSepSubcubes);
    let box = getBoxWidthHeight(nx, ny, nz, face);
    let wBottomRight = topLeft.wTopLeft + box.width;
    let hBottomRight = topLeft.hTopLeft + box.height;
    return { wBottomRight, hBottomRight };
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
            // Hide all the grid front elements below
            for (let ix = 0; ix < p.nx; ix++) { 
                for (let iy= iySelIn + p.filterSize; iy < p.nyIn; iy++) {
                    idsBottomLayerNew.push(getIdStr(ix,iy,p.nzIn-1,'front','grid','in'));
                }
            }
        }
        if (idsBottomLayerNew.toString() != this.idsBottomLayer.toString()) {
            // Redraw grid to correct order for selection that is sticking out the front
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

// Params
var p = NaN;
var ds = new DrawingSelections();

// Resized window
$( window ).resize(function() {    
    // Get width and height
    let widthCanvas = $("#ccSVG").width();
    console.log("resizing because window height changed; new width: ", widthCanvas);

    // Rescale
    p.rescale(widthCanvas);

    // Draw
    p.iySelOut = 0;
    p.ixSelOut = 0;
    p.izSelOut = -1;
    svgDraw();
    svgAnimateLoopStep();
});

function updateParamsFromUserInput() {
    var nxNew = parseInt($("#ccnx").val());
    var nyInputNew = parseInt($("#ccnyInput").val());
    var nzInputNew = parseInt($("#ccnzInput").val());
    var paddingNew = parseInt($("#ccpadding").val());
    var nFiltersNew = parseInt($("#ccnFilters").val());
    var filterSizeNew = parseInt($("#ccfilterSize").val());
    var strideNew = parseInt($("#ccstride").val());
    let widthCanvas = $("#ccSVG").width();

    console.log("Updated params from user input - width, height =", widthCanvas);
    updateParams(nxNew, nyInputNew, nzInputNew, paddingNew, nFiltersNew, filterSizeNew, strideNew, widthCanvas);
}

function updateUserFromParams() {
    $("#ccnx").val(String(p.nx));
    $("#ccfilterSize").val(String(p.filterSize));
    $('#ccstride').val(String(p.stride));
    $('#ccpadding').val(String(p.padding));
    $('#ccnFilters').val(String(p.nFilters));
}

function updateParams(nxNew, nyInputNew, nzInputNew, paddingNew, nFiltersNew, filterSizeNew, strideNew, widthCanvas) {
    if (isNaN(nxNew) || nxNew < 1 || nxNew > 10) {
        nxNew = p.nx;
    }
    if (isNaN(nyInputNew) || nyInputNew <= 0) {
        nyInputNew = p.nyInput;
    }

    if (isNaN(nzInputNew) || nzInputNew <= 0) {
        nzInputNew = p.nzInput;
    }

    if (isNaN(paddingNew) || paddingNew < 0) {
        paddingNew = p.padding;
    }

    if (isNaN(nFiltersNew) || nFiltersNew < 1) {
        nFiltersNew = p.nFilters;
    }

    if (isNaN(filterSizeNew) || filterSizeNew < 1 || filterSizeNew > 20) {
        filterSizeNew = p.filterSize;
    }

    // Limits on filter size
    if (filterSizeNew > nyInputNew + 2*paddingNew) {
        filterSizeNew = nyInputNew + 2*paddingNew;
    }
    if (filterSizeNew > nzInputNew + 2*paddingNew) {
        filterSizeNew = nzInputNew + 2*paddingNew;
    }

    if (isNaN(strideNew) || strideNew < 1) {
        strideNew = p.stride;
    }

    // Limit stride to filter size + 1 to demonstrate error
    // Else input plots can become too large
    if (strideNew > filterSizeNew + 1) {
        strideNew = filterSizeNew + 1;
    }

    // Update params only if something changed
    if (isNaN(p) || nxNew != p.nx || nyInputNew != p.nyInput || nzInputNew != p.nzInput 
        || paddingNew != p.padding || nFiltersNew != p.nFilters || filterSizeNew != p.filterSize
        || strideNew != p.stride || widthCanvas != p.widthCanvas) {
        
        console.log("New params: (paddingNew, nFiltersNew, filterSizeNew, strideNew) = ",
            paddingNew,nFiltersNew,filterSizeNew,strideNew);

        // Update params
        p = new Params(nxNew, nyInputNew, nzInputNew, paddingNew, nFiltersNew, filterSizeNew, strideNew, widthCanvas);

        // Update user display
        updateUserFromParams(p);

        // Redraw
        svgDraw();
        svgAnimateLoopStep();
    }
}

function filterSizeAdd() {
    updateParams(p.nx, p.nyInput, p.nzInput, p.padding, p.nFilters, p.filterSize+1, p.stride, p.widthCanvas);
}

function filterSizeSub() {
    updateParams(p.nx, p.nyInput, p.nzInput, p.padding, p.nFilters, p.filterSize-1, p.stride, p.widthCanvas);
}

function strideAdd() {
    updateParams(p.nx, p.nyInput, p.nzInput, p.padding, p.nFilters, p.filterSize, p.stride+1, p.widthCanvas);
}

function strideSub() {
    updateParams(p.nx, p.nyInput, p.nzInput, p.padding, p.nFilters, p.filterSize, p.stride-1, p.widthCanvas);
}

function paddingAdd() {
    updateParams(p.nx, p.nyInput, p.nzInput, p.padding+1, p.nFilters, p.filterSize, p.stride, p.widthCanvas);
}

function paddingSub() {
    updateParams(p.nx, p.nyInput, p.nzInput, p.padding-1, p.nFilters, p.filterSize, p.stride, p.widthCanvas);
}

function nxAdd() {
    updateParams(p.nx+1, p.nyInput, p.nzInput, p.padding, p.nFilters, p.filterSize, p.stride, p.widthCanvas);
}

function nxSub() {
    updateParams(p.nx-1, p.nyInput, p.nzInput, p.padding, p.nFilters, p.filterSize, p.stride, p.widthCanvas);
}

function nFiltersAdd() {
    updateParams(p.nx, p.nyInput, p.nzInput, p.padding, p.nFilters+1, p.filterSize, p.stride, p.widthCanvas);
}

function nFiltersSub() {
    updateParams(p.nx, p.nyInput, p.nzInput, p.padding, p.nFilters-1, p.filterSize, p.stride, p.widthCanvas);
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

function svgAnimateLoopStepBack() {
    // Increment
    p.svgDecrementSel();

    // Draw
    ds.svgAnimateLoopDraw(p);
}

function svgAnimateLoopStep() {
    // Increment
    p.svgIncrementSel();

    // Draw
    ds.svgAnimateLoopDraw(p);
}

function svgAnimateLoop() {
    svgAnimateLoopStep();
    timeoutID = setTimeout(svgAnimateLoop, 250);
}

function svgAnimateStop() {
    if (timeoutID != "") {
        clearTimeout(timeoutID);
    }
    timeoutID = "";
}

function svgCreateStr(width, height, pathsGrid, pathsSel, texts) {
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
    
    // Texts
    texts.forEach(function(item, index, array) {
        svgStr += item.svgStr() + '\n';
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

function createInvalidPlanes() {
    // Horizontal planes
    var consty = [];
    for (let iy = 0; iy < paddingyTop; iy++) { 
        consty.push(iy);
    }
    for (let iy = nyDraw - paddingyBottom; iy < nyDraw; iy++) {
        consty.push(iy);
    }

    // Vertical planes
    var constz = [];
    for (let iz = 0; iz < paddingzLeft; iz++) { 
        constz.push(iz);
    }
    for (let iz = nzDraw - paddingzRight; iz < nzDraw; iz++) {
        constz.push(iz);
    }

    return { consty, constz }
}

function svgDrawGrid( 
    nxDraw, nyDraw, nzDraw, 
    wTopLeftCanvas, hTopLeftCanvas, 
    inOut, 
    iyStartForId, izStartForId, 
    paddingPlanesConstY, paddingPlanesConstZ,
    invalidPlanesConstY, invalidPlanesConstZ
    ) {
    const paths = new Map();

    let isGrid = true;
    var idStr = "";
    var isPadding = false;
    var isGridInvalid = false;
    var iyGlobal = 0;
    var izGlobal = 0;

    // Top
    let iyLevel = 0;
    for (let ix = 0; ix < nxDraw; ix++) { 
        for (let iz = 0; iz < nzDraw; iz++) {
            iyGlobal = iyStartForId + iyLevel;
            izGlobal = izStartForId + iz;
            idStr = getIdStr(ix,iyGlobal, izGlobal,'top','grid',inOut);
            if ((paddingPlanesConstY.includes(iyGlobal)) || (paddingPlanesConstZ.includes(izGlobal))) {
                isPadding = true;
            } else {
                isPadding = false;
            }
            if ((invalidPlanesConstY.includes(iyGlobal)) || (invalidPlanesConstZ.includes(izGlobal))) {
                isGridInvalid = true;
            } else {
                isGridInvalid = false;
            }            
            paths.set(idStr, drawFaceTop(idStr, wTopLeftCanvas, hTopLeftCanvas, ix, iyLevel, iz, isGrid, isGridInvalid, isPadding));
        }
    }

    // Left
    let ixLevel = 0;
    for (let iy = 0; iy < nyDraw; iy++) { 
        for (let iz = 0; iz < nzDraw; iz++) {
            iyGlobal = iyStartForId + iy;
            izGlobal = izStartForId + iz;
            idStr = getIdStr(ixLevel,iyGlobal,izGlobal,'left','grid',inOut);
            if ((paddingPlanesConstY.includes(iyGlobal)) || (paddingPlanesConstZ.includes(izGlobal))) {
                isPadding = true;
            } else {
                isPadding = false;
            }
            if ((invalidPlanesConstY.includes(iyGlobal)) || (invalidPlanesConstZ.includes(izGlobal))) {
                isGridInvalid = true;
            } else {
                isGridInvalid = false;
            }
            paths.set(idStr, drawFaceLeft(idStr, wTopLeftCanvas, hTopLeftCanvas, ixLevel, iy, iz, isGrid, isGridInvalid, isPadding));
        }
    }

    // Front
    let izLevel = nzDraw - 1;
    for (let ix = 0; ix < nxDraw; ix++) { 
        for (let iy = 0; iy < nyDraw; iy++) { 
            iyGlobal = iyStartForId + iy;
            izGlobal = izStartForId + izLevel;
            idStr = getIdStr(ix,iyGlobal,izGlobal,'front','grid',inOut);
            if ((paddingPlanesConstY.includes(iyGlobal)) || (paddingPlanesConstZ.includes(izGlobal))) {
                isPadding = true;
            } else {
                isPadding = false;
            }
            if ((invalidPlanesConstY.includes(iyGlobal)) || (invalidPlanesConstZ.includes(izGlobal))) {
                isGridInvalid = true;
            } else {
                isGridInvalid = false;
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

function makeError(message) {
    let s = `
    <div class="row justify-content-center">
    <h4 style="color:red;">
        <i class="material-icons mr-1" style="color:red;">warning</i>
    `;
    s += message + '</h4>\n';
    s += '</div>';
    return s
}

function svgDraw() {
    // Check how many pieces to draw
    var paths;
    if ((!p.splitYdir) && (!p.splitZdir)) {
        paths = svgDraw1(p);
    } else if ((p.splitYdir) && (!p.splitZdir)) {
        paths = svgDraw2vert(p);
    } else if ((!p.splitYdir) && (p.splitZdir)) {
        paths = svgDraw2horiz(p);
    } else if ((p.splitYdir) && (p.splitZdir)) {
        paths = svgDraw4(p);
    }

    let textsIn = svgDrawText(p,'in');
    let textsOut = svgDrawText(p,'out');
    let texts = textsIn.concat(textsOut);

    // Draw
    let svgStr = svgCreateStr(p.widthCanvas,heightCanvasFixed,paths.pathsGrid,paths.pathsSel,texts);
    $('#ccSVG').html(svgStr);

    // Errors
    var errs = "";
    if (p.stride > p.filterSize) {
        errs += makeError("Stride is larger than the filter size - data in the input is skipped.") + "\n";
    }
    
    if (p.padding >= p.filterSize) {
        errs += makeError("Padding is greater or equal to filter size - some filters are not covering any data.") + "\n";
    }

    if (!Number.isInteger(p.nzOutTheory)) {
        errs += makeError("Filter does not evenly cover data in horizontal direction." + "\n");
    }

    if (!Number.isInteger(p.nyOutTheory)) {
        errs += makeError("Filter does not evenly cover data in vertical direction." + "\n");
    }
    $("#ccError").html(errs);

    // Dimensions
    let labelIn = '<h5>Input:&nbsp;' + String(p.nzInput) + 'x' + String(p.nyInput) + 'x' + String(p.nx) + '</h5>\n';
    let labelOut = '<h5>Output:&nbsp;' + String(p.nzOut) + 'x' + String(p.nyOut) + 'x' + String(p.nxOut) + '</h5>\n';
    var dimStr = '<div class="row">\n';
    dimStr += '<div class="col-sm-6" style="text-align: center">\n' + labelIn + '</div>\n';
    dimStr += '<div class="col-sm-6" style="text-align: center">\n' + labelOut + '</div>\n';
    dimStr += "</div>\n";
    $("#ccDims").html(dimStr);
}

class Text {
    constructor(text, x, y, rotate, anchor) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.rotate = rotate;
        this.anchor = anchor;
    }

    svgStr() {
        /*
        var s = '<text text-anchor="end" transform="rotate(0)"';
        s += ' x="' + String(this.x) + '"'; 
        s += ' y="' + String(this.y) + '"'; 
        s += '>';
        s += this.text;
        s += '</text>';
        return s;
        */
        var s = '<g transform="translate(' + String(this.x) + ',' + String(this.y) + ')">\n';
        s += '<text text-anchor="' + this.anchor + '" font-size="x-small"';
        s += 'transform="rotate(' + this.rotate + ')">';
        s += this.text;
        s += '</text>\n</g>';
        return s;
    }
}

function svgDrawText(p, inOut) {
    var texts = [];

    let n = p.getN(inOut);
    let padding = p.getPadding(inOut);

    var topLeft, iyLocalStart, iyLocalEnd, iyGlobalStart;

    // Y direction text
    if (p.splitYdir) {
        topLeft = p.getTopLeftOfSubcube('TL',inOut,'global');
        iyLocalStart = padding;
        iyLocalEnd = n.nySubcube;
        iyGlobalStart = 0;
        texts = texts.concat(svgDrawTextY(iyLocalStart, iyLocalEnd, iyGlobalStart, topLeft, p.face));

        topLeft = p.getTopLeftOfSubcube('BL',inOut,'global');
        iyLocalStart = 0;
        iyLocalEnd = n.nySubcube - padding;
        iyGlobalStart = n.ny - n.nySubcube - padding;
        texts = texts.concat(svgDrawTextY(iyLocalStart, iyLocalEnd, iyGlobalStart, topLeft, p.face));
    } else {
        topLeft = p.getTopLeftOfSubcube('TL',inOut,'global');
        iyLocalStart = padding;
        iyLocalEnd = n.ny - padding;
        iyGlobalStart = 0;
        texts = texts.concat(svgDrawTextY(iyLocalStart, iyLocalEnd, iyGlobalStart, topLeft, p.face));
    }

    // Z direction text
    var izLocalStart, izLocalEnd, izGlobalStart;
    if (p.splitZdir) {
        topLeft = p.getTopLeftOfSubcube('TL',inOut,'global');
        izLocalStart = padding;
        izLocalEnd = n.nzSubcube;
        izGlobalStart = 0;
        texts = texts.concat(svgDrawTextZ(izLocalStart, izLocalEnd, izGlobalStart, n.nx, topLeft, p.face));

        topLeft = p.getTopLeftOfSubcube('TR',inOut,'global');
        izLocalStart = 0;
        izLocalEnd = n.nzSubcube - padding;
        izGlobalStart = n.nz - n.nzSubcube - padding;
        texts = texts.concat(svgDrawTextZ(izLocalStart, izLocalEnd, izGlobalStart, n.nx, topLeft, p.face));
    } else {
        topLeft = p.getTopLeftOfSubcube('TL',inOut,'global');
        izLocalStart = padding;
        izLocalEnd = n.nz - padding;
        izGlobalStart = 0;
        texts = texts.concat(svgDrawTextZ(izLocalStart, izLocalEnd, izGlobalStart, n.nx, topLeft, p.face));
    }

    // X direction text
    topLeft = p.getTopLeftOfSubcube('TL',inOut,'global');
    texts = texts.concat(svgDrawTextX(n.nx, topLeft, p.face));

    return texts;
}

function svgDrawTextY(iyLocalStart, iyLocalEnd, iyGlobalStart, topLeft, face) {
    var texts = [];
    for (let iy = iyLocalStart; iy < iyLocalEnd; iy++) {
        let x = topLeft.wTopLeft - 5;
        let y = topLeft.hTopLeft + (iy + 0.65) * face.boxDim;
        let text = String(iyGlobalStart + iy - iyLocalStart);
        texts.push(new Text(text, x, y, 0, "end"));
    }
    return texts;
}

function svgDrawTextX(nx, topLeft, face) {
    var texts = [];
    for (let ix = 0; ix < nx; ix++) {
        let x = topLeft.wTopLeft + (ix + 0.5) * face.boxDim;
        let y = topLeft.hTopLeft - 5;
        texts.push(new Text(String(ix), x, y, 0, "end"));
    }
    return texts;
}

function svgDrawTextZ(izLocalStart, izLocalEnd, izGlobalStart, nx, topLeft, face) {
    var texts = [];
    for (let iz = izLocalStart; iz < izLocalEnd; iz++) {
        let x = topLeft.wTopLeft + nx * face.boxDim + (iz + 1.65) * face.wTranslate;
        let y = topLeft.hTopLeft + (iz+0.7) * face.hTranslate;
        let text = String(izGlobalStart + iz - izLocalStart);
        texts.push(new Text(text, x, y, -face.angle, "start"));
    }
    return texts;
}

function svgDraw1(p) {
    console.log("drawing single");

    // Draw input
    let iyStartForId = 0;
    let izStartForId = 0;
    let pathsGridIn = svgDrawGrid(p.nx, p.nyIn, p.nzIn, p.wTopLeftCanvasIn, p.hTopLeftCanvasIn, 'in', iyStartForId, izStartForId, 
        p.paddingPlanesConstYIn, p.paddingPlanesConstZIn,
        p.invalidPlanesConstYIn, p.invalidPlanesConstZIn
        );
    let pathsSelIn = svgDrawSel(p.nx, p.nyIn, p.nzIn, p.nyPadSelEndIn, p.nzPadSelEndIn, p.wTopLeftCanvasIn, p.hTopLeftCanvasIn, 'in', iyStartForId, izStartForId);

    // Draw output
    let nInHiddenPadDraw = 0;
    let pathsGridOut = svgDrawGrid(p.nxOut, p.nyOut, p.nzOut, p.wTopLeftCanvasOut, p.hTopLeftCanvasOut, 'out', iyStartForId, izStartForId,
        p.paddingPlanesConstYOut, p.paddingPlanesConstZOut,
        p.invalidPlanesConstYOut, p.invalidPlanesConstZOut
        );
    let pathsSelOut = svgDrawSel(p.nxOut, p.nyOut, p.nzOut, nInHiddenPadDraw, nInHiddenPadDraw, p.wTopLeftCanvasOut, p.hTopLeftCanvasOut, 'out', iyStartForId, izStartForId);

    // Draw
    let pathsGrid = new Map(function*() { yield* pathsGridIn; yield* pathsGridOut; }());
    let pathsSel = new Map(function*() { yield* pathsSelIn; yield* pathsSelOut; }());
    return { pathsGrid, pathsSel };
}

function svgDraw4(p) {
    console.log("drawing four");

    let pathsIn = svgDraw4InOut(
        p.nx, p.nyIn, p.nzIn,
        p.nyInSubcube, p.nzInSubcube,
        p.face,
        p.wTopLeftCanvasIn, p.hTopLeftCanvasIn,
        p.paddingPlanesConstYIn, p.paddingPlanesConstZIn,
        p.invalidPlanesConstYIn, p.invalidPlanesConstZIn,
        p.nyPadSelEndIn, p.nzPadSelEndIn,
        p.leftRightSepSubcubes, p.topBottomSepSubcubes,
        'in'
        )
    let pathsOut = svgDraw4InOut(
        p.nxOut, p.nyOut, p.nzOut,
        p.nyOutSubcube, p.nzOutSubcube,
        p.face,
        p.wTopLeftCanvasOut, p.hTopLeftCanvasOut,
        p.paddingPlanesConstYOut, p.paddingPlanesConstZOut,
        p.invalidPlanesConstYOut, p.invalidPlanesConstZOut,
        p.nyPadSelEndOut, p.nzPadSelEndOut,
        p.leftRightSepSubcubes, p.topBottomSepSubcubes,
        'out'
        )

    let pathsGrid = new Map(function*() { yield* pathsIn.pathsGrid; yield* pathsOut.pathsGrid; }());
    let pathsSel = new Map(function*() { yield* pathsIn.pathsSel; yield* pathsOut.pathsSel; }());
    return { pathsGrid, pathsSel };
}

function svgDraw4InOut(
    nx, ny, nz, 
    nySubcube, nzSubcube, 
    face, 
    wTopLeftCanvas, hTopLeftCanvas, 
    paddingPlanesConstY, paddingPlanesConstZ,
    invalidPlanesConstY, invalidPlanesConstZ,
    nyPadSelEnd, nzPadSelEnd,
    leftRightSepSubcubes, topBottomSepSubcubes,
    inOut
    ) {

    // Top-left
    var iyStartForId = 0;
    var izStartForId = 0;
    var nyPadSelEndUse = 0;
    var nzPadSelEndUse = 0;
    let pathsGridInTL = svgDrawGrid(nx, nySubcube, nzSubcube, wTopLeftCanvas, hTopLeftCanvas, inOut, iyStartForId, izStartForId, 
        paddingPlanesConstY, paddingPlanesConstZ,
        invalidPlanesConstY, invalidPlanesConstZ
        );
    let pathsSelInTL = svgDrawSel(nx, nySubcube, nzSubcube, nyPadSelEndUse, nzPadSelEndUse, wTopLeftCanvas, hTopLeftCanvas, 
        inOut, iyStartForId, izStartForId);

    // Top right
    let deltaRightW = nzSubcube*face.wTranslate + nx*face.boxDim + leftRightSepSubcubes;
    let deltaRightH = nzSubcube*face.hTranslate + (face.hTranslate/face.wTranslate)*(nx*face.boxDim + leftRightSepSubcubes);

    var wTopLeftCanvasSubcube = wTopLeftCanvas + deltaRightW;
    var hTopLeftCanvasSubcube = hTopLeftCanvas + deltaRightH;
    iyStartForId = 0;
    izStartForId = nz - nzSubcube;
    nyPadSelEndUse = 0;
    nzPadSelEndUse = nzPadSelEnd;
    let pathsGridInTR = svgDrawGrid(nx, nySubcube, nzSubcube, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, inOut, iyStartForId, izStartForId, 
        paddingPlanesConstY, paddingPlanesConstZ,
        invalidPlanesConstY, invalidPlanesConstZ
        );
    let pathsSelInTR = svgDrawSel(nx, nySubcube, nzSubcube, nyPadSelEndUse, nzPadSelEndUse, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, 
        inOut, iyStartForId, izStartForId);

    // Bottom-left
    let deltaDownW = 0;
    let deltaDownH = nySubcube*face.boxDim + nzSubcube*face.hTranslate + topBottomSepSubcubes;

    wTopLeftCanvasSubcube = wTopLeftCanvas + deltaDownW;
    hTopLeftCanvasSubcube = hTopLeftCanvas + deltaDownH;
    iyStartForId = ny - nySubcube;
    izStartForId = 0;
    nyPadSelEndUse = nyPadSelEnd;
    nzPadSelEndUse = 0;
    let pathsGridInBL = svgDrawGrid(nx, nySubcube, nzSubcube, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, inOut, iyStartForId, izStartForId, 
        paddingPlanesConstY, paddingPlanesConstZ,
        invalidPlanesConstY, invalidPlanesConstZ
        );
    let pathsSelInBL = svgDrawSel(nx, nySubcube, nzSubcube, nyPadSelEndUse, nzPadSelEndUse, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, 
        inOut, iyStartForId, izStartForId);

    // Bottom-right
    wTopLeftCanvasSubcube = wTopLeftCanvas + deltaDownW + deltaRightW;
    hTopLeftCanvasSubcube = hTopLeftCanvas + deltaDownH + deltaRightH;
    iyStartForId = ny - nySubcube;
    izStartForId = nz - nzSubcube;
    nyPadSelEndUse = nyPadSelEnd;
    nzPadSelEndUse = nzPadSelEnd;
    let pathsGridInBR = svgDrawGrid(nx, nySubcube, nzSubcube, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, inOut, iyStartForId, izStartForId, 
        paddingPlanesConstY, paddingPlanesConstZ,
        invalidPlanesConstY, invalidPlanesConstZ
        );
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
        p.wTopLeftCanvasIn, p.hTopLeftCanvasIn,
        p.paddingPlanesConstYIn, p.paddingPlanesConstZIn,
        p.invalidPlanesConstYIn, p.invalidPlanesConstZIn,
        p.nyPadSelEndIn, p.nzPadSelEndIn,
        p.topBottomSepSubcubes,
        'in'
        )
    let pathsOut = svgDraw2vertInOut(
        p.nxOut, p.nyOut, p.nzOut,
        p.nyOutSubcube,
        p.face,
        p.wTopLeftCanvasOut, p.hTopLeftCanvasOut,
        p.paddingPlanesConstYOut, p.paddingPlanesConstZOut,
        p.invalidPlanesConstYOut, p.invalidPlanesConstZOut,
        p.nyPadSelEndOut, p.nzPadSelEndOut,
        p.topBottomSepSubcubes,
        'out'
        )

    let pathsGrid = new Map(function*() { yield* pathsIn.pathsGrid; yield* pathsOut.pathsGrid; }());
    let pathsSel = new Map(function*() { yield* pathsIn.pathsSel; yield* pathsOut.pathsSel; }());
    return { pathsGrid, pathsSel };
}

function svgDraw2vertInOut(
    nx, ny, nz, 
    nySubcube, 
    face, 
    wTopLeftCanvas, hTopLeftCanvas, 
    paddingPlanesConstY, paddingPlanesConstZ, 
    invalidPlanesConstY, invalidPlanesConstZ,
    nyPadSelEnd, nzPadSelEnd,
    topBottomSepSubcubes,
    inOut
    ) {

    // Top left
    var nyPadSelEndUse = 0;
    var nzPadSelEndUse = nzPadSelEnd;
    var iyStartForId = 0;
    var izStartForId = 0;
    let pathsGridInTL = svgDrawGrid(nx, nySubcube, nz, wTopLeftCanvas, hTopLeftCanvas, inOut, iyStartForId, izStartForId, 
        paddingPlanesConstY, paddingPlanesConstZ,
        invalidPlanesConstY, invalidPlanesConstZ
        );
    let pathsSelInTL = svgDrawSel(nx, nySubcube, nz, nyPadSelEndUse, nzPadSelEndUse, wTopLeftCanvas, 
        hTopLeftCanvas, inOut, iyStartForId, izStartForId);

    let deltaDownW = 0;
    let deltaDownH = nySubcube*face.boxDim + nz*face.hTranslate + topBottomSepSubcubes;

    // Bottom-left
    wTopLeftCanvasSubcube = wTopLeftCanvas + deltaDownW;
    hTopLeftCanvasSubcube = hTopLeftCanvas + deltaDownH;
    iyStartForId = ny - nySubcube;
    izStartForId = 0;
    nyPadSelEndUse = nyPadSelEnd;
    nzPadSelEndUse = nzPadSelEnd;
    let pathsGridInBL = svgDrawGrid(nx, nySubcube, nz, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, inOut, iyStartForId, izStartForId, 
        paddingPlanesConstY, paddingPlanesConstZ,
        invalidPlanesConstY, invalidPlanesConstZ
        );
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
        p.wTopLeftCanvasIn, p.hTopLeftCanvasIn,
        p.paddingPlanesConstYIn, p.paddingPlanesConstZIn,
        p.invalidPlanesConstYIn, p.invalidPlanesConstZIn,
        p.nyPadSelEndIn, p.nzPadSelEndIn,
        p.leftRightSepSubcubes,
        'in'
        )
    let pathsOut = svgDraw2horizInOut(
        p.nxOut, p.nyOut, p.nzOut,
        p.nzOutSubcube,
        p.face,
        p.wTopLeftCanvasOut, p.hTopLeftCanvasOut,
        p.paddingPlanesConstYOut, p.paddingPlanesConstZOut,
        p.invalidPlanesConstYOut, p.invalidPlanesConstZOut,
        p.nyPadSelEndOut, p.nzPadSelEndOut,
        p.leftRightSepSubcubes,
        'out'
        )

    let pathsGrid = new Map(function*() { yield* pathsIn.pathsGrid; yield* pathsOut.pathsGrid; }());
    let pathsSel = new Map(function*() { yield* pathsIn.pathsSel; yield* pathsOut.pathsSel; }());
    return { pathsGrid, pathsSel };
}

function svgDraw2horizInOut(
    nx, ny, nz, 
    nzSubcube, 
    face, 
    wTopLeftCanvas, hTopLeftCanvas, 
    paddingPlanesConstY, paddingPlanesConstZ, 
    invalidPlanesConstY, invalidPlanesConstZ,
    nyPadSelEnd, nzPadSelEnd,
    leftRightSepSubcubes,
    inOut
    ) {

    // Top left
    var nyPadSelEndUse = nyPadSelEnd;
    var nzPadSelEndUse = 0;
    var iyStartForId = 0;
    var izStartForId = 0;
    let pathsGridInTL = svgDrawGrid(nx, ny, nzSubcube, wTopLeftCanvas, hTopLeftCanvas, inOut, iyStartForId, izStartForId, 
        paddingPlanesConstY, paddingPlanesConstZ,
        invalidPlanesConstY, invalidPlanesConstZ
        );
    let pathsSelInTL = svgDrawSel(nx, ny, nzSubcube, nyPadSelEndUse, nzPadSelEndUse, wTopLeftCanvas, hTopLeftCanvas, 
        inOut, iyStartForId, izStartForId);

    let deltaRightW = nzSubcube*face.wTranslate + nx*face.boxDim + leftRightSepSubcubes;
    let deltaRightH = nzSubcube*face.hTranslate + (face.hTranslate/face.wTranslate)*(nx*face.boxDim + leftRightSepSubcubes);

    // Top right
    var wTopLeftCanvasSubcube = wTopLeftCanvas + deltaRightW;
    var hTopLeftCanvasSubcube = hTopLeftCanvas + deltaRightH;
    iyStartForId = 0;
    izStartForId = nz - nzSubcube;
    nyPadSelEndUse = nyPadSelEnd;
    nzPadSelEndUse = nzPadSelEnd;
    let pathsGridInTR = svgDrawGrid(nx, ny, nzSubcube, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, inOut, iyStartForId, izStartForId, 
        paddingPlanesConstY, paddingPlanesConstZ,
        invalidPlanesConstY, invalidPlanesConstZ
        );
    let pathsSelInTR = svgDrawSel(nx, ny, nzSubcube, nyPadSelEndUse, nzPadSelEndUse, wTopLeftCanvasSubcube, hTopLeftCanvasSubcube, 
        inOut, iyStartForId, izStartForId);

    // Draw
    let pathsGrid = new Map(function*() { yield* pathsGridInTL; yield* pathsGridInTR; }());
    let pathsSel = new Map(function*() { yield* pathsSelInTL; yield* pathsSelInTR; }());
    return { pathsGrid, pathsSel };
}

function ccSetUp() {
    var content = getControls() + '\n';

    // Div to hold the drawing
    // content += '<div id="ccSVG" style="width:' + String(widthCanvas) + 'px;height:' + String(heightCanvas) + 'px;"></div>\n'
    content += '<div id="ccSVG" style="width:100%;"></div>\n'

    // Div for the dimensions
    content += '<div id="ccDims"></div>\n';

    // Div for the errors
    content += '<div id="ccError"></div>\n';

    // Footer
    content += getFooter() + '\n';

    // Inject
    $('#ccContainer').html(content);

    // Trigger the draw method to load initial
    updateParamsFromUserInput();
}

function getFooter() {
    return `
    <footer style="text-align: center">
        Created by <a href="https://oliver-ernst.com">Oliver K. Ernst</a> (2021). 
        <br />
        Released under MIT license.
    </footer>
    `;
}

function getControls() {
    var s = '<form>\n';
    s += `        
    <div class="row">
        <div class="col-sm-5">
            <div class="row">
                <div class="input-group mb-3">
                    <div class="input-group-prepend">
                        <span class="input-group-text" id="inputGroup-sizing-sm">Width</span>
                    </div>
                    <input type="text" class="form-control" value="6" id="ccnzInput" onchange="updateParamsFromUserInput();"
                        onkeyup="this.onchange();" onpaste="this.onchange();" oninput="this.onchange();"/>
                </div>
            </div>

            <div class="row">
                <div class="input-group mb-3">
                    <div class="input-group-prepend">
                        <span class="input-group-text" id="inputGroup-sizing-sm">Height</span>
                    </div>
                    <input type="text" class="form-control" value="6" id="ccnyInput" onchange="updateParamsFromUserInput();"
                        onkeyup="this.onchange();" onpaste="this.onchange();" oninput="this.onchange();"/>
                </div>
            </div>

            <div class="row">
                <div class="input-group mb-3">
                    <div class="input-group-prepend">
                        <span class="input-group-text" id="inputGroup-sizing-sm">No. channels</span>
                    </div>
                    <input id="ccnx" type="text" class="form-control" value="3" readonly>
                    <div class="input-group-append">
                        <button class="btn btn-outline-secondary" type="button" onclick="nxSub();">-</button>
                        <button class="btn btn-outline-secondary" type="button" onclick="nxAdd();">+</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-sm-1">
        </div>
        <div class="col-sm-6">
            <div class="row">
                <div class="input-group mb-3">
                    <div class="input-group-prepend">
                        <span class="input-group-text" id="inputGroup-sizing-sm">Padding</span>
                    </div>
                    <input id="ccpadding" type="text" class="form-control" value="0" readonly>
                    <div class="input-group-append">
                        <button class="btn btn-outline-secondary" type="button" onclick="paddingSub();">-</button>
                        <button class="btn btn-outline-secondary" type="button" onclick="paddingAdd();">+</button>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="input-group mb-3">
                    <div class="input-group-prepend">
                        <span class="input-group-text" id="inputGroup-sizing-sm">No. filters</span>
                    </div>
                    <input id="ccnFilters" type="text" class="form-control" value="2" readonly>
                    <div class="input-group-append">
                        <button class="btn btn-outline-secondary" type="button" onclick="nFiltersSub();">-</button>
                        <button class="btn btn-outline-secondary" type="button" onclick="nFiltersAdd();">+</button>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="input-group mb-3">
                    <div class="input-group-prepend">
                        <span class="input-group-text" id="inputGroup-sizing-sm">Filter extent</span>
                    </div>
                    <input id="ccfilterSize" type="text" class="form-control" value="2" readonly>
                    <div class="input-group-append">
                        <button class="btn btn-outline-secondary" type="button" onclick="filterSizeSub();">-</button>
                        <button class="btn btn-outline-secondary" type="button" onclick="filterSizeAdd();">+</button>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="input-group mb-3">
                    <div class="input-group-prepend">
                        <span class="input-group-text" id="inputGroup-sizing-sm">Stride</span>
                    </div>
                    <input id="ccstride" type="text" class="form-control" value="2" readonly>
                    <div class="input-group-append">
                        <button class="btn btn-outline-secondary" type="button" onclick="strideSub();">-</button>
                        <button class="btn btn-outline-secondary" type="button" onclick="strideAdd();">+</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
    
    s += `
    <div class="row justify-content-center">
        <button type="button" class="btn btn-outline-secondary d-flex justify-content-center align-content-between" onclick="svgAnimateLoopStepBack();">
            <i class="material-icons mr-1">fast_rewind</i>
        </button>
        &nbsp;
        <button type="button" class="btn btn-outline-secondary d-flex justify-content-center align-content-between" onclick="svgAnimateStart();">
            <i class="material-icons mr-1">play_arrow</i>
        </button>
        &nbsp;
        <button type="button" class="btn btn-outline-secondary d-flex justify-content-center align-content-between" onclick="svgAnimateStop();">
            <i class="material-icons mr-1">pause</i>
        </button>
        &nbsp;
        <button type="button" class="btn btn-outline-secondary d-flex justify-content-center align-content-between" onclick="svgAnimateLoopStep();">
            <i class="material-icons mr-1">fast_forward</i>
        </button>
    </div>
    `;

    s += '</form>';
    
    return s;
}