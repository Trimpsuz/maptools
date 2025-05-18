import { Circle } from 'react-leaflet';
import type { CircleConfig } from '@/types';

export default function CircleLayer({ circles }: { circles: CircleConfig[] }) {
  return (
    <>
      {circles.map((circleConfig) => {
        const { city, redRadius, greenRadius } = circleConfig;
        const circleId = `${city.id}-${redRadius}-${greenRadius}`;

        return (
          <div key={circleId}>
            {greenRadius > 0 && (
              <Circle
                center={[city.latitude, city.longitude]}
                radius={greenRadius * 1000}
                pathOptions={{
                  color: 'green',
                  fillColor: 'green',
                  fillOpacity: 0.2,
                }}
              ></Circle>
            )}

            {redRadius !== null && (
              <Circle
                center={[city.latitude, city.longitude]}
                radius={redRadius * 1000}
                pathOptions={{
                  color: 'red',
                  fillColor: 'red',
                  fillOpacity: 0.2,
                }}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
