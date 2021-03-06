var imgF;
var img;
var txt;

function sigmoid(x) {
    return 1 / (1 + exp(-2*x));
}

function preload() {
    imgF = loadImage("assets/thor.jpg");
    txt = loadImage("http://www.textures.com/system/categories/75/frontend-large.jpg");
}

function setup() {
    img = imgF;
    createCanvas(img.width * 2, img.height);
    pixelDensity(1);    
    image(img, 0, 0);
    img.flashlight(100);
    image(img, img.width, 0);
    frameRate(10);
}

function draw() {
    
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
    var k = 4 * (min(this.height - 1, max(0, y)) * this.width + min(this.width - 1, max(0, x)));
    return color(this.pixels[k], this.pixels[k + 1], this.pixels[k + 2]);
}

p5.Image.prototype.getFloatingColor = function(x, y) {
    var colors = [], i = parseInt(x), j = parseInt(y);
    for (var a = 0; a < 2; a++)
        for (var b = 0; b < 2; b++)
            colors.push(this.getColor(parseInt(x) + a, parseInt(y) + b));

    var r = 0, g = 0, b = 0;
    for (var k = 0; k < 4; k++) {
        var alp = Math.abs( (x - i - ( (3 - k) % 2 ) ) * (y - j - parseInt( (3 - k) / 2 ) ) );
        r += alp * red(colors[k]);
        g += alp * green(colors[k]);
        b += alp * blue(colors[k]);
    }

    return color(r, g, b);
}

p5.Image.prototype.setColor = function(x, y, color) { // Set color on coord (x, y)
    // Set the color of the (x, y) pixel
    var k = 4 * (y * this.width + x);
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
    
    var size = 2;
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
    
    var MAX = 6;
    
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
            var k = h(lightness(this.getColor(i, j)) / 120, 1 / MAX);
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
    
    var MAX = 6;
    
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

p5.Image.prototype.copy = function(img) {
    this.loadPixels();
    img.loadPixels();
    
    this.pixels = [];
    for (var i = 0; i < img.pixels.width; i++)
        this.pixels.push(img.pixels[i]);
    
    this.updatePixels();
}

p5.Image.prototype.contrast = function(pass) {
    
    function tough(r, g, b) {
        return (max(r, g, b) < pass) ? 0 : 255;
    }
    
    this.loadPixels();
    
    for (var i = 0; i < this.pixels.length; i += 4) {
        c = tough(this.pixels[i], this.pixels[i + 1], this.pixels[i + 2]);
        this.pixels[i] = c;
        this.pixels[i + 1] = c;
        this.pixels[i + 2] = c;
    }
    this.updatePixels();
}

p5.Image.prototype.negative = function(img) {
    this.loadPixels();
    
    for (var i = 0; i < this.pixels.length; i++) {
        if (i%4 != 3) {
            this.pixels[i] = 255 - this.pixels[i];
        }
    }
    this.updatePixels();
}

p5.Image.prototype.convolution33 = function(matrix, flag_normalize) {
    
    var coef;
    if (flag_normalize) {
        coef = 0;
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                coef += matrix[i][j];
            }
        }
    } else {
        coef = 1;
    }
    
    this.loadPixels();
    
    var cpImg = createImage(this.width, this.height);
    cpImg.loadPixels();   
    
    for (var i = 0; i < this.pixels.length; i++) {
        cpImg.pixels[i] = this.pixels[i];
    }
    
    cpImg.updatePixels();
    
    for (var i = 0; i < this.width; i++) {
        for (var j = 0; j < this.height; j++) {
            
            var r = 0;
            var g = 0;
            var b = 0;
            
            for (var k = -1; k < 2; k++) {
                for (var l = -1; l < 2; l++) {
                    var c = cpImg.getColor(i + k, j + l);
                    r += red(c) * matrix[k + 1][l + 1];
                    g += green(c) * matrix[k + 1][l + 1];
                    b += blue(c) * matrix[k + 1][l + 1];
                }
            }
            
            r /= coef;
            g /= coef;
            b /= coef;
            
            this.setColor(i, j, color(r, g, b));
        }
    }

    this.updatePixels();
    
    console.log("Terminated.");
}

