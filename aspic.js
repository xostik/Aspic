    Backbone.AspicModel = Backbone.Model.extend({ 
		/*
			Override set method of Backbone Model.
			Create new method when new field is setted. 
		*/	
        set: function (key, val, options) {
            var bb_set = Backbone.Model.prototype.set,
                result = bb_set.apply(this, arguments), // call native set method of Backbone Model
                attr, attrs;
                    

            if (result) {
                if (typeof key === 'object') {
                    attrs = key;
                } else {
                    (attrs = {})[key] = val;
                }

                for (attr in attrs) {
                    if (this.has(attr)) {
                        if (this[attr] === undefined) {
                            this[attr] = _.bind(function (_key, value) {
                                if (value === undefined) {
                                    return this.get(_key);
                                } else {
                                    return bb_set.call(this, _key, value);
                                }
                            }, this, attr);
                        }
                    } else {
                        delete this[attr];
                    }
                }
            }

            return result;
        }
    });

            
    Backbone.AspicView = Backbone.View.extend({
		/*
			Override constructor of Backbone View.
		*/		
        constructor: function (options) {
            Backbone.View.apply(this, arguments); // call native constructor of Backbone View.
            this._aspic_ = {}; // storage for aspic date
            
            if (this.bindings) {
                this._aspic_.bindedToView = [/*{eventTypes, selector, handler*/]; 
                this._aspic_.bindedToModel = [/*{model, eventType, handler}*/];

                for (var k in this.bindings) {
                    if (this.bindings.hasOwnProperty(k)) {
                        this._bindWithField_(k, this.bindings[k]);
                    }
                }
            }                    
        },
                
        _bindWithField_: function (selector, options) {
            var $els = this.$el.find(selector);
                    
            if (options.withProperty) {
                var prop = this._findPropertyByPath_(options.withProperty),
                    eventTypes = 'change';
                if ($els.is('input,textarea,select')) {
                    this._twoWayBindingPropertyAndModel_($els, options, selector);
                } else {
                    this._bindPropertyWithElement_($els, options);
                }
            } else {
                if (options.withFunction) {
					this._bindMethodWithElement_($els, options);
                }
            }
        },
		
		/*
			Override remove method of Backbone View.
			Create new method when new field is setted. 
		*/	
        remove: function(){
			var bb_remove = Backbone.View.prototype.remove;
			
			// unsubscribe all aspic handlers from model
			if(this._aspic_.bindedToModel){
				var binded = this._aspic_.bindedToModel;
				for(var i = 0, ii = binded.length; i < ii; i++){
					binded[i].model.off(binded.eventType, binded.handler);
				}
			}
			// unsubscribe all aspic handlers from view
			if(this._aspic_.bindedToView){
				var binded = this._aspic_.bindedToView;
				for(var i = 0, ii = binded.length; i < ii; i++){
					this.$el.off(binded.eventTypes, binded.selector, binded.handler);
				}
			}
			// call native remove method of Backbone View.
			bb_remove.call(this);
		},
        
        _findPropertiesByPath_: function(pathString) {
            var results = [],
                separatedPaths = pathString.split(',');
            for (var i = 0, ii = separatedPaths.length; i < ii; i++) {
                results.push(
                    this._findPropertyByPath_( $.trim(separatedPaths[i]) )
                );
            }
                    
            return results;
        },
                
        _findPropertyByPath_: function (pathString) {
            var paths = pathString.split('.');
            switch (paths.length) {
                case 1: return { model: this.model, prop: paths [0] };
                case 2: return { model: this.model.get(paths[0]), prop: paths[1] };
                case 3: return { model: this.model.get(paths[0]).get(paths[1]), prop: paths[2] };
                case 4: return { model: this.model.get(paths[0]).get(paths[1]).get(paths[2]), prop: paths[3] };
                case 5: return { model: this.model.get(paths[0]).get(paths[1]).get(paths[2]).get(paths[3]), prop: paths[4] };
                default: throw 'AspicView _findPropertyByPath_(): too deep dependense - ' + paths.length;
            }
        },
		
        _twoWayBindingPropertyAndModel_: function ($els, options, selector) {
			var prop = this._findPropertyByPath_(options.withProperty),
				eventTypes = 'change';	
			
			// input -> model
			if ($els.is('input:text,textarea')) {
				eventTypes = 'change keypress keyup';
			}
			var updateModel = _.bind(function (ctx, $bindedEl, bindedProp, _options) {
				if (ctx._handlesEl_InptCtx != $bindedEl) {
					var val = this._getValueFromInput_($bindedEl);

					if (_options.adaptation && _options.adaptation.forProperty) {
						val = _options.adaptation.forProperty(val, $bindedEl);
					}
					ctx._handlesEl_mdlCtx = $bindedEl;
					bindedProp.model.set(bindedProp.prop, val);
					ctx._handlesEl_mdlCtx = false;				
				}
			}, this, this, $els, prop, options);
			this.$el.on(eventTypes, selector, updateModel);
			this._aspic_.bindedToView.push({
				eventTypes: eventTypes,
				selector: selector,
				handler: updateModel
			});					
					
			// model -> input
			var updateInput = _.bind(function (ctx, $bindedEl, _options, model, newVal) {
				if (ctx._handlesEl_mdlCtx != $bindedEl) {
					if (_options.adaptation && _options.adaptation.forInput) {
						newVal = _options.adaptation.forInput(newVal, $bindedEl);
					}
					
					ctx._handlesEl_InptCtx = $bindedEl;
					this._setValueToInput_($bindedEl, newVal);
					ctx._handlesEl_InptCtx = false;
				}
			}, this, this, $els, options);
			updateInput(prop.model, prop.model.get(prop.prop));
			prop.model.on('change:' + prop.prop, updateInput);
			this._aspic_.bindedToModel.push({
				model: prop.model, 
				eventType: 'change:' + prop.prop, 
				handler: updateInput
			});            
        },
		
        _bindPropertyWithElement_: function ($els, options) {
			var prop = this._findPropertyByPath_(options.withProperty);
			
			// model -> element
			var updateElement = _.bind(function (ctx, $bindedEl, model, newVal) {
				$bindedEl.html(newVal);
			}, this, this, $els);
			updateElement(prop.model, prop.model.get(prop.prop));
			prop.model.on('change:' + prop.prop, updateElement);
			this._aspic_.bindedToModel.push({
				model: prop.model, 
				eventType: 'change:' + prop.prop, 
				handler: updateElement
			});            
        },
		
        _bindMethodWithElement_: function ($els, options) {
			var props = this._findPropertiesByPath_(options.dependencies),
				updateElement = _.bind(function (ctx) {
					$els.html(ctx[options.withFunction]());
				}, this, this);
			$els.html(this[options.withFunction]());
					
			for (var i = 0, ii = props.length; i < ii; i++) {
				props[i].model.on('change:' + props[i].prop, updateElement);
				this._aspic_.bindedToModel.push({
					model: props[i].model, 
					eventType: 'change:' + props[i].prop, 
					handler: updateElement
				});						
			}            
        },
		
		_setValueToInput_: function($els, val){
			if(!$.isArray(val)){
				val = [val];
			}
			
			$els
				.val(val)
				.change();
		},

		_getValueFromInput_: function($el){
			var elType = $el.attr('type');
			if(elType == 'radio'){
				$el = $el.filter(':checked');
			}
			return $el.val();
		}
	});
	
	
	Backbone.AspicCheckboxAdaptation = {
		forInput: function (newPropertyVal, $inputEl) {
			var result = false;
			if(newPropertyVal){
				result = $inputEl.val();
			}
			return result;
		},
		forProperty: function (newInputVal) {
			return newInputVal !== false;
		}
	};
	
	Backbone.AspicMultiselectAdaptation = {
		forProperty: function (newInputVal) {
			return newInputVal || [];
		}
	};	