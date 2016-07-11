'use strict';

var cvs;
var ctx;
var sqsize;
var players = [];
var track;
var numbers = [
    "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen"
]
var coords;
var ismoving;
var movingPlayer = null;
var ptsize = .3;
var state = 0;

var tracks = [
    {
	name: 'First Past the Post',
	description: 'Be the first to get over the finish line',
	grid: {
	    lx: 0,
	    ux: 20,
	    ly: 0,
	    uy: 20,
	    fixed: true
	},
	winner: function(p) {
	    if (p.getY() >= 10) {
		return true;
	    } else {
		return false;
	    }
	},
	starts: function(i,n) {
	    return {x: 15 - n - 3 + i, y: 0}
	},
	markers: [{x: 0, y: 10, inside: true}, {x: 20, y: 10, inside: false}],
	modifiable: false
    },
    {
	name: 'Rest at the Last',
	description: 'Get to the finish line and stop there',
	grid: {
	    lx: 0,
	    ux: 20,
	    ly: 0,
	    uy: 20,
	    fixed: true
	},
	winner: function(p) {
	    if (p.getY() == 10 && p.getVelocityX() == 0 && p.getVelocityY() == 0) {
		return true;
	    } else {
		return false;
	    }
	},
	starts: function(i,n) {
	    return {x: 15 - n - 3 + i, y: 0}
	},
	markers: [{x: 0, y: 10, inside: true}, {x: 20, y: 10, inside: false}],
	modifiable: false
    },
    {
	name: 'Do a Lap',
	description: 'Go round the marker once',
	grid: {
	    lx: 0,
	    ux: 20,
	    ly: 0,
	    uy: 20,
	    fixed: true
	},
	winner: checkTrack,
	starts: function(i,n) {
	    return {x: 20 - n - 3 + i, y: 10}
	},
	markers: [{x: 10, y: 10, inside: true}],
	modifiable: false
    },
    {
	name: 'Define your own',
	description: 'Define your own track',
	grid: {
	    lx: 0,
	    ux: 20,
	    ly: 0,
	    uy: 20,
	    fixed: true
	},
	winner: checkTrack,
	starts: function(i,n) {
	    return {x: 15 - n - 3 + i, y: 0}
	},
	markers: [],
	modifiable: true
    }
];

track = tracks[0];

function init() {
    cvs = document.getElementById('cvs');
    ctx = cvs.getContext('2d');

    cvs.addEventListener('mousedown',domousedown);
    cvs.addEventListener('mousemove',domousemove);
    cvs.addEventListener('mouseup',domouseup);
    cvs.addEventListener('mouseout',domouseup);

    var gw = document.getElementById('gridWidth');
    gw.addEventListener('change',function(e) {
	track.grid.ux = parseInt(e.target.value);
	drawGame();
    });
    var gh = document.getElementById('gridHeight');
    gh.addEventListener('change',function(e) {
	track.grid.uy = parseInt(e.target.value);
	drawGame();
    });
    var gf = document.getElementById('gridFixed');
    gf.addEventListener('click',function(e) {
	track.grid.fixed = e.target.checked;
    });

    gw.disabled = true;
    gh.disabled = true;
    gf.disabled = true;

    var pn = document.getElementById('numPlayers');
    pn.addEventListener('change',function(e) {getPlayers(e.target.value)});
    getPlayers(pn.value);
    var btn = document.getElementById('makeGrid');
    btn.addEventListener('click',definePlayers);

    var tbtn = document.getElementById('turnbtn');
    tbtn.addEventListener('click',takeTurn);

    var dbtn = document.getElementById("startGame");
    dbtn.addEventListener('click',startGame);

    var rbtn = document.getElementById('resetbtn');
    rbtn.addEventListener('click',resetGame);

    var nbtn = document.getElementById('newbtn');
    nbtn.addEventListener('click',setupGrid);

    var trackList = document.getElementById('tracks');
    var opt;
    for (var i = 0; i < tracks.length; i++) {
	opt = document.createElement('option');
	opt.innerHTML = tracks[i].name;
	opt.value = i;
	trackList.appendChild(opt);
    }
    trackList.addEventListener('change',setTrack);
}

function getPlayers(n) {
    var n = Math.max(1,parseInt(n));
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
	    inp.id = 'playerName' + (k + 1);
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
}

