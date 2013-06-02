var socket = io.connect('http://localhost');
socket.on('con_status', function (data) {
	console.log(data.msg);
});
socket.on('user_status', function (data) {
	console.log(data.user + ":" + data.msg);
});
socket.on('move', function(data){
	//console.log("x: " + data.x + " y: " + data.y);
});
(function(){
	window.requestAnimFrame = (function(callback) {
	return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
	function(callback) {
		window.setTimeout(callback, 1000 / 60);
	};
})();

var lastTime;
var running = false;
//var accmag = 0.1;
var rangeLim = 1000;
var dtmag = 1;
var eventStore = {};
var orbs = [];
var blocks = [];
var canvas = document.getElementById('myCanvas');
var context = canvas.getContext('2d');
var orbsDestroyedCount = 0;
var prevTime;

var spriteImg = new Image();
spriteImg.src = "game-sprite.png";
spriteImg.onload = function() {

};

var spriteArr = {
	black : {
		xMin : 2,
		yMin : 2,
		width : 20,
		height : 20
	}
};

function pre(){
	context.clearRect(0, 0, canvas.width, canvas.height);

	context.beginPath();
	context.rect(300, 300, 300, 150);
	context.fillStyle = '#777777';
	context.fill();

	context.fillStyle = '#f00';
	context.font = 'italic bold 30px sans-serif';
	context.textBaseline = 'bottom';
	context.fillText("Start", 375, 350);

	canvas.addEventListener('click', function(event){
		if(event.clientX < 600 && event.clientX > 300 && event.clientY < 450 && event.clientY > 300)
			init();
	});
}
function drawOrbs(orb, context)
{
	context.drawImage(spriteImg,
						orb.imgSprite.xMin,
						orb.imgSprite.yMin,
						orb.imgSprite.width,
						orb.imgSprite.height,
						orb.x - orb.imgSprite.width / 2,
						orb.y - orb.imgSprite.height / 2,
						orb.imgSprite.width,
						orb.imgSprite.height);
	/*context.beginPath();
				//context.rect(orb.x, orb.y, orb.width, orb.height);
	context.arc(orb.x, orb.y, orb.radius , 0 , 2*Math.PI);
	context.fillStyle = '#8ED6FF';
	context.fill();*/
	/*context.lineWidth = orb.borderWidth;
	context.strokeStyle = 'black';
	context.stroke();*/
}
function drawBlocks(block, context)
{
	context.beginPath();
	context.rect(block.x, block.y, block.width, block.height);
	context.fillStyle = '#777777';
	context.fill();
}
function once(orbs, canvas, context, event)
{
	for(var x in orbs){
		var orb = orbs[x];
		eventStore.clientX = event.clientX;
		eventStore.clientY = event.clientY;
	}
	if(!running){
		running = true;
		animate(orbs, canvas, context, eventStore);
	}
	socket.emit('move',{x: event.clientX, y: event.clientY});
}
function init()
{
	orbs.push(new Orb(0.15));
	blocks.push(new Block());
	for(var x in orbs)
		drawOrbs(orbs[x], context);
	for(var x in blocks)
		drawBlocks(blocks[x], context);

	prevTime = Date.now();
	canvas.addEventListener('mousemove',function(event){
		once(orbs, canvas, context, event);
	},false);
}
function detectCollision(block, orb, context)
{
	var orbMinX = orb.x - orb.radius;
	var orbMaxX = orb.x + orb.radius;
	var orbMinY = orb.y - orb.radius;
	var orbMaxY = orb.y + orb.radius;

	var xMax = Math.max(block.x, orbMinX);
	var xMin = Math.min(block.x + block.width, orbMaxX);
	var yMax = Math.max(block.y, orbMinY);
	var yMin = Math.min(block.y + block.height, orbMaxY);

	/*if(xMin < xMax || yMin < yMax)
		return false;*/
	if(xMin >= xMax && yMin >= yMax){
		return true;															// Turning off per pixel detection for now
		/*xMin = Math.floor(Math.min(block.x, orbMinX));
		xMax = Math.floor(Math.max(block.x + block.width, orbMaxX));
		yMin = Math.floor(Math.min(block.y, orbMinY));
		yMax = Math.floor(Math.max(block.y + block.height, orbMaxY));*/
		xMin = Math.floor(block.x);
		xMax = Math.floor(block.x + block.width);
		yMin = Math.floor(block.y);
		yMax = Math.floor(block.y + block.height);
		/*xMin = Math.floor(orb.x - orb.radius);
		xMax = Math.floor(orb.x + orb.radius);
		yMin = Math.floor(orb.y - orb.radius);
		yMax = Math.floor(orb.y + orb.radius);*/
		//context.clearRect(0, 0, canvas.width, canvas.height);
		var imageData = context.getImageData(xMin,yMin,xMax - xMin, yMax - yMin);
		var pixels = imageData.data;
		for(var x = 1; x <= xMax - xMin; ++x){
			for(var y = 1; y <= yMax - yMin; ++y){
				var pixelRedIndex = ((y - 1) * (imageData.width * 4)) + ((x - 1) * 4);
				var pixelcolor = "rgba("+pixels[pixelRedIndex]+", "+pixels[pixelRedIndex+1]+", "+pixels[pixelRedIndex+2]+", "+pixels[pixelRedIndex+3]+")";
				if(pixels[pixelRedIndex+2] === 255)
					return true;
			}
		}
	}
	return false;
}
function animate(orbs, canvas, context, event)
{
	var now = Date.now();
    var dt = (now - prevTime) / 10.0;
    dt = dt * dtmag;
	// update
	if(lastTime !== undefined){
		lastTime = undefined;
		running = false;
		return;
	}
	context.clearRect(0, 0, canvas.width, canvas.height);
	/*context.beginPath();
				//context.rect(orb.x, orb.y, orb.width, orb.height);
	context.arc(event.clientX, event.clientY, 10 , 0 , 2*Math.PI);
	context.fillStyle = '#00FF00';
	context.fill();
	context.lineWidth = 1;
	context.strokeStyle = 'black';
	context.stroke();*/
	for (var yBlock in blocks){
		var block = blocks[yBlock];
		drawBlocks(block, context);
		for(var xOrb in orbs){
			var tempOrb = orbs[xOrb];
			drawOrbs(tempOrb, context);
			if(detectCollision(block, tempOrb, context)){
				orbs.splice(xOrb, 1);
				block.animateCollision();
				++orbsDestroyedCount;
			}
		}
	}

	for(var x in orbs){
		var orb = orbs[x];
		var diffX = event.clientX - orb.x;
		// diffX = diffX * diffX / 1000;
		var diffY = event.clientY - orb.y;
		// diffY = diffY * diffY / 1000;
		var diffXY2 = (Math.pow((Math.pow(diffX,2) + Math.pow(diffY,2)),0.5));
		orb.acceleration.x = diffX / diffXY2 * orb.accmag;
		orb.acceleration.y = diffY / diffXY2 * orb.accmag;
		var diffVelXY2 = (Math.pow((Math.pow(orb.velocity.x,2) + Math.pow(orb.velocity.y,2)),0.5));
		/*orb.acceleration.x = orb.acceleration.x * diffXY2 / diffVelXY2;
		orb.acceleration.y = orb.acceleration.y * diffXY2 / diffVelXY2;*/
		//var magDiff = (Math.pow((rangeLim - (diffXY2 * diffXY2)/rangeLim),2)/Math.pow(rangeLim,2));
		//var magDiff = (Math.pow((rangeLim - diffXY2),2)/Math.pow(rangeLim,2));
		var magDiff = (rangeLim - diffXY2)/rangeLim;
		orb.acceleration.x = orb.acceleration.x * magDiff;
		orb.acceleration.y = orb.acceleration.y * magDiff;
		orb.acceleration.x = orb.acceleration.x * (1 + Math.abs(rangeLim - (event.clientY - orb.y))/rangeLim);
		orb.acceleration.y = orb.acceleration.y * (1 + Math.abs(rangeLim - (event.clientX - orb.x))/rangeLim);
		orb.velocity.x = orb.velocity.x + orb.acceleration.x*dt;
		orb.velocity.y = orb.velocity.y + orb.acceleration.y*dt;
		var newVel = (Math.pow((Math.pow(orb.velocity.x,2) + Math.pow(orb.velocity.y,2)),0.5));
		if(newVel < diffVelXY2){
			orb.accmag = orb.accmag + 0.003;
		}
		else {
			orb.accmag = orb.staticAccmag;
		}
		orb.x = orb.x + orb.velocity.x*dt;
		orb.y = orb.y + orb.velocity.y*dt;
		var diffnewXY2 = (Math.pow((Math.pow(event.clientX - orb.x,2) + Math.pow(event.clientY - orb.y,2)),0.5));
		if(Math.abs(diffXY2 - diffnewXY2) < 0.1){
			orb.velocity.x = orb.velocity.x * 0.95;
			orb.velocity.y = orb.velocity.y * 0.95;
		}
		else {

		}

		context.fillStyle = '#f00';
		context.font = 'italic bold 30px sans-serif';
		context.textBaseline = 'bottom';
		//var tempMag = Math.pow(Math.pow(orb.acceleration.x,2) + Math.pow(orb.acceleration.y,2) , 0.5);
		var tempMag = diffVelXY2;
		context.fillText(orbsDestroyedCount, 50, 100);

	//console.log(orb.y + " " + event.clientY + " " + orb.x + " " + event.clientX);
		if(Math.abs(orb.y - event.clientY) < 5 && Math.abs(orb.x - event.clientX) < 5 ) {
			lastTime = true;
		}

		// draw
	}

	prevTime = now;
	// request new frame
	requestAnimFrame(function() {
		animate(orbs, canvas, context, event);
	});
}

function Orb(accmag)
{
	this.imgSprite = spriteArr.black;

	this.x = Math.random() * canvas.width;
	this.y = Math.random() * canvas.height;
	this.radius = 10;
	this.borderWidth = 1;
	this.velocity = {
		x : 1,
		y : 1
	};
	this.acceleration = {
		x : 1,
		y : 1
	};
	this.accmag = accmag;
	this.staticAccmag = this.accmag;
}
function Block()
{
	this.x = Math.random() * canvas.width;
	this.y = Math.random() * canvas.height;
	this.height = 30;
	this.width = 60;
	this.minheight = this.height / 2;
	this.minwidth = this.width / 2 ;

	this.animateCollision = function(){
		var initialHeight = this.height,
			initialWidth = this.width,
			currentBlock = this;
		var timeout;
		function animateB(){
			if(currentBlock.height < initialHeight * 0.8)
				window.clearInterval(timeout);
			else{
				currentBlock.height = currentBlock.height * 0.97;
				currentBlock.width = currentBlock.width * 0.97;
			}
		}
		timeout = window.setInterval(animateB, 60);
	};
}

function autoCreateOrbs()
{
	var createOrbFunc = window.setInterval(function (){
		orbs.push(new Orb(0.1));
	}, 5000);
}
function autoCreateBlocks()
{
	var block = new Block();
	var createBlockFunc = window.setInterval(function (){
		blocks.push(new Block());
	}, 5000);
}

var gravGame = {
	'init': init,
	'autoCreateBlocks': autoCreateBlocks,
	'autoCreateOrbs' : autoCreateOrbs,
	'orbs' : orbs,
	'setdtmag' : function(value){
		dtmag = value;
	},
	'Orb' : Orb
};

window.gravGame = gravGame;
//window.gravGame.init();
pre();
})();