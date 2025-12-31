// script.js

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let cw = window.innerWidth;
let ch = window.innerHeight;

// STATES
let programState = 0; 
let fireworks = [];
let particles = [];
const explosionSound = document.getElementById('explosion-sound');

canvas.width = cw;
canvas.height = ch;

// === MATH & UTILS ===
function random(min, max) {
    return Math.random() * (max - min) + min;
}
function calculateDistance(p1x, p1y, p2x, p2y) {
    let xDistance = p1x - p2x;
    let yDistance = p1y - p2y;
    return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}
function playSound() {
    let soundClone = explosionSound.cloneNode();
    soundClone.volume = 0.4;
    soundClone.play().catch(()=>{});
}

// === LỚP FIREWORK ===
function Firework(sx, sy, tx, ty, type) {
    this.x = sx;
    this.y = sy;
    this.sx = sx;
    this.sy = sy;
    this.tx = tx;
    this.ty = ty;
    this.distanceToTarget = calculateDistance(sx, sy, tx, ty);
    this.distanceTraveled = 0;
    this.coordinates = [];
    this.coordinateCount = 3;
    while(this.coordinateCount--) { this.coordinates.push([this.x, this.y]); }
    this.angle = Math.atan2(ty - sy, tx - sx);
    this.speed = 2;
    this.acceleration = 1.05;
    this.brightness = random(50, 70);
    this.type = type;
    this.hue = random(0, 360);
}

Firework.prototype.update = function(index) {
    this.coordinates.pop();
    this.coordinates.unshift([this.x, this.y]);
    this.speed *= this.acceleration;
    let vx = Math.cos(this.angle) * this.speed;
    let vy = Math.sin(this.angle) * this.speed;
    this.distanceTraveled = calculateDistance(this.sx, this.sy, this.x + vx, this.y + vy);

    if (this.distanceTraveled >= this.distanceToTarget) {
        if (this.type === 'heart') {
            createHeartParticles(this.tx, this.ty);
        } else if (this.type === 'recursive') {
            createParticles(this.tx, this.ty, this.hue, 2); 
        } else {
            createParticles(this.tx, this.ty, this.hue, 0); 
        }
        playSound();
        fireworks.splice(index, 1);
        if (this.type === 'heart') triggerCelebration();
    } else {
        this.x += vx;
        this.y += vy;
    }
}

Firework.prototype.draw = function() {
    ctx.beginPath();
    ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
    ctx.lineTo(this.x, this.y);
    ctx.strokeStyle = 'hsl(' + this.hue + ', 100%, ' + this.brightness + '%)';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// === LỚP PARTICLE ===
function Particle(x, y, hue, tier) {
    this.x = x;
    this.y = y;
    this.coordinates = [];
    this.coordinateCount = 5;
    while(this.coordinateCount--) { this.coordinates.push([this.x, this.y]); }
    this.angle = random(0, Math.PI * 2);
    this.speed = random(1, 10);
    this.friction = 0.95;
    this.gravity = 1;
    this.hue = hue;
    this.brightness = random(50, 80);
    this.alpha = 1;
    this.decay = random(0.015, 0.03);
    this.tier = tier;
}

Particle.prototype.update = function(index) {
    this.coordinates.pop();
    this.coordinates.unshift([this.x, this.y]);
    this.speed *= this.friction;
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed + this.gravity;
    this.hue += 2; 
    this.alpha -= this.decay;
    if (this.alpha <= 0.2 && this.alpha > 0 && this.tier > 0) {
        if (Math.random() < 0.1) { 
            createParticles(this.x, this.y, this.hue, this.tier - 1);
            this.tier = 0;
        }
    }
    if (this.alpha <= this.decay) particles.splice(index, 1);
}

Particle.prototype.draw = function() {
    ctx.beginPath();
    ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
    ctx.lineTo(this.x, this.y);
    ctx.strokeStyle = 'hsla(' + this.hue + ', 100%, ' + this.brightness + '%, ' + this.alpha + ')';
    ctx.stroke();
}

function createParticles(x, y, hue, tier) {
    let count = (tier === 2) ? 50 : (tier === 1 ? 20 : 10); 
    if(tier === 0 && programState === 4) count = 30; 
    while (count--) particles.push(new Particle(x, y, hue + random(-20, 20), tier));
}

// === THAY ĐỔI QUAN TRỌNG Ở ĐÂY: TRÁI TIM SIÊU TO KHỔNG LỒ ===
function createHeartParticles(x, y) {
    // 1. Tăng số lượng hạt để DÀY HƠN (Denser)
    // Trước đây là 200, giờ tăng lên 500 hạt
    let count = 500; 
    let baseHue = 340; // Màu hồng/đỏ
    
    for (let i = 0; i < count; i++) {
        let p = new Particle(x, y, baseHue, 0);
        let angle = (Math.PI * 2 * i) / count;
        
        // Công thức hình tim
        let vx = 16 * Math.pow(Math.sin(angle), 3);
        let vy = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
        
        // Lực bung nhẹ
        let force = random(1, 1.2); 
        
        p.angle = Math.atan2(vy, vx);
        
        // 2. Tăng hệ số nhân để TO RA (Bigger)
        // Trước đây là 0.6, giờ tăng lên 1.2 để bán kính nổ rất lớn
        let multiplier = 1.2; 
        
        p.speed = Math.sqrt(vx*vx + vy*vy) * multiplier * force;
        
        // 3. Giảm tốc độ mờ để hạt sống lâu hơn, đủ thời gian bay ra xa tạo hình to
        p.decay = 0.005; 
        // Giữ trọng lực thấp để tim "treo" trên không lâu
        p.gravity = 0.5; 
        
        particles.push(p);
    }
}

// === LOGIC ===
function runCountdown() {
    programState = 1;
    let count = 3;
    const el = document.getElementById('countdown');
    el.style.display = 'block';
    let timer = setInterval(() => {
        if(count > 0) {
            el.innerText = count;
            el.classList.remove('count-animate');
            void el.offsetWidth;
            el.classList.add('count-animate');
            count--;
        } else {
            clearInterval(timer);
            el.style.display = 'none';
            // Bắn pháo tim lên vị trí đẹp để nổ to
            fireworks.push(new Firework(cw/2, ch, cw/2, ch/2.5, 'heart'));
        }
    }, 1000);
}

function triggerCelebration() {
    programState = 4;
    const content = document.getElementById('celebration-content');
    content.classList.remove('hidden');
    setTimeout(() => content.classList.add('visible'), 100);
}

function loop() {
    requestAnimationFrame(loop);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = 'lighter';

    let i = fireworks.length;
    while(i--) { fireworks[i].draw(); fireworks[i].update(i); }
    let j = particles.length;
    while(j--) { particles[j].draw(); particles[j].update(j); }

    if (programState === 4) {
        if (random(0, 100) < 5) { 
            let type = Math.random() < 0.3 ? 'recursive' : 'normal';
            fireworks.push(new Firework(random(0, cw), ch, random(100, cw-100), random(0, ch/2), type));
        }
    }
}

window.addEventListener('resize', () => {
    cw = window.innerWidth; ch = window.innerHeight;
    canvas.width = cw; canvas.height = ch;
});

document.getElementById('start-screen').addEventListener('click', function() {
    this.style.opacity = 0;
    setTimeout(() => this.style.display = 'none', 500);
    new Audio().play().catch(()=>{});
    runCountdown();
    loop();
});