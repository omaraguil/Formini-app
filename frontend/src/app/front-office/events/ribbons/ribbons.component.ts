import { Component, ElementRef, Input, OnInit, OnDestroy, ViewChild, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

interface Point {
    x: number;
    y: number;
    vx: number;
    vy: number;
    age: number;
}

interface Ribbon {
    points: Point[];
    color: string;
    thickness: number;
}

@Component({
    selector: 'app-ribbons',
    standalone: true,
    imports: [CommonModule],
    template: '<canvas #canvasContainer></canvas>',
    styles: [`
    canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  `]
})
export class RibbonsComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('canvasContainer') canvasRef!: ElementRef<HTMLCanvasElement>;

    @Input() colors: string[] = ["#FC8EAC"];
    @Input() baseSpring: number = 0.03;
    @Input() baseFriction: number = 0.9;
    @Input() baseThickness: number = 30;
    @Input() offsetFactor: number = 0.05;
    @Input() maxAge: number = 500;
    @Input() pointCount: number = 50;
    @Input() speedMultiplier: number = 0.6;
    @Input() enableFade: boolean = false;
    @Input() enableShaderEffect: boolean = false;
    @Input() effectAmplitude: number = 2;

    private ctx!: CanvasRenderingContext2D;
    private animationId: number = 0;
    private ribbons: Ribbon[] = [];
    private mouse = { x: -1000, y: -1000 };
    private isMouseMoving = false;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

    ngOnInit(): void { }

    ngAfterViewInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.initCanvas();
            this.animate();
            window.addEventListener('resize', this.handleResize.bind(this));
            window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        }
    }

    ngOnDestroy(): void {
        if (isPlatformBrowser(this.platformId)) {
            cancelAnimationFrame(this.animationId);
            window.removeEventListener('resize', this.handleResize.bind(this));
            window.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        }
    }

    private initCanvas(): void {
        const canvas = this.canvasRef.nativeElement;
        this.ctx = canvas.getContext('2d')!;
        this.handleResize();
        this.createRibbons();
    }

    private handleResize(): void {
        const canvas = this.canvasRef.nativeElement;
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }
    }

    private handleMouseMove(e: MouseEvent): void {
        const canvas = this.canvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        this.isMouseMoving = true;
    }

    private createRibbons(): void {
        this.ribbons = [];
        const colorCount = this.colors.length;
        for (let i = 0; i < 3; i++) { // Create 3 ribbons for depth
            this.ribbons.push({
                points: [],
                color: this.colors[i % colorCount],
                thickness: this.baseThickness * (1 - i * 0.2)
            });
        }
    }

    private updatePoints(): void {
        const targetX = this.isMouseMoving ? this.mouse.x : (Math.sin(Date.now() * 0.001 * this.speedMultiplier) * 200 + this.canvasRef.nativeElement.width / 2);
        const targetY = this.isMouseMoving ? this.mouse.y : (Math.cos(Date.now() * 0.0015 * this.speedMultiplier) * 200 + this.canvasRef.nativeElement.height / 2);

        this.ribbons.forEach((ribbon, rIdx) => {
            // Offset targets for each ribbon
            const offset = (rIdx - 1) * this.offsetFactor * 100;
            const currentTargetX = targetX + offset;
            const currentTargetY = targetY + offset;

            // Add new point at current target
            ribbon.points.unshift({
                x: currentTargetX,
                y: currentTargetY,
                vx: 0,
                vy: 0,
                age: 0
            });

            // Maintain point count
            if (ribbon.points.length > this.pointCount) {
                ribbon.points.pop();
            }

            // Physics update: each point follows the one before it
            for (let i = 1; i < ribbon.points.length; i++) {
                const p = ribbon.points[i];
                const prev = ribbon.points[i - 1];

                const dx = prev.x - p.x;
                const dy = prev.y - p.y;

                p.vx += dx * this.baseSpring;
                p.vy += dy * this.baseSpring;
                p.vx *= this.baseFriction;
                p.vy *= this.baseFriction;

                p.x += p.vx;
                p.y += p.vy;
                p.age++;

                if (this.enableShaderEffect) {
                    p.x += Math.sin(p.age * 0.1) * this.effectAmplitude;
                    p.y += Math.cos(p.age * 0.1) * this.effectAmplitude;
                }
            }
        });
    }

    private draw(): void {
        const canvas = this.canvasRef.nativeElement;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.ribbons.forEach((ribbon) => {
            if (ribbon.points.length < 2) return;

            this.ctx.beginPath();
            this.ctx.lineJoin = 'round';
            this.ctx.lineCap = 'round';
            this.ctx.strokeStyle = ribbon.color;
            this.ctx.lineWidth = ribbon.thickness;

            if (this.enableFade) {
                // Advanced fade logic would need segments with different alphas
                // For simplicity, we use globalAlpha or just one stroke
                this.ctx.globalAlpha = 0.5;
            }

            this.ctx.moveTo(ribbon.points[0].x, ribbon.points[0].y);

            for (let i = 1; i < ribbon.points.length; i++) {
                const p = ribbon.points[i];
                const prev = ribbon.points[i - 1];

                // Quadratic curve for smoothness
                const xc = (p.x + prev.x) / 2;
                const yc = (p.y + prev.y) / 2;
                this.ctx.quadraticCurveTo(prev.x, prev.y, xc, yc);
            }

            this.ctx.stroke();
            this.ctx.globalAlpha = 1.0;
        });
    }

    private animate(): void {
        this.updatePoints();
        this.draw();
        this.animationId = requestAnimationFrame(this.animate.bind(this));
    }
}