p5.Image.prototype.permute = function() {
    
    this.loadPixels();
    
    var cpImg = createImage(this.width, this.height);
    cpImg.loadPixels();
    
    for (var i = 0; i < this.pixels.length; i++) {
        cpImg.pixels[i] = this.pixels[i];
    }
    
    cpImg.updatePixels();
    
    var dw = parseInt(this.width / 2);
    var dh = parseInt(this.height / 2);
    
    for (var i = 0; i < this.width; i++) {
        for (var j = 0; j < this.height; j++) {
            
            if (i%2 == 0) {
                if (j%2 == 0) {
                    this.setColor(i / 2, j / 2, cpImg.getColor(i, j));
                } else {
                    this.setColor(i / 2, (j - 1) / 2 + dh, cpImg.getColor(i, j));
                }
            } else {
                if (j%2 == 0) {
                    this.setColor((i - 1) / 2 + dw, j / 2, cpImg.getColor(i, j));
                } else {
                    this.setColor((i - 1) / 2 + dw, (j - 1) / 2 + dh, cpImg.getColor(i, j));
                }
            }
        }
    }

    this.updatePixels();
}

p5.Image.prototype.resize = function(w, h) {
    
    var newImg = createImage(w, h);
    
    this.loadPixels();
    newImg.loadPixels();
    
    var wratio = this.width / w;
    var hratio = this.height / h;
    
    for (var i = 0; i < w; i++) {
        for (var j = 0; j < h; j++) {
            var x = parseInt(i * wratio);
            var y = parseInt(j * hratio);
            newImg.setColor(i, j, this.getColor(x, y));
        }        
    }
    
    newImg.updatePixels();
    return newImg;
}

p5.Image.prototype.crop = function(x, y, w, h) {
    
    var newImg = createImage(w, h);
    
    this.loadPixels();
    newImg.loadPixels();
    
    for (var i = 0; i < w; i++) {
        for (var j = 0; j < h; j++) {
            newImg.setColor(i, j, this.getColor(x + i, y + j));
        }        
    }
    
    newImg.updatePixels();
    return newImg;
}

p5.Image.prototype.radialExplosion = function(radius, intensity) {
    
    this.loadPixels();
    
    var cpImg = createImage(this.width, this.height);
    cpImg.loadPixels();
    
    for (var i = 0; i < this.pixels.length; i++) {
        cpImg.pixels[i] = this.pixels[i];
    }
    
    cpImg.updatePixels();
    
    var midh = this.height / 2;
    var midw = this.width / 2;
    
    function sumColors(c1, c2, c1Proportion) {
        return 
    }
    
    for (var i = 0; i < this.width; i++) {
        for (var j = 0; j < this.height; j++) {
            var dx = midw - i;
            var dy = midh - j;
            var norma = sqrt(dx * dx + dy * dy);
            dx = dx / norma * intensity * random();
            dy = dy / norma * intensity * random();
            var nb_color = cpImg.getFloatingColor(i + dx, j + dy);
            var old_color = cpImg.getColor(i, j);
            var c1Proportion = min(1, 3 * radius / ( (norma + 1) ));
            var new_color = color( red(old_color) * c1Proportion + red(nb_color) * (1 - c1Proportion),
                                 green(old_color) * c1Proportion + green(nb_color) * (1 - c1Proportion),
                                 blue(old_color) * c1Proportion + blue(nb_color) * (1 - c1Proportion)
                                );
            this.setColor( i, j, new_color );
        }
    }
    
    this.updatePixels();
    
    console.log("Terminated.");
}

