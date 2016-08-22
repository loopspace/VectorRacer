Track = function(p) {
    this.setParams(p);
}

Track.prototype.setParams = function(p) {
    this.name = p.name;
    this.description = p.description;
    this.grid = {};
    this.grid.lx = p.grid.lx;
    this.grid.ux = p.grid.ux;
    this.grid.ly = p.grid.ly;
    this.grid.uy = p.grid.uy;
    this.fixed = p.fixed;
    this.starts = p.starts;
    this.markers = p.markers;
    this.modifiable = p.modifiable;
    this.laps = p.laps;
    if (p.winner) {
	this.winner = p.winner;
    }
    this.initialParams = p;
}

Track.prototype.reset = function() {
    this.setParams(this.initialParams);
}

Track.prototype.getWidth = function() {
    return this.grid.ux - this.grid.lx;
}

Track.prototype.getHeight = function() {
    return this.grid.uy - this.grid.ly;
}

Track.prototype.getTop = function() {
    return this.grid.uy;
}

Track.prototype.getRight = function(v) {
    return this.grid.ux;
}

Track.prototype.getLeft = function(v) {
    return this.grid.lx;
}

Track.prototype.getBottom = function(v) {
    return this.grid.ly;
}

Track.prototype.setTop = function(v) {
    this.grid.uy = parseInt(v);
}

Track.prototype.setRight = function(v) {
    this.grid.ux = parseInt(v);
}

Track.prototype.setFixed = function(b) {
    this.fixed = b;
}

Track.prototype.getPosition = function(i,n) {
    return this.starts(i,n);
}

Track.prototype.isFixed = function() {
    return this.fixed;
}

Track.prototype.isModifiable = function() {
    return this.modifiable;
}

Track.prototype.getDescription = function() {
    return this.description;
}

Track.prototype.winner = function(p) {
    var u,t,j,k,m;
    p = p.getPath();
    t = [];
    for (k = 0; k < this.markers.length; k++) {
	t.push(0);
    }
    for (j = 1; j < p.length; j++) {
	for (k = 0; k < this.markers.length; k++) {
	    m = this.markers[k];
	    if ( (p[j].y > m.y)
		 &&
		 (p[j-1].y <= m.y)
	       ) {
		u = (p[j].y - m.y)/(p[j].y - p[j-1].y);
		if ( (1 - u) * p[j].x + u * p[j-1].x > m.x ) {
		    t[k]++;
		}
	    } else if ( (p[j].y < m.y)
		 &&
		 (p[j-1].y >= m.y)
	       ) {
		u = (p[j].y - m.y)/(p[j].y - p[j-1].y);
		if ( (1 - u) * p[j].x + u * p[j-1].x > m.x ) {
		    t[k]--;
		}
	    }
	}
    }
    for (k = 0; k < this.markers.length; k++) {
	if ( (this.markers[k].inside && t[k] < this.laps) || (!this.markers[k].inside && t[k] !== 0) ) {
	    return false;
	}
    }
    return true;
}

Track.prototype.draw = function(c,s) {
    var w = s*(this.grid.ux - this.grid.lx + .5);
    var h = s*(this.grid.uy - this.grid.ly + .5);
    c.save();
    c.strokeStyle = '#ccc';
    c.lineWidth = 2;
    c.beginPath();
    for (var i = 0; i <= this.grid.ux - this.grid.lx; i++) {
	c.moveTo((i + .5)*s,.5*s);
	c.lineTo((i + .5)*s,h);
    }
    for (var i = 0; i <= this.grid.uy - this.grid.ly; i++) {
	c.moveTo(.5*s,(i + .5)*s);
	c.lineTo(w,(i + .5)*s);
    }
    c.stroke();
    c.restore();

    c.save();
    var p;
    var cross = .2*s;
    c.strokeStyle = '#00f';
    c.lineWidth = 4;
    c.beginPath();
    for (var i = 0; i < this.markers.length; i++) {
	if (this.markers[i].inside) {
	    p = transformCoordinates(this.markers[i]);
	    c.save();
	    c.translate(p.x,p.y);
	    c.moveTo(cross,cross);
	    c.lineTo(-cross,-cross);
	    c.moveTo(-cross,cross);
	    c.lineTo(cross,-cross);
	    c.restore();
	}
    }
    c.stroke();
    c.strokeStyle = '#f00';
    c.beginPath();
    for (var i = 0; i < this.markers.length; i++) {
	if (!this.markers[i].inside) {
	    p = transformCoordinates(this.markers[i]);
	    c.save();
	    c.translate(p.x,p.y);
	    c.moveTo(cross,cross);
	    c.lineTo(-cross,-cross);
	    c.moveTo(-cross,cross);
	    c.lineTo(cross,-cross);
	    c.restore();
	}
    }
    c.stroke();
    c.restore();
}

Track.prototype.modifyMarker = function(c) {
    var w = this.grid.ux;
    var h = this.grid.uy;
    var x = Math.floor(c.x);
    var y = h - Math.floor(c.y);
    if ( (x < this.grid.lx)
	 ||
	 (x > this.grid.ux)
	 ||
	 (y < this.grid.ly)
	 ||
	 (y > this.grid.uy)
       ) {
	return;
    }
    var found = false;
    for (var k = 0; k < this.markers.length; k++) {
	if ((this.markers[k].x == x) && (this.markers[k].y == y)) {
	    if (this.markers[k].inside == true) {
		this.markers[k].inside = false;
	    } else {
		this.markers.splice(k,1);
	    }
	    found = true;
	    break;
	}
    }
    if (!found) {
	this.markers.push({x: x, y: y, inside: true});
    }
}

Track.prototype.checkSides = function(p) {
    if (
	(p.getX() < this.grid.lx)
	    ||
	    (p.getX() > this.grid.ux)
	    ||
	    (p.getY() < this.grid.ly)
	    ||
	    (p.getY() > this.grid.uy)
    ) {
	if (this.fixed) {
	    p.reset();
	    return true;
	} else {
	    this.grid.ux = Math.max(this.grid.ux, p.getX());
	    this.grid.lx = Math.min(this.grid.lx, p.getX());
	    this.grid.uy = Math.max(this.grid.uy, p.getY());
	    this.grid.ly = Math.min(this.grid.ly, p.getY());
	    return true;
	}
    }
}
