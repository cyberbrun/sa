
var sndAnalyzer;

function updateControls() {

    $("[name='viewradio']").prop( "checked", false ).checkboxradio( "refresh" );
    $("#" + sndAnalyzer.globalGetViewType() ).prop( "checked", true ).checkboxradio( "refresh" );
    $("#bothratioslider").val(sndAnalyzer.globalGetViewRatio()).slider("refresh");
    $("#smoothingslideer").val(sndAnalyzer.globalGetSmoothing()).slider("refresh");
    $("#range-min").val(sndAnalyzer.globalGetMinDecibels()).slider("refresh");
    $("#range-max").val(sndAnalyzer.globalGetMaxDecibels()).slider("refresh");
}

function doResize() {
    var winhigh = $.mobile.getScreenHeight();
    var headhigh = $('[data-role="header"]').first().outerHeight();
    var foothigh = $('[data-role="footer"]').first().outerHeight(); 
    var $content=$('[data-role="content"]');
    var contentpaddingheight=parseInt($content.css("padding-top").replace("px", ""))+parseInt($content.css("padding-bottom").replace("px", "")); //Get height of themes content containers padding
    winhigh = winhigh - headhigh - foothigh - contentpaddingheight;
    $content.css('min-height',winhigh + 'px');


    if(sndAnalyzer === undefined) {

        $content.html('<div id="soundAnalyzer"/>');
        $('#soundAnalyzer').css('height', winhigh);
        $('#soundAnalyzer').css('width', '100%');
        sndAnalyzer = $.sndAnalyzer('#soundAnalyzer');
        updateControls();
    } else {

        $('#soundAnalyzer').css('height', winhigh);
        $('#soundAnalyzer').css('width', '100%');        
        sndAnalyzer.globalUpdateView();
    }

    
}

$(document).bind('pageshow', doResize); //Call function on page show
$(window).bind('resize orientationchange', doResize); //Call function on resize and orientation change

$( "#theme-selector input" ).on( "change", function( event ) {
    var themeClass = $( "#theme-selector input:checked" ).attr( "id" );

    $( "#home" ).removeClass( "ui-page-theme-a ui-page-theme-b" ).addClass( "ui-page-theme-" + themeClass );
    $( "#ui-body-test" ).removeClass( "ui-body-a ui-body-b" ).addClass( "ui-body-" + themeClass );
    $( "#ui-bar-test, #ui-bar-form" ).removeClass( "ui-bar-a ui-bar-b" ).addClass( "ui-bar-" + themeClass );
    $( ".ui-collapsible-content" ).removeClass( "ui-body-a ui-body-b" ).addClass( "ui-body-" + themeClass );
    $( ".theme" ).text( themeClass );
    sndAnalyzer.globalSetTheme(themeClass);

});

$( "#view-selector input" ).on( "change", function( event ) {

    var viewId = $( "#view-selector input:checked" ).attr( "id" );
    sndAnalyzer.globalUpdateView(viewId);
});

$( "#bothratio" ).change( function(event) {

    var slider_value = $("#bothratioslider").val();
    sndAnalyzer.globalSetDivision(slider_value);
});

$( "#smoothing" ).change( function(event) {

    var slider_value = $("#smoothingslideer").val();
    sndAnalyzer.globalSetSmoothing(slider_value);
});

$( "#decibels" ).change( function(event) {

    var min = $("#range-min").val();
    var max = $("#range-max").val();

    sndAnalyzer.globalSetDecibels(min, max);
});

