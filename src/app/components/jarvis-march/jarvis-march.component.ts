import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-jarvis-march',
  templateUrl: './jarvis-march.component.html',
  styleUrls: ['./jarvis-march.component.scss']
})
export class JarvisMarchComponent {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  tacke: { x: number; y: number }[] = [];
  omotaci: { x: number; y: number }[][] = [];
  generisaniOmotači: boolean = false;  // Flag za provjeru da su omotači generisani, nakon kliknutog dugmeta za poziv DivideIntoConvex postavlja se na true 

  ngOnInit(): void {
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    const kontekst = canvasEl.getContext('2d');
    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight;
    canvasEl.addEventListener('click', (dogadjaj: MouseEvent) => {
      const pravougaonik = canvasEl.getBoundingClientRect();
      const x = dogadjaj.clientX - pravougaonik.left;
      const y = dogadjaj.clientY - pravougaonik.top;

      if (this.generisaniOmotači) {
        // Provjera za tačku nakon generisanja omotača
        this.provjeraTacke({ x, y });
      } else {
        // dodavanje tački ako omotači nisu generisani
        this.tacke.push({ x, y });
        if (kontekst) {
          this.crtajTacke(kontekst);
        }
      }
    });
  }

  // IDEJA ALGORITMA:
  //
  //    - Algoritam iterativno pronalazi konveksni omotač preostalih tačaka
  //      i uklanja te tačke iz skupa.
  //    - Svaka iteracija stvara jedan "sloj" omotača, sve dok ostane manje od 3 tačke.
  //     - Koristimo Graham Scan ili njegovu bržu verziju
  //    - Kod brze verzije na početku sortiramo tačke po x i y koordinati (jedanput, O(n log n)).
  //    - Time izbjegavamo višestruko sortiranje po uglu i ubrzavamo cijeli postupak.
  //    - Nakon što pronađemo omotač, uklanjamo njegove tačke iz skupa.
  //    - Proces se ponavlja dok ne ostane manje od 3 tačke.
  //    - Rezultat: niz slojeva omotača (omotaci[0] = vanjski sloj, itd.)

  // DivideIntoConvex: kreiranje omotača, trenutno generise samo jedan omotač
  /*
  DivideIntoConvex(): void {
    this.generisaniOmotači = true
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    const kontekst = canvasEl.getContext('2d');

    if (!kontekst) return;

    let preostaleTeacke = [...this.tacke];
    this.omotaci = [];

    while (preostaleTeacke.length >= 3) {
      const omotac = this.grahamovAlgoritam(preostaleTeacke);

      this.omotaci.push(omotac);

      this.crtajOmotac(kontekst, omotac);

      console.log(`Omotač ${this.omotaci.length}: ${omotac.length} tačaka`, omotac);

      preostaleTeacke = preostaleTeacke.filter(tacka =>
        !omotac.some(omotacTacka =>
          omotacTacka.x === tacka.x && omotacTacka.y === tacka.y
        )
      );

      // let omotac = this.grahamovAlgoritam(this.tacke)
      // this.crtajOmotac(kontekst, omotac)
      // if (this.tacke.length <= 3)
      //   return
    }
  }
    */

  DivideIntoConvex(): void {
    this.generisaniOmotači = true;

    const canvasEl = this.canvas.nativeElement;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    this.omotaci = [];

    let pts = [...this.tacke].sort((a, b) =>
      a.x === b.x ? a.y - b.y : a.x - b.x
    );

    while (pts.length >= 3) {

      const hull = this.grahamovAlgoritamFast(pts);

      this.omotaci.push(hull);
      this.crtajOmotac(ctx, hull);

      console.log(`Omotač ${this.omotaci.length}:`);

      const set = new Set(hull.map(p => `${p.x},${p.y}`));
      pts = pts.filter(p => !set.has(`${p.x},${p.y}`));
    }
  }


