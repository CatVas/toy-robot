jQuery(function($){
/*--- DATA (CONFIG) ---*/

	var CONFIG = {
		xMax: 4,
		xMin: 0,
		yMax: 4,
		yMin: 0,
		f: {
			North: {name: 'North', sign: String.fromCharCode(8593)},
			East: {name: 'East', sign: String.fromCharCode(8594)},
			South: {name: 'South', sign: String.fromCharCode(8595)},
			West: {name: 'West', sign: String.fromCharCode(8592)}
		}
	};

	// Min/max allowed values of X and Y on the tabletop
	$('.f-place [name="robotPlaceX"]').attr('max', CONFIG.xMax);
	$('.f-place [name="robotPlaceX"]').attr('min', CONFIG.xMin);
	$('.f-place [name="robotPlaceY"]').attr('max', CONFIG.yMax);
	$('.f-place [name="robotPlaceY"]').attr('min', CONFIG.yMin);

	// Dropdown select list of the world sides
	(function(){
		var option;
		var value;
		var select = $('.f-place [name="robotPlaceFacing"]');

		for(var worldSide in CONFIG.f){
			option = $('<option>');
			value = CONFIG.f[worldSide].name;

			option.attr('value', value).text(value).appendTo(select);
		}
	})();


/*--- MODEL ---*/

	/* Tabletop
	 * {param} numeric countX - how much cells are there horisontally;
	 * {param} numeric countY - how much cells are there vertically;
	 * {param} root - an element-container for cells (DOM, class or id).
	*/
	function TableTop(countX, countY, root){
		this._countX = parseInt(countX);
		this._countY = parseInt(countY);
		this._root = root;

		if(typeof this._countX !== 'number'){
			throw new Error('countX must be numeric');
		}
		if(typeof this._countY !== 'number'){
			throw new Error('countY must be numeric');
		}
	}

	// Check if the cell with such coordinates does exist
	TableTop.prototype.checkPlace = function(x, y){
		x = parseInt(x);
		y = parseInt(y);

		if(typeof x !== 'number'){
			throw new Error('The "x" value must be numeric');
		}
		if(x < CONFIG.xMin || x > this._countX - 1){
			throw new Error('The "x" value is outside the tabletop');
		}

		if(typeof y !== 'number'){
			throw new Error('The "y" value must be numeric');
		}
		if(y < CONFIG.yMin || y > this._countY - 1){
			throw new Error('The "y" value is outside the tabletop');
		}

		return true;
	}

	// Root element, where to bind the Tabletop cells
	TableTop.prototype.getRoot = function(){
		return this._root;
	}

	// Draws the tabletop on the screen
	TableTop.prototype.draw = function(){
		var li;

		for(var i = 0; i < this._countX * this._countY; i++){
			li = $('<li>');

			if(i < this._countX){
				li.addClass('tabletop-tc');
			}
			if(i > 0 && i % (this._countX) === 0){
				li.addClass('tabletop-nl');
			}

			$( this.getRoot() ).append(li);
		}
	}

	// Paint the cell and write a facing sign (arrow) inside
	TableTop.prototype.paintCell = function(x, y, f){
		var r = (CONFIG.yMax + CONFIG.yMin) - y;
		var cellNumber = x + r * (CONFIG.xMax - CONFIG.xMin + 1);

		$(this._root).children('.tabletop-robot').removeClass('tabletop-robot').text('');
		$(this._root).children().eq(cellNumber).addClass('tabletop-robot').text(CONFIG.f[f].sign);
	}

	/*
	 * Robot
	 * {param} number x - the tabletop X coordinate;
	 * {param} number y - the tabletop Y coordinate;
	 * {param} array facing - robot's moving direction. Only 4 values: 'NORTH', 'SOUTH', 'EAST', 'WEST';
	*/
	function Robot(){
		this._x;
		this._y;
		this._facing;
		this._tabletop;
	}

	// Rotate the robot 90 degrees left/right
	Robot.prototype.rotate = function(toRight){
		// Check if robot is placed
		if(!this._tabletop){
			alert('Cannot rotate: Robot is not placed');
			console.log('Cannot rotate: Robot is not placed');
			return false;
		}

		toRight = !!toRight;

		// Change the robot facing
		switch(this._facing){
			case CONFIG.f.North.name:
				this._facing = toRight ? CONFIG.f.East.name : CONFIG.f.West.name;
			break;

			case CONFIG.f.East.name:
				this._facing = toRight ? CONFIG.f.South.name : CONFIG.f.North.name;
			break;

			case CONFIG.f.South.name:
				this._facing = toRight ? CONFIG.f.West.name : CONFIG.f.East.name;
			break;

			case CONFIG.f.West.name:
				this._facing = toRight ? CONFIG.f.North.name : CONFIG.f.South.name;
			break;
		}

		this.place(this._tabletop, this._x, this._y, this._facing);
	}

	// Place the robot in a point (x, y) facing to "f".
	Robot.prototype.place = function(tabletop, x, y, f){
		var x = parseInt(x) || 0;
		var y = parseInt(y) || 0;

		try{
			tabletop.checkPlace(x, y);
			this._x = x;
			this._y = y;
			this._facing = f || CONFIG.f.North.name;
			this._tabletop = tabletop;
			tabletop.paintCell(this._x, this._y, f);

			return true;
		}
		catch(e){
			console.log('Bad robot placing: ' + e.message + '\n\n' + e.stack);
			return false;
		}
	}

	// Move
	Robot.prototype.move = function(){
		// Check if robot is placed
		if(!this._tabletop){
			alert('Cannot move: Robot is not placed');
			console.log('Cannot move: Robot is not placed');
			return false;
		}

		var x = this._x;
		var y = this._y;

		// Check facing and if the next cell is available.
		switch(this._facing){
			case CONFIG.f.North.name:
				++y;
			break;

			case CONFIG.f.East.name:
				++x;
			break;

			case CONFIG.f.South.name:
				--y;
			break;

			case CONFIG.f.West.name:
				--x;
			break;
		}

		this.place(this._tabletop, x, y, this._facing);
	}

	// Report
	Robot.prototype.report = function(){
		return this._tabletop
				? (this._x + ', ' + this._y + ', ' + this._facing)
				: '[Report]: Robot is not placed';
	}


/*--- CONTROLLER ---*/
	// Initialization
	var tableTop = new TableTop(CONFIG.xMax + 1, CONFIG.yMax + 1, '#js-tabletop');
	tableTop.draw();

	var robot = new Robot();

	// Placing the robot
	$('.f-place').submit(function(ev){
		ev.preventDefault();

		var x = +this.elements.robotPlaceX.value;
		var y = +this.elements.robotPlaceY.value;
		var f = this.elements.robotPlaceFacing.value;

		//console.log('X: ' + x + '; Y = ' + y + '; F = ' + f);
		robot.place(tableTop, x, y, f);
	});

	// Actions
	$('.controls-actions .btn').click(function(ev){
		var th = $(this);

		if( th.hasClass('js-controls-actions-move') ){
			robot.move();
		}
		else if( th.hasClass('js-controls-actions-left') ){
			robot.rotate(false);
		}
		else if( th.hasClass('js-controls-actions-right') ){
			robot.rotate(true);
		}
		else if( th.hasClass('js-controls-actions-report') ){
			var report = robot.report();

			console.log(report);
			alert(report);
		}
	});

});