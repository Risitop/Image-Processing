var img;

function preload() {
    img = loadImage("http://md1.libe.com/photo/799827--.jpg");    
}

function setup() {
    createCanvas(img.width, img.height);
    pixelDensity(1);
    img.toSpheres();
    image(img, 0, 0);
}

function draw() {
    
}

function Sphere(ct, ra, cl) {
    this.center = ct; // PVector2D
    this.radius = ra; // number
    this.color = cl; // Color from p5
    
    this.distance = function(p) {
        return Math.sqrt( Math.pow(p.x - this.center.x, 2) + Math.pow(p.y - this.center.y, 2) );
    };
    
    this.draw = function(img) {
        var d = pixelDensity();
        for (var i = max(0, this.center.x - this.radius); i < min(img.width, this.center.x + this.radius); i++) {
            for (var j = max(0, this.center.y - this.radius); j < min(img.height, this.center.y + this.radius); j++) {
                if (this.distance(createVector(i, j)) < this.radius) {
                    img.setColor(i, j, this.color);
                }
            }
        }
    };
    
    this.collide = function(s) {
        return (this.distance(s.center) < this.radius + s.radius);
    };
}

p5.Image.prototype.getColor = function(x, y) {
    // Returns the color of the (x, y) pixel
    var k = pixelDensity() * 4 * (y * this.width + x);
    return color(this.pixels[k], this.pixels[k + 1], this.pixels[k + 2]);
}

p5.Image.prototype.setColor = function(x, y, color) {
    // Set the color of the (x, y) pixel
    var k = pixelDensity() * 4 * (y * img.width + x);
    this.pixels[k] = red(color);
    this.pixels[k + 1] = green(color);
    this.pixels[k + 2] = blue(color);
    this.pixels[k + 3] = alpha(color);
}

p5.Image.prototype.toSpheres = function() {
    
    var size = 5;
    
    this.loadPixels();
    
    var spheres = [];
    for (var x = size; x < this.width; x += 2 * size) {
        for (var y = size; y < this.height; y += 2 * size) {
            spheres.push(new Sphere(createVector(x, y), size, this.getColor(x, y)));
        }   
    }
    
    // Erase everything
    for (var x = 0; x < this.width; x++) {
        for (var y = 0; y < this.height; y++) {
            this.setColor(x, y, color(255, 255, 255));
        }   
    }
    
    this.updatePixels();
    this.loadPixels();
    
    // Draw spheres
    for (var i = 0; i < spheres.length; i++) {
        spheres[i].draw(this);
    }
    
    this.updatePixels();
}
