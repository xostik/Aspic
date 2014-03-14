assert = chai.assert;
should = chai.should();
expect = chai.expect;

mocha.setup('bdd');

describe('Aspic', function() {
    describe('AspicModel (access to properties)', function () {

        var Point, Line, pointInstance, lineInstance;

        before(function () {
            Point = Backbone.AspicModel.extend({
				defaults: {
					x: 5,
					y: 5
				}
			});
			
			Line = Backbone.AspicModel.extend({
				defaults: {
					p1: new Point({ x: 1, y: 2 }),
					p2: new Point()
				}
			});
			
			pointInstance = new Point({ x: 1 });
			lineInstance = new Line();
        });

        it('First level model', function () {
			expect( pointInstance.x() ).to.equal(1);
			expect( pointInstance.y() ).to.equal(5);
			expect( pointInstance.y(10) ).to.equal( pointInstance );
			expect( pointInstance.y() ).to.equal(10);
        });

		it('Nested model', function () {			
			expect( lineInstance.p1().y() ).to.equal(2);
			expect( lineInstance.p1().y(15) ).to.equal( lineInstance.p1() );
			expect( lineInstance.p1().y() ).to.equal(15);
        });
    });

	// ==========================================================
	
    describe('Simple AspicView', function () {
        var Point, Line, lineInstance, LineView, lineViewInstance;

		function initModelPrepareData(){
            Point = Backbone.AspicModel.extend({
				defaults: {
					x: 5,
					y: 5
				}
			});
			
			Line = Backbone.AspicModel.extend({
				defaults: {
					p1: new Point({ x: 1, y: 2 }),
					p2: new Point(),
					checkbox: 'someval',
					checkbox2: true,
					browser: 'firefox',
					single: 's2',
					multiple: ['m2'],
					comment: 'some text'
				}
			});
			
			lineInstance = new Line();	
		}
		
		function initViewPrepareData(){
			LineView = Backbone.AspicView.extend({
				el: $('#tmp').get(0),
				
				bindings: {
					'#inp': {
						withProperty: 'p1.x'
					},
					
					'.lenOfLine .val': {
						withFunction: 'lenOfLine',
						dependencies: 'p1.x, p1.y, p2.x, p2.y'
					},

					'.x1-adapted': {
					    withFunction: 'x1Info',
					    dependencies: 'p1.x'
					},
					
					'input[name=browser]':{
						withProperty: 'browser'
					},
					
					'input[name=somecheckbox]':{
						withProperty: 'checkbox'
					},					

					'input[name=somecheckbox2]':{
						withProperty: 'checkbox2',
						adaptation: Backbone.AspicCheckboxAdaptation
					},
					
					'#multiple':{
						withProperty: 'multiple',
						adaptation: Backbone.AspicMultiselectAdaptation
					},

					'#single':{
						withProperty: 'single'
					},

					'textarea':{
						withProperty: 'comment'
					}
				},
				
				lenOfLine: function() {
					var deltaX = Math.pow(this.model.p1().x() - this.model.p2().x(), 2),
						deltaY = Math.pow(this.model.p1().y() - this.model.p2().y(), 2);
					return Math.sqrt( deltaX + deltaY );
				},

				x1Info: function () {
				    return 'x1 is ' + this.model.p1().x();
				}
			});

			lineViewInstance = new LineView({ model: lineInstance });	
		}
		
        before(function () {
			initModelPrepareData();
        });

		it('Model state before init view', function () {
			expect(lineInstance.p1()._events).to.be.undefined;
        });
		
		it('Model state after init view', function () {
			initViewPrepareData();
			expect(lineInstance.p1()._events['change:x'].length).to.equal(3);
			expect(lineInstance.p1()._events['change:y'].length).to.equal(1);
        });

        it('Bind model property with container element', function () {
			expect($('#inp').val()).to.equal('1');
        });

        it('Bind model method with container element', function () {
            expect($('.x1-adapted').html()).to.equal('x1 is 1');
        });
		
        it('Bind model property with radio element', function () {
            expect($('input[name=browser]:checked').val()).to.equal('firefox');
			
			lineInstance.browser('opera');
            expect($('input[name=browser]:checked').val()).to.equal('opera');
			
			$('input[name=browser][value=firefox]').prop('checked', true).change();	
			expect(lineInstance.browser()).to.equal('firefox');			
        });	

        it('Bind model property with checkbox element', function () {
            expect($('input[name=somecheckbox]').prop('checked')).to.be.true;
			
			lineInstance.checkbox(false);
            expect($('input[name=somecheckbox]').prop('checked')).to.be.false;
			
			$('input[name=somecheckbox]').prop('checked', true).change();	
			expect(lineInstance.checkbox()).to.equal('someval');		
        });			
		
        it('Adapted bind model property with checkbox element', function () {
            expect($('input[name=somecheckbox2]').prop('checked')).to.be.true;
			
			lineInstance.checkbox2(false);
            expect($('input[name=somecheckbox2]').prop('checked')).to.be.false;
			
			$('input[name=somecheckbox2]').prop('checked', true).change();	
			expect(lineInstance.checkbox2()).to.be.true;		
        });	

		it('Bind model property with select element', function () {
            expect($('#single').val()).to.equal('s2');
			
			lineInstance.single('s1');
            expect($('#single').val()).to.equal('s1');
			
			$('#single').val('s2').change();	
			expect(lineInstance.single()).to.equal('s2');		
        });			
		
		it('Adapted bind model property with multiselect element', function () {
			expect($('#multiple').val()).to.be.a('array');
            expect($('#multiple').val().join(' ')).to.equal('m2');
			
			lineInstance.multiple([]);
            expect($('#multiple').val()).to.be.a('null');
			
			$('#multiple').val(['m1', 'm3']).change();	
			expect(lineInstance.multiple().join(' ')).to.equal('m1 m3');		
        });	
		
		it('Bind model property with textarea', function () {
            expect($('textarea').val()).to.equal('some text');
			
			lineInstance.comment('ups text');
			expect($('textarea').val()).to.equal('ups text');
			
			$('textarea').val('txt').change();	
			expect(lineInstance.comment()).to.equal('txt');		
        });	
		
		it('Model state after remove view', function () {
			lineViewInstance.remove();
			expect(lineInstance.p1()._events['change:x']).to.be.undefined;
			expect(lineInstance.p1()._events['change:y']).to.be.undefined;
        });

    });
});