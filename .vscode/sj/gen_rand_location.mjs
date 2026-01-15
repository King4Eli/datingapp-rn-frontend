import NodeGeocoder from "node-geocoder";
import random from "random"; 

// Load bounding boxes (same as Python)
const STATE_BOUNDING_BOXES = {
    "Alabama":     [-88.473227, 30.194044, -84.888246, 35.008028],
    "Alaska":      [-179.148909, 51.214183, -129.974167, 71.365162],
    "Arizona":     [-114.816591, 31.332177, -109.045172, 37.004260],
    "Arkansas":    [-94.617919, 33.004106, -89.644395, 36.499600],
    "California":  [-124.409591, 32.534156, -114.131211, 42.009518],
    "Colorado":    [-109.060257, 36.992426, -102.041524, 41.003444],
    "Connecticut": [-73.727775, 40.980144, -71.787239, 42.050587],
    "Delaware":    [-75.788658, 38.451013, -75.048939, 39.839007],
    "Florida":     [-87.634938, 24.521096, -80.031362, 31.000888],
    "Georgia":     [-85.605165, 30.357851, -80.839729, 35.000659],
    "Hawaii":      [-160.247238, 18.911606, -154.807773, 22.235626],
    "Idaho":       [-117.243027, 41.988053, -111.043564, 49.000911],
    "Illinois":    [-91.513079, 36.970298, -87.494756, 42.508481],
    "Indiana":     [-88.097760, 37.771742, -84.784579, 41.760592],
    "Iowa":        [-96.639704, 40.375501, -90.140061, 43.501196],
    "Kansas":      [-102.051744, 36.993016, -94.588413, 40.003162],
    "Kentucky":    [-89.571510, 36.497129, -81.964971, 39.147458],
    "Louisiana":   [-94.043147, 28.928609, -88.817017, 33.019457],
    "Maine":       [-71.083924, 42.977764, -66.949471, 47.459686],
    "Maryland":    [-79.487651, 37.911717, -75.048939, 39.723043],
    "Massachusetts": [-73.508142, 41.237964, -69.858861, 42.886589],
    "Michigan":    [-90.418136, 41.696118, -82.122902, 48.238800],
    "Minnesota":   [-97.239209, 43.499356, -89.491739, 49.384358],
    "Mississippi": [-91.655009, 30.173943, -88.097888, 34.996052],
    "Missouri":    [-95.774704, 35.995683, -89.098843, 40.613640],
    "Montana":     [-116.050003, 44.358221, -104.039138, 49.001390],
    "Nebraska":    [-104.053514, 39.999998, -95.308290, 43.001708],
    "Nevada":      [-120.005746, 35.002487, -114.039648, 42.002207],
    "New Hampshire": [-72.557247, 42.696990, -70.610621, 45.305476],
    "New Jersey":  [-75.559614, 38.928519, -73.893979, 41.357423],
    "New Mexico":  [-109.050173, 31.332301, -103.001964, 37.000232],
    "New York":    [-79.762152, 40.496103, -71.856214, 45.015850],
    "North Carolina": [-84.321869, 33.842316, -75.460621, 36.588117],
    "North Dakota": [-104.048900, 45.935054, -96.554507, 49.000574],
    "Ohio":        [-84.820159, 38.403202, -80.518693, 41.977523],
    "Oklahoma":    [-103.002565, 33.615833, -94.430662, 37.002206],
    "Oregon":      [-124.566244, 41.991794, -116.463504, 46.292065],
    "Pennsylvania": [-80.519891, 39.719800, -74.689516, 42.269860],
    "Rhode Island": [-71.907139, 41.146184, -71.120570, 42.018798],
    "South Carolina": [-83.353910, 32.034600, -78.542030, 35.215540],
    "South Dakota": [-104.057698, 42.479635, -96.436589, 45.945450],
    "Tennessee":   [-90.310298, 34.982972, -81.646897, 36.678118],
    "Texas":       [-106.645646, 25.837164, -93.508292, 36.500704],
    "Utah":        [-114.052962, 36.997968, -109.041058, 42.001567],
    "Vermont":     [-73.437740, 42.726853, -71.464555, 45.016659],
    "Virginia":    [-83.675395, 36.540738, -75.242266, 39.466012],
    "Washington":  [-124.763068, 45.543541, -116.915989, 49.002494],
    "West Virginia": [-82.644739, 37.201483, -77.719519, 40.638801],
    "Wisconsin":   [-92.888114, 42.491983, -86.249542, 47.080621],
    "Wyoming":     [-111.056888, 40.994746, -104.052160, 45.005904],
    "District of Columbia": [-77.119759, 38.791645, -76.909357, 38.995548],
};

// Create geocoder (Nominatim is open-source and free)
const geocoder = NodeGeocoder({
  provider: "opencage",
  apiKey: "b0e8f6483d76459e9f41357f0da79478",
  httpAdapter: "https",
  timeout: 15000,
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
});

// Helper: generate random lat/lon inside bounding box
function getRandomPointInBBox(bbox) {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const lat = random.float(minLat, maxLat);
  const lon = random.float(minLon, maxLon);
  return [lat, lon];
}

// Main function: generate one real address
export async function generate_real_address_with_coords() {
  console.log("🟡 ---Generating Real Address with Valid Coordinates...");
  const maxRetries = 5;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const states = Object.entries(STATE_BOUNDING_BOXES);
      const [stateName, bbox] = states[Math.floor(Math.random() * states.length)];
      const [lat, lon] = getRandomPointInBBox(bbox);

      const res = await geocoder.reverse({ lat, lon });
      const location = res?.[0];
      
      if (!location) {
        throw new Error("❌ Empty geocoding result");
      }

      // Build the result object
      const result = {
        latd: lat,
        long: lon,
        accuracy: +(Math.random() * (5 - 1) + 1).toFixed(1),
        altitude: 0,
        altitudeaccuracy: +(Math.random() * (10 - 5) + 5).toFixed(1),
        heading: 0,
        speed: 0,
        timestamp: Date.now(),
        display_name: location.formattedAddress || "Unknown",
        neighbourhood: location.extra?.neighborhood || location.neighbourhood || "unknown",
        city: location.city || location.administrativeLevels?.level2long || stateName,
        country: location.country || "United States",
        state: location.state || stateName,
        postcode: location.zipcode || location.postcode || "unknown",
        road: location.streetName || location.street || "unknown",
        street: location.streetName || location.street || "unknown",
      };

      return JSON.stringify(result, null, 2);
      
    } catch (error) {
      retries++;
      console.warn(`🟡 Geocoding error (attempt ${retries}/${maxRetries}): ${error.message}`);
      
      if (retries >= maxRetries) {
        throw new Error(`❌ Failed to generate address after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff
      const delay = Math.min(2000 * Math.pow(2, retries - 1), 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

 
  
 

 
(async () => {
   
  
    //console.log(await generateRealAddressWithCoords() );
 
})();