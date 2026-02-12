// ===== CONFETTI ANIMATION =====
class ConfettiCelebration {
    constructor() {
        this.canvas = document.getElementById('confettiCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        this.setupCanvas();
    }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }
    
    createParticle() {
        const colors = ['#4DA8FF', '#3A8CDA', '#1E6BBF', '#00A0E9', '#10b981', '#f59e0b'];
        return {
            x: Math.random() * this.canvas.width,
            y: -10,
            size: Math.random() * 8 + 4,
            speedY: Math.random() * 3 + 2,
            speedX: Math.random() * 4 - 2,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            shape: Math.random() > 0.5 ? 'circle' : 'square'
        };
    }
    
    drawParticle(particle) {
        this.ctx.save();
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate((particle.rotation * Math.PI) / 180);
        this.ctx.fillStyle = particle.color;
        
        if (particle.shape === 'circle') {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        }
        
        this.ctx.restore();
    }
    
    updateParticle(particle) {
        particle.y += particle.speedY;
        particle.x += particle.speedX;
        particle.rotation += particle.rotationSpeed;
        particle.speedY += 0.1; // Gravedad
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles = this.particles.filter(particle => {
            this.updateParticle(particle);
            this.drawParticle(particle);
            return particle.y < this.canvas.height;
        });
        
        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }
    
    celebrate() {
        // Crear ráfaga de confetti
        for (let i = 0; i < 80; i++) {
            setTimeout(() => {
                this.particles.push(this.createParticle());
            }, i * 10);
        }
        
        this.animate();
    }
}

// Inicializar confetti
const confetti = new ConfettiCelebration();

// Función global para celebrar
window.celebrateSuccess = function() {
    confetti.celebrate();
};
