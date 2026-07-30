function calculateCoordinateAtDistance(lat, lon, distanceMeters, bearingDegrees) {
  const R = 6371000; // Earth's radius in meters
  const bearing = (bearingDegrees * Math.PI) / 180;
  const angularDistance = distanceMeters / R;
  
  const lat1 = (lat * Math.PI) / 180;
  const lon1 = (lon * Math.PI) / 180;
  
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
    Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
  );
  
  const lon2 = lon1 + Math.atan2(
    Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
    Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
  );
  
  return {
    latitude: (lat2 * 180) / Math.PI,
    longitude: ((lon2 * 180) / Math.PI)
  };
}

const baseProject = { lat: 40.0794599, lon: -75.3068751 };

const inside = calculateCoordinateAtDistance(baseProject.lat, baseProject.lon, 149, 0);
const outside = calculateCoordinateAtDistance(baseProject.lat, baseProject.lon, 151, 0);

console.log('149m (inside):', inside);
console.log('151m (outside):', outside);