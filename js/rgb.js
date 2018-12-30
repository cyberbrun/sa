// Copyright(c) 2018 Bruno Szymkowiak
// cyberbrun@outlook.com

// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and 
// associated documentation files (the "Software"), to deal in the Software without restriction, including 
// without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
// copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the 
// following conditions:

// The above copyright notice and this permission notice shall be included in all copies or substantial 
// portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
// LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// led strip basic integration

// jQuery.fn.fttVisualizer = function (gradientContainer) {
//     $.fttVisualizer(this, gradientContainer);
//     return this;
// };

// jQuery.fttVisualizer = function (container, gradientContainer) {
//     var container = $(container).get(0);
//     return container.fttVisualizer || (container.fttVisualizer = new jQuery._fttVisualizer(container, gradientContainer));
//   }
  

jQuery._fttVisualizer = function (container, gradientContainer) {
    var fttv = this;

    var audioCtx;
    var analyser;
    var FTTsize = 8192  ;
    var hColPos1 = 0;
    var hColpos2 = 0;
    var sColPos1 = 0;
    var sColpos2 = 0;    
    var selectPos1 = true;
    var dragging = false;
    var hScale = 1.0;
    var hMove = 0.0;
    var bufferLengthAlt;

    var dragging = false;
    var scale = 1.0;
    var from = 0.0;         
    var fttToScreenRatio = 1.0;

    fttv.hColPos1 = localStorage.getItem('hColPos1');
    fttv.hColPos2 = localStorage.getItem('hColPos2');
    fttv.hScale = localStorage.getItem('hScale');
    fttv.hMove = localStorage.getItem('hMove');
    fttv.sColPos1 = localStorage.getItem('sColPos1');
    fttv.sColPos2 = localStorage.getItem('sColPos2');




/*
    fttv.createControls = function() {

        var html = "";
        html += '<div class="boxLeft">'
        html += '<input type="radio" id="r1" name="selector" checked/><label for="r1">Hue</label><input type="radio" id="r2" name="selector" checket/><label for="r2">Color</label>';
        html += '</div>'
        html += '<div class="boxControls">';
        html += '<input type="range" id="hScaleRange" min="0" max="5" step="0.01" value="' + fttv.hScale  + '">';
        html += '<input type="range" id="hMoveRange" min="-1" max="1.0" step="0.01" value="' + fttv.hMove + '">';
        html += '</div>';   
        return html
    }
*/    

    var Width = Math.ceil($(container).width());
    var Height = Math.ceil($(container).height());
    console.log($("#fttView").width(), $("#fttView").height());
    $(container).html('<canvas class="fttCanvas" width="' + Width + '" height="' + (Height) +'"></canvas>');
    var fttCanvas = $('.fttCanvas', container);
    var fttCanvasCtx = fttCanvas[0].getContext("2d");

    var gradientContainerWidth = Math.ceil($(gradientContainer).width());
    var gradientContainerHeight = Math.ceil($(gradientContainer).height());
    $(gradientContainer).html('<canvas class="gradientCanvas" width="' + gradientContainerWidth + '" height="' + gradientContainerHeight +'"></canvas>');
    var gradientCanvas = $('.gradientCanvas', gradientContainer);
    var gradientCanvasCtx = gradientCanvas[0].getContext("2d");

    console.log(gradientContainerWidth, gradientContainerHeight);

    gradientCanvas[0].addEventListener('mousedown', onMouseDown, false);
    gradientCanvas[0].addEventListener('mouseup', onMouseUp, false);
    gradientCanvas[0].addEventListener('mousemove', onMouseMove, false);
    gradientCanvas[0].addEventListener('mousewheel', onMouseWheel, false);

    
    fttv.toLog = function(value, min, max){

        var exp = (value - min) / (max - min);
        return min * Math.pow(max/min, exp);
    }

    var oldmouse_x = 0;
   function onMouseDown(e) {

       dragging = true;
       oldmouse_x = e.x;
    }    

    function onMouseUp() {

        dragging = false;
    }

    var MouseX = 0;
    var mouserReal = 0;
    var mouseAbs = 0;
    var fromPercent = 0;
    var toPercent = 0;
    function onMouseMove(e) {

        if( dragging) {

            from -= e.x - oldmouse_x;// * fttToScreenRatio  / scale;
            oldmouse_x = e.x;
           // console.log(e);
        }
        oldmouse_x = e.x;
        MouseX = e.x;
        mouserReal = from + MouseX;
        mouseAbs = e.x / gradientContainerWidth;
        fromPercent = from / scale / gradientContainerWidth;     
        toPercent = ((from  + gradientContainerWidth)/ scale) / gradientContainerWidth;           
    }
    var old_scale = 1.0;   
    var mint = 50;
    var dscale = 0;
    var oldIntWidth = 0;
    var intWidth = mint;
    var deltaScale = 0;
    var sck = 1;

    function onMouseWheel(e) {

        if( e.deltaY > 0) {

            scale /= 1.1;
            sck-=0.1;;
        } else {
            sck+=0.1;
            scale *= 1.1;
        }

        oldIntWidth = mouserReal;
        intWidth = mouserReal / old_scale * scale;
        deltaScale = intWidth - oldIntWidth;

        from += deltaScale;
        mouserReal = from + MouseX;

        fromPercent = from / scale / gradientContainerWidth;
        toPercent = ((from  + gradientContainerWidth)/ scale) / gradientContainerWidth;
        old_scale = scale;
    }

    fttv.HSLToRGB = function (h, s, l) {
        var m1, m2, r, g, b;
        m2 = (l <= 0.5) ? l * (s + 1) : l + s - l*s;
        m1 = l * 2 - m2;
        return [this.hueToRGB(m1, m2, h+0.33333),
            this.hueToRGB(m1, m2, h),
            this.hueToRGB(m1, m2, h-0.33333)];
    }

    fttv.hueToRGB = function (m1, m2, h) {
        h = (h < 0) ? h + 1 : ((h > 1) ? h - 1 : h);
        if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
        if (h * 2 < 1) return m2;
        if (h * 3 < 2) return m1 + (m2 - m1) * (0.66666 - h) * 6;
        return m1;
    }

    fttv.packColor = function (rgb) {
        var r = Math.round(rgb[0] * 255);
        var g = Math.round(rgb[1] * 255);
        var b = Math.round(rgb[2] * 255);
        return '#' + (r < 16 ? '0' : '') + r.toString(16) +
               (g < 16 ? '0' : '') + g.toString(16) +
               (b < 16 ? '0' : '') + b.toString(16);
      }

    fttv.createPart = function(posFrom, posTo, rectWidth, bkgCol, dataArrayAlt, minDataArray, maxDataArray) {

        var hIndex1 = Math.round(posFrom / rectWidth);
        var hIndex2 = Math.round(posTo / rectWidth);

        if(hIndex2 < hIndex1) {
            var buf = hIndex1;
            hIndex1 = hIndex2;
            hIndex2 = buf;
        }
        
        var sum = 0;
        var sumMin = 0;
        var sumMax = 0
        for(i = hIndex1; i < hIndex2; i++) {
        
            fttCanvasCtx.fillStyle = bkgCol;
            fttCanvasCtx.fillRect( i * rectWidth, 0, rectWidth, Height); 
            sum += dataArrayAlt[i] * dataArrayAlt[i];
            sumMin += minDataArray[i] * minDataArray[i];
            sumMax += maxDataArray[i] * maxDataArray[i];

        }
        var len = (hIndex2 - hIndex1);
        var ros = Math.sqrt(sum / len ) / 255;
        var rosMin = Math.sqrt(sumMin / len );
        var rosMax = Math.sqrt(sumMax / len );

 
        return [ros, rosMin, rosMax, hIndex1, hIndex2];
    }

    fttv.getDefaultGradient = function() {
        
        var gradientSize = 256 * 4;
        var defaultGradient = new Uint8ClampedArray(gradientSize);

        for(var i = 0; i < gradientSize; i += 4 ) {

            var v = i / 4;//
            defaultGradient[i] = v;
            defaultGradient[i + 1] = v;
            defaultGradient[i + 2] = v;
            defaultGradient[i + 3] = v;

        }
        console.log(defaultGradient);
        return defaultGradient;
    }

    fttv.getDataUri = function(url, callback) {
        var image = new Image();
        image.onload = function () {
            var canvas = document.createElement('canvas');
            canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
            canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size
    
            canvas.getContext('2d').drawImage(this, 0, 0);
    
            // Get raw image data
         //   callback(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));
    
            // ... or get as Data URI
           // callback(canvas.toDataURL('image/png'));
        };
    
        image.src = url;
  //      img.crossOrigin="anonymous";
    }
    


    fttv.updateView = function() { 

        analyser.fftSize = FTTsize;
        bufferLengthAlt = analyser.frequencyBinCount;
        var dataArrayAlt = new Uint8Array(bufferLengthAlt);        
        var minDataArray = new Uint8Array(bufferLengthAlt);
        var maxDataArray = new Uint8Array(bufferLengthAlt);

        var historyDataArrayAlt = new Uint8Array(bufferLengthAlt);  
        var GradientDataSize = gradientContainerWidth * gradientContainerHeight * 4;
        var GradientByteData1 = new  Uint8ClampedArray(GradientDataSize);  
        var GradientByteData2 = new  Uint8ClampedArray(GradientDataSize); 
        var gradientByteData = new Array(2);
        gradientByteData[0] = GradientByteData1;
        gradientByteData[1] = GradientByteData2;
        

        var gradientImgBuf1 = gradientCanvasCtx.createImageData(gradientContainerWidth, gradientContainerHeight);        
        var gradientImgBuf2 = gradientCanvasCtx.createImageData(gradientContainerWidth, gradientContainerHeight);   
        var gradientImgBuf = new Array(2);
        gradientImgBuf[0] = gradientImgBuf1;
        gradientImgBuf[1] = gradientImgBuf2;
        var gradientImgBufId = 0;
        var gradientColor = fttv.getDefaultGradient();

        var gradSpectrum = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAABCAYAAAAxWXB3AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4gQdEzUWiC5TZQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAkUlEQVQ4y5WSQQ6FMAhEX02r9z/Zv0+L0Y2m/VgQF4TQMkOYIR38Dij0WIF85f6+s1ABARpQrzxGNWox/sTgmfGNs71ZzZkjSa1ZiKze62zgItgI5q41TnOkmQsyUay9qCtBJavBLx/c+L+GxP5YMQ95M6TwZCqO9JaFHt6z8a5fD3d6iENP6HBVvwSwlnWK6wSqDpYHBtwO4QAAAABJRU5ErkJggg==';
        var gradSpect2 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAABCAYAAAAxWXB3AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4gUDDCM2NQQrKwAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAA70lEQVQ4y32PWZIEIQgFU8WKufQcvBW0P1yGdqrLCAISeSwBfjv8ADItT38dvHLJ+XzkT15xdv+ZjxcOqTyw937du3q/enSjF59r+h53s84Z8vC/T20QG4gRxMiXEpIhYogoSYwYjRyMiJFQEobQSBiJ6nj8RQzBkM0NoSLY1CiJhqC7NmLkD25Tr5tHPLTDKhdK2LMbmUrY2v8sVCJ9+kZGCXQyZfPf/mPXcXfb96RmJDNEjWSdqJAUggIGqDNzvrrYc7thveGz5zf+pq9u9llfH7gDxe3Y4VXADIqCteldWXHy1aocZy5+ubzXLn4DBoizhVFzgeEAAAAASUVORK5CYII=';
        var gradOcean = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAABCAYAAAAxWXB3AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4gQdFAASKD1DTwAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAA+UlEQVQ4y22SQWLEMAgDR3J/0/9/L+oB7ODt5gKRkQDZwr9BIESoiKhPIA38fLtGqCMnCJT+Ebrw0Uff9Ci9qBIBaQy/PWbPM8Otg4SypQSZdZDWV0bj07LmLppQRHTQe5+83GFC7Tl9bHaObx/775k7zfHuvZlrb+nDd049EfidLWOGe7ahbR2v8+1e279Mv/XqVbO6I7nv3u4okKtu51LvKyT3W/PBkF8d7fdw8zjc3UP/ND5rL54BGaN6D0vEhiUeCa3FY8EyMX1mYpElYoHdeeHnvHF2vusmtmqWrF3rOx+cLIPN02fPcuuI/Hho+uyxtTI4c0aAP8HJS+/UcostAAAAAElFTkSuQmCC';
        var gradWhite = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAABCAYAAAAxWXB3AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4gQeAg8VO9+6DwAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAvklEQVQ4y5VQSQ7DQAjz8qJ+Kv//QXoophQ1XSJFwxi8MDyO44bnx/Xjw333BIAk+05ShatwAPCYC0dDx6kHH0s/eGtOvc3ZfjtzvM7zTEyt2RdeDcXTtR/WPr1n9ljZQdJDXyQx36Lq/Wbv3luSGpt1PKZ2dCubJVFSZ7UtALSdGVVftlEeIsncB4Zo4REs3pTatvGRA5nLWfyuVx8Dw+RczUavNFF5Xs7N+/bHKxpT7yrnVW9lf1v/c/6C3QE0mwbsjc4S6gAAAABJRU5ErkJggg==';
        var gradMetalic = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAABCAYAAAAxWXB3AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4gQdFicRaHV0/gAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAABSklEQVQ4y2WSQbIcMQhDn0QfJbvscv+jfaMsoD2TSle5ARsLLKFfv/+E/QQEkOY3Rv8sS0hG9vg2lrGFPfvlieXCNlVGb44K14shzFgh0Nbmv44QuTsik5s3K2iu42yewPdOsIIDUjBrk30jF/+t8dYdT7RMI6KiKX4oWsXRw8E0plVrJ45ENs508dXR4CJBXhOEP++0PxpgZIZrabhTrSbDuaThXsY2rqIwLm9OUWUeP1QVTz089dz98kN58uzFWM13KIaRjyzDubjaWSAHi52VYEMJXFBmtChRClVQFuVQFXx94XvOYOySc/GsOfOtvVajsTTNDocv0SHLOwQyD0lEXtmjiVenZPVqaAxh5qHfc13bWY2/MADSTIM7o3l7yWifhO6QDp2mO5zTnG76NOeEn27OObsf+jSdcLrnXk/cX/7gfdmt2Wn+AsaJwOdG7U3lAAAAAElFTkSuQmCC';
        var gradMarker = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAABCAYAAAAxWXB3AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4gQeBBw69Wy6dgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAsklEQVQ4y+1MW27EQAziZU9y//vG/Zh0G61W6gFaJGQM2MQ//iCGAAxAN/nQv5EAct/noeue737uuzyoR+4PPT08v/kCkGTcPV0FV00SJJlUwfZUFSQhx3GlG7XW5fNEHcdV5wl3T3WP14K7J90jG1lrlIz2X6hqaI+rQHuUgDaYbC2ByVDavg1svT1psPuEDdikBNhAorsv2IS0OxJJ7p3c/NG7TxIAXvlevyde+ROfvC+T3hj7KA1bQgAAAABJRU5ErkJggg==';
        var gradBlack = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAABCAYAAAAxWXB3AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4gUDFzcMzdVpXQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAX0lEQVQ4y91SywoAIAzS/f9Hd6hgRNqCTgXSY23llOiDA5HWSGdY4jmHIjbz1ExRA2Z/un8LLJyrsdfvQfQ/jA4wPXd6Kq1YqBniXztPxMEniudPgOBc8YXzxK3fpJYNASEA/wECCpgAAAAASUVORK5CYII=';

        gradientScaleImage = new Image();
        gradientScaleImage.src = gradBlack;
        gradientScaleImage.onload = function() {

            var canvas = document.createElement('canvas');
            canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
            canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size
    
            canvas.getContext('2d').drawImage(this, 0, 0);            
            console.log(canvas);
      //      fttCanvasCtx.drawImage(gradientScaleImage, 0, 0);
          gradientColor = canvas.getContext('2d').getImageData(0,0, 256, 1).data;

         };   

        // var gradientScale  = fttCanvasCtx.getImageData(0,0, 256, 1);
        // console.log(gradientScale);
       // var imgData=fttCanvasCtx.getImageData(0,0,256,1);

        var y = gradientContainerHeight - 1;
    

        // var gradientImage = gradientCanvasCtx.getImageData(0, 0, gradientContainerWidth, gradientContainerHeight);
        //     for (var i=0 ;i< gradientImage.data.length; i+=4) {
                
        //         gradientImage.data[i] = Math.random() * 255;
        //         gradientImage.data[i + 1] = Math.random() * 255;
        //         gradientImage.data[i + 2] = Math.random() * 255;
        //         gradientImage.data[i + 3] = 255;
        //     }
            
        //     gradientCanvasCtx.putImageData(gradientImage,0,0);
            var getLogValue = function(index, min, max, data) {

                var logIndex = fttv.toLog(index, min, max);
                var low = Math.floor(logIndex);
                var high = Math.ceil(logIndex);
                var w = (logIndex - low) / (high - low);

                var lv = data[low];
                var hv = data[high];

                //var v = lv;// + (hv - lv) * w;
            return lv + ((hv - lv) * w);    
            // return index;   

        

            }

        fttv.createGrid = function() {

            var insterval = 75 * scale;// gradientContainerWidth / 4;

            gradientCanvasCtx.beginPath();
            gradientCanvasCtx.strokeStyle = '#ff0000';  
            var x = gradientContainerWidth * scale * 0.35 - from;
  //          gradientCanvasCtx.moveTo(x,0);      
    //        gradientCanvasCtx.lineTo(x,gradientContainerHeight);      
            var x = gradientContainerWidth * scale * 0.628 - from;
            // gradientCanvasCtx.moveTo(x,0);      
            // gradientCanvasCtx.lineTo(x,gradientContainerHeight);   
            var x = gradientContainerWidth * scale * 0.905 - from;
            // gradientCanvasCtx.moveTo(x,0);      
            // gradientCanvasCtx.lineTo(x,gradientContainerHeight);   


            var start = -from;
            var end = Width * scale * 0.363 - from;
            var itemWidth = end - start;
            var step = itemWidth / 10;

            for(var xx = step * 4; xx < itemWidth; xx += step) {

                var xxx = end - fttv.toLog(xx, 1, itemWidth);
                gradientCanvasCtx.moveTo(xxx,0);      
                gradientCanvasCtx.lineTo(xxx,gradientContainerHeight);    
            }

            var start = Width * scale * 0.363 - from;
            var end = Width * scale * 0.635 - from;
            var itemWidth = end - start;
            var step = itemWidth / 10;

            for(var xx = step * 4; xx < itemWidth; xx += step) {

                var xxx = end - fttv.toLog(xx, 1, itemWidth);

                gradientCanvasCtx.moveTo(xxx,0);      
                gradientCanvasCtx.lineTo(xxx,gradientContainerHeight);    

            }

            var start = Width * scale * 0.635 - from;
            var end = Width * scale * 0.905 - from;
            var itemWidth = end - start;
            var step = itemWidth / 10;

            for(var xx = step * 4; xx < itemWidth; xx += step) {

                var xxx = end - fttv.toLog(xx, 1, itemWidth);

                gradientCanvasCtx.moveTo(xxx,0);      
                gradientCanvasCtx.lineTo(xxx,gradientContainerHeight);    

            }

            // for(var i = gradientContainerWidth * scale; i >=0; i -= insterval) {

            //     var xLog = ( gradientContainerWidth * scale) - fttv.toLog(i, 1, gradientContainerWidth * scale);

            //     var x = xLog - from;
            //     gradientCanvasCtx.moveTo(x,0); 
            //     gradientCanvasCtx.lineTo(x, gradientContainerHeight );

            // }


            gradientCanvasCtx.stroke();

            /*
            gradientCanvasCtx.fillStyle = "white"
            gradientCanvasCtx.font = "14px Arial";
            gradientCanvasCtx.fillText("Scale: " + scale + ", delta scale:  " + dscale,10,50);
            gradientCanvasCtx.fillText("From: " + from + ", mouserReal: " + (mouserReal),10,70);
            gradientCanvasCtx.fillText("Interval width:" + (intWidth) + ", delta scale: " + (deltaScale),10,90);
            gradientCanvasCtx.fillText("MouseX: " + MouseX + ", Mouse abs: " + mouseAbs,10,110); 
            gradientCanvasCtx.fillText("fromScaled: " + fromPercent,10,130); 
            gradientCanvasCtx.fillText("toScaled: " + toPercent,10,150); 
            */
         



        }
        

        var prepareHistory = function() {

       
            var prepareHistoryInterval = setInterval(function(){

                analyser.getByteFrequencyData(historyDataArrayAlt);
                var gradientStepWidth = gradientContainerWidth / bufferLengthAlt;


                // var gradientLineSize = gradientContainerWidth * 4;
                // for(var i = GradientDataSize - 1; i >= 0; i -= 1 ) {

                //     GradientData[i] = GradientData[i - gradientLineSize];
                // }


                var to = (bufferLengthAlt * (1.0 / scale)) + from;
                var iStart = Math.floor(from);
                var scaledWidth = to - from;
                fttToScreenRatio =  bufferLengthAlt / gradientContainerWidth * 0.91;
                if(bufferLengthAlt > gradientContainerWidth) {

                    var fromftt = Math.floor(fromPercent * bufferLengthAlt);
                    var toftt = Math.ceil(toPercent * bufferLengthAlt); 
                    var widthftt = toftt - fromftt;
                    for(i = 0; i < widthftt; i++ ) {
                        rectHeight = getLogValue(i + fromftt, 1, bufferLengthAlt, historyDataArrayAlt);
                        var gradientXPos = ((y-1) * gradientContainerWidth * 4) + (Math.floor((i / widthftt ) * gradientContainerWidth) * 4);


                        var gradioenYPos = Math.floor(rectHeight) * 4;
                        gradientByteData[gradientImgBufId][(gradientXPos)] =  gradientColor[gradioenYPos];//
                        gradientByteData[gradientImgBufId][(gradientXPos) + 1] = gradientColor[gradioenYPos + 1];
                        gradientByteData[gradientImgBufId][(gradientXPos) + 2] = gradientColor[gradioenYPos + 2];
                        gradientByteData[gradientImgBufId][(gradientXPos) + 3] = gradientColor[gradioenYPos + 3];         
                    }
                } else {

/*                    
                    for(i = 0; i < gradientContainerWidth; i++ ) {
                        var IInt = Math.floor( i / gradientContainerWidth * bufferLengthAlt);
                        rectHeight = (getLogValue(IInt, 1, bufferLengthAlt, historyDataArrayAlt));
                        var gradientXPos = ((y-1) * gradientContainerWidth * 4) + i * 4;
                        var gradioenYPos = Math.floor(rectHeight) * 4;

                        gradientByteData[gradientImgBufId][(gradientXPos)] =  gradientColor[gradioenYPos];//
                        gradientByteData[gradientImgBufId][(gradientXPos) + 1] = gradientColor[gradioenYPos + 1];
                        gradientByteData[gradientImgBufId][(gradientXPos) + 2] = gradientColor[gradioenYPos + 2];
                        gradientByteData[gradientImgBufId][(gradientXPos) + 3] = gradientColor[gradioenYPos + 3];         
                    }
*/
                }


                gradientImgBuf[gradientImgBufId].data.set(gradientByteData[gradientImgBufId]);                
                y--;
                if( y == 0) {


            //        gradientImgBuf[1].data.set(gradientByteData[1]);

                    y = gradientContainerHeight;
                    gradientImgBufId++;
                    if( gradientImgBufId > 1) {
                        gradientImgBufId = 0;
                    }
                }

                

            }, 0)
        }
        prepareHistory();
           
        var oldY = 0;
        var drawFTT = function() {

            requestAnimationFrame(drawFTT);
            analyser.getByteFrequencyData(dataArrayAlt);

            

            fttCanvasCtx.fillStyle = '#f9f9f9';
            fttCanvasCtx.fillRect(0, 0, Width, Height);



            
            var stepWidth = Width / bufferLengthAlt;
            var rectHeight;



            rectHeight = (getLogValue(0, 1, bufferLengthAlt, dataArrayAlt) / 255) * Height;
            fttCanvasCtx.beginPath();
            fttCanvasCtx.moveTo(0, Height - rectHeight);      

    
            
            fttCanvasCtx.strokeStyle = '#333333';  

            var fromftt = Math.floor(fromPercent * bufferLengthAlt);
            var toftt = Math.ceil(toPercent * bufferLengthAlt); 
            var widthftt = toftt - fromftt;
            var stepWidth = Width / widthftt;
            for(i = 0; i < widthftt; i++ ) {
                rectHeight = getLogValue(i + fromftt, 1, bufferLengthAlt, dataArrayAlt) / 255;

  //          for(i = 0; i < bufferLengthAlt; i++ ) {
                // if( dataArrayAlt[i] > maxDataArray[i] ) {
                //     maxDataArray[i] = dataArrayAlt[i];
                // }
                // if( dataArrayAlt[i] < minDataArray[i] ) {
                //     minDataArray[i] = dataArrayAlt[i];
                // }

                

// //                rectHeight = dataArrayAlt[i];//((dataArrayAlt[i] / 255) * Math.log(i / bufferLengthAlt)) * 255;
 //               rectHeight = (getLogValue(i, 1, bufferLengthAlt, dataArrayAlt) / 255);
                //console.log((rectHeight / Height));

 
                 var posX = (i * stepWidth) + stepWidth;
                 var posY = Height - (rectHeight * Height);
                 fttCanvasCtx.lineTo(posX, posY);
                 fttCanvasCtx.moveTo(posX, posY);

                



                
//                 //fttCanvasCtx.fillRect( i * 20, Height - rectHeight, 10, 10 );
//                // fttCanvasCtx.fillRect(i * rectWidth, Height - (rectHeight / 255) * Height, rectWidth, Height);
//                 // fttCanvasCtx.fillStyle = 'rgb(170, 170, 170)';
//                 // fttCanvasCtx.fillRect(i * rectWidth, Height - (maxDataArray[i] / 255) * Height, rectWidth, 1);
//                 // fttCanvasCtx.fillStyle = 'rgb(37, 37, 37)';
//                 // fttCanvasCtx.fillRect(i * rectWidth, Height - (minDataArray[i] / 255) * Height, rectWidth, 1);                

//                 if( maxDataArray[i] > 0)
//                     maxDataArray[i]--;
//                 minDataArray[i]++;
            }
           // rectHeight = (getLogValue(bufferLengthAlt, 1, bufferLengthAlt) / 255) * Height;
            fttCanvasCtx.lineTo(Width, Height);
            fttCanvasCtx.stroke();
            if( y != oldY) {
                var syncY = y;
                var bufId = gradientImgBufId;
                var b1, b2;

                if( bufId == 0) {
                    b1 = gradientImgBuf[0];
                    b2 = gradientImgBuf[1];
                } else {
                    b1 = gradientImgBuf[1];
                    b2 = gradientImgBuf[0];                    
                }
    

                
  
              //  gradientCanvasCtx.fillStyle = 'rgb(255,0,0)';
             //   gradientCanvasCtx.fillRect(0, 0, gradientContainerWidth, gradientContainerHeight);
                gradientCanvasCtx.putImageData(b2,0, gradientContainerHeight - syncY);   
                gradientCanvasCtx.putImageData(b1,0,-syncY);                  
                fttv.createGrid();

   

                    
                //gradientCanvasCtx.fillStyle = 'rgb(255,0,0)';

                // gradientCanvasCtx.beginPath();
                // gradientCanvasCtx.strokeStyle = 'rgb(255,0,0)';                   
                // gradientCanvasCtx.rect(0,-syncY - 1, 100, gradientImgBuf[bufId].width, gradientImgBuf[bufId].height);      
        
                // gradientCanvasCtx.stroke();
                
            }        
            oldY  = y;
        }

        drawFTT();
    }

    fttv.initMic = function() {

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
                    fttv.updateView();
               })
               .catch( function(err) { 
                   
                   fttCanvasCtx.fillStyle = 'rgb(0,0,255)';
                   fttCanvasCtx.fillRect(0, 0, Width, Height);
                })
         } else {
            fttCanvasCtx.fillStyle = 'rgb(255,0,0)';
            fttCanvasCtx.fillRect(0, 0, Width, Height);
         }
    }
    fttv.initMic();
