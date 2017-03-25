var img;
var txt;

function sigmoid(x) {
    return 1 / (1 + exp(-2*x));
}

function preload() {
    img = loadImage("assets/manoir.jpg");
    txt = loadImage("http://www.textures.com/system/categories/75/frontend-large.jpg");
}

function setup() {
    createCanvas(img.width, img.height);
    pixelDensity(1);
    img.labyrinth();
    image(img, 0, 0);
}

function draw() {
    
}

p5.Image.prototype.cartoonize = function() { // Ca tu connais
    var hValues = [0, 0.1, 0.2, 0.4, 0.5, 0.6, 0.8, 0.9, 1];
    var sValues = [0, 0.2, 0.5, 0.8, 1];
    var vValues = [0, 0.2, 0.5, 0.8, 1];
    
    this.loadPixels();
    for (var i = 0; i < this.width; i++) {
        for (var j = 0; j < this.height; j++) {
            var color = this.getColor(i, j);
            var hsv_color = RGBtoHSV(red(color), green(color), blue(color));
            var new_h = find_closest_value(hValues, hsv_color.h);
            var new_s = find_closest_value(sValues, hsv_color.s);
            var new_v = min(1, find_closest_value(vValues, hsv_color.v) * 1.3);
            this.setColor(i, j, HSVtoRGB(new_h, new_s, new_v));
        }        
    }
    this.updatePixels();
}

function find_closest_value(tab, e) {
    var closest = tab[0], min_d = Math.abs(tab[0] - e);
    for (var i = 1; i < tab.length; i++) {
        var d = Math.abs(tab[i] - e);
        if (d < min_d) {
            min_d = d;
            closest = tab[i];
        }
    }
    return closest;
}

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return color(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}

function RGBtoHSV(r, g, b) {
    if (arguments.length === 1) {
        g = r.g, b = r.b, r = r.r;
    }
    var max = Math.max(r, g, b), min = Math.min(r, g, b),
        d = max - min,
        h,
        s = (max === 0 ? 0 : d / max),
        v = max / 255;

    switch (max) {
        case min: h = 0; break;
        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
        case g: h = (b - r) + d * 2; h /= 6 * d; break;
        case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }

    return {
        h: h,
        s: s,
        v: v
    };
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

p5.Image.prototype.getColor = function(x, y) { // Get the color on coord (x, y)
    // Returns the color of the (x, y) pixel
    var k = pixelDensity() * 4 * (min(this.height - 1, max(0, y)) * this.width + min(this.width - 1, max(0, x)));
    return color(this.pixels[k], this.pixels[k + 1], this.pixels[k + 2]);
}

p5.Image.prototype.setColor = function(x, y, color) { // Set color on coord (x, y)
    // Set the color of the (x, y) pixel
    var k = pixelDensity() * 4 * (y * img.width + x);
    this.pixels[k] = red(color);
    this.pixels[k + 1] = green(color);
    this.pixels[k + 2] = blue(color);
    this.pixels[k + 3] = alpha(color);
}

p5.Image.prototype.toSpheres = function() { // Draw circles of fixed size 
    
    var size = 2;
    
    this.loadPixels();
    
    // We create each sphere with the color of its center
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

p5.Image.prototype.toBuffer = function() { // We apply a circular buffer, and we drag it across the picture
    
    var size = 10;
    var Nx = this.width / size;
    var Ny = this.height / size;
    
    // Returns the y coord, given the x of the unit center centered on (0, 1)
    var values = {};
    function circleEq(x) {
        if (!values[x])
            values[x] = sqrt(1 - (1-x) * (1-x));
        return values[x];
    }
    
    this.loadPixels();
    
    // For each square of size size
    for (var i = 0; i < Nx; i++) {
        for (var j = 0; j < Ny; j++) {
            // For each pixel of this square
            for (var offx = 0; offx < size; offx++) {
                for (var offy = 0; offy < size; offy++) {
                    // We detect if we are above or under the unit circle, and we chose most appropriate color
                    var relX = (offx % size) / size;
                    var relY = 1 - (offy % size) / size;
                    var color = (relY > circleEq(relX)) ? this.getColor(i * size + 1, j * size - 1) : this.getColor(i * size + size, j * size + size);
                    this.setColor(i * size + offx, j * size + offy, color); 
                }
            }
        }
    }
    
    this.updatePixels();
    
}

p5.Image.prototype.fetchTexture = function() {
    // Transforms an image into its brightness table, to print it on a picture
    var tab = []
    for (var i = 0; i < this.width; i++) {
        tab.push([]);
        for (var j = 0; j < this.height; j++) {
                tab[i].push( sigmoid(lightness(this.getColor(i, j)) / 255) );
        }
    }
    return tab;
}

p5.Image.prototype.texture = function(texture) { // Textures an image with given texture
    
    this.loadPixels();
    texture.loadPixels();
    
    var textureTab = texture.fetchTexture();
    
    console.log("Texture fetched.");
    
    this.cartoonize();
    
    console.log("Catoonized.");
    
    for (var i = 0; i < this.width; i++) {
        for (var j = 0; j < this.height; j++) {
            var c = this.getColor(i, j);
            var ratio = textureTab[i % texture.width][j % texture.height];
            this.setColor(i, j, color(red(c) * ratio, green(c) * ratio, blue(c) * ratio) );
        }
    }
    
    console.log("Texture applied.");
    
    this.updatePixels();
}

p5.Image.prototype.blackAndWhite = function() {
    this.loadPixels();
    
    for (var i = 0; i < this.width; i++) {
        for (var j = 0; j < this.height; j++) {
            var c = this.getColor(i, j);
            var gray = red(c) * 0.299 + green(c) * 0.587 + blue(c) * 0.114;
            this.setColor(i, j, color(gray) );
        }
    }
    
    this.updatePixels();
}

p5.Image.prototype.labyrinth = function() { // Creates labyrinth whose density depends on brightness
    
    var MAX = 10;
    
    this.blackAndWhite();
    
    this.loadPixels();
    
    function h(x, step) {
        return (x == 0) ? 0 : ceil(x / step);
    }
    
    function flip(a, b) {
        return (random() < 0.5) ? a : b;
    }
    
    for (var i = 0; i < this.width; i++) {
        for (var j = 0; j < this.height; j++) {
            var k = h(lightness(this.getColor(i, j)) / 255, 1 / MAX);
            if (k < MAX && flip(i, j) % k == 0) {
                this.setColor(i, j, color(0));
            } else {
                this.setColor(i, j, color(255));
            }
        }
    }      
    
    this.updatePixels();
}

p5.Image.prototype.toStripes = function() { // Same with stripes
    
    var MAX = 10;
    
    this.blackAndWhite();
    
    this.loadPixels();
    
    function h(x, step) {
        return (x == 0) ? 0 : ceil(x / step);
    }
    
    function flip(a, b, k) {
        return (k % 2 == 0) ? a : b;
    }
    
    for (var i = 0; i < this.width; i++) {
        for (var j = 0; j < this.height; j++) {
            var k = h(lightness(this.getColor(i, j)) / 120, 1 / MAX);
            if (k < MAX && flip(i, j, k ) % k == 0) {
                this.setColor(i, j, color(0));
            } else {
                this.setColor(i, j, color(255));
            }
        }
    }      
    
    this.updatePixels();
}
