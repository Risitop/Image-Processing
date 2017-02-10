var img;

function preload() {
    img = loadImage("assets/melenchon.jpg");    
}

function setup() {
    createCanvas(img.width, img.height);
    pixelDensity(1);
    image(img, 0, 0);
    loadPixels();
    //blackAndWhite();
    cartoonize();
}

function draw() {
    
}

function blackAndWhite() {
    for (var i = 0; i < pixels.length; i += 4) {
        var v = parseInt(0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]);
        var gray = color(v, v, v);
        pixels[i] = red(gray);
        pixels[i + 1] = green(gray);
        pixels[i + 2] = blue(gray);
        pixels[i + 3] = alpha(gray);
    }
    updatePixels();
}

function cartoonize() {
    var hValues = [0, 0.2, 0.5, 0.8, 1];
    var sValues = [0, 0.2, 0.5, 0.8, 1];
    var vValues = [0, 0.2, 0.5, 0.8, 1];
    for (var i = 0; i < pixels.length; i += 4) {
        var hsv_color = RGBtoHSV(pixels[i], pixels[i + 1], pixels[i + 2]);
        var new_h = find_closest_value(hValues, hsv_color.h);
        var new_s = find_closest_value(sValues, hsv_color.s);
        var new_v = find_closest_value(vValues, hsv_color.v);
        var new_color = HSVtoRGB(new_h, new_s, new_v);
        pixels[i] = red(new_color);
        pixels[i + 1] = green(new_color);
        pixels[i + 2] = blue(new_color);
        pixels[i + 3] = alpha(new_color);
    }
    updatePixels();
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