/*
    fttv.setCallback = function(callback) {
        
        fttv.color = null;
        if (typeof callback == 'function') {

            fttv.callback = callback;
        }
    }

    if(callback) {
        fttv.setCallback(callback);
    }
*/
};

var ws = null; 
var connected = false;
function startAutoreconnectClient(Address){

    ws = new WebSocket(Address);
    var autoupdateHandle;
    ws.onmessage = function(e) {

        epar = JSON.parse(e.data);  
    };
    ws.onopen = function(epar) {
        connected = true;
    }
    ws.onclose = function(){
        connected = false;
        clearInterval(autoupdateHandle);
        autoupdateHandle = setTimeout(function(){startAutoreconnectClient(Address)}, 1000);
    };
}

function unpackColor(color) {

    return [parseInt('0x' + color.substring(1, 3)) / 255,
    parseInt('0x' + color.substring(3, 5)) / 255,
    parseInt('0x' + color.substring(5, 7)) / 255];
}

function sendRGB(color) {

    if( connected) {
        var rgb = unpackColor(color);
        var rgbMsg = {
            Type: 2,
            r: Math.round(rgb[0] * 255),
            g: Math.round(rgb[1] * 255),
            b: Math.round(rgb[2] * 255)
        }
        ws.send( JSON.stringify(rgbMsg));                 

    }
}


// $(document).ready(function() {
//     //startAutoreconnectClient("ws://192.168.0.105:81");
//     $('#fttView').fttVisualizer($('#fttGradientView'));
// }); 