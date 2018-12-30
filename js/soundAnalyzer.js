jQuery.fn.sndAnalyzer = function () {
    $.sndAnalyzer(this);
    return this;
};

jQuery.sndAnalyzer = function (container) {
    var container = $(container).get(0);
    return container.sndAnalyzer || (container.sndAnalyzer = new jQuery._sndAnalyzer(container));
}
  
updateTest = function() {

}

jQuery._sndAnalyzer = function (container) {

    const lightBkgColor = '#f9f9f9';
    const darkBkgColor = '#252525';
    const lightGraphColor = '#333333';
    const darkGraphColor =  '#9a9a9a';
    const lightGridColor = '#9a9a9aaa';
    const darkGridColor = '#4a4a4a';
    const lightGridFontColor = '#888888';
    const darkGridFontColor = '#696969';
    var saObj = this;
    var division = 0.55;
    var fttSize = 8192;
    var doubleView = false;
    var graphBkgColor = lightBkgColor;
    var spectBkgColor = lightBkgColor;
    var gridColor = lightGridColor;
    var graphColor = lightGraphColor;
    var gridFontColor = lightGridFontColor;
    var analyser = null;
    var bufferLength;
    var fromX = 0;
    var scale = 1.0;
    var oldMouseX;
    var dragging = false;
    var mouserReal = 0;    
    var oldScale = 1.0;   
    var stepWidth = 0;
    var deltaScale = 0;
    var oldStepWidth = 0;
    var fromPercent = 0;
    var toPercent = 0;    
    var dataArray;
    var spectrumDataArray;
    var spectrumByteData;
    var spectrumImgBuf;
    var spectrumImgBufId;
    var gradientColor;
    var y = 0;
    var oldY = 0;
    var themeId = 'b';
    var animFrameId;
    var Width;
    var Height;
    var Ctx;
    var graphHeight;
    var spectrumHeight;
    var prepareSpectrumInterval;
    var viewType = 'viewspectrum';
    var needSpectrum;
    var needGRaph;

    saObj.test = function() {
        console.log("test");
    }


    createView();
    
    


    setTheme(themeId);

    function createView() {

        Width = Math.floor($(container).width());
        Height = Math.floor($(container).height());
        $(container).html('<canvas class="sndAnalyzerCanvas" width="' + Width + '" height="' + Height + '"/>');
        var sndAnalyzerCanvas = $('.sndAnalyzerCanvas', container);
        Ctx = sndAnalyzerCanvas[0].getContext("2d");
        
        fromPercent = fromX / scale / Width;     
        toPercent = ((fromX  + Width)/ scale) / Width;         

        updateView(viewType);

        sndAnalyzerCanvas[0].addEventListener('mousedown', onMouseDown, false);
        sndAnalyzerCanvas[0].addEventListener('mouseup', onMouseUp, false);
        sndAnalyzerCanvas[0].addEventListener('mousemove', onMouseMove, false);
        sndAnalyzerCanvas[0].addEventListener('mousewheel', onMouseWheel, false);
            
    }

    function updateView(type) { // update both view divider

        viewType = type;
        switch(type) {

            case 'viewboth':
                graphHeight = Math.floor( Height * division );
                spectrumHeight = Height - graphHeight;
                needSpectrum = true;
                needGraph = true;
            break;
            case 'viewvawe':
                graphHeight = Height;
                needSpectrum = false;
                needGraph = true;
            break;
            case 'viewspectrum':
                graphHeight = 0;
                spectrumHeight = Height;
                needGraph = false;
                needSpectrum = true;
            break;
            y = spectrumHeight;
        }

    }

    

   function onMouseDown(e) {

       dragging = true;
       oldMouseX = e.x;
    }    

    function onMouseUp() {

        dragging = false;
    }

    function onMouseMove(e) {

        if( dragging) {

            var v = e.x - oldMouseX;
            fromX -= v;
            if(fromX < 0 ) {
            
                fromX = 0;
                
            } else if ( (fromX  + Width) / scale > Width) {

                fromX += v;
            } else {
                fromPercent = fromX / scale / Width;     
                toPercent = ((fromX  + Width)/ scale) / Width;       
            }
 
          //  mouserReal = fromX + e.x;    

     //       }      
        }
        oldMouseX = e.x;

    }

    function onMouseWheel(e)  {

        if( e.deltaY > 0) {

            scale /= 1.1;
        } else {

            scale *= 1.1;
        }

        if(scale >= 1) {

            oldStepWidth = mouserReal;
            stepWidth = mouserReal / oldScale * scale;       
            deltaScale = stepWidth - oldStepWidth;
            fromX += deltaScale;
            var toX = (fromX  + Width) / scale;
            if( toX > Width) {

                 fromX -= toX - Width;
             }

        
            mouserReal = fromX + e.x;
            oldScale = scale;
        } else {

            scale = 1.0;
            fromX = 0;
        }
        fromPercent = fromX / scale / Width;
        toPercent = ((fromX  + Width) / scale) / Width;
    }

    var getLogValue = function(index, min, max, data) {

        var logIndex = toLog(index, min, max);
        var low = Math.floor(logIndex);
        var high = Math.ceil(logIndex);
        var w = (logIndex - low) / (high - low);

        var lv = data[low];
        var hv = data[high];

        //var v = lv;// + (hv - lv) * w;
        return lv + ((hv - lv) * w);    
    // return index;   
    }


    drawGraph = function() {

        analyser.getByteFrequencyData(dataArray);

        Ctx.beginPath();
        Ctx.strokeStyle = graphColor;  
        Ctx.moveTo(0, graphHeight);      


        for(var i = 0; i < Width; i++) {

            var fftt = ((fromX + i) / scale / Width) * bufferLength;
            var rectHeight = getLogValue(fftt, 1, bufferLength, spectrumDataArray) / 255;

            var posY = graphHeight - (rectHeight * graphHeight);;
            Ctx.lineTo(i, posY);
            Ctx.moveTo(i, posY);    
        }

    

        // var rectHeight;
        // var fromftt = Math.floor(fromPercent * bufferLength);
        // var toftt = Math.ceil(toPercent * bufferLength); 
        // var widthftt = toftt - fromftt;
        // var stepWidth = Width / widthftt;  

        // rectHeight = getLogValue(fromftt, 1, bufferLength, dataArray) / 255;
        // var posY = graphHeight - (rectHeight * graphHeight);
        // Ctx.beginPath();
        // Ctx.strokeStyle = graphColor;  
        // Ctx.moveTo(0, posY);      

        // for(i = 0; i < widthftt; i++ ) {
        //     rectHeight = getLogValue(i + fromftt, 1, bufferLength, dataArray) / 255;
        //     var posX = (i * stepWidth) + stepWidth;
        //     posY = graphHeight - (rectHeight * graphHeight);
        //     Ctx.lineTo(posX, posY);
        //     Ctx.moveTo(posX, posY);            
        // }


        Ctx.lineTo(Width, graphHeight);
        Ctx.stroke();        
    }

    toLog = function(value, min, max){

        var exp = (value - min) / (max - min);
        return min * Math.pow(max/min, exp);
    }

    drawGridLog = function(gridFrom, gridTo) {

        var start = Width * scale * gridFrom - fromX;
        var end = Width * scale * gridTo - fromX;
        var itemWidth = end - start;
        var step = itemWidth / 10;
        var oldX = 0;
        var txtId = 10;
        for(var i = 0; i <= itemWidth; i += step) {

            var X = end - toLog(i, 1, itemWidth);

            Ctx.moveTo(X,0);      
            Ctx.lineTo(X,Height);    
            if( (oldX - X > 50) ) {
                Ctx.fillText(txtId,X + 2 , graphHeight - 2);
                Ctx.fillText(txtId,X + 2 , 14);
            }
            oldX = X;
            txtId += 10;
        }        
    }
    
    drawGrid = function() {

        Ctx.fillStyle = gridFontColor;
        Ctx.font = "12px Arial";
        Ctx.beginPath();
        Ctx.strokeStyle = gridColor;  
        drawGridLog(0, 0.353);
        drawGridLog(0.353, 0.6285);
        drawGridLog(0.6285, 0.9053);
  

        if( needGRaph) {
            var interval = graphHeight / 10;
            for(var y = 0; y <= graphHeight; y += interval) {

                Ctx.moveTo(0, y);
                Ctx.lineTo(Width, y);
                Ctx.fillText((y / interval) * 10, 5, y - 5);
                Ctx.fillText((y / interval) * 10, Width - 20, y - 5);
            }
        }
        // Ctx.fillText("AMouse real: " + mouserReal, 100, 100);
        // Ctx.fillText("fromX: " + fromX, 100, 115);
        // Ctx.fillText("scale: " + scale, 100, 130);
        // Ctx.fillText("toX: " + (fromX  + Width) / scale, 100, 145);
        // Ctx.fillText("width: " + Width, 100, 160);
        // Ctx.fillText("fromPercent: " + fromPercent, 100, 175);
        // Ctx.fillText("toPercent: " + toPercent, 100, 190);

        // var fromftt = Math.floor(fromPercent * bufferLength);
        // var toftt = Math.floor(toPercent * bufferLength); 
        // var widthftt = toftt - fromftt;                   
        // Ctx.fillText("fromFtt: " +fromftt, 100, 205);
        // Ctx.fillText("toFtt: " + toftt, 100, 220);
        // Ctx.fillText("widthFtt: " + (toftt - fromftt), 100, 235);

        Ctx.stroke();      
    }

    drawSpectrum = function() { // little funny idea :P

       // Ctx.fillStyle = spectBkgColor;
     //   Ctx.fillRect(0, graphHeight, Width, Height - graphHeight);
        if( y != oldY) {

            var syncY = y;          
            var bufId = spectrumImgBufId;
            var b1, b2;

            if( bufId == 0) {
                b1 = spectrumImgBuf[0];
                b2 = spectrumImgBuf[1];
            } else {
                b1 = spectrumImgBuf[1];
                b2 = spectrumImgBuf[0];                    
            }


            Ctx.putImageData(b2,0, spectrumHeight - syncY + graphHeight);   
            Ctx.putImageData(b1,0,-syncY + graphHeight);   
            
            oldY = y;
        };

    }

    draw = function() {

        if(needSpectrum) {

            drawSpectrum();
        }
        
//        Ctx.fillStyle = 'rgb('+ Math.floor((Math.random() * 255)) +',0,0)';//graphBkgColor;
        Ctx.fillStyle = graphBkgColor;
        Ctx.fillRect(0, 0, Width, graphHeight);
        drawGrid();  

        if( needGraph) {

            drawGraph();
        }
        
        
        animFrameId = requestAnimationFrame(draw);
    }

    function createDefaultGradient(theme) {
        
        var gradientSize = 256 * 4;
        var defaultGradient = new Uint8ClampedArray(gradientSize);
        if(theme=='a') {
            for(var i = 0; i < gradientSize; i += 4 ) {

                var v = i / 4;//

                defaultGradient[i + 3] = v;
    
            }
        } else {
            for(var i = 0; i < gradientSize; i += 4 ) {

                var v = i / 4;//
                defaultGradient[i] = v;
                defaultGradient[i + 1] = v;
                defaultGradient[i + 2] = v;
                defaultGradient[i + 3] = v;
    
            }
        }

        return defaultGradient;
    }

    function initBuffers() {

        analyser.fftSize = fttSize;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);   
        spectrumDataArray = new Uint8Array(bufferLength);   

        var SpectrumDataSize = Width * spectrumHeight * 4;
        var SpectrumByteData1 = new  Uint8ClampedArray(SpectrumDataSize);  
        var SpectrumByteData2 = new  Uint8ClampedArray(SpectrumDataSize); 
        spectrumByteData = new Array(2);
        spectrumByteData[0] = SpectrumByteData1;
        spectrumByteData[1] = SpectrumByteData2;
        var spectrumImgBuf1 = Ctx.createImageData(Width, spectrumHeight);        
        var spectrumImgBuf2 = Ctx.createImageData(Width, spectrumHeight);   
        spectrumImgBuf = new Array(2);
        spectrumImgBuf[0] = spectrumImgBuf1;
        spectrumImgBuf[1] = spectrumImgBuf2;        
        spectrumImgBufId = 0;        
        gradientColor = createDefaultGradient(themeId);
    }

    analyzeSound = function() {

        initBuffers();
        draw();
        if(needSpectrum) {

            prepareSpectrum();
        }

        console.log(needSpectrum);
    }

    prepareSpectrum = function() {

        y = spectrumHeight - 1;
        
        prepareSpectrumInterval = setInterval(function(){

            analyser.getByteFrequencyData(spectrumDataArray);

        
            var fromftt = Math.floor(fromPercent * bufferLength);
            var toftt = Math.floor(toPercent * bufferLength); 
            var widthftt = toftt - fromftt;   
            if(widthftt >= Width) {
                for(i = 0; i < widthftt; i++ ) {
                    var rectHeight = getLogValue(i + fromftt, 1, bufferLength, spectrumDataArray);
                    var spectrumXPos = ((y-1) * Width * 4) + (Math.floor((i / widthftt ) * Width) * 4);
                    var spectrumYPos = Math.floor(rectHeight) * 4;

                    spectrumByteData[spectrumImgBufId][(spectrumXPos)] =  gradientColor[spectrumYPos];//
                    spectrumByteData[spectrumImgBufId][(spectrumXPos) + 1] = gradientColor[spectrumYPos + 1];
                    spectrumByteData[spectrumImgBufId][(spectrumXPos) + 2] = gradientColor[spectrumYPos + 2];
                    spectrumByteData[spectrumImgBufId][(spectrumXPos) + 3] = gradientColor[spectrumYPos + 3];         
                }
            } else {

                for(var i =0; i < Width; i++) {

                    var fftt = ((fromX + i) / scale / Width) * bufferLength;
                    var rectHeight = getLogValue(fftt, 1, bufferLength, spectrumDataArray);
                    var spectrumXPos = ((y-1) * Width * 4) + (i * 4);
                    var spectrumYPos = Math.floor(rectHeight) * 4;

                    spectrumByteData[spectrumImgBufId][(spectrumXPos)] =  gradientColor[spectrumYPos];//
                    spectrumByteData[spectrumImgBufId][(spectrumXPos) + 1] = gradientColor[spectrumYPos + 1];
                    spectrumByteData[spectrumImgBufId][(spectrumXPos) + 2] = gradientColor[spectrumYPos + 2];
                    spectrumByteData[spectrumImgBufId][(spectrumXPos) + 3] = gradientColor[spectrumYPos + 3];                         

                }

            }
            spectrumImgBuf[spectrumImgBufId].data.set(spectrumByteData[spectrumImgBufId]);      
            y--;
            if( y == 0) {

                y = spectrumHeight;
                spectrumImgBufId++;
                if( spectrumImgBufId > 1) {
                    spectrumImgBufId = 0;
                }
            }
        
        }, 0);
    }

    saObj.globalSetTheme = function(theme) {

        setTheme(theme);
    }

    saObj.globalGetTheme = function() {

        return themeId;
    }

    saObj.globalCancelAnimation = function() {

        cancelAnimationFrame(animFrameId);
    }

    saObj.globalUpdateView = function(type) {

        cancelAnimationFrame(animFrameId);
        clearInterval(prepareSpectrumInterval);
        createView();
        if( type !== undefined ) updateView(type);
        analyzeSound();

    }

    saObj.globalSetDivision = function(val) {

        cancelAnimationFrame(animFrameId);
        clearInterval(prepareSpectrumInterval);
        division = val / 100.0;
        updateView(viewType);
        analyzeSound();
    }

    saObj.globalSetSmoothing = function(val) {

        analyser.smoothingTimeConstant = val;
    }

    saObj.globalGetSmoothing = function() {

        return  analyser.smoothingTimeConstant;        
    }

    saObj.globalSetDecibels = function(min, max) {

        analyser.minDecibels = min;
        analyser.maxDecibels = max    ;
    }

    saObj.globalGetMinDecibels = function() {
     
        return analyser.minDecibels;
    }

    saObj.globalGetMaxDecibels = function() {
     
        return analyser.maxDecibels;
    }

    saObj.globalGetViewType = function() {

        return viewType;
    }

    saObj.globalGetViewRatio = function() {

        return division * 100;
    }


    function setTheme(theme) {

        themeId = theme;
        switch(theme) {
            case 'a': 
                graphBkgColor = lightBkgColor;
                spectBkgColor = lightBkgColor;
                graphColor = lightGraphColor;
                gridColor = lightGridColor;
                gridFontColor = lightGridFontColor;
            break;
            case 'b': 
                graphBkgColor = darkBkgColor;
                spectBkgColor = darkBkgColor;
                graphColor = darkGraphColor;
                gridColor = darkGridColor;
                gridFontColor = darkGridFontColor;
            break;
        }
        gradientColor = createDefaultGradient(theme);
        setGUITheme(theme);

        console.log(themeId);
    }

    function setGUITheme(theme) {
    
        $( "#home" ).removeClass( "ui-page-theme-a ui-page-theme-b" ).addClass( "ui-page-theme-" + theme );
        $( "#ui-body-test" ).removeClass( "ui-body-a ui-body-b" ).addClass( "ui-body-" + theme );
        $( "#ui-bar-test, #ui-bar-form" ).removeClass( "ui-bar-a ui-bar-b" ).addClass( "ui-bar-" + theme );
        $( ".ui-collapsible-content" ).removeClass( "ui-body-a ui-body-b" ).addClass( "ui-body-" + theme );
        $( ".theme" ).text( theme );

    }

    initMic = function() {

        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
//        analyser.minDecibels = -90;
//        analyser.maxDecibels = -10;
        analyser.smoothingTimeConstant = 0.0;
        
        if (navigator.mediaDevices.getUserMedia) {
            console.log('getUserMedia supported.');
            var constraints = {audio: true}
            navigator.mediaDevices.getUserMedia (constraints)
               .then(
                 function(stream) {
                    source = audioCtx.createMediaStreamSource(stream);
                    source.connect(analyser);
                    analyzeSound();
               })
               .catch( function(err) { 
                   

                })
         } else {

         }
    }
    initMic();    

}