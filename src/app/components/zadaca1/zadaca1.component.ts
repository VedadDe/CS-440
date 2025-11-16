import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

interface Tacka {
    x: number;
    y: number;
}

@Component({
    selector: 'app-zadaca1',
    templateUrl: './zadaca1.component.html',
    styleUrls: ['./zadaca1.component.scss']
})
export class Zadaca1Component implements AfterViewInit {
    // Pristupamo referenci na HTML canvas element
    @ViewChild('canvasRef', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

    // Kontekst za crtanje na platnu
    ctx!: CanvasRenderingContext2D;

    // Niz za pohranu tačaka koje korisnik dodaje
    tacke: Tacka[] = [];
    kruznice: { centar: Tacka, poluprecnik: number }[] = [];
    poruka: string = '';

    // Metoda koja se poziva nakon inicijalizacije pogleda
    ngAfterViewInit() {
        // Inicijaliziramo canvas i njegov kontekst nakon što je pogled inicijaliziran
        const canvas = this.canvasRef.nativeElement;
        this.ctx = canvas.getContext('2d')!;
        canvas.width = 600;  // Postavljamo širinu canvas-a na 600 piksela
        canvas.height = 400; // Postavljamo visinu canvas-a na 400 piksela
    }

    onCanvasClick(event: MouseEvent): void {
        const canvas = this.canvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();

        // Correct for device pixel ratio to get accurate coordinates
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        // Calculate the coordinates relative to the canvas and account for scaling
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        // Create a new point and add it to the points array
        const tacka: Tacka = { x, y };
        this.tacke.push(tacka);

        // Draw the point on the canvas
        this.crtajTacku(tacka);
    }

    // Metoda za crtanje tačke na canvas-u
    crtajTacku(tacka: Tacka): void {
        this.ctx.beginPath();
        this.ctx.arc(tacka.x, tacka.y, 5, 0, 2 * Math.PI); // Kreiramo krug na koordinatama tačke
        this.ctx.fillStyle = 'red'; // Postavljamo crvenu boju za ispunu kruga
        this.ctx.fill();  // Popunjavamo krug bojom
        this.ctx.stroke();  // Ocrtavamo konturu kruga
    }

    // Metoda za crtanje segmenta (linije) između posljednje dvije tačke
    crtajSegment(): void {
        // Provjeravamo da li postoje barem dvije tačke kako bi se mogao nacrtati segment
        if (this.tacke.length >= 2) {
            const zadnjaTacka = this.tacke[this.tacke.length - 1];
            const pretposljednjaTacka = this.tacke[this.tacke.length - 2];

            // Crtamo liniju između zadnje dvije tačke
            this.ctx.beginPath();
            this.ctx.moveTo(pretposljednjaTacka.x, pretposljednjaTacka.y);  // Postavljamo početnu tačku linije
            this.ctx.lineTo(zadnjaTacka.x, zadnjaTacka.y);  // Crtamo liniju do zadnje tačke
            this.ctx.strokeStyle = 'blue';  // Postavljamo plavu boju za liniju
            this.ctx.lineWidth = 2;  // Debljina linije
            this.ctx.stroke();  // Crtamo liniju na canvas-u
        }
    }

    // Metoda za crtanje kružnice sa centrom u prvoj tački
    crtajKruznicu(): void {
        // Provjeravamo da li postoje barem dvije tačke kako bi se mogao nacrtati segment
        if (this.tacke.length >= 2) {
            const zadnjaTacka = this.tacke[this.tacke.length - 1];
            const pretposljednjaTacka = this.tacke[this.tacke.length - 2];

            // Izračunavamo poluprečnik kao udaljenost između prve i druge tačke
            const r = Math.sqrt(Math.pow(zadnjaTacka.x - pretposljednjaTacka.x, 2) + Math.pow(zadnjaTacka.y - pretposljednjaTacka.y, 2));

            if (pretposljednjaTacka.x + r > this.canvasRef.nativeElement.width ||
                pretposljednjaTacka.x - r < 0 ||
                pretposljednjaTacka.y + r > this.canvasRef.nativeElement.height ||
                pretposljednjaTacka.y - r < 0) {
                this.poruka = 'Kružnica izlazi izvan granica canvas-a!';
                //alert('Kružnica izlazi izvan granica canvas-a!');
                return;
            }

            if (pretposljednjaTacka.x === zadnjaTacka.x && pretposljednjaTacka.y === zadnjaTacka.y) {
                this.poruka = 'Poluprečnik kružnice ne može biti nula!';
                return;
            }

            this.kruznice.push({ centar: pretposljednjaTacka, poluprecnik: r });

            // Crtamo kružnicu sa centrom u prvoj tački i poluprečnikom r
            this.ctx.beginPath();
            this.ctx.arc(pretposljednjaTacka.x, pretposljednjaTacka.y, r, 0, 2 * Math.PI); // Kreiramo kružnicu
            this.ctx.strokeStyle = 'green';  // Postavljamo zelenu boju za kružnicu
            this.ctx.lineWidth = 2;  // Debljina linije kružnice
            this.ctx.stroke();  // Crtamo kružnicu na canvas-u

            this.crtajSegment();
        }
    }

    // Metoda za provjeru da li je zadnja tačka unutar kružnice
    daLiJeTackaUKruznici(): void {
        if (this.tacke.length < 3) {
            alert('Nema dovoljno tačaka za provjeru!');
            return;
        }

        const zadnjaTacka = this.tacke[this.tacke.length - 1]

        this.poruka = '';

        for (let kruznica of this.kruznice) {
            const udaljenost = Math.sqrt(Math.pow(zadnjaTacka.x - kruznica.centar.x, 2) + Math.pow(zadnjaTacka.y - kruznica.centar.y, 2));

            let novaPoruka = `Centar kružnice: (${kruznica.centar.x}, ${kruznica.centar.y}) - `;

            if (udaljenost < kruznica.poluprecnik) {
                novaPoruka += 'Zadnja tačka je unutar kružnice!';
            } else if (udaljenost > kruznica.poluprecnik) {
                novaPoruka += 'Zadnja tačka je izvan kružnice!';
            } else {
                novaPoruka += 'Zadnja tačka je na kružnici!';
            }

            // Dodaj novu poruku sa novim redom
            if (this.poruka) {
                this.poruka += '\n' + novaPoruka;
            } else {
                this.poruka = novaPoruka;
            }
        }
    }

    // Metoda da li segment siječe kružnicu
    daLiSegmentSijeceKruznicu(): void {
        if (this.tacke.length < 4) {
            alert('Nema dovoljno tačaka za provjeru!');
            return;
        }

        const zadnjaTacka = this.tacke[this.tacke.length - 1];
        const pretposljednjaTacka = this.tacke[this.tacke.length - 2];

        this.crtajSegment();

        this.poruka = '';

        const epsilon = 1e-6; // Tolerancija zbog floating-point grešaka

        for (let kruznica of this.kruznice) {
            const x1 = pretposljednjaTacka.x;
            const y1 = pretposljednjaTacka.y;
            const x2 = zadnjaTacka.x;
            const y2 = zadnjaTacka.y;
            const x0 = kruznica.centar.x;
            const y0 = kruznica.centar.y;
            const r = kruznica.poluprecnik;

            // Provjeravamo udaljenost krajeva segmenta od centra kružnice
            const d1 = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
            const d2 = Math.sqrt((x2 - x0) ** 2 + (y2 - y0) ** 2);

            const jeTacka1Unutar = d1 < r + epsilon;
            const jeTacka2Unutar = d2 < r + epsilon;

            let novaPoruka = `Centar kružnice: (${x0}, ${y0}) - `;

            // Ako su oba kraja unutar -> segment je unutar
            if (jeTacka1Unutar && jeTacka2Unutar) {
                novaPoruka += 'Segment je unutar kružnice.';
            } else {
                // Izračunavamo parametre kvadratne jednačine presjeka linije i kružnice
                const dx = x2 - x1;
                const dy = y2 - y1;
                const A = dx * dx + dy * dy;
                const B = 2 * (dx * (x1 - x0) + dy * (y1 - y0));
                const C = (x1 - x0) ** 2 + (y1 - y0) ** 2 - r ** 2;

                const diskriminanta = B * B - 4 * A * C;

                // Provjera presjeka
                let sijece = false;
                if (diskriminanta >= -epsilon) { // diskriminanta >= 0 uz toleranciju
                    const sqrtD = Math.sqrt(Math.max(diskriminanta, 0)); // izbjegavanje negativnog sqrt
                    const t1 = (-B - sqrtD) / (2 * A);
                    const t2 = (-B + sqrtD) / (2 * A);

                    // Ako je barem jedan presjek unutar segmenta -> siječe kružnicu
                    if ((t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)) {
                        sijece = true;
                    }
                }

                if (sijece) {
                    novaPoruka += 'Segment siječe kružnicu.';
                } else {
                    novaPoruka += 'Segment je van kružnice.';
                }
            }

            if (this.poruka) {
                this.poruka += '\n' + novaPoruka;
            } else {
                this.poruka = novaPoruka;
            }
        }
    }

    // Opcionalna metoda za brisanje canvas-a i resetiranje tačaka
    ocistiCanvas(): void {
        const canvas = this.canvasRef.nativeElement;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);  // Brišemo cijeli sadržaj canvas-a
        this.tacke = [];  // Praznimo niz tačaka
        this.kruznice = [];
        this.poruka = '';
    }
}
