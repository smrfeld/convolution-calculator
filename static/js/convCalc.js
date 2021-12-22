var x = 0;
var timeoutID = "";

var pos_iy = 0;
var pos_iz = 0;
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
let ny = 5;
let nz = 5;

let ny_pad = 2;
let nz_pad = 2;

let face = new Face(30, 20, 50);
let w_top_left_canvas = 100;
let h_top_left_canvas = 100;

let filter_size = 3;

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

function svgSelect(ix, iy, iz, loc) {
    var idStr = '#' + getIdStr(ix,iy,iz,loc,'sel');
    $(idStr).css("fill-opacity","0.25");
    $(idStr).css("stroke-opacity","1");
    selected.push(idStr);
}

function svgAnimateStart() {
    svgUnselectAll();

    // Next in z direction
    pos_iz += 1;

    // Check in bounds
    if (pos_iz > nz + 2*nz_pad - filter_size) {
        // Next in y direction
        pos_iy += 1;
        pos_iz = 0;
    }
    if (pos_iy > ny + 2*ny_pad - filter_size) {
        // Reset
        pos_iy = 0;
        pos_iz = 0;
    }

    // Select all filters

    // Top
    let iy_top = pos_iy;
    for (let ix = 0; ix < nx; ix++) { 
        for (let iz = pos_iz; iz < (pos_iz+filter_size); iz++) {
            svgSelect(ix, iy_top, iz, 'top');
        }
    }

    // Left
    let ix_left = 0;
    for (let iy = pos_iy; iy < (pos_iy+filter_size); iy++) {
        for (let iz = pos_iz; iz < (pos_iz+filter_size); iz++) {
            svgSelect(ix_left, iy, iz, 'left');
        }
    }

    // Front
    let iz_front = pos_iz + filter_size - 1;
    for (let ix = 0; ix < nx; ix++) { 
        for (let iy = pos_iy; iy < (pos_iy+filter_size); iy++) {
            svgSelect(ix, iy, iz_front, 'front');
        }
    }

    timeoutID = setTimeout(svgAnimateStart, 200);
}

function svgAnimateStop() {
    clearTimeout(timeoutID);
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

function getIdStr(ix, iy, iz, loc, obj) {
    return String(ix).padStart(3, '0') + '_' + String(iy).padStart(3, '0') + '_' + String(iz).padStart(3, '0') + '_' + loc + '_' + obj;
}

function svgDrawGrid(nx, ny, nz, ny_pad, nz_pad, face, w_top_left_canvas, h_top_left_canvas) {
    var paths = [];
    let isGrid = true;
    var idStr = "";

    // Top
    let iy_level = ny_pad;
    for (let ix = 0; ix < nx; ix++) { 
        for (let iz = nz_pad; iz < nz+nz_pad; iz++) {
            idStr = getIdStr(ix,iy_level,iz,'top','grid');
            paths.push(drawFaceTop(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy_level, iz, face, isGrid));
        }
    }

    // Left
    let ix_level = 0;
    for (let iy = ny_pad; iy < ny+ny_pad; iy++) { 
        for (let iz = nz_pad; iz < nz+nz_pad; iz++) {
            idStr = getIdStr(ix_level,iy,iz,'left','grid');
            paths.push(drawFaceLeft(idStr, w_top_left_canvas, h_top_left_canvas, ix_level, iy, iz, face, isGrid));
        }
    }

    // Front
    let iz_level = nz_pad + nz - 1;
    for (let ix = 0; ix < nx; ix++) { 
        for (let iy = ny_pad; iy < ny+ny_pad; iy++) { 
            idStr = getIdStr(ix,iy,iz_level,'front','grid');
            paths.push(drawFaceFront(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz_level, face, isGrid));
        }
    }

    return paths;
}

function svgDrawSel(nx, ny, nz, ny_pad, nz_pad, face, w_top_left_canvas, h_top_left_canvas) {
    var paths = [];
    let isGrid = false;
    var idStr = "";

    for (let ix = 0; ix < nx; ix++) { 
        for (let iy = 0; iy < ny+2*ny_pad; iy++) { 
            for (let iz = 0; iz < nz+2*nz_pad; iz++) {
                idStr = getIdStr(ix,iy,iz,'top','sel');
                paths.push(drawFaceTop(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz, face, isGrid));
                
                idStr = getIdStr(ix,iy,iz,'left','sel');
                paths.push(drawFaceLeft(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz, face, isGrid));
                
                idStr = getIdStr(ix,iy,iz,'front','sel');
                paths.push(drawFaceFront(idStr, w_top_left_canvas, h_top_left_canvas, ix, iy, iz, face, isGrid));
            }
        }
    }

    return paths;
}

function svgDraw() {

    let pathsGrid = svgDrawGrid(nx, ny, nz, ny_pad, nz_pad, face, w_top_left_canvas, h_top_left_canvas);
    let pathsSel = svgDrawSel(nx, ny, nz, ny_pad, nz_pad, face, w_top_left_canvas, h_top_left_canvas);
    let paths = pathsSel.concat(pathsGrid);

    // Draw
    let svgStr = svgCreateStr(1000,800,paths);
    $('#ccSVG').html(svgStr);
}