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

(function() {

	var $ = document.id;

	this.Slider = new Class({

		Implements : [Events, Options],

		Binds : ['clickedElement', 'draggedKnob', 'scrolledElement', 'clickedElementKeyUp'],

		options : {
			/*
			 onTick: $empty(intPosition),
			 onChange: $empty(intStep),
			 onComplete: $empty(strStep),*/
			onTick : function(position) {
				if(this.options.snap)
					position = this.toPosition(this.step);
				this.knob.setStyle(this.property, position);

				// --- extended ----------- Anfang Bearbeitet --------------------------------
				// Wird ben�tigt damit dr aktuelle Wert des Sliders gelesen wird.
				$(document.body).getElements('.knob').setProperty('aria-valuenow', this.step);
				//		 $(document.body).getElements('.knob').setProperty('aria-valuetext', this.step);
				// ------------------------- Ende Bearbeitet ---------------------------------
			},
			onMoveTick : function(position) {
				// --- extended ----------- Anfang Bearbeitet --------------------------------
				// Wird ben�tigt damit dr aktuelle Wert des Sliders gelesen wird.
				$(document.body).getElements('.knob').setProperty('aria-valuenow', this.step);
				//		 $(document.body).getElements('.knob').setProperty('aria-valuetext', this.step);
				// ------------------------- Ende Bearbeitet ---------------------------------
			},
			initialStep : 0,
			snap : false,
			offset : 0,
			range : false,
			wheel : false,
			steps : 100,
			mode : 'horizontal'
		},

		initialize : function(element, knob, options) {
			this.setOptions(options);
			this.element = document.id(element);
			this.knob = document.id(knob);
			this.previousChange = this.previousEnd = this.step = -1;
			var offset, limit = {}, modifiers = {
				'x' : false,
				'y' : false
			};

			switch (this.options.mode) {
				case 'vertical':
					this.axis = 'y';
					this.property = 'top';
					offset = 'offsetHeight';
					break;
				case 'horizontal':
					this.axis = 'x';
					this.property = 'left';
					offset = 'offsetWidth';
			}

			this.full = this.element.measure( function() {
				this.half = this.knob[offset] / 2;
				return this.element[offset] - this.knob[offset] + (this.options.offset * 2);
			}.bind(this));

			this.min = $chk(this.options.range[0]) ? this.options.range[0] : 0;
			this.max = $chk(this.options.range[1]) ? this.options.range[1] : this.options.steps;
			this.range = this.max - this.min;
			this.steps = this.options.steps || this.full;
			this.stepSize = Math.abs(this.range) / this.steps;
			this.stepWidth = this.stepSize * this.full / Math.abs(this.range);

			this.knob.setStyle('position', 'relative').setStyle(this.property, this.options.initialStep ? this.toPosition(this.options.initialStep) : -this.options.offset);

			modifiers[this.axis] = this.property;
			limit[this.axis] = [-this.options.offset, this.full - this.options.offset];

			// *********** everything for drag and drop ***********************************
			var dragOptions = {
				preventDefault : true,
				snap : 0,
				limit : limit,
				modifiers : modifiers,
				onDrag : (function() {
					this.draggedKnob();
				}).bind(this),
				onStart : (function() {
					this.draggedKnob();
				}).bind(this),
				onBeforeStart : (function() {
					this.isDragging = true;
				}).bind(this),
				onCancel : function() {
					this.isDragging = false;
				}.bind(this),
				onComplete : function() {
					this.isDragging = false;
					this.draggedKnob();
					this.end();
				}.bind(this)
			};
			if(this.options.snap) {
				dragOptions.grid = Math.ceil(this.stepWidth);
				dragOptions.limit[this.axis][1] = this.full;
			}
			this.drag = new Drag(this.knob, dragOptions);
			this.attach();

			// --- extended ----------- Anfang Bearbeitet --------------------------------
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
		attach : function() {
			var self = this;
			this.element.addEvent('mousedown', function(e) {
				self.clickedElement(e);
			});
			this.element.addEvent('touchstart', function(e) {
				self.clickedElement(e);
			});
			if(this.options.wheel)
				this.element.addEvent('mousewheel', this.scrolledElement);

			// --- extended ----------- Anfang Bearbeitet --------------------------------
			// Aufruf der Funktion clickedElementKeyUp bei einem Tastendruck. Selbst geschriebener
			// eventlistener.
			this.knob.addEvent('keydown', this.clickedElementKeyUp.bindWithEvent(this));

			//VoiceOver compatibility
			this.knob.addEvent('focus', function() {
				var addCount = function() {
					if(this.knob.getProperty('aria-valuenow') != this.currentValueNow) {
						step = this.lastValueNow.toInt() + (this.knob.getProperty('aria-valuenow').toInt() - this.lastValueNow.toInt())
						if(!((this.range > 0) ^ (step < this.min))) {
							step = this.min;
							this.fireEvent('moveTick', this.step);
						}
						if(!((this.range > 0) ^ (step > this.max))) {
							step = this.max;
							this.fireEvent('moveTick', this.step);
						}

						this.step = Math.round(step);
						this.checkStep();
						position = this.toPosition(this.step);
						if(this.options.snap)
							position = this.toPosition(this.step);
						this.knob.setStyle(this.property, position);
						this.lastValueNow = this.knob.getProperty('aria-valuenow')
					}
				}.bind(this);
				var timer = addCount.periodical(500, this);

				this.knob.addEvents({
					'touchend' : function() {
						//clearInterval(timer);
						removeEvents('touchend', 'mouseup', 'mousemove', 'touchmove', 'blur');
					}.bind(this),
					'mouseup' : function() {
						clearInterval(timer);
						removeEvents('touchend', 'mouseup', 'mousemove', 'touchmove', 'blur');
					}.bind(this),
					'mousemove' : function() {
						clearInterval(timer);
						removeEvents('touchend', 'mouseup', 'mousemove', 'touchmove', 'blur');
					}.bind(this),
					'touchmove' : function() {
						//clearInterval(timer);
						removeEvents('touchend', 'mouseup', 'mousemove', 'touchmove', 'blur');
					}.bind(this),
					'blur' : function() {
						clearInterval(timer);
						removeEvents('touchend', 'mouseup', 'mousemove', 'touchmove', 'blur');
					}.bind(this)
				});
			}.bind(this));
			// ------------------------- Ende Bearbeitet ---------------------------------

			this.drag.attach();
			return this;
		},
		detach : function() {
			this.element.removeEvent('mousedown', this.clickedElement);

			this.element.removeEvent('touchstart', this.clickedElement);
			this.element.removeEvent('mousewheel', this.scrolledElement);
			this.drag.detach();
			return this;
		},
		set : function(step) {
			if(!((this.range > 0) ^ (step < this.min)))
				step = this.min;
			if(!((this.range > 0) ^ (step > this.max)))
				step = this.max;

			this.step = Math.round(step);
			this.checkStep();
			this.fireEvent('tick', this.toPosition(this.step));
			this.end();
			return this;
		},
		// --- extended ----------- Anfang Bearbeitet --------------------------------
		// Die Funktion clickedElementKeyUp verarbeitet die eingegebenen Tasten so das sich
		// der Slider wie gew�nscht verh�lt.
		clickedElementKeyUp : function(event) {

			var keyCode;

			if(window.event) {
				var e = window.event;
				keyCode = e.keyCode;
			} else {
				keyCode = event.code;
			}

			//alert(keyCode);

			switch (keyCode) {
				case 37:
					// left arrow
					event.stop();
					this.set(this.step - this.stepSize);
					//alert('step afterwards: ' + this.step);
					break;
				case 39:
					// right arrow
					event.stop();
					this.set(this.step + this.stepSize);
					//alert('step afterwards: ' + this.step);
					break;
				case 38:
					// up arrow
					event.stop();
					this.set(this.step + this.stepSize);
					//alert('step afterwards: ' + this.step);
					break;

				case 40:
					// down arrow
					event.stop();
					this.set(this.step - this.stepSize);
					//alert('step afterwards: ' + this.step);
					break;
				case 33:
					// Bild hoch
					event.stop();
					this.set(this.step + 10 * this.stepSize);
					break;
				case 34:
					// Bild runter
					event.stop();
					this.set(this.step - 10 * this.stepSize);
					break;
				case 36:
					// Pos 1
					event.stop();
					this.set(this.min);
					break;
				case 35:
					// Ende
					event.stop();
					this.set(this.max);
					break;
			}
		},
		// ------------------------- Ende Bearbeitet ---------------------------------

		clickedElement : function(event) {
			this.knob.focus();
			if(this.isDragging || event.target == this.knob)
				return;

			var dir = this.range < 0 ? -1 : 1;
			var position = event.page[this.axis] - this.element.getPosition()[this.axis] - this.half;
			position = position.limit(-this.options.offset, this.full - this.options.offset);

			this.step = Math.round(this.min + dir * this.toStep(position));
			this.checkStep();
			this.fireEvent('tick', position);
			this.end();
		},
		scrolledElement : function(event) {
			var mode = (this.options.mode == 'horizontal') ? (event.wheel < 0) : (event.wheel > 0);
			this.set( mode ? this.step - this.stepSize : this.step + this.stepSize);
			event.stop();
		},
		draggedKnob : function() {
			var dir = this.range < 0 ? -1 : 1;
			var position = this.drag.value.now[this.axis];
			position = position.limit(-this.options.offset, this.full - this.options.offset);
			this.step = Math.round(this.min + dir * this.toStep(position));
			this.checkStep();

		},
		checkStep : function() {
			if(this.previousChange != this.step) {
				this.previousChange = this.step;
				this.fireEvent('change', this.step);
				this.fireEvent('moveTick', this.step);
			}
		},
		end : function() {
			if(this.previousEnd !== this.step) {
				this.previousEnd = this.step;
				this.fireEvent('complete', this.step + '');
			}
		},
		toStep : function(position) {
			var step = (position + this.options.offset) * this.stepSize / this.full * this.steps;
			return this.options.steps ? Math.round(step -= step % this.stepSize) : step;
		},
		toPosition : function(step) {
			return (this.full * Math.abs(this.min - step)) / (this.steps * this.stepSize) - this.options.offset;
		}
	});

})();

/*
 ---
 script: Drag.js
 description: The base Drag Class. Can be used to drag and resize Elements using mouse events.
 license: MIT-style license
 authors:
 - Valerio Proietti
 - Tom Occhinno
 - Jan Kassens
 requires:
 - core:1.2.4/Events
 - core:1.2.4/Options
 - core:1.2.4/Element.Event
 - core:1.2.4/Element.Style
 - /MooTools.More
 provides: [Drag]
 */
var Drag = new Class({

	Implements : [Events, Options],

	options : {
		/*
		 onBeforeStart: $empty(thisElement),
		 onStart: $empty(thisElement, event),
		 onSnap: $empty(thisElement)
		 onDrag: $empty(thisElement, event),
		 onCancel: $empty(thisElement),
		 onComplete: $empty(thisElement, event),*/
		snap : 6,
		unit : 'px',
		grid : false,
		style : true,
		limit : false,
		handle : false,
		invert : false,
		preventDefault : false,
		stopPropagation : false,
		modifiers : {
			x : 'left',
			y : 'top'
		}
	},

	initialize : function() {
		var params = Array.link(arguments, {
			'options' : Object.type,
			'element' : $defined
		});
		this.element = document.id(params.element);
		this.document = this.element.getDocument();
		this.setOptions(params.options || {});
		var htype = $type(this.options.handle);
		this.handles = ((htype == 'array' || htype == 'collection') ? $$(this.options.handle) : document.id(this.options.handle)) || this.element;
		this.mouse = {
			'now' : {},
			'pos' : {}
		};
		this.value = {
			'start' : {},
			'now' : {}
		};

		this.selection = (Browser.Engine.trident) ? 'selectstart' : 'mousedown';

		this.bound = {
			start : this.start.bind(this),
			check : this.check.bind(this),
			drag : this.drag.bind(this),
			stop : this.stop.bind(this),
			cancel : this.cancel.bind(this),
			eventStop : $lambda(false)
		};
		this.attach();
	},
	attach : function() {
		this.handles.addEvent('mousedown', this.bound.start);

		//touchdevices
		this.handles.addEvent('touchstart', this.bound.start);
		return this;
	},
	detach : function() {
		this.handles.removeEvent('mousedown', this.bound.start);

		//touchdevices
		this.handles.removeEvent('touchstart', this.bound.start);
		return this;
	},
	start : function(event) {
		if(event.rightClick)
			return;
		if(this.options.preventDefault)
			event.preventDefault();
		if(this.options.stopPropagation)
			event.stopPropagation();
		this.mouse.start = event.page;
		this.fireEvent('beforeStart', this.element);
		var limit = this.options.limit;
		this.limit = {
			x : [],
			y : []
		};
		for(var z in this.options.modifiers) {
			if(!this.options.modifiers[z])
				continue;
			if(this.options.style)
				this.value.now[z] = this.element.getStyle(this.options.modifiers[z]).toInt();
			else
				this.value.now[z] = this.element[this.options.modifiers[z]];
			if(this.options.invert)
				this.value.now[z] *= -1;
			this.mouse.pos[z] = event.page[z] - this.value.now[z];
			if(limit && limit[z]) {
				for(var i = 2; i--; i) {
					if($chk(limit[z][i]))
						this.limit[z][i] = $lambda(limit[z][i])();
				}
			}
		}
		if($type(this.options.grid) == 'number')
			this.options.grid = {
				x : this.options.grid,
				y : this.options.grid
			};
		this.document.addEvents({
			mousemove : this.bound.check,
			mouseup : this.bound.cancel,
			//touchdevices
			touchmove : this.bound.check,
			touchend : this.bound.cancel
		});
		this.document.addEvent(this.selection, this.bound.eventStop);
	},
	check : function(event) {
		if(this.options.preventDefault)
			event.preventDefault();
		var distance = Math.round(Math.sqrt(Math.pow(event.page.x - this.mouse.start.x, 2) + Math.pow(event.page.y - this.mouse.start.y, 2)));
		if(distance > this.options.snap) {
			this.cancel();
			this.document.addEvents({
				mousemove : this.bound.drag,
				mouseup : this.bound.stop,
				//touchdevices
				touchmove : this.bound.drag,
				touchend : this.bound.stop
			});
			this.fireEvent('start', [this.element, event]).fireEvent('snap', this.element);
		}
	},
	drag : function(event) {
		if(this.options.preventDefault)
			event.preventDefault();
		this.mouse.now = event.page;
		for(var z in this.options.modifiers) {
			if(!this.options.modifiers[z])
				continue;
			this.value.now[z] = this.mouse.now[z] - this.mouse.pos[z];
			if(this.options.invert)
				this.value.now[z] *= -1;
			if(this.options.limit && this.limit[z]) {
				if($chk(this.limit[z][1]) && (this.value.now[z] > this.limit[z][1])) {
					this.value.now[z] = this.limit[z][1];
				} else if($chk(this.limit[z][0]) && (this.value.now[z] < this.limit[z][0])) {
					this.value.now[z] = this.limit[z][0];
				}
			}
			if(this.options.grid[z])
				this.value.now[z] -= ((this.value.now[z] - (this.limit[z][0] || 0)) % this.options.grid[z]);
			if(this.options.style) {
				this.element.setStyle(this.options.modifiers[z], this.value.now[z] + this.options.unit);
			} else {
				this.element[this.options.modifiers[z]] = this.value.now[z];
			}
		}
		this.fireEvent('drag', [this.element, event]);
	},
	cancel : function(event) {
		this.document.removeEvent('mousemove', this.bound.check);
		this.document.removeEvent('mouseup', this.bound.cancel);
		//touchdevices
		this.document.removeEvent('touchmove', this.bound.check);
		this.document.removeEvent('touchend', this.bound.cancel);
		if(event) {
			this.document.removeEvent(this.selection, this.bound.eventStop);
			this.fireEvent('cancel', this.element);
		}
	},
	stop : function(event) {
		this.document.removeEvent(this.selection, this.bound.eventStop);
		this.document.removeEvent('mousemove', this.bound.drag);
		this.document.removeEvent('mouseup', this.bound.stop);
		//touchdevices
		this.document.removeEvent('touchmove', this.bound.drag);
		this.document.removeEvent('touchend', this.bound.stop);
		if(event)
			this.fireEvent('complete', [this.element, event]);
	}
});

Element.implement({

	makeResizable : function(options) {
		var drag = new Drag(this, $merge({
			modifiers : {
				x : 'width',
				y : 'height'
			}
		}, options));
		this.store('resizer', drag);
		return drag.addEvent('drag', function() {
			this.fireEvent('resize', drag);
		}.bind(this));
	}
});
