'use strict';

var cvs;
var ctx;
var sqsize;
var players = [];
var grid = {lx: 0, ly: 0, ux: 20, uy:20};
var track = [
];
var numbers = [
    "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen"
]
var cplayer;
var coords;
var ismoving;
var ptsize = .3;
var state = 0;

function init() {
    cvs = document.getElementById('cvs');
    ctx = cvs.getContext('2d');

    cvs.addEventListener('mousedown',domousedown);
    cvs.addEventListener('mousemove',domousemove);
    cvs.addEventListener('mouseup',domouseup);
    cvs.addEventListener('click',doclick);

    var ctrls = document.querySelectorAll('.accelerate');
    for (var i = 0; i < ctrls.length; i++) {
	ctrls[i].addEventListener('click',setAcceleration);
    }

    var gw = document.getElementById('gridWidth');
    gw.addEventListener('change',function(e) {
	grid.ux = parseInt(e.target.value);
    });
    var gh = document.getElementById('gridHeight');
    gh.addEventListener('change',function(e) {
	grid.uy = parseInt(e.target.value);
    });
    var gf = document.getElementById('gridFixed');
    gf.addEventListener('click',function(e) {
	grid.fixed = e.target.checked;
    });
    var pn = document.getElementById('numPlayers');
    pn.addEventListener('change',function(e) {
	var n = e.target.value;
	var tb = document.getElementById('playerNames');
	var ch = tb.children;
	if (ch.length < n) {
	    var tr, td, inp;
	    for (var k= ch.length; k < n; k++) {
		tr = document.createElement('tr');
		tb.appendChild(tr);
		td = document.createElement('td');
		td.innerHTML = 'Player ' + (k+1) + "'s name:";
		tr.appendChild(td);
		td = document.createElement('td');
		inp = document.createElement('input');
		inp.type = 'text';
		inp.id = 'playerName' + k;
		td.appendChild(inp);
		tr.appendChild(td);
	    }
	} else if (ch.length > n) {
	    var tr;
	    for (var k = ch.length - 1; k >= n; k--) {
		tr = ch[k];
		tb.removeChild(tr);
	    }
	}
    });
    var btn = document.getElementById('makeGrid');
    btn.addEventListener('click',setupGrid);
}

function setupGrid() {
    var frm = document.getElementById("setup");
    frm.style.display = "none";
    var trk = document.getElementById("track");
    trk.style.display = "block";
    var def = document.getElementById("define");
    def.style.display = "block";
    var dbtn = document.getElementById("startGame");
    dbtn.addEventListener('click',startGame);
    
    var tb = document.getElementById('playerNames');
    var ch = tb.children;
    
    var phi = (Math.sqrt(5)-1)/2;
    var name;
    if (grid.ux < ch.length + 6) {
	grid.ux = ch.length + 6;
    }
    var spos = grid.ux - ch.length - 3;
    for (var i=0; i < ch.length; i++) {
	name = ch[i].lastChild.lastChild.innerHTML;
	if (name == '') {
	    name = 'Player ' + i;
	}
	players.push(new Player(spos + i,hsl(phi * i,1,.5), "Player " + numbers[i]));
    }
    setSize();
    drawGrid();
}

function startGame() {
    var def = document.getElementById("define");
    def.style.display = "none";
    var acc = document.getElementById("acceleration");
    acc.style.display = "block";
    drawTrack();
    
    for (var i=0; i < players.length; i++) {
	players[i].drawCar();
    }
    cplayer = 0;
    setControls();
    state = 1;
}

function hsl(h,s,l) {
    h = (h - Math.floor(h))*6;
    var c = (1 - Math.abs(2*l-1))*s*255;
    var m = l*255 - c/2;
    var x = c*(1 - Math.abs(h%2 - 1));
    var r,g,b;
    if (h < 1) {
	r = c + m;
	g = x + m;
	b = m;
    } else if (h < 2) {
	r = x + m;
	g = c + m;
	b = m;
    } else if (h < 3) {
	r = m;
	g = c + m;
	b = x + m;
    } else if (h < 4) {
	r = m;
	g = x + m;
	b = c + m;
    } else if (h < 5) {
	r = x + m;
	g = m;
	b = c + m;
    } else {
	r = c + m;
	g = m;
	b = x + m;
    }
    var s = 'rgb(' + Math.floor(r) + ',' + Math.floor(g) + ',' + Math.floor(b) + ')';
    return s;
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
	checkTrack();
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
    ctx.lineWidth = 2;
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

function drawTrack() {
    var c;
    var cross = .2*sqsize;
    ctx.strokeStyle = '#00f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (var i = 0; i < track.length; i++) {
	if (track[i].inside) {
	    c = transformCoordinates(track[i]);
	    ctx.save();
	    ctx.translate(c.x,c.y);
	    ctx.moveTo(cross,cross);
	    ctx.lineTo(-cross,-cross);
	    ctx.moveTo(-cross,cross);
	    ctx.lineTo(cross,-cross);
	    ctx.restore();
	}
    }
    ctx.stroke();
    ctx.strokeStyle = '#f00';
    ctx.beginPath();
    for (var i = 0; i < track.length; i++) {
	if (!track[i].inside) {
	    c = transformCoordinates(track[i]);
	    ctx.save();
	    ctx.translate(c.x,c.y);
	    ctx.moveTo(cross,cross);
	    ctx.lineTo(-cross,-cross);
	    ctx.moveTo(-cross,cross);
	    ctx.lineTo(cross,-cross);
	    ctx.restore();
	}
    }
    ctx.stroke();
}

