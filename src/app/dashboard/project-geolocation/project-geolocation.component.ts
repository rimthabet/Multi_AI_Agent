import {
  Component,
  AfterViewInit,
  input,
  viewChild,
  effect,
  ElementRef,
  inject,
} from '@angular/core';
import * as L from 'leaflet';
import { LayerGroup } from 'leaflet';
import { UiService } from '../../services/ui.service';

const iconUrl =
  'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png';

@Component({
  selector: 'project-geolocation',
  standalone: true,
  imports: [],
  templateUrl: './project-geolocation.component.html',
  styleUrl: './project-geolocation.component.scss',
})
export class ProjectGeolocationComponent implements AfterViewInit {
  // Input
  projet = input<any>();
  projets = input<any[]>();
  showTitles = input<boolean>();
  height = input<string>('755px');

  mapContainer = viewChild.required<ElementRef>('mapContainer');

  private readonly uiService = inject(UiService);

  private currentTileLayer: L.TileLayer | null = null;

  map: L.Map | undefined;
  markersLayer = new L.LayerGroup();
  sMarkersLayer: LayerGroup<any> | undefined;
  zoomLevel = 8;

  // LIFECYCLE
  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeMap();
    }, 50);
  }

  // EFFECTS
  readonly dataEffect = effect(() => {
    if (this.projet() || this.projets()) {
      this.updateMapData();
    }
  });

  // MAP
  initializeMap(): void {
    const mapElement = this.mapContainer()?.nativeElement;
    if (!mapElement) return;

    if (this.map) {
      this.map.remove();
    }

    const options: L.MapOptions = {
      zoom: this.zoomLevel,
      center: L.latLng(34.63298595465927, 9.922569065905051),
      attributionControl: false,
      zoomControl: true,
      scrollWheelZoom: false,
    };

    this.map = L.map(mapElement, options);

    this.uiService.theme.subscribe((theme) => {
      this.updateTileLayer(theme);
    });

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
        this.updateMapData();
      }
    }, 100);
  }

  // TILES
  updateTileLayer(theme: string): void {
    if (!this.map) return;

    if (this.currentTileLayer) {
      this.map.removeLayer(this.currentTileLayer);
      this.currentTileLayer = null;
    }

    let tileUrl = '';
    let attribution = '';
    let tileSize = 512;
    let zoomOffset = -1;

    if (theme === 'dark') {
      tileUrl =
        'https://api.maptiler.com/maps/basic-v2-dark/{z}/{x}/{y}.png?key=dASoROrTSRWaM57ccMaj';
      attribution = '&copy; MapTiler &copy; OpenStreetMap contributors';
    } else {
      tileUrl =
        'https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=dASoROrTSRWaM57ccMaj';
      attribution = '&copy; MapTiler &copy; OpenStreetMap contributors';
    }

    this.currentTileLayer = L.tileLayer(tileUrl, {
      tileSize,
      zoomOffset,
      attribution,
      maxZoom: 19,
    });

    this.currentTileLayer.addTo(this.map);
  }

  // MARKERS
  updateMapData(): void {
    if (!this.map) return;

    // Supprimer ancienne couche
    if (this.sMarkersLayer) {
      this.sMarkersLayer.clearLayers();
      this.map.removeLayer(this.sMarkersLayer);
    }

    this.sMarkersLayer = new L.LayerGroup();

    const projetsArray = this.projets()?.map((p: any) => p.projet);
    const singleProjet = this.projet()?.projet;

    const hasSingle = !!(singleProjet?.altitude && singleProjet?.longitude);
    const hasMultiple = Array.isArray(projetsArray) && projetsArray.length > 0;

    if (hasSingle) {
      this.addSingleProjectMarker();
    }

    if (hasMultiple) {
      this.addMultipleProjectsMarkers();
    }

    // Ajoute la couche si elle contient des marqueurs
    if (this.sMarkersLayer.getLayers().length > 0) {
      this.map.addLayer(this.sMarkersLayer);
    }
  }

  // MARKERS
  addSingleProjectMarker(): void {
    if (!this.map) return;

    const projet = this.projet()?.projet;

    this.sMarkersLayer = new L.LayerGroup();

    const markerIcon = new L.Icon({
      iconUrl: iconUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
    });

    const stationLatLng = L.latLng(
      Number(projet.altitude),
      Number(projet.longitude)
    );

    const stationMarker = L.marker(stationLatLng, { icon: markerIcon });

    stationMarker
      .bindTooltip(projet.nom, {
        permanent: true,
        direction: 'bottom',
        offset: L.point(-8, 25),
      })
      .openTooltip();

    this.sMarkersLayer.addLayer(stationMarker);
    this.map.setView(stationLatLng, this.zoomLevel);
  }

  // MARKERS
  addMultipleProjectsMarkers(): void {
    if (!this.map) return;

    const projets = this.projets();

    this.sMarkersLayer = new L.LayerGroup();

    projets?.forEach((projetData) => {
      const projet = projetData?.projet;
      if (!projet?.altitude || !projet?.longitude) return;

      const lat = Number(projet.altitude);
      const lng = Number(projet.longitude);

      const markerIcon = new L.Icon({
        iconUrl: iconUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
      });

      const marker = L.marker([lat, lng], { icon: markerIcon });

      marker.bindTooltip(projet.nom, {
        direction: 'top',
        sticky: true,
        opacity: 0.9,
        className: 'leaflet-tooltip',
      });

      this.sMarkersLayer!.addLayer(marker);
    });

    // Centrer la carte sur Tunis avec un zoom fixe
    this.map.setView([34.9, 9.8], this.zoomLevel);
  }
}