  // provjeraTacke: 
  provjeraTacke(point: { x: number; y: number }): void {
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    const kontekst = canvasEl.getContext('2d');

    if (!kontekst) return;

    this.omotaci.forEach(omotac => {
      const sadrzi = this.tackaUOmotacu(point, omotac);

      kontekst.strokeStyle = sadrzi ? 'yellow' : 'red';
      kontekst.fillStyle = 'rgba(0,0,0,0)';
      kontekst.beginPath();
      kontekst.moveTo(omotac[0].x, omotac[0].y);
      for (let i = 1; i < omotac.length; i++) {
        kontekst.lineTo(omotac[i].x, omotac[i].y);
      }
      kontekst.closePath();
      kontekst.stroke();
    });

    //
    //this.crtajOmotac(kontekst, omotac)
  }

  tackaUOmotacu(point: { x: number; y: number }, hull: { x: number; y: number }[]): boolean {
    let unutra = false;
    const n = hull.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = hull[i].x, yi = hull[i].y;
      const xj = hull[j].x, yj = hull[j].y;

      const intersect =
        (yi > point.y) !== (yj > point.y) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);

      if (intersect) unutra = !unutra;
    }

    return unutra;
  }

  crtajOmotac(kontekst: CanvasRenderingContext2D | null, omotac: { x: number; y: number }[], color: string = 'red'): void {
    if (!kontekst) return;
    kontekst.strokeStyle = color;
    kontekst.beginPath();
    kontekst.moveTo(omotac[0].x, omotac[0].y);
    for (let i = 1; i < omotac.length; i++) {
      kontekst.lineTo(omotac[i].x, omotac[i].y);
    }
    kontekst.closePath();
    kontekst.stroke();
  }


  //invertovan koordinatni sistem, kako bi se poklapao sa tradicionalnim pogledom
  //   jarvisMarch(tacke: { x: number; y: number }[], canvasHeight: number): { x: number; y: number }[] { 
  //     const transformedPoints = tacke.map(point => ({ x: point.x, y: canvasHeight - point.y }));
  //     let najniziIndeks = 0;
  //     for (let i = 1; i < transformedPoints.length; i++) {
  //       if (
  //         transformedPoints[i].y < transformedPoints[najniziIndeks].y || 
  //         (transformedPoints[i].y === transformedPoints[najniziIndeks].y && transformedPoints[i].x < transformedPoints[najniziIndeks].x)
  //       ) {
  //         najniziIndeks = i;
  //       }
  //     }
  //     console.log(najniziIndeks)


  //     const omotac: { x: number; y: number }[] = [transformedPoints[najniziIndeks]];

  //     let trenutnaTacka = najniziIndeks;
  //     let krajnjaTacka: number;
  //     do {
  //       krajnjaTacka = 0;
  //       for (let i = 1; i < transformedPoints.length; i++) {
  //         if (
  //           trenutnaTacka === krajnjaTacka || 
  //           this.jeSuprotnoOdSata(transformedPoints[trenutnaTacka], transformedPoints[i], transformedPoints[krajnjaTacka])
  //         ) {
  //           krajnjaTacka = i;
  //         }
  //       }
  //       omotac.push(transformedPoints[krajnjaTacka]);
  //       trenutnaTacka = krajnjaTacka;
  //     } while (trenutnaTacka !== najniziIndeks);

  //     const result = omotac.map(point => ({ x: point.x, y: canvasHeight - point.y }));
  //     return result;
  // }

  jarvisMarch(tacke: { x: number; y: number }[]): { x: number; y: number }[] {
    let najniziIndeks = 0;
    for (let i = 1; i < tacke.length; i++) {
      if (tacke[i].y < tacke[najniziIndeks].y || (tacke[i].y === tacke[najniziIndeks].y && tacke[i].x < tacke[najniziIndeks].x)) {
        najniziIndeks = i;
      }
    }
    console.log(najniziIndeks)
    const omotac: { x: number; y: number }[] = [tacke[najniziIndeks]];

    let trenutnaTacka = najniziIndeks;
    let krajnjaTacka: number;
    do {
      krajnjaTacka = 0;
      for (let i = 1; i < tacke.length; i++) {
        if (trenutnaTacka === krajnjaTacka || this.jeSuprotnoOdSata(tacke[trenutnaTacka], tacke[i], tacke[krajnjaTacka])) {
          console.log(trenutnaTacka, i, krajnjaTacka, "test1")
          krajnjaTacka = i;
        }
      }
      omotac.push(tacke[krajnjaTacka]);
      trenutnaTacka = krajnjaTacka;
      console.log(trenutnaTacka, najniziIndeks, "test2")
    } while (trenutnaTacka !== najniziIndeks);

    return omotac;
  }


  grahamovAlgoritam(tacke: { x: number; y: number }[]): { x: number; y: number }[] {
    let najniziIndeks = 0;
    for (let i = 1; i < tacke.length; i++) {
      if (tacke[i].y < tacke[najniziIndeks].y || (tacke[i].y === tacke[najniziIndeks].y && tacke[i].x < tacke[najniziIndeks].x)) {
        najniziIndeks = i;
      }
    }
    const omotac: { x: number; y: number }[] = [tacke[najniziIndeks]];

    let najniziIndeksTacka = tacke[najniziIndeks]
    tacke.splice(najniziIndeks, 1);

    tacke.sort((a, b) => this.porediPolarniUgao(najniziIndeksTacka, a, b));
    omotac.push(tacke[0])
    tacke.splice(0, 1);

    for (let i = 0; i < tacke.length; i++) {

      while (
        omotac.length >= 2 &&
        this.vektorskiProizvod(
          omotac[omotac.length - 2],
          omotac[omotac.length - 1],
          tacke[i]
        ) <= 0
      ) {
        omotac.pop();
      }
      omotac.push(tacke[i]);
    }

    return omotac;
  }

  grahamovAlgoritamFast(points: { x: number; y: number }[]): { x: number; y: number }[] {
    if (points.length <= 1) return points;

    const cross = (o: any, a: any, b: any) =>
      (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

    const lower: any[] = [];
    for (const p of points) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
        lower.pop();
      }
      lower.push(p);
    }

    const upper: any[] = [];
    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
        upper.pop();
      }
      upper.push(p);
    }

    upper.pop();
    lower.pop();
    return lower.concat(upper);
  }




  vektorskiProizvod(o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  porediPolarniUgao(tacka0: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
    const vp = this.vektorskiProizvod(tacka0, a, b);
    if (vp === 0) {
      return Math.sqrt(Math.pow(a.x - tacka0.x, 2) + Math.pow(a.y - tacka0.y, 2)) - Math.sqrt(Math.pow(b.x - tacka0.x, 2) + Math.pow(b.y - tacka0.y, 2));
    }
    return Math.atan2(a.y - tacka0.y, a.x - tacka0.x) - Math.atan2(b.y - tacka0.y, b.x - tacka0.x);
  }


  pokreniJarvisMarch(): void {
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    const kontekst = canvasEl.getContext('2d');
    // const omotac = this.jarvisMarch(this.tacke, canvasEl.height);
    const omotac = this.jarvisMarch(this.tacke,);
    this.crtajOmotac(kontekst, omotac);
    console.log("gotovo")
  }
  pokreniGrahamScan(): void {
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    const kontekst = canvasEl.getContext('2d');
    const omotac = this.grahamovAlgoritam(this.tacke);
    this.crtajOmotac(kontekst, omotac);
    console.log("gotovo")
  }
  jeSuprotnoOdSata(p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }): boolean {
    const vektorskiProizvod = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
    return vektorskiProizvod > 0;
  }


  crtajTacke(kontekst: CanvasRenderingContext2D): void {
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    kontekst.clearRect(0, 0, canvasEl.width, canvasEl.height);
    kontekst.lineWidth = 1;

    this.tacke.forEach((tacka) => {
      kontekst.beginPath();
      kontekst.arc(tacka.x, tacka.y, 2, 0, 2 * Math.PI);
      kontekst.fill();
      kontekst.stroke();
    });
  }

  generisiTacke(): void {
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    const kontekst = canvasEl.getContext('2d');
    const brojTacka = 100000;
    this.tacke = [];
    for (let i = 0; i < brojTacka; i++) {
      const x = Math.floor(Math.random() * canvasEl.width);
      const y = Math.floor(Math.random() * canvasEl.height);
      this.tacke.push({ x, y });
    }
    if (kontekst) {
      this.crtajTacke(kontekst);
    }
  }

}