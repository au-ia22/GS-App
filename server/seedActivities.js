const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'condition-survey-9b5b9',
});

const db = admin.firestore();

// Activities data
const activities = [
  { activity: "200:Inspection", description: "Inspection - SOE and Underpinning", billable: "Yes" },
  { activity: "200A:Inspection", description: "Inspection - SOE and Underpinning (night/weekend)", billable: "Yes" },
  { activity: "201:Inspection", description: "Inspection - Demolition", billable: "Yes" },
  { activity: "201A:Inspection", description: "Inspection - Demolition (night/weekend)", billable: "Yes" },
  { activity: "202:Inspection", description: "Inspection - Ground Improvement", billable: "Yes" },
  { activity: "202A:Inspection", description: "Inspection - Ground Improvement (night/weekend)", billable: "Yes" },
  { activity: "203:Inspection", description: "Inspection - Footings/Mat Subgrade", billable: "Yes" },
  { activity: "203A:Inspection", description: "Inspection - Footings/Mat Subgrade (night/weekend)", billable: "Yes" },
  { activity: "204:Inspection", description: "Inspection - Compaction Testing", billable: "Yes" },
  { activity: "204A:Inspection", description: "Inspection - Compaction Testing (night/weekend)", billable: "Yes" },
  { activity: "205:Inspection", description: "Inspection - Pile Installation", billable: "Yes" },
  { activity: "205A:Inspection", description: "Inspection - Pile Installation (night/weekend)", billable: "Yes" },
  { activity: "206:Inspection", description: "Inspection - Caisson Installation", billable: "Yes" },
  { activity: "206A:Inspection", description: "Inspection - Caisson Installation (night/weekend)", billable: "Yes" },
  { activity: "207:Inspection", description: "Inspection - Load Testing", billable: "Yes" },
  { activity: "207A:Inspection", description: "Inspection - Load Testing (night/weekend)", billable: "Yes" },
  { activity: "208:Inspection", description: "Inspection - Deep Dynamic Compaction (DDC)", billable: "Yes" },
  { activity: "208A:Inspection", description: "Inspection - Deep Dynamic Compaction (DDC) (night/weekend)", billable: "Yes" },
  { activity: "225:Inspection", description: "Inspection - Concrete/Rebar Testing and Sampling", billable: "Yes" },
  { activity: "225A:Inspection", description: "Inspection - Concrete/Rebar Testing and Sampling (night/weekend)", billable: "Yes" },
  { activity: "226:Inspection", description: "Inspection - Masonry Testing & Sampling", billable: "Yes" },
  { activity: "226A:Inspection", description: "Inspection - Masonry Testing & Sampling (night/weekend)", billable: "Yes" },
  { activity: "227:Inspection", description: "Inspection - Structural Steel Bolting & Welding", billable: "Yes" },
  { activity: "227A:Inspection", description: "Inspection - Structural Steel Bolting & Welding (night/weekend)", billable: "Yes" },
  { activity: "228:Inspection", description: "Inspection - Structural Steel - Fabrication Shop Visit", billable: "Yes" },
  { activity: "228A:Inspection", description: "Inspection - Structural Steel - Fabrication Shop Visit (night/weekend)", billable: "Yes" },
  { activity: "229:Inspection", description: "Inspection - Fireproofing Installation/Testing", billable: "Yes" },
  { activity: "229A:Inspection", description: "Inspection - Fireproofing Installation/Testing (night/weekend)", billable: "Yes" },
  { activity: "230:Inspection", description: "Inspection - Post Installed Anchors Installation/Testing", billable: "Yes" },
  { activity: "230A:Inspection", description: "Inspection - Post Installed Anchors Installation/Testing (night/weekend)", billable: "Yes" },
  { activity: "231:Inspection", description: "Inspection - Floor Flatness & Levelness Testing (Day)", billable: "Yes" },
  { activity: "232:Inspection", description: "Inspection - Wood Framing", billable: "Yes" },
  { activity: "232A:Inspection", description: "Inspection - Wood Framing (night & weekend)", billable: "Yes" },
  { activity: "233:Inspection", description: "Fire-resistant penetrations and joints (Day)", billable: "Yes" },
  { activity: "234:Inspection", description: "Inspection - EIFS", billable: "Yes" },
  { activity: "235:Inspection", description: "Inspection - Structural Stability", billable: "Yes" },
  { activity: "235A:Inspection", description: "Inspection - Structural Stability (night/overtime)", billable: "Yes" },
  { activity: "236:Inspection", description: "Inspection - FRP", billable: "Yes" },
  { activity: "236A:Inspection", description: "Inspection - FRP (night/overtime)", billable: "Yes" },
  { activity: "245:Inspection", description: "Daily Report Preparation", billable: "No" },
  { activity: "249:Inspection", description: "Inspection - Travel Mileage & Parking Expenses (Trip)", billable: "Yes" },
  { activity: "250:Inspection", description: "Consulting (Project Engineer)", billable: "Yes" },
  { activity: "250A:Inspection", description: "Consulting (Project Manager)", billable: "Yes" },
  { activity: "250B:Inspection", description: "Consulting (Senior PE/Principal)", billable: "Yes" },
  { activity: "250C:Inspection", description: "Consulting (Chief Engineer)", billable: "Yes" },
  { activity: "250D:Inspection", description: "250D", billable: "Yes" },
  { activity: "251:Inspection", description: "Meeting (Project Engineer)", billable: "Yes" },
  { activity: "251A:Inspection", description: "Meeting (Project Manager)", billable: "Yes" },
  { activity: "251B:Inspection", description: "Meeting (Senior PE/Principal)", billable: "Yes" },
  { activity: "251C:Inspection", description: "Meeting (Chief Engineer)", billable: "Yes" },
  { activity: "252:Inspection", description: "Site Visit (Project Engineer)", billable: "Yes" },
  { activity: "252A:Inspection", description: "Site Visit (Project Manager)", billable: "Yes" },
  { activity: "252B:Inspection", description: "Site Visit (Senior PE/Principal)", billable: "Yes" },
  { activity: "252C:Inspection", description: "Site Visit (Chief Engineer)", billable: "Yes" },
  { activity: "253:Inspection", description: "Project Management (technical support, daily report review and submission)", billable: "Yes" },
  { activity: "290:Inspection", description: "Nuclear Gauge Equipment (Day)", billable: "Yes" },
  { activity: "291:Inspection", description: "Anchor Pull Testing Equipment (Day)", billable: "Yes" },
  { activity: "292:Inspection", description: "Equipment (Day)", billable: "Yes" },
  { activity: "495:Inspection", description: "Cylinder Pickup (Trip)", billable: "Yes" },
];

// Seed activities
async function seedActivities() {
  try {
    console.log('Starting to seed activities collection...');

    const activitiesRef = db.collection('activities');
    let count = 0;

    for (const activityData of activities) {
      // Use activity ID as document ID for easy lookup
      await activitiesRef.doc(activityData.activity).set(activityData);
      count++;
      console.log(`✓ Seeded: ${activityData.activity}`);
    }

    console.log(`\n✓ Successfully seeded ${count} activities`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding activities:', error);
    process.exit(1);
  }
}

// Run seeding
seedActivities();