p5.Image.prototype.radialBlur = function(intensity) {
    
    intensity /= 1000;
    
    angleMode(RADIANS);
    
    this.loadPixels();
    
    var cpImg = createImage(this.width, this.height);
    cpImg.loadPixels();
    
    for (var i = 0; i < this.pixels.length; i++) {
        cpImg.pixels[i] = this.pixels[i];
    }
    
    cpImg.updatePixels();
    
    var midh = this.height / 2;
    var midw = this.width / 2;
    
    function toPolar(x, y) {
        return {rho: sqrt(x*x + y*y), theta: atan2(y, x)};
    }
    
    function toCartesian(rho, theta) {
        return {x: rho * cos(theta), y: rho * sin(theta)};
    }
    
    for (var i = 0; i < this.width; i++) {
        for (var j = 0; j < this.height; j++) {
            var p1 = {x: i - midw, y: j - midh};
            var p1Polar = toPolar(p1.x, p1.y);
            var p2 = toCartesian(p1Polar.rho * (1 - intensity), p1Polar.theta),
                p3 = toCartesian(p1Polar.rho * (1 + intensity), p1Polar.theta);
            var c1 = cpImg.getFloatingColor(p1.x + midw, p1.y + midh),
                c2 = cpImg.getFloatingColor(p2.x + midw, p2.y + midh),
                c3 = cpImg.getFloatingColor(p3.x + midw, p3.y + midh);
            this.setColor(i, j, color( 0.1 * red(c1) + 0.4 * red(c2) + 0.4 * red(c3),
                                       0.1 * green(c1) + 0.4 * green(c2) + 0.4 * green(c3),
                                       0.1 * blue(c1) + 0.4 * blue(c2) + 0.4 * blue(c3)));
            
        }
    }
    
    this.updatePixels();
    
    console.log("Terminated.");
}

p5.Image.prototype.circularBlur = function(intensity) {
    
    angleMode(RADIANS);
    
    intensity /= 1000;
    
    this.loadPixels();
    
    var cpImg = createImage(this.width, this.height);
    cpImg.loadPixels();
    
    for (var i = 0; i < this.pixels.length; i++) {
        cpImg.pixels[i] = this.pixels[i];
    }
    
    cpImg.updatePixels();
    
    var midh = this.height / 2;
    var midw = this.width / 2;
    
    function toPolar(x, y) {
        return {rho: sqrt(x*x + y*y), theta: atan2(y, x)};
    }
    
    function toCartesian(rho, theta) {
        return {x: rho * cos(theta), y: rho * sin(theta)};
    }
    
    for (var i = 0; i < this.width; i++) {
        for (var j = 0; j < this.height; j++) {
            var p1 = {x: i - midw, y: j - midh};
            var p1Polar = toPolar(p1.x, p1.y);
            var p2 = toCartesian(p1Polar.rho, p1Polar.theta + intensity),
                p3 = toCartesian(p1Polar.rho, p1Polar.theta - intensity);
            var c1 = cpImg.getFloatingColor(p1.x + midw, p1.y + midh),
                c2 = cpImg.getFloatingColor(p2.x + midw, p2.y + midh),
                c3 = cpImg.getFloatingColor(p3.x + midw, p3.y + midh);
            this.setColor(i, j, color( 0.33 * red(c1) + 0.33 * red(c2) + 0.33 * red(c3),
                                       0.33 * green(c1) + 0.33 * green(c2) + 0.33 * green(c3),
                                       0.33 * blue(c1) + 0.33 * blue(c2) + 0.33 * blue(c3)));
            
        }
    }
    
    this.updatePixels();
    
    console.log("Terminated.");
}

p5.Image.prototype.flashlight = function(intensity) {
    
    intensity /= 100;
    
    function f(d, dM) {
        return (dM - d) / dM * (1 + intensity);
    }
    
    this.loadPixels();
    
    var midh = this.height / 2,
        midw = this.width / 2;
    
    var maxD = sqrt(midh*midh + midw*midw) * 0.8 * intensity;
    
    for (var i = 0; i < this.width; i++) {
        for (var j = 0; j < this.height; j++) {
            var p = {x: i - midw, y: j - midh};
            var d = sqrt(p.x*p.x + p.y*p.y);
            var coef = f(d, maxD),
                c = this.getColor(i, j);
            this.setColor(i, j, color(coef * red(c), coef * green(c), coef * blue(c)));
        }
    }    
    this.updatePixels();
}
