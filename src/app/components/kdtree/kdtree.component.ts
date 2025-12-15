import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

interface Tacka {
  x: number;
  y: number;
}

// Struktura cvora u stablu.
class Cvor2D {
  tacka: Tacka;          // (x, y) tacka pohranjena u ovom cvoru
  lijevo: Cvor2D | null; // Lijevo (ili "ispod") podstablo
  desno: Cvor2D | null;  // Desno (ili "iznad") podstablo

  constructor(tacka: Tacka) {
    this.tacka = tacka;
    this.lijevo = null;
    this.desno = null;
  }
}

@Component({
  selector: 'app-kdtree',
  templateUrl: './kdtree.component.html',
  styleUrls: ['./kdtree.component.scss']
})
export class KdtreeComponent implements OnInit {

  @ViewChild('mojePlatno', { static: true })
  mojePlatno!: ElementRef<HTMLCanvasElement>;
  private kontekst!: CanvasRenderingContext2D | null;

  // Dinamična lista tačaka (početne + klikovi korisnika).
  tacke: Tacka[] = [
    { x: 20,  y: 300 },
    { x: 100, y: 230 },
    { x: 400, y: 440 },
    { x: 500, y: 200 }
  ];

  // Korijen našeg 2D BST-a
  korijen: Cvor2D | null = null;

  ngOnInit() {
    // 1) Kreiraj početni 2D BST
    this.korijen = this.kreiraj2DBST(this.tacke, 0);

    // 2) Uzmi kontekst platna
    this.kontekst = this.mojePlatno.nativeElement.getContext('2d');
    if (this.kontekst) {
      // Očisti platno
      this.kontekst.clearRect(0, 0, this.mojePlatno.nativeElement.width, this.mojePlatno.nativeElement.height);
    }

    // 3) Nacrtaj početni 2D BST
    this.osvjeziCrtanje();

    // 4) Dodaj handler za klikove za dodavanje novih tačaka
    this.mojePlatno.nativeElement.addEventListener('click', (event: MouseEvent) => {
      const rect = this.mojePlatno.nativeElement.getBoundingClientRect();
      // Konvertuj clientX/clientY u koordinate platna
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      // Dodaj novu tačku
      this.dodajTacku({ x, y });
    });
  }

  /**
   * dodajTacku
   * Dodaje novu tačku u listu tačaka, ponovo gradi stablo i crta.
   */
  dodajTacku(tacka: Tacka) {
    this.tacke.push(tacka);
    this.korijen = this.kreiraj2DBST(this.tacke, 0);
    this.osvjeziCrtanje();
  }

  /**
   * kreiraj2DBST
   * Rekurzivno kreira 2D BST (kd-stablo) iz skupa tačaka.
   *
   * @param tacke  niz tačaka
   * @param dubina trenutna dubina rekurzije
   * @returns      korijen podstabla
   */
  kreiraj2DBST(tacke: Tacka[], dubina: number): Cvor2D | null {
    if (tacke.length === 0) {
      return null;
    }
    if (tacke.length === 1) {
      return new Cvor2D(tacke[0]);
    }

    // Parna dubina => podjela po X (vertikalna linija),
    // Neparna dubina => podjela po Y (horizontalna linija).
    const os = (dubina % 2 === 0) ? 'x' : 'y';

    // Sortiraj tačke prema trenutnoj osi
    tacke.sort((a, b) => a[os] - b[os]);

    // Pronađi indeks medijana
    const indeksMedijana = Math.floor(tacke.length / 2);

    // Kreiraj cvor iz medijana
    const cvor = new Cvor2D(tacke[indeksMedijana]);

    // Lijevo podstablo (tačke "manje od" medijana prema osi)
    const lijeveTacke = tacke.slice(0, indeksMedijana);
    // Desno podstablo (tačke "veće od" medijana prema osi)
    const desneTacke = tacke.slice(indeksMedijana + 1);

    cvor.lijevo = this.kreiraj2DBST(lijeveTacke, dubina + 1);
    cvor.desno = this.kreiraj2DBST(desneTacke, dubina + 1);

    return cvor;
  }

  /**
   * osvjeziCrtanje
   * Briše platno i ponovo crta cijelo 2D BST.
   */
  osvjeziCrtanje() {
    if (!this.kontekst) return;

    // Očisti platno
    this.kontekst.clearRect(0, 0, this.mojePlatno.nativeElement.width, this.mojePlatno.nativeElement.height);

    // postavi debljinu linije i font
    this.kontekst.lineWidth = 1;
    this.kontekst.font = '14px Arial';

    if (this.korijen) {
      this.crtaj2DBST(
        this.kontekst,
        this.korijen,
        0, // minX
        this.mojePlatno.nativeElement.width, // maxX
        0, // minY
        this.mojePlatno.nativeElement.height, // maxY
        0 // dubina
      );
    }
  }

  /**
   * crtaj2DBST
   * Rekurzivno crta cvorove i linije podjele na platnu.
   *
   * @param kontekst  2D rendering kontekst
   * @param cvor      trenutni cvor
   * @param minX      lijeva granica regije
   * @param maxX      desna granica regije
   * @param minY      gornja granica regije
   * @param maxY      donja granica regije
   * @param dubina    dubina rekurzije
   */
  crtaj2DBST(
    kontekst: CanvasRenderingContext2D,
    cvor: Cvor2D,
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    dubina: number
  ) {
    if (!cvor) return;

    // Koordinate tačke cvora
    const { x, y } = cvor.tacka;

    // 1) Nacrtaj cvor kao mali krug
    kontekst.beginPath();
    kontekst.arc(x, y, 3 /* poluprecnik */, 0, 2 * Math.PI);
    kontekst.fillStyle = 'red';
    kontekst.fill();
    kontekst.closePath();

    // (Opcionalno) označi cvor
    kontekst.fillStyle = 'black';
    kontekst.fillText(`(${Math.round(x)},${Math.round(y)})`, x + 5, y - 5);

    // 2) Odredi da li crtaš vertikalnu ili horizontalnu liniju
    // Parna dubina => vertikalna linija, Neparna dubina => horizontalna linija
    const jeVertikalna = (dubina % 2 === 0);

    if (jeVertikalna) {
      // Crtaj vertikalnu liniju na x
      kontekst.beginPath();
      kontekst.strokeStyle = 'blue';
      kontekst.moveTo(x, minY);
      kontekst.lineTo(x, maxY);
      kontekst.stroke();
      kontekst.closePath();

      // Rekurzija lijevo
      if (cvor.lijevo) {
        this.crtaj2DBST(kontekst, cvor.lijevo, minX, x, minY, maxY, dubina + 1);
      }
      // Rekurzija desno
      if (cvor.desno) {
        this.crtaj2DBST(kontekst, cvor.desno, x, maxX, minY, maxY, dubina + 1);
      }
    } else {
      // Crtaj horizontalnu liniju na y
      kontekst.beginPath();
      kontekst.strokeStyle = 'green';
      kontekst.moveTo(minX, y);
      kontekst.lineTo(maxX, y);
      kontekst.stroke();
      kontekst.closePath();

      // Rekurzija ispod
      if (cvor.lijevo) {
        this.crtaj2DBST(kontekst, cvor.lijevo, minX, maxX, minY, y, dubina + 1);
      }
      // Rekurzija iznad
      if (cvor.desno) {
        this.crtaj2DBST(kontekst, cvor.desno, minX, maxX, y, maxY, dubina + 1);
      }
    }
  }
}