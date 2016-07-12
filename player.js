var ptsize = .3;

Player = function(c,bg,n) {
    this.velocity = {x: 0, y: 0};
    this.position = {x: 0, y: 0};
    this.original = {x: 0, y: 0};
    this.path = [{x: 0, y: 0}];
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

Player.prototype.drawCar = function(ctx,sqsize) {
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

Player.prototype.drawTrajectory = function(ctx,sqsize) {
    ctx.save();
    var c = transformCoordinates(this.position);
    var p = transformCoordinates(this.path[this.path.length - 2]);
    ctx.strokeStyle = this.colour;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x,p.y);
    ctx.lineTo(c.x,c.y);
    ctx.stroke();
    this.drawCar(ctx,sqsize);
    ctx.restore();
}

Player.prototype.redraw = function(ctx,sqsize) {
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
