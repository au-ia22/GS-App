// index.js

process.env.GOOGLE_APPLICATION_CREDENTIALS = '/secrets/firebase-key'

const express = require('express');
const cors = require('cors');
const db = require('./firebase');

const app = express();
const PORT = 5000;

//app.use(cors());
app.use(cors({
  origin: 'https://condition-survey-9b5b9.web.app'
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('GeoTime Server is running :)');
});

app.get('/api/test', (req, res) => {
  res.json({ message: "GeoTime server is running :)" });
});

app.get('/api/test-firebase', async (req, res) => {
  console.log('=== /api/test-firebase called ===');
  try {
    console.log('Attempting to write to Firestore...');
    const docRef = db.collection('test').doc('hello');
    console.log('docRef created:', docRef.path);

    await docRef.set({ message: 'It works!', timestamp: new Date() });
    console.log('Write successful');

    const doc = await docRef.get();
    console.log('Document data:', doc.data());
    res.json(doc.data());
  } catch (error) {
    console.error('Full error object:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    res.status(500).json({ error: error.message, code: error.code });
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    const snapshot = await db.collection('projects').get();
    const projects = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.get('/api/inspectors', async (req, res) => {
  try {
    const snapshot = await db.collection('inspectors').get();
    const inspectors = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(inspectors);
  } catch (error) {
    console.error('Error fetching inspectors:', error);
    res.status(500).json({ error: 'Failed to fetch inspectors' });
  }
});

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getFormattedTime(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}_${String(minutes).padStart(2, '0')}_${period}`;
}

function getFormattedDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

app.post('/api/shifts/clockin', async (req, res) => {
  try {
    const { projectId, projectName, phase, latitude, longitude, activity, inspectorName, overlapResolved } = req.body;

    if (!projectId || !projectName || latitude === undefined || longitude === undefined || !activity || !inspectorName) {
      return res.status(400).json({ error: 'Missing required fields: projectId, projectName, latitude, longitude, activity, inspectorName' });
    }

    const radius = 150;
    const getDistance = (workerLat, workerLon, projectLat, projectLon) => {
      return calculateDistance(workerLat, workerLon, projectLat, projectLon);
    };

    const now = new Date();
    const formattedDate = getFormattedDate(now);
    const formattedTime = getFormattedTime(now);

    const allProjectsSnapshot = await db.collection('projects').get();
    const nearbyProjects = [];
    let selectedProjectNearby = false;

    for (const doc of allProjectsSnapshot.docs) {
      const otherProject = doc.data();
      let isNearby = false;
      let closestDistance = Infinity;

      if (otherProject.locations && Array.isArray(otherProject.locations)) {
        for (const location of otherProject.locations) {
          const distance = getDistance(latitude, longitude, location.latitude, location.longitude);
          closestDistance = Math.min(closestDistance, distance);
          if (distance <= radius) {
            isNearby = true;
          }
        }
      }

      if (isNearby) {
        nearbyProjects.push({
          projectId: doc.id,
          projectName: otherProject.project_name,
          distance: parseFloat(closestDistance.toFixed(2))
        });

        if (doc.id === projectId) {
          selectedProjectNearby = true;
        }
      }
    }

    if (!selectedProjectNearby) {
      const clockinFailId = `clockinfail_${formattedDate}_${formattedTime}_${Date.now()}`;
      await db.collection('clock_in_failures').doc(clockinFailId).set({
        employee_name: inspectorName,
        project_id: projectId,
        project_name: projectName,
        error_message: 'Selected project outside geofence',
        worker_location: { latitude, longitude },
        timestamp: now
      });

      return res.status(403).json({
        success: false,
        error: 'Clock-in unsuccessful. Too far from site.'
      });
    }

    const employeeName = inspectorName;
    const shiftId = `shift_${formattedDate}_${formattedTime}_${Date.now()}`;
    await db.collection('shifts').doc(shiftId).set({
      employee_name: employeeName,
      clock_in_time: now,
      clock_out_time: null,
      status: 'ACTIVE',
      breaks: [],
      break_duration: 0,
      shift_duration: 0
    });

    const siteVisitId = `sitevisit_${shiftId}_${Date.now()}`;
    await db.collection('site_visits').doc(siteVisitId).set({
      shift_id: shiftId,
      project_name: projectName,
      phase: phase || null,
      entry_timestamp: now,
      exit_timestamp: null,
      location_coordinates: {
        latitude: latitude,
        longitude: longitude
      }
    });

    const activityLogId = `activitylog_${shiftId}_${Date.now()}`;
    await db.collection('activity_logs').doc(activityLogId).set({
      shift_id: shiftId,
      site_visit_id: siteVisitId,
      activity: activity,
      description: activity,
      start_timestamp: now,
      end_timestamp: null,
      duration: 0,
      billable: 'Yes'
    });

    const clockinId = `clockin_${formattedDate}_${formattedTime}_${Date.now()}`;
    await db.collection('clock_ins').doc(clockinId).set({
      employee_name: employeeName,
      project_name: projectName,
      shift_id: shiftId,
      timestamp: now
    });

    res.json({
      success: true,
      message: 'Clock-in successful.',
      shiftId: shiftId,
      siteVisitId: siteVisitId,
      activityLogId: activityLogId
    });
  } catch (error) {
    console.error('Error in /api/shifts/clockin:', error);

    const now = new Date();
    const formattedDate = getFormattedDate(now);
    const formattedTime = getFormattedTime(now);

    const clockinFailId = `clockinfail_${formattedDate}_${formattedTime}_${Date.now()}`;
    await db.collection('clock_in_failures').doc(clockinFailId).set({
      error_message: error.message,
      timestamp: now
    });

    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shifts/startbreak', async (req, res) => {
  try {
    const { shiftId } = req.body;

    if (!shiftId) {
      return res.status(400).json({ error: 'Missing required field: shiftId' });
    }

    const now = new Date();

    const shiftDoc = await db.collection('shifts').doc(shiftId).get();
    if (!shiftDoc.exists) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    const shiftData = shiftDoc.data();

    if (shiftData.activeBreak) {
      return res.status(400).json({ error: 'A break is already active' });
    }

    await db.collection('shifts').doc(shiftId).update({
      activeBreak: {
        break_start: now
      }
    });

    res.json({
      success: true,
      message: 'Break started',
      breakStart: now
    });
  } catch (error) {
    console.error('Error in /api/shifts/startbreak:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shifts/endbreak', async (req, res) => {
  try {
    const { shiftId } = req.body;

    if (!shiftId) {
      return res.status(400).json({ error: 'Missing required field: shiftId' });
    }

    const now = new Date();

    const shiftDoc = await db.collection('shifts').doc(shiftId).get();
    if (!shiftDoc.exists) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    const shiftData = shiftDoc.data();

    if (!shiftData.activeBreak) {
      return res.status(400).json({ error: 'No active break' });
    }

    const breakStart = shiftData.activeBreak.break_start.toDate();
    const breakDurationSeconds = Math.round((now - breakStart) / 1000);

    const breakObj = {
      break_start: breakStart,
      break_end: now,
      duration: breakDurationSeconds
    };

    const updatedBreaks = shiftData.breaks || [];
    updatedBreaks.push(breakObj);

    const totalBreakDuration = updatedBreaks.reduce((sum, brk) => sum + brk.duration, 0);

    await db.collection('shifts').doc(shiftId).update({
      breaks: updatedBreaks,
      break_duration: totalBreakDuration,
      activeBreak: null
    });

    res.json({
      success: true,
      message: 'Break ended',
      breakDurationSeconds: breakDurationSeconds,
      totalBreakDuration: totalBreakDuration
    });
  } catch (error) {
    console.error('Error in /api/shifts/endbreak:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shifts/startactivity', async (req, res) => {
  try {
    const { shiftId, activity, description } = req.body;

    if (!shiftId) {
      return res.status(400).json({ error: 'Missing required field: shiftId' });
    }

    const now = new Date();

    const shiftDoc = await db.collection('shifts').doc(shiftId).get();
    if (!shiftDoc.exists) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    const siteVisitsSnapshot = await db.collection('site_visits')
      .where('shift_id', '==', shiftId)
      .where('exit_timestamp', '==', null)
      .get();

    let siteVisitId = null;
    if (!siteVisitsSnapshot.empty) {
      siteVisitId = siteVisitsSnapshot.docs[siteVisitsSnapshot.docs.length - 1].id;
    }

    const activityLogId = `activitylog_${shiftId}_${Date.now()}`;
    await db.collection('activity_logs').doc(activityLogId).set({
      shift_id: shiftId,
      site_visit_id: siteVisitId,
      activity: activity || 'Unnamed Activity',
      description: description || activity || 'Unnamed Activity',
      start_timestamp: now,
      end_timestamp: null,
      duration: 0,
      billable: 'Yes'
    });

    res.json({
      success: true,
      message: 'Activity started',
      activityLogId: activityLogId,
      startTime: now
    });
  } catch (error) {
    console.error('Error in /api/shifts/startactivity:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shifts/endactivity', async (req, res) => {
  try {
    const { shiftId, elapsedTimeMs } = req.body;

    if (!shiftId) {
      return res.status(400).json({ error: 'Missing required field: shiftId' });
    }

    const now = new Date();

    const activityLogsSnapshot = await db.collection('activity_logs')
      .where('shift_id', '==', shiftId)
      .where('end_timestamp', '==', null)
      .get();

    if (activityLogsSnapshot.empty) {
      return res.json({
        success: true,
        message: 'Activity already ended or does not exist',
        activityLogId: null,
        duration: 0,
        endTime: now
      });
    }

    const activityDocs = activityLogsSnapshot.docs;
    const activityLogDoc = activityDocs[activityDocs.length - 1];

    let durationSeconds;
    if (elapsedTimeMs !== undefined) {
      durationSeconds = Math.floor(elapsedTimeMs / 1000);
    } else {
      const activityData = activityLogDoc.data();
      const startTime = activityData.start_timestamp.toDate();
      durationSeconds = Math.floor((now - startTime) / 1000);
    }

    await db.collection('activity_logs').doc(activityLogDoc.id).update({
      end_timestamp: now,
      duration: durationSeconds
    });

    res.json({
      success: true,
      message: 'Activity ended',
      activityLogId: activityLogDoc.id,
      duration: durationSeconds,
      endTime: now
    });
  } catch (error) {
    console.error('Error in /api/shifts/endactivity:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shifts/startsitevisit', async (req, res) => {
  try {
    const { shiftId, projectName, phase, latitude, longitude } = req.body;

    if (!shiftId) {
      return res.status(400).json({ error: 'Missing required field: shiftId' });
    }

    const now = new Date();

    const shiftDoc = await db.collection('shifts').doc(shiftId).get();
    if (!shiftDoc.exists) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    const siteVisitId = `sitevisit_${shiftId}_${Date.now()}`;
    await db.collection('site_visits').doc(siteVisitId).set({
      shift_id: shiftId,
      project_name: projectName || 'Unnamed Site',
      phase: phase || null,
      entry_timestamp: now,
      exit_timestamp: null,
      location_coordinates: {
        latitude: latitude || 0,
        longitude: longitude || 0
      }
    });

    res.json({
      success: true,
      message: 'Site visit started',
      siteVisitId: siteVisitId,
      entryTime: now
    });
  } catch (error) {
    console.error('Error in /api/shifts/startsitevisit:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shifts/updatephase', async (req, res) => {
  try {
    const { shiftId, phase } = req.body;

    if (!shiftId) {
      return res.status(400).json({ error: 'Missing required field: shiftId' });
    }

    const siteVisitsSnapshot = await db.collection('site_visits')
      .where('shift_id', '==', shiftId)
      .where('exit_timestamp', '==', null)
      .get();

    if (siteVisitsSnapshot.empty) {
      return res.status(404).json({ error: 'No active site visit found' });
    }

    const siteVisitDoc = siteVisitsSnapshot.docs[0];

    await db.collection('site_visits').doc(siteVisitDoc.id).update({
      phase: phase || null
    });

    res.json({
      success: true,
      message: 'Phase updated',
      phase: phase
    });
  } catch (error) {
    console.error('Error in /api/shifts/updatephase:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shifts/endsitevisit', async (req, res) => {
  try {
    const { shiftId, elapsedTimeMs } = req.body;

    if (!shiftId) {
      return res.status(400).json({ error: 'Missing required field: shiftId' });
    }

    const now = new Date();

    const siteVisitsSnapshot = await db.collection('site_visits')
      .where('shift_id', '==', shiftId)
      .where('exit_timestamp', '==', null)
      .get();

    if (siteVisitsSnapshot.empty) {
      return res.status(404).json({ error: 'No active site visit found' });
    }

    const siteVisitDocs = siteVisitsSnapshot.docs;
    const siteVisitDoc = siteVisitDocs[siteVisitDocs.length - 1];

    let durationSeconds;
    if (elapsedTimeMs !== undefined) {
      durationSeconds = Math.floor(elapsedTimeMs / 1000);
    } else {
      const siteVisitData = siteVisitDoc.data();
      const entryTime = siteVisitData.entry_timestamp.toDate();
      durationSeconds = Math.floor((now - entryTime) / 1000);
    }

    const allSiteVisitsSnapshot = await db.collection('site_visits')
      .where('shift_id', '==', shiftId)
      .get();

    let totalShiftDuration = 0;
    allSiteVisitsSnapshot.docs.forEach(doc => {
      if (doc.id !== siteVisitDoc.id) {
        totalShiftDuration += doc.data().duration || 0;
      }
    });

    totalShiftDuration += durationSeconds;

    await db.collection('shifts').doc(shiftId).update({
      shift_duration: totalShiftDuration
    });

    await db.collection('site_visits').doc(siteVisitDoc.id).update({
      exit_timestamp: now,
      duration: durationSeconds
    });

    res.json({
      success: true,
      message: 'Site visit ended',
      siteVisitId: siteVisitDoc.id,
      duration: durationSeconds,
      exitTime: now,
      shiftDuration: totalShiftDuration
    });
  } catch (error) {
    console.error('Error in /api/shifts/endsitevisit:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shifts/clockout', async (req, res) => {
  try {
    const { shiftId, latitude, longitude, elapsedSeconds } = req.body;

    if (!shiftId) {
      return res.status(400).json({ error: 'Missing required field: shiftId' });
    }

    const now = new Date();

    const shiftDoc = await db.collection('shifts').doc(shiftId).get();
    if (!shiftDoc.exists) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    const shiftData = shiftDoc.data();

    const openActivitiesSnapshot = await db.collection('activity_logs')
      .where('shift_id', '==', shiftId)
      .where('end_timestamp', '==', null)
      .get();

    for (const activityDoc of openActivitiesSnapshot.docs) {
      const activityData = activityDoc.data();
      const startTime = activityData.start_timestamp.toDate();
      const durationSeconds = Math.floor((now - startTime) / 1000);

      await db.collection('activity_logs').doc(activityDoc.id).update({
        end_timestamp: now,
        duration: durationSeconds
      });
    }

    const openSiteVisitsSnapshot = await db.collection('site_visits')
      .where('shift_id', '==', shiftId)
      .where('exit_timestamp', '==', null)
      .get();

    for (const siteVisitDoc of openSiteVisitsSnapshot.docs) {
      const siteVisitData = siteVisitDoc.data();
      let durationSeconds;

      if (siteVisitData.duration) {
        durationSeconds = siteVisitData.duration;
      } else {
        const entryTime = siteVisitData.entry_timestamp.toDate();
        durationSeconds = Math.floor((now - entryTime) / 1000);
      }

      await db.collection('site_visits').doc(siteVisitDoc.id).update({
        exit_timestamp: now,
        duration: durationSeconds
      });
    }

    const allSiteVisitsSnapshot = await db.collection('site_visits')
      .where('shift_id', '==', shiftId)
      .get();

    let finalShiftDuration = 0;
    allSiteVisitsSnapshot.docs.forEach(doc => {
      finalShiftDuration += doc.data().duration || 0;
    });

    const shiftDuration = finalShiftDuration > 0 ? finalShiftDuration : (elapsedSeconds || 0);

    await db.collection('shifts').doc(shiftId).update({
      clock_out_time: now,
      shift_duration: shiftDuration,
      status: 'COMPLETED'
    });

    res.json({
      success: true,
      message: 'Clock-out successful',
      shiftId: shiftId,
      clockOutTime: now,
      shiftDuration: shiftDuration
    });
  } catch (error) {
    console.error('Error in /api/shifts/clockout:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/shifts/:shiftId/summary', async (req, res) => {
  try {
    const { shiftId } = req.params;

    const shiftDoc = await db.collection('shifts').doc(shiftId).get();
    if (!shiftDoc.exists) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    const shiftData = shiftDoc.data();

    const activitiesSnapshot = await db.collection('activity_logs')
      .where('shift_id', '==', shiftId)
      .get();

    const activitiesByVisit = {};
    const allActivities = [];

    activitiesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const activity = {
        id: doc.id,
        ...data,
        start_timestamp: data.start_timestamp?.toDate ? data.start_timestamp.toDate() : data.start_timestamp,
        end_timestamp: data.end_timestamp?.toDate ? data.end_timestamp.toDate() : data.end_timestamp,
      };
      allActivities.push(activity);

      const siteVisitId = data.site_visit_id;
      if (siteVisitId) {
        if (!activitiesByVisit[siteVisitId]) {
          activitiesByVisit[siteVisitId] = [];
        }
        activitiesByVisit[siteVisitId].push(activity);
      }
    });

    const siteVisitsSnapshot = await db.collection('site_visits')
      .where('shift_id', '==', shiftId)
      .get();

    const site_visits = siteVisitsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        entry_timestamp: data.entry_timestamp?.toDate ? data.entry_timestamp.toDate() : data.entry_timestamp,
        exit_timestamp: data.exit_timestamp?.toDate ? data.exit_timestamp.toDate() : data.exit_timestamp,
        activities: activitiesByVisit[doc.id] || []
      };
    });

    const breaks = (shiftData.breaks || []).map(brk => ({
      break_start: brk.break_start?.toDate ? brk.break_start.toDate() : brk.break_start,
      break_end: brk.break_end?.toDate ? brk.break_end.toDate() : brk.break_end,
      duration: brk.duration || 0,
    }));

    const clockInTime = shiftData.clock_in_time?.toDate ? shiftData.clock_in_time.toDate() : shiftData.clock_in_time;
    const clockOutTime = shiftData.clock_out_time?.toDate ? shiftData.clock_out_time.toDate() : shiftData.clock_out_time;
    const totalElapsedSeconds = Math.floor((clockOutTime - clockInTime) / 1000);

    res.json({
      id: shiftId,
      employee_name: shiftData.employee_name,
      project_name: site_visits.length > 0 ? site_visits[0].project_name : 'Unknown',
      phase: site_visits.length > 0 ? site_visits[0].phase : null,
      clock_in_time: clockInTime,
      clock_out_time: clockOutTime,
      shift_duration: shiftData.shift_duration || 0,
      break_duration: shiftData.break_duration || 0,
      total_elapsed_seconds: totalElapsedSeconds,
      site_visits: site_visits,
      breaks: breaks,
      status: shiftData.status,
    });
  } catch (error) {
    console.error('Error in /api/shifts/:shiftId/summary:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shifts/:shiftId/submit', async (req, res) => {
  try {
    const { shiftId } = req.params;
    const { changes } = req.body;

    const shiftDoc = await db.collection('shifts').doc(shiftId).get();
    if (!shiftDoc.exists) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    const now = new Date();
    const employeeName = shiftDoc.data().employee_name;

    if (changes && Array.isArray(changes) && changes.length > 0) {
      for (const change of changes) {
        if (change.previousValue !== change.newValue) {
          const auditId = `auditlog_${shiftId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await db.collection('audit_logs').doc(auditId).set({
            shift_id: shiftId,
            document_id: change.documentId,
            document_type: change.documentType,
            inspector_id: employeeName,
            field_changed: change.fieldChanged,
            previous_value: String(change.previousValue),
            new_value: String(change.newValue),
            timestamp: now
          });
        }
      }
    }

    await db.collection('shifts').doc(shiftId).update({
      status: 'SUBMITTED',
      submitted_at: now
    });

    res.json({
      success: true,
      message: 'Shift submitted successfully',
      shiftId: shiftId,
      submittedAt: now
    });
  } catch (error) {
    console.error('Error in /api/shifts/:shiftId/submit:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shifts/:shiftId/updatefield', async (req, res) => {
  try {
    const { shiftId } = req.params;
    const { documentId, documentType, fieldName, newValue } = req.body;

    if (!documentId || !documentType || !fieldName) {
      return res.status(400).json({ error: 'Missing required fields: documentId, documentType, fieldName' });
    }

    const collection = documentType === 'activity_log' ? 'activity_logs' :
                      documentType === 'site_visit' ? 'site_visits' :
                      documentType === 'shift' ? 'shifts' : null;

    if (!collection) {
      return res.status(400).json({ error: 'Invalid documentType' });
    }

    const doc = await db.collection(collection).doc(documentId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const previousValue = doc.data()[fieldName];

    await db.collection(collection).doc(documentId).update({
      [fieldName]: newValue
    });

    res.json({
      success: true,
      message: 'Field updated',
      documentId: documentId,
      fieldName: fieldName,
      previousValue: previousValue,
      newValue: newValue
    });
  } catch (error) {
    console.error('Error in /api/shifts/:shiftId/updatefield:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});