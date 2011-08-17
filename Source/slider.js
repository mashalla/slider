/*
---

script: Slider.js

description: Class for creating horizontal and vertical slider controls.

license: MIT-style license

authors:
 - Valerio Proietti
 - Christian Merz

requires:
 - Core/1.2.4: *
 - More/1.2.4: Element.Dimensions
 - More/1.2.4: Class.Binds
 - More/1.2.4: Drag
 - More/1.2.4: Element.Dimensions
 - More/1.2.4: Element.Measure

provides: [Slider]
 
...
*/

// Refactors the Mootools DragClass
Drag = Class.refactor(Drag, {
    attach: function(){
        this.previous();
        this.handles.addEvent('touchstart', this.bound.start);
        return this;
    },
    detach: function(){
        this.previous();
        this.handles.removeEvent('touchstart', this.bound.start);
        return this;
    },
    start: function(event){
        this.previous(event);
        this.document.addEvents({
            touchmove: this.bound.check,
            touchend: this.bound.cancel
        });
    },
    check: function(event){
        if (this.options.preventDefault) 
            event.preventDefault();
        var distance = Math.round(Math.sqrt(Math.pow(event.page.x - this.mouse.start.x, 2) + Math.pow(event.page.y - this.mouse.start.y, 2)));
        if (distance > this.options.snap) {
            this.cancel();
            this.document.addEvents({
                mousemove: this.bound.drag,
                mouseup: this.bound.stop,
                //touchdevices
                touchmove: this.bound.drag,
                touchend: this.bound.stop
            });
            this.fireEvent('start', [this.element, event]).fireEvent('snap', this.element);
        }
    },
    cancel: function(event){
        this.previous(event);
        this.document.removeEvent('touchmove', this.bound.check);
        this.document.removeEvent('touchend', this.bound.cancel)
    },
    stop: function(event){
        this.previous(event);
        this.document.removeEvent('touchmove', this.bound.check);
        this.document.removeEvent('touchend', this.bound.cancel)
    }
});

