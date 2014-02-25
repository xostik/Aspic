    Backbone.AspicModel = Backbone.Model.extend({              
        set: function (key, val, options) {
            var bb_set = Backbone.Model.prototype.set,
                result = bb_set.apply(this, arguments),
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
        constructor: function (options) {
            Backbone.View.apply(this, arguments);
                    
            if (this.bindings) {
                for (var k in this.bindings) {
                    if (this.bindings.hasOwnProperty(k)) {
                        this.bindWithField(k, this.bindings[k]);
                    }
                }
            }
        },
                
        bindWithField: function (selector, options) {
            var $els = this.$el.find(selector);
                    
            if (options.withProperty) {
                var prop = this.findPropertyByPath(options.withProperty),
                    eventTypes = 'change';
                if ($els.is('input,textarea,select')) {
                    // input -> model
                    if ($els.is('input:text,textarea')) {
                        eventTypes = 'change keypress keyup';
                    }
                    this.$el.on(eventTypes, selector, _.bind(function (ctx, $bindedEl, bindedProp, _options) {
                        var val = $bindedEl.val();
                                
                        if (_options.adaptation && _options.adaptation.forProperty) {
                            val = _options.adaptation.forProperty(val);
                        }
                        ctx._handlesEl = $bindedEl;
                        bindedProp.model.set(bindedProp.prop, val);
                        ctx._handlesEl = false;
                    }, this, this, $els, prop, options));
                            
                    // model -> input
                    var updateInput = _.bind(function (ctx, $bindedEl, _options, model, newVal) {
                        if (ctx._handlesEl != $bindedEl) {
                            if (_options.adaptation && _options.adaptation.forInput) {
                                newVal = _options.adaptation.forInput(newVal);
                            }
                            $bindedEl
                                .val(newVal)
                                .change();
                        }
                    }, this, this, $els, options);
                    updateInput(prop.model, prop.model.get(prop.prop));
                    prop.model.on('change:' + prop.prop, updateInput);
                } else {
                    // model -> element
                    var updateElement = _.bind(function (ctx, $bindedEl, model, newVal) {
                        if (ctx._handlesEl != $bindedEl) {
                            $bindedEl.html(newVal);
                        }
                    }, this, this, $els);
                    updateElement(prop.model, prop.model.get(prop.prop));
                    prop.model.on('change:' + prop.prop, updateElement);
                }
            } else {
                if (options.withFunction) {
                    var props = this.findPropertiesByPath(options.dependencies);
                    $els.html(this[options.withFunction]());
                            
                    for (var i = 0, ii = props.length; i < ii; i++) {
                        props[i].model.on('change:' + props[i].prop, _.bind(function (ctx) {
                            $els.html(ctx[options.withFunction]());
                        }, this, this));
                    }
                }
            }
        },
                
        findPropertiesByPath: function(pathString) {
            var results = [],
                separatedPaths = pathString.split(',');
            for (var i = 0, ii = separatedPaths.length; i < ii; i++) {
                results.push(
                    this.findPropertyByPath( $.trim(separatedPaths[i]) )
                );
            }
                    
            return results;
        },
                
        findPropertyByPath: function (pathString) {
            var paths = pathString.split('.');
            switch (paths.length) {
                case 1: return { model: this.model, prop: paths [0] };
                case 2: return { model: this.model.get(paths[0]), prop: paths[1] };
                case 3: return { model: this.model.get(paths[0]).get(paths[1]), prop: paths[2] };
                case 4: return { model: this.model.get(paths[0]).get(paths[1]).get(paths[2]), prop: paths[3] };
                case 5: return { model: this.model.get(paths[0]).get(paths[1]).get(paths[2]).get(paths[3]), prop: paths[4] };
                default: throw 'AspicView findPropertyByPath(): too deep dependense - ' + paths.length;
            }
        }
    });
