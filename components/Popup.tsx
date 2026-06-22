'use client';

import { Copy, CircleCheck, TriangleAlert, ChevronDown } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';
import { escape } from 'html-escaper';
import type { City, Country } from '@/types';

const copyIcon = ReactDOMServer.renderToString(<Copy size={20} />);
const checkIcon = ReactDOMServer.renderToString(<CircleCheck size={20} />);
const alertIcon = ReactDOMServer.renderToString(
  <TriangleAlert size={20} color="#ffb818" />,
);
const chevronIcon = ReactDOMServer.renderToString(<ChevronDown size={18} />);

export function createPopupHTML(
  city: City,
  countries: Country[],
  distanceBrackets: number[],
  useClosestGuess: boolean,
) {
  const country =
    countries.find((c) => c.code === city.countryCode)?.name ?? '';
  const names = city.name.split(', ');

  const popup = `
              <div class="bg-background text-foreground p-4 rounded-lg shadow-lg min-w-max flex flex-col gap-2">
                <div class="flex flex-row gap-2 items-center pe-4">
                  <h3 class="font-bold text-lg">${escape(names[0])}</h3>
                  <button 
                    class="text-foreground/80 hover:text-foreground rounded-full hover:bg-foreground/10 transition-colors cursor-pointer"
                    onclick="
                      const button = this;
                      const copyIcon = button.innerHTML;
                      navigator.clipboard.writeText('${escape(names[0])}').then(() => {
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
                <div class="text-foreground/80 text-sm">
                  Population: ${city.population.toLocaleString()}
                </div>
                ${
                  city.countryRequired || city.admin1Required
                    ? `
                  <div class="flex flex-row gap-2 items-center">
                    ${alertIcon}
                    <div class="text-foreground/80 text-sm">Country required: <b>${country}</b></div>
                    <button 
                      class="text-foreground/80 hover:text-foreground rounded-full hover:bg-foreground/10 transition-colors cursor-pointer"
                      onclick="
                        const button = this;
                        const copyIcon = button.innerHTML;
                        navigator.clipboard.writeText('${escape(country)}').then(() => {
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
                `
                    : ''
                }
                ${
                  city.admin1Required && city.admin1
                    ? `
                  <div class="flex flex-row gap-2 items-center">
                    ${alertIcon}
                    <div class="text-foreground/80 text-sm">Region required: <b>${city.admin1Name}</b></div>
                    <button 
                      class="text-foreground/80 hover:text-foreground rounded-full hover:bg-foreground/10 transition-colors cursor-pointer"
                      onclick="
                        const button = this;
                        const copyIcon = button.innerHTML;
                        navigator.clipboard.writeText('${escape(String(city.admin1Name))}').then(() => {
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
                `
                    : ''
                }
                ${
                  city.admin2Required && city.alternateNames !== ''
                    ? `
                  <div class="flex flex-row gap-2 items-center">
                    ${alertIcon}
                    <div class="text-foreground/80 text-sm">Alternate name likely required: <b>${city.alternateNames.split(';')[0]}</b></div>
                    <button 
                      class="text-foreground/80 hover:text-foreground rounded-full hover:bg-foreground/10 transition-colors cursor-pointer"
                      onclick="
                        const button = this;
                        const copyIcon = button.innerHTML;
                        navigator.clipboard.writeText('${escape(city.alternateNames.split(';')[0].split(',')[0])}').then(() => {
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
                `
                    : ''
                }
                ${
                  city.admin2Required && city.alternateNames !== ''
                    ? `
                  <div class="flex flex-row gap-2 items-center cursor-pointer" onclick="
                    const menu = document.getElementById('dropdownMenu');
                    menu.classList.toggle('hidden');
      
                    const chevron = document.getElementById('chevron');
                    chevron.classList.toggle('rotate-180');"
                  >
                    <div class="text-foreground/80 text-sm">View all alternate names</div>
                    <div id="chevron" class="transform transition-transform duration-200">${chevronIcon}</div>
                  </div>
      
                  <div id="dropdownMenu" class="hidden transform transition-transform duration-200">
                    <div class="flex flex-wrap gap-x-1 select-text">
                      ${city.alternateNames
                        .split(';')
                        .map((name, i, arr) => {
                          const cleanName = name.split(',')[0];
                          const comma = i < arr.length - 1;
                          return `
                          <span class="flex items-center">
                            <span
                              class="select-all"
                            >
                              ${cleanName}
                            </span>${comma ? '<span>,</span>' : ''}
                          </span>`;
                        })
                        .join('')}
                    </div>
                  </div>
                `
                    : ''
                }
                ${
                  (city.admin2Required && city.alternateNames === '') ||
                  (city.admin1Required && !city.admin1)
                    ? `
                  <div class="flex flex-row gap-2 items-center">
                    ${alertIcon}
                    <div class="text-foreground/80 text-sm">City likely not usable</div>
                  </div>
                `
                    : ''
                }
                ${
                  !city.admin2Required || city.alternateNames !== ''
                    ? `
                  <div class="flex flex-row gap-2 items-center">
                      <h3 class="font-bold text-md">Copy full command</h3>
                      <button 
                        class="text-foreground/80 hover:text-foreground rounded-full hover:bg-foreground/10 transition-colors cursor-pointer"
                        onclick="
                          const button = this;
                          const copyIcon = button.innerHTML;
                          navigator.clipboard.writeText(
                          '${escape(
                            city.admin2Required && city.alternateNames !== ''
                              ? `/guess city:${city.alternateNames.split(';')[0].split(',')[0].replaceAll("'", "\\'")} country:${city.countryCode} ${
                                  city.admin1Name
                                    ? `region:${city.admin1Name?.replaceAll("'", "\\'")}`
                                    : ''
                                }`
                              : `/guess city:${names[0].replaceAll("'", "\\'")} country:${city.countryCode} ${city.admin1Name ? `region:${city.admin1Name?.replaceAll("'", "\\'")}` : ''}`,
                          )}'
                          ).then(() => {
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
                  `
                    : ''
                }
                <div class="grid ${useClosestGuess ? `grid-cols-${distanceBrackets.length + 2}` : `grid-cols-${distanceBrackets.length + 1}`} gap-1">
                  ${
                    useClosestGuess
                      ? `<button onclick="document.dispatchEvent(new CustomEvent('closestGuess', { detail: { id: '${city.id}'} }));" data-slot="button" class=" cursor-pointer inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5">⬇️</button>`
                      : ''
                  }
                  <button onclick="document.dispatchEvent(new CustomEvent('addCityCircle', { detail: { id: '${city.id}', redRadius: ${
                    [...distanceBrackets].sort((a, b) => b - a)[0]
                  }, greenRadius: 0 } }));" data-slot="button" class=" cursor-pointer inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5">❌</button>
                  ${
                    distanceBrackets.includes(250)
                      ? `<button onclick="document.dispatchEvent(new CustomEvent('addCityCircle', { detail: { id: '${city.id}', redRadius: 100, greenRadius: 250 } }));" data-slot="button" class=" cursor-pointer inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5">⭕</button>`
                      : ''
                  }
                  ${
                    distanceBrackets.includes(100)
                      ? `<button onclick="document.dispatchEvent(new CustomEvent('addCityCircle', { detail: { id: '${city.id}', redRadius: 50, greenRadius: 100 } }));" data-slot="button" class=" cursor-pointer inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5">🤏</button>`
                      : ''
                  }
                  ${
                    distanceBrackets.includes(50)
                      ? `<button onclick="document.dispatchEvent(new CustomEvent('addCityCircle', { detail: { id: '${city.id}', redRadius: 20, greenRadius: 50 } }));" data-slot="button" class=" cursor-pointer inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5">🤞</button>`
                      : ''
                  }
                  ${
                    distanceBrackets.includes(20)
                      ? `<button onclick="document.dispatchEvent(new CustomEvent('addCityCircle', { detail: { id: '${city.id}', redRadius: 10, greenRadius: 20 } }));" data-slot="button" class=" cursor-pointer inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5">💥</button>`
                      : ''
                  }
                  ${
                    distanceBrackets.includes(10)
                      ? `<button onclick="document.dispatchEvent(new CustomEvent('addCityCircle', { detail: { id: '${city.id}', redRadius: 5, greenRadius: 10 } }));" data-slot="button" class=" cursor-pointer inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5">🔍</button>`
                      : ''
                  }
                  ${
                    distanceBrackets.includes(5)
                      ? `<button onclick="document.dispatchEvent(new CustomEvent('addCityCircle', { detail: { id: '${city.id}', redRadius: null, greenRadius: 5 } }));" data-slot="button" class=" cursor-pointer inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5">📍</button>`
                      : ''
                  }
                </div>
              </div>
            `;

  return popup;
}
