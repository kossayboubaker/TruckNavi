import { Kafka } from 'kafkajs';
import { spawn } from 'child_process';
import { Camion } from '../model/camion.js';

const kafka = new Kafka({
  clientId: 'truck-iot-consumer',
  brokers: [process.env.KAFKA_BROKERS || 'kafka:9092'],
});

const consumer = kafka.consumer({ groupId: 'truck-iot-group' });

const runConsumer = async (io) => {
  try {
    await consumer.connect();
    console.log('Kafka consumer connected');

    await consumer.subscribe({ topic: 'truck-data', fromBeginning: true });
    await consumer.subscribe({ topic: 'truck-route-updates', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        const rawValue = message.value.toString();
        try {
          const data = JSON.parse(rawValue);

          if (topic === 'truck-data') {
            // Extraction coordonnées, attendues dans location {lat, lng}
            let latitude = null;
            let longitude = null;

            if (data.location && typeof data.location.lat === 'number' && typeof data.location.lng === 'number') {
              latitude = data.location.lat;
              longitude = data.location.lng;
            } else {
              // fallback sur autres formats possibles
              if (data.gps && typeof data.gps.latitude === 'number' && typeof data.gps.longitude === 'number') {
                latitude = data.gps.latitude;
                longitude = data.gps.longitude;
              } else if (Array.isArray(data.position) && data.position.length === 2) {
                [latitude, longitude] = data.position;
              }
            }

            if (latitude == null || longitude == null || isNaN(latitude) || isNaN(longitude)) {
              console.warn('Invalid coordinates in message:', data);
              return;
            }

            const truckData = {
              id: data.truck_id || data.id,
              position: [latitude, longitude],
              speed: data.speed || 0,
              state: data.status || data.state || 'Unknown',
              driver: data.driver || 'Unknown',
              destination: data.destination || 'Unknown',  // Peut être un nom de ville
              route_progress: data.route_progress || 0,
              bearing: data.bearing || data.direction || 0,
              route: data.route || [],
              startPoint: data.startPoint || null,
            };

            // Mise à jour MongoDB avec les noms startPoint et destination,
            // et coordonnées avec lat/lon (attention lon, pas lng)
            const updateFields = {
              location: { lat: latitude, lon: longitude },
              speed: truckData.speed,
              bearing: truckData.bearing,
              route: truckData.route,
              routeProgress: truckData.route_progress,
              status: truckData.state,
            };

            if (truckData.startPoint) {
              updateFields.startPoint = truckData.startPoint;
            }
            if (truckData.destination) {
              updateFields.destination = truckData.destination;
            }

            await Camion.findOneAndUpdate(
              { truckId: truckData.id },
              { $set: updateFields },
              { upsert: true, new: true }
            );

            io.emit('truckUpdate', truckData);
            console.log(`truckUpdate for ${truckData.id} at [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`);

            simulateTruckStops(truckData, io);
            optimizeCarbon(truckData, io);

          } else if (topic === 'truck-route-updates') {
            if (!Array.isArray(data.route) || data.route.length === 0) {
              console.warn('Empty or invalid route data:', data);
              return;
            }

            // data.route = array de points [lng, lat]
            const lastPoint = data.route[data.route.length - 1];
            const destLon = lastPoint[0];
            const destLat = lastPoint[1];

            await Camion.findOneAndUpdate(
              { truckId: data.truck_id },
              {
                $set: {
                  route: data.route,
                  distance: data.distance,
                  duration: data.duration,
                  // destination stocké comme objet avec lat/lon
                },
              },
              { new: true }
            );

            io.emit('truckRouteUpdate', data);
            console.log(`Forwarded route update for truck ${data.truck_id}`);
          }
        } catch (error) {
          console.error(`Error parsing Kafka message from topic ${topic}:`, error.message);
        }
      },
    });
  } catch (error) {
    console.error('Kafka consumer error:', error);
  }
};

function simulateTruckStops(truckData, io) {
  const python = spawn('python3', ['simulator/simulate_truck_stops.py']);
  python.stdin.write(JSON.stringify(truckData));
  python.stdin.end();

  python.stdout.on('data', (data) => {
    try {
      const result = JSON.parse(data.toString());
      io.emit('truckStopSuggestion', { truckId: truckData.id, stops: result.stops });
    } catch (e) {
      console.error('simulate_truck_stops.py returned invalid data:', e.message);
    }
  });

  python.stderr.on('data', (err) => {
    console.error(`simulate_truck_stops.py error:`, err.toString());
  });
}

function optimizeCarbon(truckData, io) {
  const python = spawn('python3', ['simulator/carbon_optimizer.py']);
  python.stdin.write(JSON.stringify(truckData));
  python.stdin.end();

  python.stdout.on('data', (data) => {
    try {
      const result = JSON.parse(data.toString());
      io.emit('carbonOptimization', {
        truckId: truckData.id,
        carbon: result.carbon,
        optimalSpeed: result.optimal_speed,
        recommendedRoute: result.recommended_route,
      });
    } catch (e) {
      console.error('carbon_optimizer.py returned invalid data:', e.message);
    }
  });

  python.stderr.on('data', (err) => {
    console.error(`carbon_optimizer.py error:`, err.toString());
  });
}

export default runConsumer;
