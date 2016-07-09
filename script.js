'use strict';

var cvs;
var ctx;
var sqsize;
var players = [];
var grid = {lx: 0, ly: 0, ux: 20, uy:20};
var numbers = [
    "One", "Two", "Three", "Four", "Five"
]
var cplayer;
var coords;
var ismoving;
var ptsize = .3;

function init() {
    cvs = document.getElementById('cvs');
    ctx = cvs.getContext('2d');

    cvs.addEventListener('mousedown',domousedown);
    cvs.addEventListener('mousemove',domousemove);
    cvs.addEventListener('mouseup',domouseup);

    var ctrls = document.querySelectorAll('.accelerate');
    for (var i = 0; i < ctrls.length; i++) {
	ctrls[i].addEventListener('click',setAcceleration);
    }
    
    var colours = [
	'#f00',
	'#0f0',
    ];
    for (var i=0; i < 2; i++) {
	players.push(new Player(15+i,colours[i], "Player " + numbers[i]));
    }
    setSize();
    drawGrid();
    
    for (var i=0; i < players.length; i++) {
	players[i].drawCar();
    }
    cplayer = 0;
    setControls();
}

function setControls() {
    var name = document.getElementById('playerName');
    name.innerHTML = players[cplayer].getName();
}

function setAcceleration(e) {
    var x = parseInt(e.currentTarget.dataset.x);
    var y = parseInt(e.currentTarget.dataset.y);
    players[cplayer].update(x,y);
    nextPlayer();
}

function nextPlayer() {
    cplayer += 1;
    if (cplayer == players.length) {
	for (var i = 0; i < players.length; i++) {
	    players[i].drawTrajectory();
	}
	cplayer = 0;
	checkSize();
    }
    setControls();
}

function setSize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var bdy = document.querySelector('body');
    var s = window.getComputedStyle(bdy);
    w -= parseFloat(s.marginLeft) + parseFloat(s.marginRight);
    h -= parseFloat(s.marginTop) + parseFloat(s.marginBottom);
    cvs.width = w;
    cvs.height = h;
    var dv = document.getElementById('track');
    dv.style.width = w + 'px';
    dv.style.height = h + 'px';
    w /= grid.ux - grid.lx + 1;
    h /= grid.uy - grid.ly + 1;
    sqsize = Math.min(w,h);
}

function drawGrid() {
    var w = sqsize*(grid.ux - grid.lx + .5);
    var h = sqsize*(grid.uy - grid.ly + .5);
    ctx.strokeStyle = '#ccc';
    ctx.beginPath();
    for (var i = 0; i <= grid.ux - grid.lx; i++) {
	ctx.moveTo((i + .5)*sqsize,.5*sqsize);
	ctx.lineTo((i + .5)*sqsize,h);
    }
    for (var i = 0; i <= grid.uy - grid.ly; i++) {
	ctx.moveTo(.5*sqsize,(i + .5)*sqsize);
	ctx.lineTo(w,(i + .5)*sqsize);
    }
    ctx.stroke();
}

function reset() {
    clear();
    for (var i = 0; i < players.length; i++) {
	players[i].reset();
    }
    cplayer = 0;
    drawGrid();
}

function checkSize() {
    var redo = false;
    var lx,ly,ux,uy;
    lx = grid.lx;
    ly = grid.ly;
    ux = grid.ux;
    uy = grid.uy;
    for (var i = 0; i < players.length; i++) {
	if (players[i].getX() < lx) {
	    redo = true;
	    lx = players[i].getX();
	}
	if (players[i].getX() > ux) {
	    redo = true;
	    ux = players[i].getX();
	}
	if (players[i].getY() < ly) {
	    redo = true;
	    ly = players[i].getY();
	}
	if (players[i].getY() > uy) {
	    redo = true;
	    uy = players[i].getY();
	}
    }
    if (redo) {
	grid.lx = lx;
	grid.ly = ly;
	grid.ux = ux;
	grid.uy = uy;
	var w = Math.ceil((ux - lx + 1) * sqsize);
	var h = Math.ceil((uy - ly + 1) * sqsize);
	cvs.width = w;
	cvs.height = h;
	drawGrid();
	for (var i = 0; i < players.length; i++) {
	    players[i].redraw();
	}
    }
}

