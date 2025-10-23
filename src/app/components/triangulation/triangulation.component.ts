import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-triangulation',
  templateUrl: './triangulation.component.html',
  styleUrls: ['./triangulation.component.scss'],
})
export class TriangulationComponent implements AfterViewInit {
  // 
  // Fields
  // 
  @ViewChild('polygonCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private kontekst!: CanvasRenderingContext2D;
  private tacke: { x: number; y: number }[] = [];
  n: number = 3;
  pocetakSegmenta: { x: number; y: number } | null = null;
  krajSegmenta: { x: number; y: number } | null = null;
  segment: boolean = false;

  // Dodana svojstva za triangulaciju
  private trouglovi: number[][] = [];

  // 
  // Lifecycle
  // 
  ngAfterViewInit(): void {
    const kontekst = this.canvasRef.nativeElement.getContext('2d');
    if (!kontekst) {
      throw new Error('Ne može se dobiti 2D kontekst za canvas.');
    }
    this.kontekst = kontekst;
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private resizeCanvas(): void {
    this.canvasRef.nativeElement.width = window.innerWidth * 0.8;
    this.canvasRef.nativeElement.height = window.innerHeight * 0.8;
    console.log('Canvas promijenjen na veličinu:', this.canvasRef.nativeElement.width, 'x', this.canvasRef.nativeElement.height);
  }

  // 
  // Event handlers
  // 
  onCanvasClick(event: MouseEvent): void {
    if (this.segment) {
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (!this.pocetakSegmenta) {
        this.pocetakSegmenta = { x, y };
        console.log(`Početak segmenta postavljen na (${x.toFixed(2)}, ${y.toFixed(2)})`);
      } else if (!this.krajSegmenta) {
        this.krajSegmenta = { x, y };
        console.log(`Kraj segmenta postavljen na (${x.toFixed(2)}, ${y.toFixed(2)})`);
        this.crtajSegment(this.pocetakSegmenta, this.krajSegmenta);

        if (this.ispitivanjePresjeka(this.pocetakSegmenta, this.krajSegmenta)) {
          alert('Segment siječe poligon.');
          console.log('Segment siječe poligon.');
        } else {
          const midtacka = { x: (this.pocetakSegmenta.x + this.krajSegmenta.x) / 2, y: (this.pocetakSegmenta.y + this.krajSegmenta.y) / 2 };
          if (this.jeLiTackaUPoligonu(midtacka)) {
            alert('Segment je u poligonu.');
            console.log('Segment je u poligonu.');
          } else {
            alert('Segment je van poligona.');
            console.log('Segment je van poligona.');
          }
        }

        this.pocetakSegmenta = null;
        this.krajSegmenta = null;
      }
    } else {
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const uPoligonu = this.jeLiTackaUPoligonu({ x, y });
      if (uPoligonu) {
        alert('Tačka je u poligonu.');
        console.log(`Tačka (${x.toFixed(2)}, ${y.toFixed(2)}) je u poligonu.`);
      } else {
        alert('Tačka nije u poligonu.');
        console.log(`Tačka (${x.toFixed(2)}, ${y.toFixed(2)}) nije u poligonu.`);
      }
    }
  }

  // 
  // Public actions
  // 
  generisiPoligon(): void {
    if (this.n >= 3) {
      console.log(`Generisanje poligona sa ${this.n} tačaka.`);
      this.tacke = this.generisiRandomtacke(this.n);
      this.tacke = this.sortirajTackePoPolarnomUglu(this.tacke);
      this.kontekst.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);

      this.kontekst.beginPath();
      this.kontekst.moveTo(this.tacke[0].x, this.tacke[0].y);

      for (let i = 1; i < this.tacke.length; i++) {
        this.kontekst.lineTo(this.tacke[i].x, this.tacke[i].y);
      }

      this.kontekst.closePath();
      this.kontekst.stroke();
      console.log('Poligon nacrtan na canvas.');

      for (let i = 0; i < this.tacke.length; i++) {
        this.crtajTacku(i, this.tacke[i].x, this.tacke[i].y);
      }
    }
  }

  segmentIliTacka() {
    this.segment = !this.segment;
    console.log(`Mod promijenjen na: ${this.segment ? 'Segment' : 'Tačka'}`);
  }

  jeLiTackaUPoligonu(tacka: { x: number; y: number }): boolean {
    let presjeci = 0;
    const testLinija = { a: tacka, b: { x: this.canvasRef.nativeElement.width + 1, y: tacka.y } };

    for (let i = 0; i < this.tacke.length; i++) {
      const a = this.tacke[i];
      const b = (this.tacke[(i + 1) % this.tacke.length]);

      const sePresjecu = this.daLiSeLinijePresjecu(a, b, testLinija.a, testLinija.b);
      if (sePresjecu) {
        presjeci++;
        console.log(`Linije presjecu: indeks ${i} - indeks ${(i + 1) % this.tacke.length}`);
      }
    }

    console.log(`Broj presjeka: ${presjeci}`);
    return presjeci % 2 !== 0;
  }

  daLiSeLinijePresjecu(a1: { x: number; y: number }, a2: { x: number; y: number }, b1: { x: number; y: number }, b2: { x: number; y: number }): boolean {
    const d = (a1.x - a2.x) * (b2.y - b1.y) - (a1.y - a2.y) * (b2.x - b1.x);
    if (d === 0) return false;

    const s = ((a1.x - b1.x) * (b2.y - b1.y) - (a1.y - b1.y) * (b2.x - b1.x)) / d;
    const t = ((a1.x - a2.x) * (a1.y - b1.y) - (a1.y - a2.y) * (a1.x - b1.x)) / d;

    return s >= 0 && s <= 1 && t >= 0 && t <= 1;
  }

  ispitivanjePresjeka(pocetakSegmenta: { x: number; y: number }, krajSegmenta: { x: number; y: number }): boolean {
    for (let i = 0; i < this.tacke.length; i++) {
      const a = this.tacke[i];
      const b = (this.tacke[(i + 1) % this.tacke.length]);

      if (this.daLiSeLinijePresjecu(a, b, pocetakSegmenta, krajSegmenta)) {
        console.log(`Segment presjekao ivicu poligona: indeks ${i} - indeks ${(i + 1) % this.tacke.length}`);
        return true;
      }
    }

    return false;
  }

  generisiIIspitajNTacaka(): void {
    const slucajneTacke = this.generisiRandomtacke(1000);
    console.log('Generisano 1000 nasumičnih tačaka za ispitivanje.');

    for (let i = 0; i < slucajneTacke.length; i++) {
      const tacka = slucajneTacke[i];
      if (this.jeLiTackaUPoligonu(tacka)) {
        this.crtajTackuUBoji(i, tacka.x, tacka.y, 'red');
      } else {
        this.crtajTackuUBoji(i, tacka.x, tacka.y, 'blue');
      }
    }
  }

  // 
  // Geometry helpers
  // 
  private izracunajCentroid(tacke: { x: number; y: number }[]): { x: number; y: number } {
    const centroid = { x: 0, y: 0 };

    for (const tacka of tacke) {
      centroid.x += tacka.x;
      centroid.y += tacka.y;
    }

    centroid.x /= tacke.length;
    centroid.y /= tacke.length;

    return centroid;
  }

  private sortirajTackePoPolarnomUglu(tacke: { x: number; y: number }[]): { x: number; y: number }[] {
    const centroid = this.izracunajCentroid(tacke);
    console.log(`Centroid poligona: (${centroid.x.toFixed(2)}, ${centroid.y.toFixed(2)})`);

    tacke.sort((a, b) => {
      const ugaoA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
      const ugaoB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
      return ugaoA - ugaoB;
    });

    console.log('Tačke sortirane po polarnom uglu.');
    return tacke;
  }

  private generisiRandomtacke(n: number): { x: number; y: number }[] {
    const tacke: { x: number; y: number }[] = [];
    const sirina = this.canvasRef.nativeElement.width;
    const visina = this.canvasRef.nativeElement.height;

    for (let i = 0; i < n; i++) {
      const tacka = {
        x: Math.random() * sirina,
        y: Math.random() * visina,
      };
      tacke.push(tacka);
      console.log(`Generisana tačka ${i}: indeks ${i}`);
    }

    return tacke;
  }

  // 
  // Drawing helpers
  // 
  private crtajTacku(index: number, x: number, y: number): void {
    this.kontekst.beginPath();
    this.kontekst.arc(x, y, 3, 0, 2 * Math.PI);
    this.kontekst.fillStyle = 'black';
    this.kontekst.fill();
    console.log(`Tačka indeks ${index} nacrtana.`);
  }

  crtajSegment(start: { x: number; y: number }, end: { x: number; y: number }): void {
    this.kontekst.beginPath();
    this.kontekst.moveTo(start.x, start.y);
    this.kontekst.lineTo(end.x, end.y);
    this.kontekst.stroke();
    console.log(`Segment nacrtan od (${start.x.toFixed(2)}, ${start.y.toFixed(2)}) do (${end.x.toFixed(2)}, ${end.y.toFixed(2)})`);
  }

  crtajTackuUBoji(index: number, x: number, y: number, boja: string): void {
    this.kontekst.beginPath();
    this.kontekst.arc(x, y, 3, 0, 2 * Math.PI);
    this.kontekst.fillStyle = boja;
    this.kontekst.fill();
    console.log(`Tačka indeks ${index} nacrtana u boji ${boja}.`);
  }
}