function definePlayers() {
    var tb = document.getElementById('playerNames');
    var tlist = document.getElementById('playerSpots');
    var ch = tb.children;
    
    var phi = (Math.sqrt(5)-1)/2;
    var name;
    if (track.grid.ux < ch.length + 6) {
	track.grid.ux = ch.length + 6;
    }
    var spos = track.grid.ux - ch.length - 3;
    var td,col,tr,txt,bgcol;
    for (var i=0; i < ch.length; i++) {
	name = ch[i].getElementsByTagName('input')[0].value;
	if (name == '') {
	    name = 'Player ' + (i + 1);
	}
	col = hsl(phi * i,1,.5);
	bgcol = hsl(phi * i,1,.75);
	players.push(new Player({x: spos + i, y: 0},col, bgcol, name));
	tr = document.createElement('tr');
	td = document.createElement('td');
	txt = document.createTextNode(name);
	tr.appendChild(td);
	td.appendChild(txt);
	td = document.createElement('td');
	txt = document.createElement('span');
	txt.innerHTML = '&nbsp;';
	txt.className = 'playerSpot';
	txt.style.backgroundColor = col;
	txt.id = 'playerSpot' + i;
	tr.appendChild(td);
	td.appendChild(txt);
	tlist.appendChild(tr);
    }
    for (var i = 0; i < players.length; i++) {
	players[i].setPosition(track.starts(i,players.length));
    }

    setupGrid();
}

function setupGrid() {
    var frm = document.getElementById("setup");
    frm.style.display = "none";
    var trk = document.getElementById("track");
    trk.style.display = "block";
    var def = document.getElementById("define");
    def.style.display = "block";
    var acc = document.getElementById("acceleration");
    acc.style.display = "none";

    state = 0;
    
    setSize();
    drawGame();
}

function startGame() {
    var def = document.getElementById("define");
    def.style.display = "none";
    var acc = document.getElementById("acceleration");
    var acctbl = document.getElementById("acceltbl");
    var ctrltbl,tds;
    for (var i = 0; i < players.length; i++) {
	ctrltbl = acctbl.cloneNode(true);
	ctrltbl.id = 'playerControls' + (i+1);
	ctrltbl.style.display = 'block';
	tds = ctrltbl.getElementsByTagName('td');
	for (var j = 0; j < tds.length; j++) {
	    tds[j].style.backgroundColor = players[i].getBgColour();
	    tds[j].dataset.player = i;
	}
	tds[0].innerHTML = players[i].getName();
	acc.insertBefore(ctrltbl,acceltbl);
    }
    var ctrls = document.querySelectorAll('.accelerate');
    for (var i = 0; i < ctrls.length; i++) {
	ctrls[i].addEventListener('click',clickSquare);
    }
    acc.style.display = "block";
    var tbtn = document.getElementById('turnbtn');
    tbtn.disabled = true;
    drawTrack();
    drawPlayers();
    state = 1;
}

function clickSquare(e) {
    if (state !== 1) {
	return;
    }
    var tds = e.currentTarget.parentNode.parentNode.querySelectorAll('.accelerate');
    for (var i = 0; i < tds.length; i++) {
	tds[i].style.borderStyle = 'outset';
    }
    e.currentTarget.style.borderStyle = 'inset';
    players[e.currentTarget.dataset.player].setAcceleration(parseInt(e.currentTarget.dataset.x),parseInt(e.currentTarget.dataset.y));
    var ready = true;
    for (var i = 0; i < players.length; i++) {
	if (!players[i].isReady()) {
	    ready = false;
	}
    }
    if (ready) {
	var tbtn = document.getElementById('turnbtn');
	tbtn.disabled = false;
    }
}

function takeTurn() {
    for (var i = 0; i < players.length; i++) {
	players[i].update();
    }
    for (var i = 0; i < players.length; i++) {
	players[i].drawTrajectory();
    }
    var acc = document.getElementById("acceleration");
    var tds = acc.querySelectorAll('.accelerate');
    for (var i = 0; i < tds.length; i++) {
	tds[i].style.borderStyle = 'outset';
    }
    var tbtn = document.getElementById('turnbtn');
    tbtn.disabled = true;
    checkSides();
    checkWinners();
}

function setTrack(e) {
    var i = e.target.value;
    track = tracks[i];
    for (var j = 0; j < players.length; j++) {
	players[j].setPosition(track.starts(j,players.length));
    }
    var gw = document.getElementById('gridWidth');
    gw.value = track.grid.ux;
    var gh = document.getElementById('gridHeight');
    gh.value = track.grid.uy;
    var gf = document.getElementById('gridFixed');
    gf.checked = track.grid.fixed;
    if (track.modifiable) {
	gw.disabled = false;
	gh.disabled = false;
	gf.disabled = false;
    } else {
	gw.disabled = true;
	gh.disabled = true;
	gf.disabled = true;
    }
    drawGame();
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
    w /= track.grid.ux - track.grid.lx + 1;
    h /= track.grid.uy - track.grid.ly + 1;
    sqsize = Math.min(w,h);
}

