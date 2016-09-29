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
var state = 0;

var tracks = [
    new Track({
	name: 'Free For All',
	description: 'Just move around the grid',
	grid: {
	    lx: 0,
	    ux: 20,
	    ly: 0,
	    uy: 20,
	},
	fixed: false,
	winner: function(p) {
	    return false;
	},
	starts: function(i,n) {
	    return {x: 15 - n - 3 + i, y: 0}
	},
	markers: [],
	modifiable: false
    }),
    new Track({
	name: 'First Past the Post',
	description: 'Be the first to get over the finish line',
	grid: {
	    lx: 0,
	    ux: 20,
	    ly: 0,
	    uy: 20,
	},
	fixed: true,
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
    }),
    new Track({
	name: 'Rest at the Last',
	description: 'Get to the finish line and wait there for a turn',
	grid: {
	    lx: 0,
	    ux: 20,
	    ly: 0,
	    uy: 20,
	},
	fixed: true,
	winner: function(p) {
	    var pt = p.getPath();
	    if (pt.length < 2) {
		return false;
	    }
	    var x = pt[pt.length-2].x;
	    var y = pt[pt.length-2].y
	    if (p.getY() == 10 && y == 10 && x == p.getX() ) {
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
    }),
    new Track({
	name: 'Do a Lap',
	description: 'Go round the blue crosses once',
	grid: {
	    lx: 0,
	    ux: 20,
	    ly: 0,
	    uy: 20,
	},
	fixed: true,
	starts: function(i,n) {
	    return {x: 20 - n - 3 + i, y: 10}
	},
	laps: 1,
	markers: [{x: 10, y: 9, inside: true},{x: 10, y: 11, inside: true}],
	modifiable: false
    }),
    new Track({
	name: 'Hit the target',
	description: 'Get to the target',
	grid: {
	    lx: 0,
	    ux: 20,
	    ly: 0,
	    uy: 20,
	},
	fixed: true,
	starts: function(i,n) {
	    return {x: 20 - n - 3 + i, y: 1}
	},
	laps: 1,
	markers: [{x: 3, y: 17, inside: true}],
	winner: function(p) {
	    if (p.getX() == 3 && p.getY() == 17) {
		return true;
	    } else {
		return false;
	    }
	},
	modifiable: false
    }),
    new Track({
	name: 'Stop on a dime',
	description: 'Get to the target and wait there for a turn',
	grid: {
	    lx: 0,
	    ux: 20,
	    ly: 0,
	    uy: 20,
	},
	fixed: true,
	starts: function(i,n) {
	    return {x: 20 - n - 3 + i, y: 1}
	},
	laps: 1,
	markers: [{x: 3, y: 17, inside: true}],
	winner: function(p) {
	    var pt = p.getPath();
	    if (pt.length < 2) {
		return false;
	    }
	    var x = pt[pt.length-2].x;
	    var y = pt[pt.length-2].y
	    if (p.getX() == 3 && p.getY() == 17 && y == 17 && x == 3 ) {
		return true;
	    } else {
		return false;
	    }
	},
	modifiable: false
    }),
    new Track({
	name: 'Define your own',
	description: 'Define your own track.  Set the width and height of the initial grid.  If the grid is "fixed", a player who hits the side restarts.  If not, the grid is effectively infinite.  Click on the grid to set markers: blue markers are inside the track, red are outside.  Drag the players\' starting positions to where you want them to be.',
	grid: {
	    lx: 0,
	    ux: 20,
	    ly: 0,
	    uy: 20,
	},
	fixed: true,
	starts: function(i,n) {
	    return {x: 15 - n - 3 + i, y: 0}
	},
	laps: 1,
	markers: [],
	modifiable: true
    })
];

function init() {
    cvs = document.getElementById('cvs');
    ctx = cvs.getContext('2d');

    cvs.addEventListener('mousedown',domousedown);
    cvs.addEventListener('mousemove',domousemove);
    cvs.addEventListener('mouseup',domouseup);
    cvs.addEventListener('mouseout',domouseup);

    var inst = document.getElementById('setupinst');
    var istyle = window.getComputedStyle(document.getElementById('setupTable'));
    inst.style.width = istyle.width;
    
    var gw = document.getElementById('gridWidth');
    gw.addEventListener('change',function(e) {
	track.setRight(e.target.value);
	drawGame();
    });
    var gh = document.getElementById('gridHeight');
    gh.addEventListener('change',function(e) {
	track.setTop(e.target.value);
	drawGame();
    });
    var gf = document.getElementById('gridFixed');
    gf.addEventListener('click',function(e) {
	track.setFixed(e.target.checked);
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
    setTrack(0);

    setSize();
    drawGame();
}

window.addEventListener('load',init,false);

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
    var td,col,tr,txt,bgcol;
    for (var i=0; i < ch.length; i++) {
	name = ch[i].getElementsByTagName('input')[0].value;
	if (name == '') {
	    name = 'Player ' + (i + 1);
	}
	col = hsl(phi * i,1,.5);
	bgcol = hsl(phi * i,1,.75);
	players.push(new Player(col, bgcol, name));
	
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
	players[i].setPosition(track.getPosition(i,players.length));
    }

    setupGrid();
}

function setupGrid() {
    showControls(1);

    var inst = document.getElementById('trackinst');
    var istyle = window.getComputedStyle(document.getElementById('trackTable'));
    inst.style.width = istyle.width;

    resetGame();
    state = 0;
}

function startGame() {
    showControls(2);
    var acc = document.getElementById("accelctrls");
    acc.innerHTML = '';
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
	acc.appendChild(ctrltbl);
    }
    var ctrls = document.querySelectorAll('.accelerate');
    for (var i = 0; i < ctrls.length; i++) {
	ctrls[i].addEventListener('click',clickSquare);
    }
    var tbtn = document.getElementById('turnbtn');
    tbtn.disabled = true;
    drawGame();
    state = 1;
}

function clickSquare(e) {
    if (state !== 1) {
	return;
    }
    var tds = e.currentTarget.parentNode.parentNode.querySelectorAll('.accelerate');
    var bgcol = players[e.currentTarget.dataset.player].getBgColour();
    for (var i = 0; i < tds.length; i++) {
	tds[i].style.borderStyle = 'outset';
	tds[i].style.backgroundColor = bgcol;
    }
    e.currentTarget.style.borderStyle = 'inset';
    e.currentTarget.style.backgroundColor = 'white';
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
	players[i].drawTrajectory(ctx,sqsize);
    }
    var acc = document.getElementById("acceleration");
    var tds = acc.querySelectorAll('.accelerate');
    for (var i = 0; i < tds.length; i++) {
	if (!tds[i].dataset.player) {
	    break;
	}
	tds[i].style.backgroundColor = players[tds[i].dataset.player].getBgColour();
	tds[i].style.borderStyle = 'outset';
    }
    var tbtn = document.getElementById('turnbtn');
    tbtn.disabled = true;
    checkSides();
    checkWinners();
}

function setTrack(e) {
    var i;
    if (e.target) {
	i = e.target.value;
    } else {
	i = e;
    }
    track = tracks[i];
    for (var j = 0; j < players.length; j++) {
	players[j].setPosition(track.getPosition(j,players.length));
    }
    var gw = document.getElementById('gridWidth');
    gw.value = track.getWidth();
    var gh = document.getElementById('gridHeight');
    gh.value = track.getHeight();
    var gf = document.getElementById('gridFixed');
    gf.checked = track.isFixed();

    var tdesc = document.getElementById('trackdesc');
    tdesc.innerHTML = track.getDescription();
    
    var tf = document.getElementById('trackdef');
    if (track.modifiable) {
	tf.style.display = "table-row-group";
	gw.disabled = false;
	gh.disabled = false;
	gf.disabled = false;
    } else {
	tf.style.display = "none";
	gw.disabled = true;
	gh.disabled = true;
	gf.disabled = true;
    }
    drawGame();
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
    w /= track.getWidth() + 1;
    h /= track.getHeight() + 1;
    sqsize = Math.min(w,h);
}


function drawPlayers() {
    for (var i=0; i < players.length; i++) {
	players[i].drawCar(ctx,sqsize);
    }
}

function redrawPlayers() {
    for (var i=0; i < players.length; i++) {
	players[i].redraw(ctx,sqsize);
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


function setMessage(s) {
    var dv = document.getElementById('messages');
    dv.style.display = 'inline-block';
    dv.innerHTML = s;
    var style = window.getComputedStyle(dv);
    var ww = window.innerWidth;
    var wh = window.innerHeight;
    dv.style.left = (ww/2 - parseFloat(style.width)/2) + 'px';
    dv.style.top = 100 + 'px';//(wh/2 - parseFloat(style.height)/2) + 'px';
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
    track.reset();
    var w = Math.ceil((track.getWidth() + 1) * sqsize);
    var h = Math.ceil((track.getHeight() + 1) * sqsize);
    cvs.width = w;
    cvs.height = h;
    redrawGame();
    state = 1;
}

function drawGame() {
    clear(ctx);
    track.draw(ctx,sqsize);
    drawPlayers();
}

function redrawGame() {
    clear(ctx);
    track.draw(ctx,sqsize);
    redrawPlayers();
}

function checkSides() {
    var redo = false;
    for (var i = 0; i < players.length; i++) {
	if (track.checkSides(players[i])) {
	    redo = true;
	}
    }
    if (redo) {
	var w = Math.ceil((track.getWidth() + 1) * sqsize);
	var h = Math.ceil((track.getHeight() + 1) * sqsize);
	cvs.width = w;
	cvs.height = h;
	redrawGame();
    }
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
	    c.x /= sqsize;
	    c.y /= sqsize;
	    track.modifyMarker(c);
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
	    var x = Math.floor(c.x/sqsize);
	    var y = track.getTop() - Math.floor(c.y/sqsize);
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

function clear(c) {
    var w = c.canvas.width;
    var h = c.canvas.height;
    c.save()
    c.setTransform(1,0,0,1,0,0);
    c.clearRect(0,0,w,h);
    c.restore();
}

function showControls(n) {
    var ids = ["setup", "define", "acceleration"];
    var elt;
    for (var i = 0; i < ids.length; i++) {
	elt = document.getElementById(ids[i]);
	if (i == n) {
	    elt.style.display = "block";
	} else {
	    elt.style.display = "none";
	}
    }
}

function getRelativeCoords(event) {
    if (event.offsetX !== undefined && event.offsetY !== undefined) { return { x: event.offsetX, y: event.offsetY }; }
    return { x: event.layerX, y: event.layerY };
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

function transformCoordinates(x,y) {
    var h = cvs.height;
    if (x.x !== undefined) {
	y = x.y;
	x = x.x;
    }
    return {x: (x - track.getLeft() + .5)*sqsize, y: h - (y - track.getBottom() + .5)*sqsize }
}

