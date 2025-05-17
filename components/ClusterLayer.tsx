'use client';

import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { useEffect } from 'react';
import { Copy, CircleCheck, TriangleAlert } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';
import { escape } from 'html-escaper';
import type { City } from '@/types';

const copyIcon = ReactDOMServer.renderToString(<Copy size={20} />);
const checkIcon = ReactDOMServer.renderToString(<CircleCheck size={20} />);
const alertIcon = ReactDOMServer.renderToString(<TriangleAlert size={20} color="#ffb818" />);

export default function ClusterLayer({ cities }: { cities: City[] }) {
  const map = useMap();

  useEffect(() => {
    const markers = L.markerClusterGroup();

    cities.forEach((city) => {
      const names = city.name.split(', ');

      const marker = L.marker([city.latitude, city.longitude]).bindPopup(`
        <div class="bg-background text-foreground p-4 rounded-lg shadow-lg min-w-max flex flex-col gap-2">
          <div class="flex justify-between items-center pe-4">
            <h3 class="font-bold text-lg">${escape(names[0])}</h3>
          </div>
          <div class="text-foreground/80 text-sm">
            Population: ${city.population.toLocaleString()}
          </div>
          <div>
            ${
              names.length > 1
                ? `
              <div class="flex flex-row gap-1 items-center">
                ${alertIcon}
                <div class="text-foreground/80 text-sm">Country required: <b>${city.countryCode}</b></div>
              </div>
            `
                : ''
            }
            ${
              names.length == 2 && names[1] != city.countryCode
                ? `
              <div class="flex flex-row gap-1 items-center">
                ${alertIcon}
                <div class="text-foreground/80 text-sm">Region required: <b>${names[1]}</b></div>
              </div>
            `
                : ''
            }
            ${
              names.length > 2
                ? `
              <div class="flex flex-row gap-1 items-center">
                ${alertIcon}
                <div class="text-foreground/80 text-sm">Region required: <b>${names[1]}</b></div>
              </div>
            `
                : ''
            }
          </div>
          <div>
            <button 
              class="text-foreground/80 hover:text-foreground rounded-full hover:bg-foreground/10 transition-colors cursor-pointer"
              onclick="
                const button = this;
                const copyIcon = button.innerHTML;
                navigator.clipboard.writeText('${names[0].replaceAll("'", "\\'")}').then(() => {
                  button.innerHTML = atob('${btoa(checkIcon)}');
                  button.classList.add('text-green-500');
                  button.classList.remove('cursor-pointer');
                  button.classList.remove('hover:text-foreground');
                  
                  setTimeout(() => {
                    button.innerHTML = copyIcon;
                    button.classList.remove('text-green-500');
                    button.classList.add('cursor-pointer');
                    button.classList.add('hover:text-foreground');
                  }, 1000);
                }).catch(err => console.error('Could not copy text: ', err));"
              title="Copy city name"
            >
              ${copyIcon}
            </button>
          </div>
        </div>
      `);

      markers.addLayer(marker);
    });

    map.addLayer(markers);

    return () => {
      map.removeLayer(markers);
    };
  }, [cities, map]);

  return null;
}
