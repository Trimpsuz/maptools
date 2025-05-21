# Maptools

QOL tools for the Guess the City Discord bot. Basically, this project aims to be a drop-in upgrade for [the original maptools](https://github.com/dirkschut/maptoolspublic/).

## Features

- Map with a marker for each city
- Filter cities by **population**, **country** (and state in US), **continent** and **hemisphere**
- Create circles based on information the bot provides, ex. not within 100km or within 50km
- Exclude countries
- Only show markers which fit the required circles, countries etc filters
- Automatically parse recaps provided by the bot
- Marker popups include
  - City name
  - Population
  - If additional information like country, region or alternate name is required to guess the city
  - If the city is likely not usable due to other cities with the same information but more population existing
  - Button to automatically copy the guess command for the given city
  - Buttons to add a circle for the city directly from the popup
- Uses the same APIs as https://cities.trimpsuz.dev

## Usage

Visit https://maptools.trimpsuz.dev  
OR locally:

```bash
git clone https://github.com/Trimpsuz/maptools
cd maptools
bun install
bun run dev
```

## Contributing

- Use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)

## License

- The project is licensed under AGPL 3.0. See the [LICENSE](LICENSE) file for more details.
