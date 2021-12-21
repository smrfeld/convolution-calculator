var x = 0;
var timeoutID = "";

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
    $('#ccSVG').load('js/convCalc.svg');
}