function drawGrid() {
    var w = sqsize*(track.grid.ux - track.grid.lx + .5);
    var h = sqsize*(track.grid.uy - track.grid.ly + .5);
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i <= track.grid.ux - track.grid.lx; i++) {
	ctx.moveTo((i + .5)*sqsize,.5*sqsize);
	ctx.lineTo((i + .5)*sqsize,h);
    }
    for (var i = 0; i <= track.grid.uy - track.grid.ly; i++) {
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
    for (var i = 0; i < track.markers.length; i++) {
	if (track.markers[i].inside) {
	    c = transformCoordinates(track.markers[i]);
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
    for (var i = 0; i < track.markers.length; i++) {
	if (!track.markers[i].inside) {
	    c = transformCoordinates(track.markers[i]);
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

function drawPlayers() {
    for (var i=0; i < players.length; i++) {
	players[i].drawCar();
    }
}

function redrawPlayers() {
    for (var i=0; i < players.length; i++) {
	players[i].drawCar();
    }
}

function checkWinners() {
    var w = [];
    for (var i = 0; i < players.length; i++) {
	if (track.winner(players[i])) {
	    w.push(i);
	}
    }
    if (w.length > 0) {
	var msg;
	if (w.length == 1) {
	    msg = "The winner is " + players[w[0]].getName();
	} else {
	    msg = "The winners are ";
	    for (var i = 0; i < w.length - 2; i++) {
		msg += players[w[i]].getName() + ", ";
	    }
	    i = w.length - 2;
	    msg += players[w[i]].getName() + " and " + players[w[i+1]].getName();
	}
	setMessage(msg);
	state = 2;
    }
}

function checkTrack(player) {
    var p,u,t,i,j,k;
    p = player.getPath();
    t = [];
    for (k = 0; k < track.markers.length; k++) {
	t.push(0);
    }
    for (j = 1; j < p.length; j++) {
	for (k = 0; k < track.markers.length; k++) {
	    if ( (p[j].y - track.markers[k].y) * (track.markers[k].y - p[j-1].y) > 0 || (track.markers[k].y == p[j].y && track.markers[k].y != p[j-1].y) ) {
		u = (p[j].y - track.markers[k].y)/(p[j].y - p[j-1].y);
		if ( (1 - u) * p[j].x + u * p[j-1].x > track.markers[k].x ) {
		    t[k]++;
		}
	    }
	}
    }
    for (k = 0; k < track.markers.length; k++) {
	if ( (track.markers[k].inside && t[k]%2 == 0) || (!track.markers[k].inside && t[k]%2 == 1) ) {
	    return false;
	}
    }
    return true;
}

function setMessage(s) {
    var dv = document.getElementById('messages');
    dv.style.display = 'inline-block';
    dv.innerHTML = s;
    var style = window.getComputedStyle(dv);
    var ww = window.innerWidth;
    var wh = window.innerHeight;
    dv.style.left = (ww/2 - parseFloat(style.width)/2) + 'px';
    dv.style.top = (wh/2 - parseFloat(style.height)/2) + 'px';
    window.setTimeout(clearMessage,5000);
}

function clearMessage() {
    var dv = document.getElementById('messages');
    dv.style.display = 'none';
}

function resetGame() {
    for (var i = 0; i < players.length; i++) {
	players[i].reset();
    }
    drawGame();
    state = 1;
}

function drawGame() {
    clear(ctx);
    drawGrid();
    drawTrack();
    drawPlayers();
}

function redrawGame() {
    clear(ctx);
    drawGrid();
    drawTrack();
    redrawPlayers();
}

function checkSides() {
    if (track.grid.fixed) {
	checkSidesFixed();
    } else {
	checkSidesResize();
    }
}

function checkSidesFixed() {
    var redo;
    for (var i = 0; i < players.length; i++) {
	if (
	    (players[i].getX() < track.grid.lx)
		||
		(players[i].getX() > track.grid.ux)
		||
	    (players[i].getY() < track.grid.ly)
		||
		(players[i].getY() > track.grid.uy)
	) {
	    redo = true;
	    players[i].reset();
	}
    }
    if (redo) {
	redrawGame();
    }
}

function checkSidesResize() {
    var redo = false;
    var lx,ly,ux,uy;
    lx = track.grid.lx;
    ly = track.grid.ly;
    ux = track.grid.ux;
    uy = track.grid.uy;
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
	track.grid.lx = lx;
	track.grid.ly = ly;
	track.grid.ux = ux;
	track.grid.uy = uy;
	var w = Math.ceil((ux - lx + 1) * sqsize);
	var h = Math.ceil((uy - ly + 1) * sqsize);
	cvs.width = w;
	cvs.height = h;
	redrawGame();
    }
}

function transformCoordinates(x,y) {
    var h = cvs.height;
    if (x.x !== undefined) {
	y = x.y;
	x = x.x;
    }
    return {x: (x - track.grid.lx + .5)*sqsize, y: h - (y - track.grid.ly + .5)*sqsize }
}

function domousedown(e) {
    var c = getRelativeCoords(e);
    if (state == 0) {
	if (!track.modifiable) {
	    return;
	}
	var w = track.grid.ux;
	var h = track.grid.uy;
	var x = Math.floor(c.x/sqsize);
	var y = h - Math.floor(c.y/sqsize);
	var p;
	for (var k = 0; k < players.length; k++) {
	    if (players[k].getX() == x && players[k].getY() == y) {
		p = k;
		break;
	    }
	}
	if (p !== undefined) {
	    movingPlayer = p;
	} else {
	    movingPlayer = null;
	}
    } else {
	coords = {x: c.x, y: c.y};
    }
    ismoving = true;
}

function domouseup(e) {
    if (!ismoving) {
	return;
    }
    if (state == 0) {
	if (movingPlayer === null) {
	    var c = getRelativeCoords(e);
	    var w = track.grid.ux;
	    var h = track.grid.uy;
	    var x = Math.floor(c.x/sqsize);
	    var y = h - Math.floor(c.y/sqsize);
	    var found = false;
	    for (var k = 0; k < track.markers.length; k++) {
		if ((track.markers[k].x == x) && (track.markers[k].y == y)) {
		    if (track.markers[k].inside == true) {
			track.markers[k].inside = false;
		    } else {
			track.markers.splice(k,1);
		    }
		    found = true;
		    break;
		}
	    }
	    if (!found) {
		track.markers.push({x: x, y: y, inside: true});
	    }
	}
	drawGame();
    }
    movingPlayer = null;
    ismoving = false;
}

function domousemove(e) {
    if (!ismoving) {
	return;
    }
    if (state == 0) {
	if (movingPlayer !== null) {
	    var c = getRelativeCoords(e);
	    var w = track.grid.ux;
	    var h = track.grid.uy;
	    var x = Math.floor(c.x/sqsize);
	    var y = h - Math.floor(c.y/sqsize);
	    players[movingPlayer].setPosition({x: x, y: y});
	    drawGame();
	}
    } else {
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

var Player = function(v,c,bg,n) {
    this.velocity = {x: 0, y: 0};
    this.position = {x: v.x, y: v.y};
    this.original = {x: v.x, y: v.y};
    this.path = [{x: v.x, y: v.y}];
    this.colour = c;
    this.bgcolour = bg;
    this.name = n;
    this.acceleration = null;
}

Player.prototype.setPosition = function(v) {
    this.position = {x: v.x, y: v.y};
    this.original = {x: v.x, y: v.y};
    this.path = [{x: v.x, y: v.y}];
}

Player.prototype.reset = function() {
    this.velocity = {x: 0, y: 0};
    this.position = {x: this.original.x, y: this.original.y};
    this.path = [{x: this.original.x, y: this.original.y}];
    this.acceleration = null;
}

Player.prototype.setAcceleration = function(x,y) {
    this.acceleration = {x: x, y: y};
}

Player.prototype.update = function() {
    this.velocity.x += this.acceleration.x;
    this.velocity.y += this.acceleration.y;
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.path.push({x: this.position.x, y: this.position.y});
    this.acceleration = null;
}

Player.prototype.isReady = function() {
    if (this.acceleration) {
	return true;
    } else {
	return false;
    }
}

Player.prototype.getX = function() {
    return this.position.x;
}

Player.prototype.getY = function() {
    return this.position.y;
}

Player.prototype.getVelocityX = function() {
    return this.velocity.x;
}

Player.prototype.getVelocityY = function() {
    return this.velocity.y;
}

Player.prototype.getPath = function() {
    return this.path;
}

Player.prototype.getName = function() {
    return this.name;
}

Player.prototype.getBgColour = function() {
    return this.bgcolour;
}

Player.prototype.drawCar = function() {
    ctx.save();
    var c;
    if (this.path.length > 1) {
	var c = transformCoordinates(this.path[this.path.length-2]);
	ctx.fillStyle = this.bgcolour;
	ctx.beginPath();
	ctx.moveTo(c.x,c.y);
	ctx.arc(c.x,c.y,ptsize*sqsize,0,2*Math.PI);
	ctx.fill();
    }
    var c = transformCoordinates(this.position);
    ctx.fillStyle = this.colour;
    ctx.beginPath();
    ctx.moveTo(c.x,c.y);
    ctx.arc(c.x,c.y,ptsize*sqsize,0,2*Math.PI);
    ctx.fill();
    ctx.restore();
}

Player.prototype.drawTrajectory = function() {
    ctx.save();
    var c = transformCoordinates(this.position);
    var p = transformCoordinates(this.path[this.path.length - 2]);
    ctx.strokeStyle = this.colour;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x,p.y);
    ctx.lineTo(c.x,c.y);
    ctx.stroke();
    this.drawCar();
    ctx.restore();
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
