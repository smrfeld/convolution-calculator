var x = 0;
var timeoutID = "";

var pos_iy = 0;
var pos_iz = 0;
var selected = [];

class Path {
    constructor(idStr) {
        this.idStr = idStr;
        this.pts = [];
    }

    // Method
    svgStr() {
        var s = '';

        s += '<path id="' + this.idStr + '"';

        s += ' style="fill-rule:nonzero;fill:rgb(0%,0%,0%);fill-opacity:0;stroke-width:0.100000;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(0%,0%,0%);stroke-opacity:1.000000;stroke-miterlimit:10;"';

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
    })

    selected = [];
}

function svgSelect(ix, iy, iz) {
    var s = '#sel_left_' + String(ix).padStart(3, '0') + '_' + String(iy).padStart(3, '0') + '_' + String(iz).padStart(3, '0');
    $(s).css("fill-opacity","1");
    selected.push(s);

    s = '#sel_top_' + String(ix).padStart(3, '0') + '_' + String(iy).padStart(3, '0') + '_' + String(iz).padStart(3, '0');
    $(s).css("fill-opacity","1");
    selected.push(s);

    s = '#sel_front_' + String(ix).padStart(3, '0') + '_' + String(iy).padStart(3, '0') + '_' + String(iz).padStart(3, '0');
    $(s).css("fill-opacity","1");
    selected.push(s);
}

function svgAnimateStart() {
    svgUnselectAll();

    let ny_in = 6;
    let nz_in = 6;
    let nx = 3;

    let filter_size = 3;

    // Next in z direction
    pos_iz += 1;

    // Check
    if (pos_iz >= nz_in) {
        // Next in y direction
        pos_iy += 1;
        pos_iz = 0;
    }
    if (pos_iy >= ny_in) {
        // Reset
        pos_iy = 0;
        pos_iz = 0;
    }

    // Select all filters
    for (let ix = 0; ix < nx; ix++) { 
        for (let iy = pos_iy; iy < (pos_iy+filter_size); iy++) {
            for (let iz = pos_iz; iz < (pos_iz+filter_size); iz++) {
                svgSelect(ix, iy, iz);
            }
        }
    }
    
    /*
    let ny_in = 6;
    let nz_in = 6;

    let s = '#sel_left_001_002_001';
    console.log(s);
    // $(s).css("fill","rgb(100%,0%,0%)");
    $(s).css("fill-opacity","1");
    */

    timeoutID = setTimeout(svgAnimateStart, 200);
}

function svgAnimateStop() {
    clearTimeout(timeoutID);
}

function svgDraw() {
    let path = new Path("abc123");
    path.pts.push([0,0]);
    path.pts.push([100,100]);

    let s = path.svgStr();
    console.log(s);

    var svgStr = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n';
    svgStr += '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" viewBox="0 0 959 593">\n';
    svgStr += s + '\n';
    svgStr += '</svg>';
    
    $('#ccSVG').html(svgStr);
}