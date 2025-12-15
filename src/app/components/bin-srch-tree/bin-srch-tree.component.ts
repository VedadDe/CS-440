
import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';

class CvorStabla {
  vrijednost: number;
  lijevo: CvorStabla | null;
  desno: CvorStabla | null;

  constructor(vrijednost: number) {
    this.vrijednost = vrijednost;
    this.lijevo = null;
    this.desno = null;
  }
}

class BinarnoStablo {
  korijen: CvorStabla | null = null;

  dodaj(vrijednost: number): void {
    if (!this.korijen) {
      this.korijen = new CvorStabla(vrijednost);
      return;
    }
    this._dodajRekurzivno(this.korijen, vrijednost);
  }

  private _dodajRekurzivno(cvor: CvorStabla, vrijednost: number): void {
    if (vrijednost - cvor.vrijednost < 0.0001) {
      // idi lijevo
      if (!cvor.lijevo) {
        cvor.lijevo = new CvorStabla(vrijednost);
      } else {
        this._dodajRekurzivno(cvor.lijevo, vrijednost);
      }
    } else {
      // idi desno
      if (!cvor.desno) {
        cvor.desno = new CvorStabla(vrijednost);
      } else {
        this._dodajRekurzivno(cvor.desno, vrijednost);
      }
    }
  }

  pretrazi(vrijednost: number): CvorStabla | null {
    return this._pretraziRekurzivno(this.korijen, vrijednost);
  }

  private _pretraziRekurzivno(cvor: CvorStabla | null, vrijednost: number): CvorStabla | null {
    if (!cvor || cvor.vrijednost === vrijednost) {
      return cvor;
    }

    if (vrijednost - cvor.vrijednost < 0.0001) {
      return this._pretraziRekurzivno(cvor.lijevo, vrijednost);
    } else {
      return this._pretraziRekurzivno(cvor.desno, vrijednost);
    }
  }
}

@Component({
  selector: 'app-bin-srch-tree',
  templateUrl: './bin-srch-tree.component.html',
  styleUrls: ['./bin-srch-tree.component.scss']
})
export class BinSrchTreeComponent implements AfterViewInit {
  @ViewChild('mojePlatno', { static: false })
  mojePlatno!: ElementRef<HTMLCanvasElement>;

  private kontekst!: CanvasRenderingContext2D;
  private binarnoStablo: BinarnoStablo = new BinarnoStablo();

  // Ako je cvor pronadjen pretragom, spremi njegovu vrijednost ovdje za isticanje
  private vrijednostPretrage: number | null = null;

  readonly sirinaPlatna = 800;
  readonly visinaPlatna = 600;

  ngAfterViewInit(): void {
    this.kontekst = this.mojePlatno.nativeElement.getContext('2d')!;
    this.ocistiPlatno();
  }

  /**
   * Dodaj novu vrijednost u binarno stablo, zatim ponovo nacrtaj
   */
  dodajVrijednost(vrijednost: number): void {
    this.binarnoStablo.dodaj(vrijednost);
    this.vrijednostPretrage = null;
    this.nacrtajStablo();
  }

  /**
   * Pretrazi vrijednost u binarnom stablu.
   * Ako je pronadjena, oznacit cemo cvor na platnu.
   */
  pretraziCvor(vrijednost: number): void {
    const pronadjeniCvor = this.binarnoStablo.pretrazi(vrijednost);
    if (pronadjeniCvor) {
      this.vrijednostPretrage = pronadjeniCvor.vrijednost;
    } else {
      this.vrijednostPretrage = null;
      alert(`Vrijednost ${vrijednost} nije pronadjena u stablu.`);
    }
    this.nacrtajStablo();
  }

  /**
   * Ocisti platno i nacrtaj trenutno stablo
   */
  nacrtajStablo(): void {
    this.ocistiPlatno();
    if (!this.binarnoStablo.korijen) {
      return; // prazno stablo
    }

    this.nacrtajCvor(this.binarnoStablo.korijen, this.sirinaPlatna / 2, 50, 200);
  }

  /**
   * Rekurzivno nacrtaj cvor i njegovu djecu.
   *
   * @param cvor    Trenutni cvor
   * @param x       X pozicija za crtanje
   * @param y       Y pozicija za crtanje
   * @param pomak   Horizontalni pomak za djecu
   */
  private nacrtajCvor(cvor: CvorStabla, x: number, y: number, pomak: number): void {
    if (!cvor) return;

    const poluprecnik = 20;

    // Prvo nacrtaj linije prema djeci (tako da krugovi budu na vrhu)
    const yDijete = y + 60; // vertikalni razmak
    if (cvor.lijevo) {
      this.nacrtajLiniju(x, y + poluprecnik, x - pomak, yDijete - poluprecnik);
      this.nacrtajCvor(cvor.lijevo, x - pomak, yDijete, pomak / 2);
    }
    if (cvor.desno) {
      this.nacrtajLiniju(x, y + poluprecnik, x + pomak, yDijete - poluprecnik);
      this.nacrtajCvor(cvor.desno, x + pomak, yDijete, pomak / 2);
    }

    // Nacrtaj krug za trenutni cvor
    this.kontekst.beginPath();

    // Ako je ovaj cvor onaj koji smo pretrazili, nacrtaj ga crveno
    if (this.vrijednostPretrage !== null && cvor.vrijednost === this.vrijednostPretrage) {
      this.kontekst.strokeStyle = 'red';
      this.kontekst.lineWidth = 3;
    } else {
      // podrazumijevani stil
      this.kontekst.strokeStyle = 'black';
      this.kontekst.lineWidth = 1;
    }

    this.kontekst.arc(x, y, poluprecnik, 0, 2 * Math.PI);
    this.kontekst.stroke();

    // Nacrtaj vrijednost cvora (centrirano)
    this.kontekst.font = '14px Arial';
    this.kontekst.fillStyle = 'black';
    this.kontekst.textAlign = 'center';
    this.kontekst.textBaseline = 'middle';
    this.kontekst.fillText(cvor.vrijednost.toString(), x, y);
  }

  /**
   * Nacrtaj liniju od (x1, y1) do (x2, y2)
   */
  private nacrtajLiniju(x1: number, y1: number, x2: number, y2: number): void {
    this.kontekst.beginPath();
    this.kontekst.moveTo(x1, y1);
    this.kontekst.lineTo(x2, y2);
    this.kontekst.stroke();
  }

  /**
   * Ocisti cijelo platno
   */
  private ocistiPlatno(): void {
    this.kontekst.clearRect(0, 0, this.sirinaPlatna, this.visinaPlatna);
  }
}