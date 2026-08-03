import React, { useState, useEffect, useRef } from 'react';
import './ClockIn.css';
import { db } from './firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function ClockIn() {
  const [inspectors, setInspectors] = useState([]);
  const [selectedInspector, setSelectedInspector] = useState(null);
  const [inspectorSearch, setInspectorSearch] = useState('');
  const [showInspectorDropdown, setShowInspectorDropdown] = useState(false);
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedPhase, setSelectedPhase] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [, setLocationError] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [phaseSearch, setPhaseSearch] = useState('');
  const [activitySearch, setActivitySearch] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showPhaseDropdown, setShowPhaseDropdown] = useState(false);
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
  const [overlapResolved, setOverlapResolved] = useState(false);
  const inspectorInputRef = useRef(null);
  const projectInputRef = useRef(null);
  const phaseInputRef = useRef(null);
  const activityInputRef = useRef(null);
  const inspectorTouchStartRef = useRef(0);
  const projectTouchStartRef = useRef(0);
  const phaseTouchStartRef = useRef(0);
  const activityTouchStartRef = useRef(0);
  const [testLocationIndex, setTestLocationIndex] = useState(0);
  const [shiftInProgress, setShiftInProgress] = useState(false);
  const [currentShiftId, setCurrentShiftId] = useState(null);
  const [clockInTime, setClockInTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [isActivityActive, setIsActivityActive] = useState(false);
  const [isSiteVisitActive, setIsSiteVisitActive] = useState(false);
  const [breakElapsedTime, setBreakElapsedTime] = useState('00:00:00');
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [activityElapsedTime, setActivityElapsedTime] = useState('00:00:00');
  const [activityStartTime, setActivityStartTime] = useState(null);
  const [activityPausedMs, setActivityPausedMs] = useState(0);
  const [siteVisitElapsedTime, setSiteVisitElapsedTime] = useState('00:00:00');
  const [siteVisitStartTime, setSiteVisitStartTime] = useState(null);
  const [siteVisitPausedMs, setSiteVisitPausedMs] = useState(0);
  const [currentActivityName, setCurrentActivityName] = useState('');
  const [currentSiteVisitName, setCurrentSiteVisitName] = useState('');
  const [currentPhaseName, setCurrentPhaseName] = useState('');
  const [sipsActivitySearch, setSipsActivitySearch] = useState('');
  const [showSipsActivityDropdown, setShowSipsActivityDropdown] = useState(false);
  const [sipsSiteVisitSearch, setSipsSiteVisitSearch] = useState('');
  const [showSipsSiteVisitDropdown, setShowSipsSiteVisitDropdown] = useState(false);
  const [sipsPhaseSearch, setSipsPhaseSearch] = useState('');
  const [showSipsPhaseDropdown, setShowSipsPhaseDropdown] = useState(false);
  const [currentSitePhases, setCurrentSitePhases] = useState([]);
  const sipsActivityInputRef = useRef(null);
  const sipsSiteVisitInputRef = useRef(null);
  const sipsPhaseInputRef = useRef(null);
  const sipsActivityTouchStartRef = useRef(0);
  const sipsSiteVisitTouchStartRef = useRef(0);
  const sipsPhaseTouchStartRef = useRef(0);
  const breakLastTapRef = useRef(0);
  const activityLastTapRef = useRef(0);
  const siteVisitLastTapRef = useRef(0);
  const clockOutLastTapRef = useRef(0);
  const clockInLastTapRef = useRef(0);
  const makeEditsLastTapRef = useRef(0);
  const submitLastTapRef = useRef(0);
  const [siteVisitMessageState, setSiteVisitMessageState] = useState('');
  const siteVisitMessageTimeoutRef = useRef(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [isEditingEnabled, setIsEditingEnabled] = useState(false);
  const [editedFields, setEditedFields] = useState({});
  const elapsedTimeAccumulatedMsRef = useRef(0);

  const testLocations = [
    { latitude: 40.102063650000005, longitude: -75.4128611, name: 'Current Location' }
  ];

  useEffect(() => {
    fetchInspectors();
    fetchProjects();
    fetchActivities();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [shiftInProgress, showSummary]);

  useEffect(() => {
    if (!shiftInProgress || !clockInTime || isBreakActive) return;
    const timer = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - clockInTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setElapsedTime(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [shiftInProgress, clockInTime, isBreakActive]);

  useEffect(() => {
    if (!isBreakActive || !breakStartTime) return;
    const timer = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - breakStartTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setBreakElapsedTime(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [isBreakActive, breakStartTime]);

  useEffect(() => {
    if (!shiftInProgress || !isActivityActive || isBreakActive || !isSiteVisitActive || !clockInTime) return;
    if (!activityStartTime) return;
    const timer = setInterval(() => {
      const now = new Date();
      const elapsedMs = now.getTime() - activityStartTime.getTime();
      const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
      const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);
      setActivityElapsedTime(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [shiftInProgress, isActivityActive, activityStartTime, isBreakActive, isSiteVisitActive, clockInTime]);

  useEffect(() => {
    if (!shiftInProgress || !isSiteVisitActive || isBreakActive) return;
    if (!siteVisitStartTime) return;
    const timer = setInterval(() => {
      const now = new Date();
      const elapsedMs = now.getTime() - siteVisitStartTime.getTime();
      const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
      const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);
      setSiteVisitElapsedTime(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [shiftInProgress, isSiteVisitActive, siteVisitStartTime, isBreakActive]);

  useEffect(() => {
    if (shiftInProgress) {
      const saveShiftStateToLocalStorage = (state) => {
        try {
          localStorage.setItem('geotime_shift_state', JSON.stringify({
            shiftInProgress: state.shiftInProgress,
            currentShiftId: state.currentShiftId,
            clockInTime: state.clockInTime ? state.clockInTime.toISOString() : null,
            isBreakActive: state.isBreakActive,
            isActivityActive: state.isActivityActive,
            isSiteVisitActive: state.isSiteVisitActive,
            currentActivityName: state.currentActivityName,
            currentSiteVisitName: state.currentSiteVisitName,
            currentPhaseName: state.currentPhaseName,
            selectedProject: state.selectedProject,
            activityElapsedTime: state.activityElapsedTime,
            siteVisitElapsedTime: state.siteVisitElapsedTime,
            breakElapsedTime: state.breakElapsedTime,
            breakStartTime: state.breakStartTime ? state.breakStartTime.toISOString() : null,
            activityStartTime: state.activityStartTime ? state.activityStartTime.toISOString() : null,
            activityPausedMs: state.activityPausedMs,
            siteVisitStartTime: state.siteVisitStartTime ? state.siteVisitStartTime.toISOString() : null,
            siteVisitPausedMs: state.siteVisitPausedMs,
            currentSitePhases: state.currentSitePhases,
            elapsedTime: state.elapsedTime,
            elapsedTimeAccumulatedMs: state.elapsedTimeAccumulatedMs,
          }));
        } catch (error) {
          console.error('Error saving shift state to localStorage:', error);
        }
      };
      saveShiftStateToLocalStorage({
        shiftInProgress,
        currentShiftId,
        clockInTime,
        isBreakActive,
        isActivityActive,
        isSiteVisitActive,
        currentActivityName,
        currentSiteVisitName,
        currentPhaseName,
        selectedProject,
        activityElapsedTime,
        siteVisitElapsedTime,
        breakElapsedTime,
        breakStartTime,
        activityStartTime,
        activityPausedMs,
        siteVisitStartTime,
        siteVisitPausedMs,
        currentSitePhases,
        elapsedTime,
        elapsedTimeAccumulatedMs: elapsedTimeAccumulatedMsRef.current,
      });
    }
  }, [shiftInProgress, currentShiftId, clockInTime, isBreakActive, isActivityActive, isSiteVisitActive, currentActivityName, currentSiteVisitName, currentPhaseName, selectedProject, activityElapsedTime, siteVisitElapsedTime, breakElapsedTime, breakStartTime, activityStartTime, activityPausedMs, siteVisitStartTime, siteVisitPausedMs, currentSitePhases, elapsedTime]);

  useEffect(() => {
    if (showSummary) {
      try {
        localStorage.setItem('geotime_summary_state', JSON.stringify({
          showSummary: true,
          summaryData: summaryData,
          isEditingEnabled: isEditingEnabled,
          editedFields: editedFields,
        }));
      } catch (error) {
        console.error('Error saving summary state to localStorage:', error);
      }
    }
  }, [showSummary, summaryData, isEditingEnabled, editedFields]);

  useEffect(() => {
    try {
      localStorage.setItem('geotime_start_shift_state', JSON.stringify({
        selectedInspector: selectedInspector,
        inspectorSearch: inspectorSearch,
        selectedProject: selectedProject,
        selectedPhase: selectedPhase,
        projectSearch: projectSearch,
        phaseSearch: phaseSearch,
        selectedActivity: selectedActivity,
        activitySearch: activitySearch,
      }));
    } catch (error) {
      console.error('Error saving start shift state to localStorage:', error);
    }
  }, [selectedInspector, inspectorSearch, selectedProject, selectedPhase, projectSearch, phaseSearch, selectedActivity, activitySearch]);

  const fetchInspectors = async () => {
    try {
      const response = await fetch('https://geotime-697107870492.us-east1.run.app/api/inspectors');
      if (!response.ok) throw new Error('Failed to fetch inspectors');
      const data = await response.json();
      setInspectors(data);
    } catch (error) {
      console.error('Error fetching inspectors:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('https://geotime-697107870492.us-east1.run.app/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
      setAllProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const activitiesRef = collection(db, 'activities');
      const querySnapshot = await getDocs(activitiesRef);
      const activitiesData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.activity && data.description && data.billable && !data.shift_id) {
          activitiesData.push({
            id: doc.id,
            ...data
          });
        }
      });
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const restoreShiftStateFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('geotime_shift_state');
      if (saved) {
        const state = JSON.parse(saved);
        if (state.shiftInProgress) {
          setShiftInProgress(true);
          setCurrentShiftId(state.currentShiftId);
          setIsBreakActive(state.isBreakActive);
          setIsActivityActive(state.isActivityActive);
          setIsSiteVisitActive(state.isSiteVisitActive);
          setCurrentActivityName(state.currentActivityName);
          setCurrentSiteVisitName(state.currentSiteVisitName);
          setCurrentPhaseName(state.currentPhaseName);
          setSelectedProject(state.selectedProject);
          setActivityElapsedTime(state.activityElapsedTime || '00:00:00');
          setSiteVisitElapsedTime(state.siteVisitElapsedTime || '00:00:00');
          setBreakElapsedTime(state.breakElapsedTime || '00:00:00');
          setElapsedTime(state.elapsedTime || '00:00:00');
          setCurrentSitePhases(state.currentSitePhases || []);

          elapsedTimeAccumulatedMsRef.current = state.elapsedTimeAccumulatedMs || 0;

          const now = new Date();

          if (state.isBreakActive && state.breakStartTime) {
            setBreakStartTime(new Date(state.breakStartTime));
          }

          if (state.clockInTime) {
            setClockInTime(new Date(state.clockInTime));
          } else if (state.isBreakActive && state.elapsedTime) {
            const elapsedParts = state.elapsedTime.split(':');
            const elapsedMs = parseInt(elapsedParts[0]) * 3600000 +
              parseInt(elapsedParts[1]) * 60000 +
              parseInt(elapsedParts[2]) * 1000;
            setClockInTime(new Date(now.getTime() - elapsedMs));
          }

          if (state.isActivityActive && state.activityStartTime) {
            setActivityStartTime(new Date(state.activityStartTime));
          } else if (!state.isActivityActive && state.activityPausedMs) {
            const roundedActivityMs = Math.floor(state.activityPausedMs / 1000) * 1000;
            setActivityStartTime(new Date(now.getTime() - roundedActivityMs));
            setActivityPausedMs(state.activityPausedMs);
          }

          if (state.isSiteVisitActive && state.siteVisitStartTime) {
            setSiteVisitStartTime(new Date(state.siteVisitStartTime));
          } else if (!state.isSiteVisitActive && state.siteVisitPausedMs) {
            setSiteVisitStartTime(null);
            setSiteVisitPausedMs(state.siteVisitPausedMs);
          }

          try {
            const summarySaved = localStorage.getItem('geotime_summary_state');
            if (summarySaved) {
              const summaryState = JSON.parse(summarySaved);
              setShowSummary(summaryState.showSummary || false);
              setSummaryData(summaryState.summaryData || null);
              setIsEditingEnabled(summaryState.isEditingEnabled || false);
              setEditedFields(summaryState.editedFields || {});
            }
          } catch (e) {
            console.error('Error restoring summary state:', e);
          }
          return true;
        }
      }
    } catch (error) {
      console.error('Error restoring shift state from localStorage:', error);
    }
    return false;
  };

  const restoreStartShiftStateFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('geotime_start_shift_state');
      if (saved) {
        const state = JSON.parse(saved);
        if (state.selectedInspector) {
          setSelectedInspector(state.selectedInspector);
          setInspectorSearch(state.inspectorSearch || state.selectedInspector.full_name || '');
        }
        if (state.selectedProject) {
          setSelectedProject(state.selectedProject);
          setProjectSearch(state.projectSearch || state.selectedProject.project_name || '');
        }
        if (state.selectedPhase) {
          setSelectedPhase(state.selectedPhase);
          setPhaseSearch(state.phaseSearch || state.selectedPhase || '');
        }
        if (state.selectedActivity) {
          setSelectedActivity(state.selectedActivity);
          setActivitySearch(state.activitySearch || state.selectedActivity || '');
        }
      }
    } catch (error) {
      console.error('Error restoring start shift state from localStorage:', error);
    }
  };

  const clearShiftStateFromLocalStorage = () => {
    try {
      localStorage.removeItem('geotime_shift_state');
      localStorage.removeItem('geotime_summary_state');
      localStorage.removeItem('geotime_start_shift_state');
    } catch (error) {
      console.error('Error clearing shift state from localStorage:', error);
    }
  };

  useEffect(() => {
    const restoredFromLocalStorage = restoreShiftStateFromLocalStorage();
    if (!restoredFromLocalStorage) {
      checkForActiveShift();
    }
  }, []);

  useEffect(() => {
    if (inspectors.length > 0 && projects.length > 0 && activities.length > 0 && !shiftInProgress) {
      restoreStartShiftStateFromLocalStorage();
    }
  }, [inspectors, projects, activities, shiftInProgress]);

  const checkForActiveShift = async () => {
    try {
      const shiftsRef = collection(db, 'shifts');
      const q = query(shiftsRef, where('status', '==', 'ACTIVE'));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const shiftDoc = querySnapshot.docs[0];
        const shiftData = shiftDoc.data();
        setCurrentShiftId(shiftDoc.id);
        setClockInTime(shiftData.clock_in_time.toDate());
        setShiftInProgress(true);
        setIsBreakActive(!!shiftData.activeBreak);
        setIsActivityActive(false);
        setIsSiteVisitActive(false);
        setCurrentActivityName('');
        setCurrentSiteVisitName('');
        setCurrentPhaseName('');
        setCurrentSitePhases([]);
        setSipsActivitySearch('');
        setSipsSiteVisitSearch('');
        setSipsPhaseSearch('');
        setShowSipsActivityDropdown(false);
        setShowSipsSiteVisitDropdown(false);
        setShowSipsPhaseDropdown(false);
        const activityLogsSnapshot = await getDocs(
          query(collection(db, 'activity_logs'), where('shift_id', '==', shiftDoc.id), where('end_timestamp', '==', null))
        );
        if (!activityLogsSnapshot.empty) {
          const activityData = activityLogsSnapshot.docs[0].data();
          setCurrentActivityName(activityData.description);
          setIsActivityActive(true);
          if (activityData.start_timestamp) {
            setActivityStartTime(activityData.start_timestamp.toDate());
          }
        }
        const siteVisitsSnapshot = await getDocs(
          query(collection(db, 'site_visits'), where('shift_id', '==', shiftDoc.id), where('exit_timestamp', '==', null))
        );
        if (!siteVisitsSnapshot.empty) {
          const siteVisitData = siteVisitsSnapshot.docs[0].data();
          setCurrentSiteVisitName(siteVisitData.project_name);
          setCurrentPhaseName(siteVisitData.phase || '');
          setSipsPhaseSearch(siteVisitData.phase || '');
          setIsSiteVisitActive(true);
          if (siteVisitData.entry_timestamp) {
            setSiteVisitStartTime(siteVisitData.entry_timestamp.toDate());
          }
        }
      }
    } catch (error) {
      console.error('Error checking for active shift:', error);
    }
  };

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

  const getLocationOnDemand = () => {
    const currentLocation = testLocations[testLocationIndex];
    const location = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    };
    setUserLocation(location);
    setLocationError('');
    setTestLocationIndex((prevIndex) => (prevIndex + 1) % testLocations.length);
    return location;
  };

  const filteredInspectors = inspectors.filter((inspector) =>
    inspector.full_name.toLowerCase().includes(inspectorSearch.toLowerCase())
  );
  const filteredProjects = projects.filter((project) =>
    project.project_name.toLowerCase().includes(projectSearch.toLowerCase())
  );
  const filteredPhases = selectedProject?.phases?.filter((phase) =>
    phase.toLowerCase().includes(phaseSearch.toLowerCase())
  ) || [];
  const filteredActivities = activities.filter((activity) =>
    activity.description.toLowerCase().includes(activitySearch.toLowerCase())
  );
  const filteredSipsActivities = activities.filter((activity) =>
    activity.description.toLowerCase().includes(sipsActivitySearch.toLowerCase())
  );
  const filteredSipsSiteVisits = allProjects.filter((project) =>
    project.project_name.toLowerCase().includes(sipsSiteVisitSearch.toLowerCase())
  );
  const filteredSipsPhases = currentSitePhases.filter((phase) =>
    phase.toLowerCase().includes(sipsPhaseSearch.toLowerCase())
  );

  const handleInspectorSelect = (inspector) => {
    setSelectedInspector(inspector);
    setInspectorSearch(inspector.full_name);
    setShowInspectorDropdown(false);
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setProjectSearch(project.project_name);
    setShowProjectDropdown(false);
    setSelectedPhase('');
    setPhaseSearch('');
  };

  const handlePhaseSelect = (phase) => {
    setSelectedPhase(phase);
    setPhaseSearch(phase);
    setShowPhaseDropdown(false);
  };

  const handleActivitySelect = (activity) => {
    setSelectedActivity(activity.description);
    setActivitySearch(`${activity.activity} | ${activity.description}`);
    setShowActivityDropdown(false);
  };

  const handleSipsActivitySelect = (activity) => {
    setCurrentActivityName(activity.description);
    setSipsActivitySearch(`${activity.activity} | ${activity.description}`);
    setShowSipsActivityDropdown(false);
  };

  const clearSipsActivity = () => {
    setCurrentActivityName('');
    setSipsActivitySearch('');
    setShowSipsActivityDropdown(false);
  };

  const handleSipsSiteVisitSelect = (siteVisit) => {
    setCurrentSiteVisitName(siteVisit.project_name);
    setSipsSiteVisitSearch(siteVisit.project_name);
    setShowSipsSiteVisitDropdown(false);
    setCurrentPhaseName('');
    setSipsPhaseSearch('');
    setShowSipsPhaseDropdown(false);
    const sitePhasesArray = siteVisit.phases && Array.isArray(siteVisit.phases) ? siteVisit.phases : [];
    setCurrentSitePhases(sitePhasesArray);
    if (sitePhasesArray.length > 0) {
      if (!currentActivityName) {
        setSiteVisitMessageState('select_phase_activity');
      } else {
        setSiteVisitMessageState('select_phase');
      }
    } else {
      if (!currentActivityName) {
        setSiteVisitMessageState('select_activity');
      } else {
        setSiteVisitMessageState('');
      }
    }
  };

  const clearSipsSiteVisit = () => {
    setCurrentSiteVisitName('');
    setSipsSiteVisitSearch('');
    setShowSipsSiteVisitDropdown(false);
    setCurrentPhaseName('');
    setSipsPhaseSearch('');
    setShowSipsPhaseDropdown(false);
    setCurrentSitePhases([]);
    setSiteVisitMessageState('');
  };

  const clearSipsPhase = () => {
    setCurrentPhaseName('');
    setSipsPhaseSearch('');
    setShowSipsPhaseDropdown(false);
  };

  const handleSwipe = (e, onClear) => {
    if (e.type === 'touchstart') {
      const target = e.currentTarget;
      if (target === inspectorInputRef.current) {
        inspectorTouchStartRef.current = e.touches[0].clientX;
      } else if (target === projectInputRef.current) {
        projectTouchStartRef.current = e.touches[0].clientX;
      } else if (target === phaseInputRef.current) {
        phaseTouchStartRef.current = e.touches[0].clientX;
      } else if (target === activityInputRef.current) {
        activityTouchStartRef.current = e.touches[0].clientX;
      } else if (target === sipsActivityInputRef.current) {
        sipsActivityTouchStartRef.current = e.touches[0].clientX;
      } else if (target === sipsSiteVisitInputRef.current) {
        sipsSiteVisitTouchStartRef.current = e.touches[0].clientX;
      } else if (target === sipsPhaseInputRef.current) {
        sipsPhaseTouchStartRef.current = e.touches[0].clientX;
      }
    } else if (e.type === 'touchend') {
      let touchStart = 0;
      if (e.currentTarget === inspectorInputRef.current) {
        touchStart = inspectorTouchStartRef.current;
      } else if (e.currentTarget === projectInputRef.current) {
        touchStart = projectTouchStartRef.current;
      } else if (e.currentTarget === phaseInputRef.current) {
        touchStart = phaseTouchStartRef.current;
      } else if (e.currentTarget === activityInputRef.current) {
        touchStart = activityTouchStartRef.current;
      } else if (e.currentTarget === sipsActivityInputRef.current) {
        touchStart = sipsActivityTouchStartRef.current;
      } else if (e.currentTarget === sipsSiteVisitInputRef.current) {
        touchStart = sipsSiteVisitTouchStartRef.current;
      } else if (e.currentTarget === sipsPhaseInputRef.current) {
        touchStart = sipsPhaseTouchStartRef.current;
      }
      const touchEnd = e.changedTouches[0].clientX;
      const diff = touchStart - touchEnd;
      if (Math.abs(diff) > 50) {
        onClear();
      }
    }
  };

  const clearInspector = () => {
    setSelectedInspector(null);
    setInspectorSearch('');
    setShowInspectorDropdown(false);
  };

  const clearProject = () => {
    setSelectedProject(null);
    setProjectSearch('');
    setShowProjectDropdown(false);
    setSelectedPhase('');
    setPhaseSearch('');
  };

  const clearPhase = () => {
    setSelectedPhase('');
    setPhaseSearch('');
    setShowPhaseDropdown(false);
  };

  const clearActivity = () => {
    setSelectedActivity('');
    setActivitySearch('');
    setShowActivityDropdown(false);
  };

  const isInspectorSelected = !!selectedInspector;
  const isProjectSelected = !!selectedProject;
  const isPhaseSelected = !selectedProject || !selectedProject.phases || selectedProject.phases.length === 0 || !!selectedPhase;
  const isActivitySelected = !!selectedActivity;

  const getSiteVisitMessage = () => {
    if (siteVisitMessageState === 'ended_with_phases') {
      return '*Site visit ended. Phase and activity also ended';
    }
    if (siteVisitMessageState === 'ended') {
      return '*Site visit ended. Activity ended';
    }
    if (siteVisitMessageState === 'select_phase_activity') {
      return '*Select a phase and activity to start site visit';
    }
    if (siteVisitMessageState === 'select_phase') {
      return '*Select a phase to start site visit';
    }
    if (siteVisitMessageState === 'select_activity') {
      return '*Select an activity to start site visit';
    }
    if (isSiteVisitActive && !isActivityActive) {
      return '*Select an activity to resume site visit';
    }
    return '';
  };

  const handleClockInDoubleTap = async () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - clockInLastTapRef.current < DOUBLE_TAP_DELAY) {
      clockInLastTapRef.current = 0;
      await handleClockIn();
    } else {
      clockInLastTapRef.current = now;
    }
  };

  const handleClockIn = async () => {
    if (!isInspectorSelected) {
      setMessage('Please select an inspector');
      setMessageType('error');
      return;
    }
    if (!isProjectSelected) {
      setMessage('Please select a project');
      setMessageType('error');
      return;
    }
    if (selectedProject.phases && selectedProject.phases.length > 0 && !isPhaseSelected) {
      setMessage('Please select a phase');
      setMessageType('error');
      return;
    }
    if (!isActivitySelected) {
      setMessage('Please select an activity');
      setMessageType('error');
      return;
    }
    setLoading(true);
    setMessage('Getting your location...');
    setMessageType('info');
    const location = getLocationOnDemand();
    if (!location) {
      setMessage('Could not get your location. Please enable GPS and try again.');
      setMessageType('error');
      setLoading(false);
      return;
    }
    setMessage('Clocking in...');
    try {
      const radius = 150;
      const getDistance = (workerLat, workerLon, projectLat, projectLon) => {
        return calculateDistance(workerLat, workerLon, projectLat, projectLon);
      };
      let selectedProjectNearby = false;
      if (selectedProject.locations && Array.isArray(selectedProject.locations)) {
        for (const loc of selectedProject.locations) {
          const distance = getDistance(location.latitude, location.longitude, loc.latitude, loc.longitude);
          if (distance <= radius) {
            selectedProjectNearby = true;
            break;
          }
        }
      }
      if (!selectedProjectNearby) {
        setMessage('Too far from site');
        setMessageType('error');
        setLoading(false);
        return;
      }
      const response = await fetch('https://geotime-697107870492.us-east1.run.app/api/shifts/clockin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject.id,
          projectName: selectedProject.project_name,
          phase: selectedPhase || null,
          latitude: location.latitude,
          longitude: location.longitude,
          activity: selectedActivity,
          inspectorName: selectedInspector.full_name,
          overlapResolved: overlapResolved,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentShiftId(data.shiftId);
        setClockInTime(new Date());
        elapsedTimeAccumulatedMsRef.current = 0;
        setShiftInProgress(true);
        setElapsedTime('00:00:00');
        setIsBreakActive(false);
        setIsActivityActive(true);
        setIsSiteVisitActive(true);
        setCurrentActivityName(selectedActivity);
        setCurrentSiteVisitName(selectedProject.project_name);
        setCurrentPhaseName(selectedPhase);
        const projectPhases = selectedProject.phases && Array.isArray(selectedProject.phases) ? selectedProject.phases : [];
        setCurrentSitePhases(projectPhases);
        setActivityStartTime(new Date());
        setSiteVisitStartTime(new Date());
        setActivityElapsedTime('00:00:00');
        setSiteVisitElapsedTime('00:00:00');
        setActivityPausedMs(0);
        setSiteVisitPausedMs(0);
        setMessage('');
        setMessageType('');
      } else {
        setMessage(data.error || 'Clock-in failed');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Clock-in error details:', error);
      console.error('Error message:', error.message);
      setMessage('Network error');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleBreakDoubleTap = async () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - breakLastTapRef.current < DOUBLE_TAP_DELAY) {
      breakLastTapRef.current = 0;
      await executeBreakToggle();
    } else {
      breakLastTapRef.current = now;
    }
  };

  const executeBreakToggle = async () => {
    setLoading(true);
    setMessage('');
    try {
      const endpoint = isBreakActive
        ? 'https://geotime-697107870492.us-east1.run.app/api/shifts/endbreak'
        : 'https://geotime-697107870492.us-east1.run.app/api/shifts/startbreak';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftId: currentShiftId }),
      });
      const data = await response.json();
      if (response.ok) {
        if (!isBreakActive) {
          const now = new Date();
          const currentElapsedMs = now.getTime() - clockInTime.getTime();
          const elapsedRoundedDown = Math.floor(currentElapsedMs / 1000) * 1000;
          elapsedTimeAccumulatedMsRef.current = elapsedRoundedDown;

          const activityParts = activityElapsedTime.split(':');
          const activityMs = (parseInt(activityParts[0]) * 3600 + parseInt(activityParts[1]) * 60 + parseInt(activityParts[2])) * 1000;
          setActivityPausedMs(activityMs);

          const siteVisitParts = siteVisitElapsedTime.split(':');
          const siteVisitMs = (parseInt(siteVisitParts[0]) * 3600 + parseInt(siteVisitParts[1]) * 60 + parseInt(siteVisitParts[2])) * 1000;
          setSiteVisitPausedMs(siteVisitMs);

          setBreakStartTime(new Date());
          setClockInTime(null);
        } else {
          const now = new Date();
          const adjustedClockInTime = new Date(now.getTime() - elapsedTimeAccumulatedMsRef.current);

          setClockInTime(adjustedClockInTime);
          setActivityStartTime(new Date(now.getTime() - activityPausedMs));
          setSiteVisitStartTime(new Date(now.getTime() - siteVisitPausedMs));
          setActivityPausedMs(0);
          setSiteVisitPausedMs(0);
          setBreakStartTime(null);
          setBreakElapsedTime('00:00:00');
        }
        setIsBreakActive(!isBreakActive);
      } else {
        setMessage(data.error || `Failed to ${isBreakActive ? 'end' : 'start'} break`);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Break toggle error:', error);
      setMessage('Network error');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleActivityDoubleTap = async () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - activityLastTapRef.current < DOUBLE_TAP_DELAY) {
      activityLastTapRef.current = 0;
      await executeActivityToggle();
    } else {
      activityLastTapRef.current = now;
    }
  };

  const executeActivityToggle = async () => {
    setLoading(true);
    setMessage('');
    try {
      if (isActivityActive) {
        const activityParts = activityElapsedTime.split(':');
        const activityTotalMs = (parseInt(activityParts[0]) * 3600 + parseInt(activityParts[1]) * 60 + parseInt(activityParts[2])) * 1000;
        const response = await fetch('https://geotime-697107870492.us-east1.run.app/api/shifts/endactivity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shiftId: currentShiftId,
            elapsedTimeMs: activityTotalMs,
          }),
        });
        const data = await response.json();
        if (response.ok) {
          const now = new Date();
          const currentElapsedMs = now.getTime() - clockInTime.getTime();
          const elapsedRoundedDown = Math.floor(currentElapsedMs / 1000) * 1000;
          elapsedTimeAccumulatedMsRef.current = elapsedRoundedDown;

          const siteVisitParts = siteVisitElapsedTime.split(':');
          const siteVisitMs = (parseInt(siteVisitParts[0]) * 3600 + parseInt(siteVisitParts[1]) * 60 + parseInt(siteVisitParts[2])) * 1000;
          setSiteVisitPausedMs(siteVisitMs);
          setSiteVisitStartTime(null);

          setActivityPausedMs(activityTotalMs);
          setIsActivityActive(false);
          setCurrentActivityName('');
          setSipsActivitySearch('');
          setShowSipsActivityDropdown(false);
          setActivityStartTime(null);
          setClockInTime(null);
        } else {
          setMessage(data.error || 'Failed to end activity');
          setMessageType('error');
        }
      } else {
        if (!currentActivityName) {
          setMessage('Please select an activity first');
          setMessageType('error');
          setLoading(false);
          return;
        }
        const response = await fetch('https://geotime-697107870492.us-east1.run.app/api/shifts/startactivity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shiftId: currentShiftId,
            activity: currentActivityName,
            description: currentActivityName
          }),
        });
        const data = await response.json();
        if (response.ok) {
          const now = new Date();
          const adjustedClockInTime = new Date(now.getTime() - elapsedTimeAccumulatedMsRef.current);

          setIsActivityActive(true);
          setClockInTime(adjustedClockInTime);
          setActivityStartTime(new Date(now.getTime() - activityPausedMs));
          setActivityPausedMs(0);
          setSiteVisitStartTime(new Date(now.getTime() - siteVisitPausedMs));
          setSiteVisitPausedMs(0);
        } else {
          setMessage(data.error || 'Failed to start activity');
          setMessageType('error');
        }
      }
    } catch (error) {
      console.error('Activity toggle error:', error);
      setMessage('Network error');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSiteVisitDoubleTap = async () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - siteVisitLastTapRef.current < DOUBLE_TAP_DELAY) {
      siteVisitLastTapRef.current = 0;
      await executeSiteVisitToggle();
    } else {
      siteVisitLastTapRef.current = now;
    }
  };

  const executeSiteVisitToggle = async () => {
    setLoading(true);
    setMessage('');
    try {
      if (isSiteVisitActive) {
        const hadPhases = currentSitePhases.length > 0;
        const siteVisitParts = siteVisitElapsedTime.split(':');
        const siteVisitTotalMs = (parseInt(siteVisitParts[0]) * 3600 + parseInt(siteVisitParts[1]) * 60 + parseInt(siteVisitParts[2])) * 1000;
        const response = await fetch('https://geotime-697107870492.us-east1.run.app/api/shifts/endsitevisit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shiftId: currentShiftId,
            elapsedTimeMs: siteVisitTotalMs,
          }),
        });
        const data = await response.json();
        if (response.ok) {
          const now = new Date();
          const currentElapsedMs = now.getTime() - clockInTime.getTime();
          const elapsedRoundedDown = Math.floor(currentElapsedMs / 1000) * 1000;
          elapsedTimeAccumulatedMsRef.current = elapsedRoundedDown;

          setSiteVisitPausedMs(siteVisitTotalMs);
          setIsSiteVisitActive(false);
          setCurrentSiteVisitName('');
          setSipsSiteVisitSearch('');
          setShowSipsSiteVisitDropdown(false);
          setSiteVisitStartTime(null);
          setCurrentPhaseName('');
          setSipsPhaseSearch('');
          setShowSipsPhaseDropdown(false);
          setCurrentSitePhases([]);
          setClockInTime(null);

          const activityParts = activityElapsedTime.split(':');
          const activityTotalMs = (parseInt(activityParts[0]) * 3600 + parseInt(activityParts[1]) * 60 + parseInt(activityParts[2])) * 1000;
          const activityResponse = await fetch('https://geotime-697107870492.us-east1.run.app/api/shifts/endactivity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shiftId: currentShiftId,
              elapsedTimeMs: activityTotalMs,
            }),
          });
          const activityData = await activityResponse.json();
          if (activityResponse.ok) {
            setActivityPausedMs(activityTotalMs);
            setIsActivityActive(false);
            setCurrentActivityName('');
            setSipsActivitySearch('');
            setShowSipsActivityDropdown(false);
            setActivityStartTime(null);
          } else {
            console.error('Failed to end activity:', activityData.error);
          }

          setSiteVisitMessageState(hadPhases ? 'ended_with_phases' : 'ended');
          if (siteVisitMessageTimeoutRef.current) {
            clearTimeout(siteVisitMessageTimeoutRef.current);
          }
          siteVisitMessageTimeoutRef.current = setTimeout(() => {
            setSiteVisitMessageState('');
          }, 5000);
        } else {
          setMessage(data.error || 'Failed to end site visit');
          setMessageType('error');
        }
      } else {
        if (!currentSiteVisitName) {
          setMessage('Please select a site visit first');
          setMessageType('error');
          setLoading(false);
          return;
        }
        const location = getLocationOnDemand();
        if (!location) {
          setMessage('Could not get your location. Please enable GPS.');
          setMessageType('error');
          setLoading(false);
          return;
        }
        const selectedSiteProject = allProjects.find(p => p.project_name === currentSiteVisitName);
        if (!selectedSiteProject) {
          setMessage('Site not found');
          setMessageType('error');
          setLoading(false);
          return;
        }
        const radius = 150;
        const getDistance = (workerLat, workerLon, projectLat, projectLon) => {
          return calculateDistance(workerLat, workerLon, projectLat, projectLon);
        };
        let selectedProjectNearby = false;
        if (selectedSiteProject.locations && Array.isArray(selectedSiteProject.locations)) {
          for (const loc of selectedSiteProject.locations) {
            const distance = getDistance(location.latitude, location.longitude, loc.latitude, loc.longitude);
            if (distance <= radius) {
              selectedProjectNearby = true;
              break;
            }
          }
        }
        if (!selectedProjectNearby) {
          setMessage('Too far from site');
          setMessageType('error');
          setLoading(false);
          return;
        }
        const response = await fetch('https://geotime-697107870492.us-east1.run.app/api/shifts/startsitevisit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shiftId: currentShiftId,
            projectName: currentSiteVisitName,
            phase: currentPhaseName || null,
            latitude: location.latitude || 0,
            longitude: location.longitude || 0
          }),
        });
        const data = await response.json();
        if (response.ok) {
          const now = new Date();
          const adjustedClockInTime = new Date(now.getTime() - elapsedTimeAccumulatedMsRef.current);

          setIsSiteVisitActive(true);
          setClockInTime(adjustedClockInTime);
          setSiteVisitStartTime(new Date(now.getTime() - siteVisitPausedMs));
          setSiteVisitPausedMs(0);

          const activityResponse = await fetch('https://geotime-697107870492.us-east1.run.app/api/shifts/startactivity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shiftId: currentShiftId,
              activity: currentActivityName,
              description: currentActivityName
            }),
          });
          const activityData = await activityResponse.json();
          if (activityResponse.ok) {
            const nowForActivity = new Date();

            setIsActivityActive(true);
            setActivityStartTime(new Date(nowForActivity.getTime() - activityPausedMs));
            setActivityPausedMs(0);
          } else {
            console.error('Failed to start activity:', activityData.error);
          }
        } else {
          setMessage(data.error || 'Failed to start site visit');
          setMessageType('error');
        }
      }
    } catch (error) {
      console.error('Site visit toggle error:', error);
      setMessage('Network error');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhaseSelectSips = (phase) => {
    setCurrentPhaseName(phase);
    setSipsPhaseSearch(phase);
    setShowSipsPhaseDropdown(false);
  };

  const handleClockOutDoubleTap = async () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - clockOutLastTapRef.current < DOUBLE_TAP_DELAY) {
      clockOutLastTapRef.current = 0;
      await handleClockOut();
    } else {
      clockOutLastTapRef.current = now;
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    setMessage('Clocking out...');
    setMessageType('info');
    try {
      const elapsedParts = elapsedTime.split(':');
      const elapsedSeconds =
        Math.floor(parseInt(elapsedParts[0]) * 3600 +
          parseInt(elapsedParts[1]) * 60 +
          parseInt(elapsedParts[2]));

      const siteVisitParts = siteVisitElapsedTime.split(':');
      const siteVisitElapsedMs =
        Math.floor((parseInt(siteVisitParts[0]) * 3600 +
          parseInt(siteVisitParts[1]) * 60 +
          parseInt(siteVisitParts[2])) * 1000);

      const response = await fetch('https://geotime-697107870492.us-east1.run.app/api/shifts/clockout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId: currentShiftId,
          latitude: userLocation?.latitude || 0,
          longitude: userLocation?.longitude || 0,
          elapsedSeconds: elapsedSeconds,
          siteVisitElapsedMs: siteVisitElapsedMs
        }),
      });
      const data = await response.json();
      if (response.ok) {
        await fetchAndShowSummary();
      } else {
        setMessage(data.error || 'Clock-out failed');
        setMessageType('error');
        setLoading(false);
      }
    } catch (error) {
      console.error('Clock-out error:', error);
      setMessage('Network error');
      setMessageType('error');
      setLoading(false);
    }
  };

  const fetchAndShowSummary = async () => {
    try {
      const response = await fetch(`https://geotime-697107870492.us-east1.run.app/api/shifts/${currentShiftId}/summary`);
      if (!response.ok) throw new Error('Failed to fetch summary');
      const data = await response.json();
      setSummaryData(data);
      setIsEditingEnabled(false);
      setEditedFields({});
      setShowSummary(true);
      setMessage('');
      setMessageType('');
    } catch (error) {
      console.error('Error fetching summary:', error);
      setMessage('Failed to load shift summary');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleMakeEditsDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - makeEditsLastTapRef.current < DOUBLE_TAP_DELAY) {
      makeEditsLastTapRef.current = 0;
      setIsEditingEnabled(true);
    } else {
      makeEditsLastTapRef.current = now;
    }
  };

  const handleFieldChange = (documentId, fieldName, newValue) => {
    setEditedFields({
      ...editedFields,
      [`${documentId}_${fieldName}`]: {
        documentId,
        fieldName,
        newValue
      }
    });
  };

  const handleSubmitDoubleTap = async () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - submitLastTapRef.current < DOUBLE_TAP_DELAY) {
      submitLastTapRef.current = 0;
      await handleSubmitShift();
    } else {
      submitLastTapRef.current = now;
    }
  };

  const handleSubmitShift = async () => {
    setLoading(true);
    setMessage('Submitting shift...');
    setMessageType('info');
    try {
      const changes = Object.values(editedFields).map(edit => {
        let originalValue = null;
        if (edit.fieldName === 'duration') {
          const siteVisit = summaryData.site_visits.find(s => s.id === edit.documentId);
          if (siteVisit) {
            originalValue = siteVisit.duration;
          } else {
            for (const sv of summaryData.site_visits) {
              const activity = sv.activities.find(a => a.id === edit.documentId);
              if (activity) {
                originalValue = activity.duration;
                break;
              }
            }
          }
        }
        return {
          documentId: edit.documentId,
          documentType: edit.documentId.startsWith('activitylog_') ? 'activity_log' : 'site_visit',
          fieldChanged: edit.fieldName,
          previousValue: originalValue,
          newValue: edit.newValue
        };
      });
      const response = await fetch(`https://geotime-697107870492.us-east1.run.app/api/shifts/${currentShiftId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes }),
      });
      const data = await response.json();
      if (response.ok) {
        setShiftInProgress(false);
        setCurrentShiftId(null);
        setClockInTime(null);
        setSelectedInspector(null);
        setInspectorSearch('');
        setSelectedProject(null);
        setSelectedPhase('');
        setProjectSearch('');
        setPhaseSearch('');
        setSelectedActivity('');
        setActivitySearch('');
        setCurrentActivityName('');
        setCurrentSiteVisitName('');
        setCurrentPhaseName('');
        setCurrentSitePhases([]);
        setOverlapResolved(false);
        setIsBreakActive(false);
        setBreakElapsedTime('00:00:00');
        setBreakStartTime(null);
        setActivityElapsedTime('00:00:00');
        setActivityStartTime(null);
        setActivityPausedMs(0);
        setSiteVisitElapsedTime('00:00:00');
        setSiteVisitStartTime(null);
        setSiteVisitPausedMs(0);
        elapsedTimeAccumulatedMsRef.current = 0;
        clearShiftStateFromLocalStorage();
        setShowSummary(false);
        setSummaryData(null);
        setIsEditingEnabled(false);
        setEditedFields({});
        setMessage('✓ Shift submitted successfully');
        setMessageType('success');
        setTimeout(() => {
          setMessage('');
          setMessageType('');
        }, 3000);
      } else {
        setMessage(data.error || 'Failed to submit shift');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage('Network error');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const formatMinutes = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatTimeOnly = (timestamp) => {
    const date = new Date(timestamp);
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${period}`;
  };

  const groupSiteVisitsByProject = (siteVisits) => {
    const grouped = {};

    siteVisits.forEach((visit) => {
      const projectName = visit.project_name;
      if (!grouped[projectName]) {
        grouped[projectName] = {
          project_name: projectName,
          visits: []
        };
      }
      grouped[projectName].visits.push({
        ...visit,
        visitIndex: grouped[projectName].visits.length + 1
      });
    });

    return Object.values(grouped);
  };

  if (showSummary && summaryData) {
    const allPhasesSame = (siteGroup) => {
      if (siteGroup.visits.length === 0) return true;
      const firstPhase = siteGroup.visits[0].phase;
      return siteGroup.visits.every(visit => visit.phase === firstPhase);
    };

    const getGroupDuration = (siteGroup) => {
      return siteGroup.visits[siteGroup.visits.length - 1].duration;
    };

    return (
      <div className="clockin-container">
        <header className="clockin-header clockin-header-summary">
          <h1><i>Review Shift</i></h1>
        </header>
        <div className="clockin-content">
          {message && (
            <div className={`message message-${messageType}`}>
              {message}
            </div>
          )}
          <div className="summary-section">
            <div className="summary-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <label style={{ display: 'block' }}>Clock In</label>
                  <p style={{ margin: '4px 0' }}>{formatTimeOnly(summaryData.clock_in_time)}</p>
                </div>
                <div style={{ padding: '0 12px', fontSize: '16px' }}>-</div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <label style={{ display: 'block' }}>Clock Out</label>
                  <p style={{ margin: '4px 0' }}>{formatTimeOnly(summaryData.clock_out_time)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="summary-section">
            <h3>Overview</h3>
            <div className="summary-item">
              <label>Inspector</label>
              <p>{summaryData.employee_name}</p>
            </div>
          </div>
          <div className="summary-section">
            <h3>Time Summary</h3>
            <div className="summary-item">
              <label>Break Time</label>
              <p>{formatMinutes(summaryData.break_duration)}</p>
            </div>
            <div className="summary-item">
              <label>Shift Duration</label>
              <p>{formatMinutes(summaryData.shift_duration)}</p>
            </div>
          </div>
          {summaryData.site_visits && summaryData.site_visits.length > 0 && (
            <div className="summary-section">
              <h3>Site Visits ({summaryData.site_visits.length})</h3>
              {groupSiteVisitsByProject(summaryData.site_visits).map((siteGroup, groupIdx) => {
                const samePhases = allPhasesSame(siteGroup);
                const groupDuration = getGroupDuration(siteGroup);

                return (
                  <div key={groupIdx} className={`summary-item ${isEditingEnabled ? 'editable' : ''}`}>
                    <strong>{siteGroup.project_name}</strong>
                    <p><i>Duration:</i> {formatMinutes(groupDuration)}</p>
                    {samePhases && siteGroup.visits[0].phase && (
                      <p><i>Phase:</i> {siteGroup.visits[0].phase}</p>
                    )}

                    {siteGroup.visits.map((visit, visitIdx) => (
                      <div
                        key={visitIdx}
                        style={{
                          marginTop: visitIdx > 0 ? '12px' : '0px',
                          paddingTop: visitIdx > 0 ? '12px' : '0px',
                          borderTop: visitIdx > 0 ? '0.5px solid #e0e0e0' : 'none'
                        }}
                      >
                        {siteGroup.visits.length > 1 && (
                          <p style={{ fontSize: '12px', color: '#999', margin: '0 0 8px 0' }}>
                            Visit {visit.visitIndex}
                          </p>
                        )}
                        {!samePhases && visit.phase && (
                          <p><i>Phase:</i> {visit.phase}</p>
                        )}

                        <p style={{ fontStyle: 'italic', marginTop: '8px' }}>Activities ({visit.activities ? [...new Set(visit.activities.map(a => a.description))].length : 0}):</p>
                        <ul style={{ marginLeft: '20px', marginTop: '5px', fontSize: '0.9em' }}>
                          {visit.activities && [...new Set(visit.activities.map(a => a.description))].map((description) => (
                            <li key={description}>{description}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
          {!isEditingEnabled && (
            <button
              className="btn btn-primary btn-make-edits"
              onClick={() => {}}
              disabled={false}
            >
              Make Edits
            </button>
          )}
          <button
            className="btn btn-clock-in"
            onClick={handleSubmitDoubleTap}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
          <p className="swipe-hint" style={{ textAlign: 'center', marginTop: '20px' }}>Double tap buttons</p>
        </div>
      </div>
    );
  }

  if (shiftInProgress) {
    const elapsedTimeColor = isBreakActive || !isSiteVisitActive || !isActivityActive ? '#ff6b6b' : 'inherit';
    return (
      <div className="clockin-container">
        <header className="clockin-header">
          <h1><i>Shift in Progress</i></h1>
          <p className="subtitle">Project: {selectedProject?.project_name}</p>
        </header>
        <div className="clockin-content">
          <div className="elapsed-time-box">
            <p className="elapsed-time" style={{ color: elapsedTimeColor }}>{elapsedTime}</p>
          </div>
          {message && (
            <div className={`message message-${messageType}`}>
              {message}
            </div>
          )}
          <div className="control-card">
            <h3>Break</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <p className={`status ${isBreakActive ? 'active' : 'inactive'}`} style={{ color: isBreakActive ? 'green' : '#666', margin: 0 }}>
                {isBreakActive ? 'Active' : 'Inactive'}
              </p>
              {isBreakActive && <p style={{ fontSize: '12px', margin: 0 }}>({breakElapsedTime})</p>}
            </div>
            <button
              className={`btn ${isBreakActive ? 'btn-danger' : 'btn-warning'}`}
              onClick={handleBreakDoubleTap}
              disabled={loading || !isSiteVisitActive || (isSiteVisitActive && !isActivityActive)}
              style={{ color: 'black' }}
            >
              {loading ? 'Processing...' : isBreakActive ? 'End Break' : 'Start Break'}
            </button>
          </div>

          <div className="control-card">
            <h3>Activity</h3>
            {isBreakActive ? (
              <p style={{ color: '#666', margin: '5px 0' }}>Paused</p>
            ) : (
              <p className={`status ${isActivityActive ? 'active' : 'inactive'}`} style={{ color: isActivityActive ? 'green' : 'red' }}>
                {isActivityActive ? 'Active' : 'Inactive'}
              </p>
            )}
            {isActivityActive ? (
              <div className="search-dropdown-container">
                <input
                  type="text"
                  value={currentActivityName}
                  className="search-input"
                  disabled
                  readOnly
                />
              </div>
            ) : (
              <div className="search-dropdown-container">
                <input
                  ref={sipsActivityInputRef}
                  type="text"
                  placeholder="Type to search or scroll..."
                  value={sipsActivitySearch}
                  onChange={(e) => {
                    setSipsActivitySearch(e.target.value);
                    setShowSipsActivityDropdown(true);
                  }}
                  onFocus={() => setShowSipsActivityDropdown(true)}
                  onTouchStart={(e) => !isActivityActive && handleSwipe(e, clearSipsActivity)}
                  onTouchEnd={(e) => !isActivityActive && handleSwipe(e, clearSipsActivity)}
                  className="search-input"
                  disabled={loading}
                  readOnly={isActivityActive}
                />
                {showSipsActivityDropdown && !isActivityActive && (
                  <div className="dropdown-menu">
                    {filteredSipsActivities.length > 0 ? (
                      filteredSipsActivities.map((activity) => (
                        <div
                          key={activity.activity}
                          className="dropdown-item"
                          onClick={() => handleSipsActivitySelect(activity)}
                        >
                          <strong>{activity.activity}</strong> | {activity.description}
                        </div>
                      ))
                    ) : (
                      <div className="dropdown-item disabled">No activities found</div>
                    )}
                  </div>
                )}
              </div>
            )}
            <button
              className={`btn ${isActivityActive ? 'btn-danger' : 'btn-success'}`}
              onClick={handleActivityDoubleTap}
              disabled={loading || !isSiteVisitActive || (!isActivityActive && !currentActivityName) || isBreakActive}
              style={{ color: 'black' }}
            >
              {loading ? 'Processing...' : isActivityActive ? 'End Activity' : 'Start Activity'}
            </button>
          </div>

          <div className="control-card">
            <h3>Site Visit</h3>
            {isBreakActive ? (
              <p style={{ color: '#666', margin: '5px 0' }}>Paused</p>
            ) : isSiteVisitActive && !isActivityActive ? (
              <p style={{ color: '#666', margin: '5px 0' }}>Paused</p>
            ) : (
              <p className={`status ${isSiteVisitActive ? 'active' : 'inactive'}`} style={{ color: isSiteVisitActive ? 'green' : 'red' }}>
                {isSiteVisitActive ? 'Active' : 'Inactive'}
              </p>
            )}
            {isSiteVisitActive ? (
              <div className="search-dropdown-container">
                <input
                  type="text"
                  value={currentSiteVisitName}
                  className="search-input"
                  disabled
                  readOnly
                />
              </div>
            ) : (
              <div className="search-dropdown-container">
                <input
                  ref={sipsSiteVisitInputRef}
                  type="text"
                  placeholder="Type to search or scroll..."
                  value={sipsSiteVisitSearch}
                  onChange={(e) => {
                    setSipsSiteVisitSearch(e.target.value);
                    setShowSipsSiteVisitDropdown(true);
                  }}
                  onFocus={() => setShowSipsSiteVisitDropdown(true)}
                  onTouchStart={(e) => handleSwipe(e, clearSipsSiteVisit)}
                  onTouchEnd={(e) => handleSwipe(e, clearSipsSiteVisit)}
                  className="search-input"
                  disabled={loading}
                />
                {showSipsSiteVisitDropdown && (
                  <div className="dropdown-menu">
                    {filteredSipsSiteVisits.length > 0 ? (
                      filteredSipsSiteVisits.map((siteVisit) => (
                        <div
                          key={siteVisit.id}
                          className="dropdown-item"
                          onClick={() => handleSipsSiteVisitSelect(siteVisit)}
                        >
                          {siteVisit.project_name}
                        </div>
                      ))
                    ) : (
                      <div className="dropdown-item disabled">No sites found</div>
                    )}
                  </div>
                )}
              </div>
            )}
            {getSiteVisitMessage() && !isSiteVisitActive && (
              <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                {getSiteVisitMessage()}
              </p>
            )}
            {getSiteVisitMessage() && isSiteVisitActive && !isActivityActive && (
              <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                {getSiteVisitMessage()}
              </p>
            )}
            <button
              className={`btn ${isSiteVisitActive ? 'btn-danger' : 'btn-info'}`}
              onClick={handleSiteVisitDoubleTap}
              disabled={loading || (!isSiteVisitActive && (!currentSiteVisitName || !currentActivityName || (currentSitePhases.length > 0 && !currentPhaseName))) || isBreakActive}
              style={{ color: 'black' }}
            >
              {loading ? 'Processing...' : isSiteVisitActive ? 'End Site Visit' : 'Start Site Visit'}
            </button>
          </div>

          {currentSiteVisitName && currentSitePhases && currentSitePhases.length > 0 && (
            <div className="control-card">
              <h3>Phase</h3>
              {currentPhaseName ? (
                <div className="search-dropdown-container">
                  <input
                    ref={sipsPhaseInputRef}
                    type="text"
                    value={currentPhaseName}
                    className="search-input"
                    disabled={isSiteVisitActive}
                    readOnly={isSiteVisitActive}
                    onTouchStart={(e) => !isSiteVisitActive && handleSwipe(e, clearSipsPhase)}
                    onTouchEnd={(e) => !isSiteVisitActive && handleSwipe(e, clearSipsPhase)}
                  />
                </div>
              ) : (
                <div className="search-dropdown-container">
                  <input
                    ref={sipsPhaseInputRef}
                    type="text"
                    placeholder="Type to search or scroll..."
                    value={sipsPhaseSearch}
                    onChange={(e) => {
                      setSipsPhaseSearch(e.target.value);
                      setShowSipsPhaseDropdown(true);
                    }}
                    onFocus={() => setShowSipsPhaseDropdown(true)}
                    onTouchStart={(e) => handleSwipe(e, clearSipsPhase)}
                    onTouchEnd={(e) => handleSwipe(e, clearSipsPhase)}
                    className="search-input"
                    disabled={loading || isSiteVisitActive}
                    readOnly={false}
                  />
                  {showSipsPhaseDropdown && !isSiteVisitActive && (
                    <div className="dropdown-menu">
                      {filteredSipsPhases.length > 0 ? (
                        filteredSipsPhases.map((phase, index) => (
                          <div
                            key={index}
                            className="dropdown-item"
                            onClick={() => handlePhaseSelectSips(phase)}
                          >
                            {phase}
                          </div>
                        ))
                      ) : (
                        <div className="dropdown-item disabled">No phases found</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            className="btn btn-clock-in"
            onClick={handleClockOutDoubleTap}
            disabled={loading}
            style={{ color: 'white' }}
          >
            {loading ? 'Processing...' : 'Clock Out'}
          </button>
          <p className="swipe-hint" style={{ textAlign: 'center', marginTop: '20px' }}>
            {isSiteVisitActive ? 'Swipe to clear' : 'Swipe to clear • Double tap buttons'}
          </p>
        </div>
        <footer className="clockin-footer">
          <p>Manage your shift</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="clockin-container">
      <header className="clockin-header">
        <h1><i>Start Shift</i></h1>
        <p className="subtitle">{selectedInspector ? `Welcome ${selectedInspector.full_name}!` : 'Fill in to clock in'}</p>
      </header>
      <div className="clockin-content">
        <div className="form-group">
          <label htmlFor="inspector-search">Select Inspector:</label>
          <div className="search-dropdown-container">
            <input
              ref={inspectorInputRef}
              id="inspector-search"
              type="text"
              placeholder="Type to search or scroll..."
              value={inspectorSearch}
              onChange={(e) => {
                setInspectorSearch(e.target.value);
                setShowInspectorDropdown(true);
              }}
              onFocus={() => setShowInspectorDropdown(true)}
              onTouchStart={(e) => handleSwipe(e, clearInspector)}
              onTouchEnd={(e) => handleSwipe(e, clearInspector)}
              className="search-input"
              disabled={loading || !!selectedInspector}
              readOnly={!!selectedInspector}
            />
            {showInspectorDropdown && (
              <div className="dropdown-menu">
                {filteredInspectors.length > 0 ? (
                  filteredInspectors.map((inspector) => (
                    <div
                      key={inspector.id}
                      className="dropdown-item"
                      onClick={() => handleInspectorSelect(inspector)}
                    >
                      {inspector.full_name}
                    </div>
                  ))
                ) : (
                  <div className="dropdown-item disabled">No inspectors found</div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="project-search">Select Project:</label>
          <div className="search-dropdown-container">
            <input
              ref={projectInputRef}
              id="project-search"
              type="text"
              placeholder="Type to search or scroll..."
              value={projectSearch}
              onChange={(e) => {
                setProjectSearch(e.target.value);
                setShowProjectDropdown(true);
              }}
              onFocus={() => setShowProjectDropdown(true)}
              onTouchStart={(e) => handleSwipe(e, clearProject)}
              onTouchEnd={(e) => handleSwipe(e, clearProject)}
              className="search-input"
              disabled={loading || isProjectSelected}
              readOnly={isProjectSelected}
            />
            {showProjectDropdown && (
              <div className="dropdown-menu">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="dropdown-item"
                      onClick={() => handleProjectSelect(project)}
                    >
                      {project.project_name}
                    </div>
                  ))
                ) : (
                  <div className="dropdown-item disabled">No projects found</div>
                )}
              </div>
            )}
          </div>
        </div>
        {selectedProject && selectedProject.phases && selectedProject.phases.length > 0 && (
          <div className="form-group">
            <label htmlFor="phase-search">Select Phase:</label>
            <div className="search-dropdown-container">
              <input
                ref={phaseInputRef}
                id="phase-search"
                type="text"
                placeholder="Type to search or scroll..."
                value={phaseSearch}
                onChange={(e) => {
                  setPhaseSearch(e.target.value);
                  setShowPhaseDropdown(true);
                }}
                onFocus={() => setShowPhaseDropdown(true)}
                onTouchStart={(e) => handleSwipe(e, clearPhase)}
                onTouchEnd={(e) => handleSwipe(e, clearPhase)}
                className="search-input"
                disabled={loading || !!selectedPhase}
                readOnly={!!selectedPhase}
              />
              {showPhaseDropdown && (
                <div className="dropdown-menu">
                  {filteredPhases.length > 0 ? (
                    filteredPhases.map((phase, index) => (
                      <div
                        key={index}
                        className="dropdown-item"
                        onClick={() => handlePhaseSelect(phase)}
                      >
                        {phase}
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-item disabled">No phases found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="form-group">
          <label htmlFor="activity-search">Select Activity:</label>
          <div className="search-dropdown-container">
            <input
              ref={activityInputRef}
              id="activity-search"
              type="text"
              placeholder="Type to search or scroll..."
              value={activitySearch}
              onChange={(e) => {
                setActivitySearch(e.target.value);
                setShowActivityDropdown(true);
              }}
              onFocus={() => setShowActivityDropdown(true)}
              onTouchStart={(e) => handleSwipe(e, clearActivity)}
              onTouchEnd={(e) => handleSwipe(e, clearActivity)}
              className="search-input"
              disabled={loading || isActivitySelected}
              readOnly={isActivitySelected}
            />
            {showActivityDropdown && (
              <div className="dropdown-menu">
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((activity) => (
                    <div
                      key={activity.activity}
                      className="dropdown-item"
                      onClick={() => handleActivitySelect(activity)}
                    >
                      <strong>{activity.activity}</strong> | {activity.description}
                    </div>
                  ))
                ) : (
                  <div className="dropdown-item disabled">No activities found</div>
                )}
              </div>
            )}
          </div>
        </div>
        <button
          className="btn btn-clock-in"
          onClick={handleClockInDoubleTap}
          disabled={loading || !isInspectorSelected || !isProjectSelected || !isActivitySelected || (selectedProject?.phases?.length > 0 && !isPhaseSelected)}
        >
          {loading ? 'Clocking In...' : 'Clock In'}
        </button>
        <p className="swipe-hint" style={{ textAlign: 'center', marginTop: '20px' }}>Swipe to clear • Double tap buttons</p>
        {message && (
          <div className={`message message-${messageType}`}>
            {message}
          </div>
        )}
      </div>
      <footer className="clockin-footer">
        <p>Ensure GPS is enabled for accurate clock-in</p>
      </footer>
    </div>
  );
}