'use strict';

var cvs;
var ctx;
var sqsize;
var players = [];
var grid = {x: 20, y:20};
var numbers = [
    "One", "Two", "Three", "Four", "Five"
]
var cplayer;

function init() {
    cvs = document.getElementById('cvs');
    ctx = cvs.getContext('2d');

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
    sqsize = Math.min(w/grid.x,h/grid.y);
}

function drawGrid() {
    var w = sqsize*grid.x;
    var h = sqsize*grid.y;
    ctx.strokeStyle = '#ccc';
    ctx.beginPath();
    for (var i = 0; i <= grid.x; i++) {
	ctx.moveTo(i*sqsize,0);
	ctx.lineTo(i*sqsize,h);
    }
    for (var i = 0; i <= grid.y; i++) {
	ctx.moveTo(0,i*sqsize);
	ctx.lineTo(w,i*sqsize);
    }
    ctx.stroke()
}

function reset() {
    clear();
    for (var i = 0; i < players.length; i++) {
	players[i].reset();
    }
    cplayer = 0;
    drawGrid();
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
    this.previous = {x: x, y: 0};
    this.colour = c;
    this.name = n;
}

Player.prototype.reset = function() {
    this.velocity = {x: 0, y: 0};
    this.position = {x: this.original.x, y: this.original.y};
    this.previous = {x: x, y: 0};
}

Player.prototype.update = function(x,y) {
    this.velocity.x += x;
    this.velocity.y += y;
    this.previous.x = this.position.x;
    this.previous.y = this.position.y;
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
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
    var h = cvs.height;
    ctx.fillStyle = this.colour;
    ctx.beginPath();
    ctx.moveTo(this.position.x*sqsize,h - this.position.y*sqsize);
    ctx.arc(this.position.x*sqsize,h - this.position.y*sqsize,.3*sqsize,0,2*Math.PI);
    ctx.fill();
}

Player.prototype.drawTrajectory = function() {
    var h = cvs.height;
    ctx.strokeStyle = this.colour;
    ctx.lineWidth = "2px";
    ctx.beginPath();
    ctx.moveTo(this.previous.x*sqsize,h - this.previous.y*sqsize);
    ctx.lineTo(this.position.x*sqsize,h - this.position.y*sqsize);
    ctx.stroke();
    this.drawCar();
}