// Refactors the Mootools SliderClass
Slider = Class.refactor(Slider, {

    Binds: ['clickedElement', 'draggedKnob', 'scrolledElement', 'clickedElementKeyUp'],
    
    options: {
        onTick: function(position){
            if (this.options.snap) 
                position = this.toPosition(this.step);
            this.knob.setStyle(this.property, position);
            
            // --- extended ----------- Anfang Bearbeitet --------------------------------
            // Wird ben�tigt damit dr aktuelle Wert des Sliders gelesen wird.
            $(document.body).getElements('.knob').setProperty('aria-valuenow', this.step);
            //		 $(document.body).getElements('.knob').setProperty('aria-valuetext', this.step);
            // ------------------------- Ende Bearbeitet ---------------------------------
        },
        onMoveTick: function(position){
            // --- extended ----------- Anfang Bearbeitet --------------------------------
            // Wird ben�tigt damit dr aktuelle Wert des Sliders gelesen wird.
            $(document.body).getElements('.knob').setProperty('aria-valuenow', this.step);
            //		 $(document.body).getElements('.knob').setProperty('aria-valuetext', this.step);
            // ------------------------- Ende Bearbeitet ---------------------------------
        }
    },
    
    initialize: function(element, knob, options){
        this.previous(element, knob, options);
        // Notwendige und hinreichende Attribute die dem Element 'knob' zugewiesen werden
        $(document.body).getElements('.knob').setProperty('role', 'slider');
        $(document.body).getElements('.knob').setProperty('aria-valuemin', this.min);
        $(document.body).getElements('.knob').setProperty('aria-valuemax', this.max);
        $(document.body).getElements('.knob').setProperty('aria-valuenow', this.options.initialStep);
        //$(document.body).getElements('.knob').setProperty('aria-valuetext', this.options.initialStep);
        //$(document.body).getElements('.knob').setProperty('aria-live', 'assertive');
        $(document.body).getElements('.knob').setProperty('tabindex', '0');
        this.lastValueNow = this.knob.getProperty('aria-valuenow');
        // ------------------------- Ende Bearbeitet ---------------------------------
    
    },
    
    attach: function(){
        var self = this;
		this.element.addEvent('mousedown', this.clickedElement);
		this.element.addEvent('touchstart', this.clickedElement);
		if (this.options.wheel) this.element.addEvent('mousewheel', this.scrolledElement);
        
        // --- extended ----------- Anfang Bearbeitet --------------------------------
        // Aufruf der Funktion clickedElementKeyUp bei einem Tastendruck. Selbst geschriebener
        // eventlistener.
        this.knob.addEvent('keydown', this.clickedElementKeyUp.bindWithEvent(this));
        
        //VoiceOver compatibility
		
        this.knob.addEvent('focus', function(){
            var addCount = function(){
                if (this.knob.getProperty('aria-valuenow') != this.currentValueNow) {
                    step = this.lastValueNow.toInt() + (this.knob.getProperty('aria-valuenow').toInt() - this.lastValueNow.toInt())
					if (!((this.range > 0) ^ (step < this.min))) {
                        step = this.min;
                        this.fireEvent('moveTick', this.step);
                    }
                    if (!((this.range > 0) ^ (step > this.max))) {
                        step = this.max;
                        this.fireEvent('moveTick', this.step);
                    }
                    
                    this.step = Math.round(step);
                    this.checkStep();
                    position = this.toPosition(this.step);
                    if (this.options.snap) 
                        position = this.toPosition(this.step);
                    this.knob.setStyle(this.property, position);
                    this.lastValueNow = this.knob.getProperty('aria-valuenow')
                }
            }
.bind(this);
            var timer = addCount.periodical(500, this);
            
            this.knob.addEvents({
                'touchend': function(){
                    clearInterval(timer);
                    removeEvents('touchend', 'mouseup', 'mousemove', 'touchmove', 'blur');
                }
.bind(this)                ,
                'mouseup': function(){
                    clearInterval(timer);
                    removeEvents('touchend', 'mouseup', 'mousemove', 'touchmove', 'blur');
                }
.bind(this)                ,
                'mousemove': function(){
                    clearInterval(timer);
                    removeEvents('touchend', 'mouseup', 'mousemove', 'touchmove', 'blur');
                }
.bind(this)                ,
                'touchmove': function(){
                    clearInterval(timer);
                    removeEvents('touchend', 'mouseup', 'mousemove', 'touchmove', 'blur');
                }
.bind(this)                ,
                'blur': function(){
                    clearInterval(timer);
                    removeEvents('touchend', 'mouseup', 'mousemove', 'touchmove', 'blur');
                }
.bind(this)
            });
        }
.bind(this));
        // ------------------------- Ende Bearbeitet ---------------------------------
        
        this.drag.attach();
        return this;
    },
    
    detach: function(){
        this.previous();
        this.element.removeEvent('touchstart', this.clickedElement);
        return this;
    },
    
    // --- extended ----------- Anfang Bearbeitet --------------------------------
    // Die Funktion clickedElementKeyUp verarbeitet die eingegebenen Tasten so das sich
    // der Slider wie gew�nscht verh�lt. 
    clickedElementKeyUp: function(event){
    
        var keyCode;
        
        if (window.event) {
            var e = window.event;
            keyCode = e.keyCode;
        }
        else {
            keyCode = event.code;
        }
        
        //alert(keyCode);
        
        switch (keyCode) {
            case 37: // left arrow
                event.stop();
                this.set(this.step - this.stepSize);
                //alert('step afterwards: ' + this.step);
                break;
            case 39: // right arrow
                event.stop();
                this.set(this.step + this.stepSize);
                //alert('step afterwards: ' + this.step);
                break;
            case 38: // up arrow
                event.stop();
                this.set(this.step + this.stepSize);
                //alert('step afterwards: ' + this.step);
                break;
                
            case 40: // down arrow
                event.stop();
                this.set(this.step - this.stepSize);
                //alert('step afterwards: ' + this.step);
                break;
            case 33: // Bild hoch
                event.stop();
                this.set(this.step + 10 * this.stepSize);
                break;
            case 34: // Bild runter
                event.stop();
                this.set(this.step - 10 * this.stepSize);
                break;
            case 36: // Pos 1
                event.stop();
                this.set(this.min);
                break;
            case 35: // Ende
                event.stop();
                this.set(this.max);
                break;
        }
    },
    // ------------------------- Ende Bearbeitet ---------------------------------
    
    checkStep: function(){
        if (this.previousChange != this.step) {
            this.previousChange = this.step;
            this.fireEvent('change', this.step);
            this.fireEvent('moveTick', this.step);
        }
		return this;
    }
});