function checkTrack() {
    var p,t;
    var i,j,k;
    var s,w,u;
    w = [];
    for (i = 0; i < players.length; i++) {
	p = players[i].getPath();
	t = [];
	for (k = 0; k < track.length; k++) {
	    t.push(0);
	}
	for (j = 1; j < p.length; j++) {
	    for (k = 0; k < track.length; k++) {
		if ( (p[j].y - track[k].y) * (track[k].y - p[j-1].y) > 0 || (track[k].y == p[j].y && track[k].y != p[j-1].y) ) {
		    u = (p[j].y - track[k].y)/(p[j].y - p[j-1].y);
		    if ( (1 - u) * p[j].x + u * p[j-1].x > track[k].x ) {
			t[k]++;
		    }
		}
	    }
	}
	s = true;
	for (k = 0; k < track.length; k++) {
	    if ( (track[k].inside && t[k]%2 == 0) || (!track[k].inside && t[k]%2 == 1) ) {
		s = false;
		break;
	    }
	}
	if (s) {
	    w.push(i);
	}
    }
    if (w.length > 0) {
	var dv = document.getElementById('winners');
	dv.style.display = 'inline-block';
	var msg;
	if (w.length == 1) {
	    msg = "The winner is " + players[w[0]].getName();
	} else {
	    msg = "The winners are ";
	    for (i = 0; i < w.length - 2; i++) {
		msg += players[w[i]].getName() + ", ";
	    }
	    i = w.length - 2;
	    msg += players[w[i]].getName() + " and " + players[w[i+1]].getName();
	}
	dv.innerHTML = msg;
	var style = window.getComputedStyle(dv);
	var ww = window.innerWidth;
	var wh = window.innerHeight;
	dv.style.left = (ww/2 - parseFloat(style.width)/2) + 'px';
	dv.style.top = (wh/2 - parseFloat(style.height)/2) + 'px';
    }
}

function reset() {
    clear(ctx);
    for (var i = 0; i < players.length; i++) {
	players[i].reset();
    }
    cplayer = 0;
    drawGrid();
    drawTrack();
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
	drawTrack();
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

function doclick(e) {
    if (state != 0) {
	return;
    }
    var c = getRelativeCoords(e);
    var w = grid.ux;
    var h = grid.uy;
    var x = Math.floor(c.x/sqsize);
    var y = h - Math.floor(c.y/sqsize);
    var found = false;
    for (var k = 0; k < track.length; k++) {
	if ((track[k].x == x) && (track[k].y == y)) {
	    if (track[k].inside == true) {
		track[k].inside = false;
	    } else {
		track.splice(k,1);
	    }
	    found = true;
	    break;
	}
    }
    if (!found) {
	track.push({x: x, y: y, inside: true});
    }
    clear(ctx);
    drawGrid();
    drawTrack();
}

function domousedown(e) {
    if (state == 0) {
	return;
    }
    var c = getRelativeCoords(e);
    coords = {x: c.x, y: c.y};
    ismoving = true;
}

function domouseup(e) {
    if (state == 0) {
	return;
    }
    ismoving = false;
}

function domousemove(e) {
    if (state == 0) {
	return;
    }
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

Player.prototype.getPath = function() {
    return this.path;
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
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x,p.y);
    ctx.lineTo(c.x,c.y);
    ctx.stroke();
    this.drawCar();
}

Player.prototype.redraw = function() {
    var p = transformCoordinates(this.path[0]);
    ctx.strokeStyle = this.colour;
    ctx.lineWidth = 2;
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