function transformCoordinates(x,y) {
    var h = cvs.height;
    if (x.x) {
	y = x.y;
	x = x.x;
    }
    return {x: (x - grid.lx + .5)*sqsize, y: h - (y - grid.ly + .5)*sqsize }
}

function domousedown(e) {
    var c = getRelativeCoords(e);
    coords = {x: c.x, y: c.y};
    ismoving = true;
}

function domouseup(e) {
    ismoving = false;
}

function domousemove(e) {
    if (ismoving) {
	var c = getRelativeCoords(e);
	var m = window.getComputedStyle(cvs);
	var x = parseFloat(m.left);
	var y = parseFloat(m.top);
	x = x + c.x - coords.x;
	y = y + c.y - coords.y;
	cvs.style.left = x + 'px';
	cvs.style.top = y + 'px';
    }
}

function getRelativeCoords(event) {
    if (event.offsetX !== undefined && event.offsetY !== undefined) { return { x: event.offsetX, y: event.offsetY }; }
    return { x: event.layerX, y: event.layerY };
}


window.addEventListener('load',init,false);

function clear(c) {
    var w = c.canvas.width;
    var h = c.canvas.height;
    c.save()
    c.setTransform(1,0,0,1,0,0);
    c.clearRect(0,0,w,h);
    c.restore();
}

var Player = function(x,c,n) {
    this.velocity = {x: 0, y: 0};
    this.position = {x: x, y: 0};
    this.original = {x: x, y: 0};
    this.path = [{x: x, y: 0}];
    this.colour = c;
    this.name = n;
}

Player.prototype.reset = function() {
    this.velocity = {x: 0, y: 0};
    this.position = {x: this.original.x, y: this.original.y};
    this.path = [{x: this.original.x, y: this.original.y}];
}

Player.prototype.update = function(x,y) {
    this.velocity.x += x;
    this.velocity.y += y;
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.path.push({x: this.position.x, y: this.position.y});
}

Player.prototype.getX = function() {
    return this.position.x;
}

Player.prototype.getY = function() {
    return this.position.y;
}

Player.prototype.getName = function() {
    return this.name;
}

Player.prototype.drawCar = function() {
    var c = transformCoordinates(this.position);
    ctx.fillStyle = this.colour;
    ctx.beginPath();
    ctx.moveTo(c.x,c.y);
    ctx.arc(c.x,c.y,ptsize*sqsize,0,2*Math.PI);
    ctx.fill();
}

Player.prototype.drawTrajectory = function() {
    var c = transformCoordinates(this.position);
    var p = transformCoordinates(this.path[this.path.length - 2]);
    ctx.strokeStyle = this.colour;
    ctx.lineWidth = "2px";
    ctx.beginPath();
    ctx.moveTo(p.x,p.y);
    ctx.lineTo(c.x,c.y);
    ctx.stroke();
    this.drawCar();
}

Player.prototype.redraw = function() {
    var p = transformCoordinates(this.path[0]);
    ctx.strokeStyle = this.colour;
    ctx.lineWidth = "2px";
    ctx.beginPath();
    ctx.moveTo(p.x,p.y);
    for (var i = 1; i < this.path.length; i++) {
	p = transformCoordinates(this.path[i]);
	ctx.lineTo(p.x,p.y);
    }
    ctx.stroke();
    ctx.fillStyle = this.colour;
    ctx.beginPath();
    for (var i = 0; i < this.path.length; i++) {
	p = transformCoordinates(this.path[i]);
	ctx.moveTo(p.x,p.y);
	ctx.arc(p.x,p.y,ptsize*sqsize,0,2*Math.PI);
    }
    ctx.fill();
}
