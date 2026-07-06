import { useEffect, useRef, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { MdQrCodeScanner, MdStop, MdDelete, MdCheckCircle, MdWarning, MdError } from 'react-icons/md';

const MarkAttendance = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [scanning, setScanning] = useState(false);
  const [scanLog, setScanLog] = useState([]);
  const [presentCount, setPresentCount] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState('');
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const lastScanRef = useRef('');
  const lastScanTimeRef = useRef(0);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await API.get('/subjects');
        setSubjects(res.data);
      } catch { /* ignore */ }
      finally { setLoadingSubjects(false); }
    };
    fetchSubjects();
  }, []);

  // Load existing attendance count when subject/date changes
  useEffect(() => {
    if (!selectedSubject || !selectedDate) { setPresentCount(0); return; }
    const fetchCount = async () => {
      try {
        const res = await API.get('/attendance', {
          params: { subjectId: selectedSubject, date: selectedDate }
        });
        setPresentCount(res.data.length);
      } catch { /* ignore */ }
    };
    fetchCount();
  }, [selectedSubject, selectedDate]);

  const onScanSuccess = useCallback(async (decodedText) => {
    const now = Date.now();
    // Debounce: ignore same QR within 3 seconds to prevent accidental double-scans
    if (decodedText === lastScanRef.current && now - lastScanTimeRef.current < 3000) return;
    lastScanRef.current = decodedText;
    lastScanTimeRef.current = now;

    const rollNumber = decodedText.trim().toUpperCase();

    try {
      const res = await API.post('/attendance/scan', {
        rollNumber,
        subjectId: selectedSubject,
        date: selectedDate
      });

      const { student, alreadyMarked } = res.data;

      if (alreadyMarked) {
        setScanLog(prev => [{
          id: Date.now(),
          type: 'duplicate',
          icon: '⚠️',
          text: `${student.name} (${rollNumber}) — Already marked`,
          time: new Date().toLocaleTimeString()
        }, ...prev.slice(0, 29)]);
        setStatusMsg(`⚠️ ${student.name} already marked present!`);
        setStatusType('warning');
      } else {
        setPresentCount(prev => prev + 1);
        setScanLog(prev => [{
          id: Date.now(),
          type: 'success',
          icon: '✅',
          text: `${student.name} (${rollNumber}) — Present`,
          time: new Date().toLocaleTimeString()
        }, ...prev.slice(0, 29)]);
        setStatusMsg(`✅ ${student.name} marked present!`);
        setStatusType('success');

        // Play a success sound via AudioContext
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } catch { /* ignore */ }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error processing scan';
      setScanLog(prev => [{
        id: Date.now(),
        type: 'error',
        icon: '❌',
        text: `${rollNumber} — ${msg}`,
        time: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 29)]);
      setStatusMsg(`❌ ${msg}`);
      setStatusType('error');
    }

    // Clear status after 3s
    setTimeout(() => { setStatusMsg(''); setStatusType(''); }, 3000);
  }, [selectedSubject, selectedDate]);

  const startScanner = async () => {
    if (!selectedSubject) {
      alert('Please select a subject first.');
      return;
    }
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 30, // Maximum frame rate for fastest possible decode
          qrbox: { width: 250, height: 250 }, // Smaller focused box = faster decode computation
          aspectRatio: 1.777778, // Match standard wide camera sensors
          disableFlip: false, // Allow mirrored QR codes
          experimentalFeatures: { useBarCodeDetectorIfSupported: true }, // Use native BarcodeDetector API for near-instant decoding
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.UPC_A
          ]
        },
        onScanSuccess,
        () => { /* ignore errors */ }
      );
      setScanning(true);
    } catch (err) {
      console.error('Camera error:', err);
      alert('Could not access camera. Please allow camera permissions and try again.');
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch { /* ignore */ }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const selectedSubjectInfo = subjects.find(s => s._id === selectedSubject);

  return (
    <>
      <Navbar title="Mark Attendance" subtitle="Scan student QR codes to mark attendance" />
      <div className="page-container">

        <div className="grid-2" style={{ gap: 28, alignItems: 'start' }}>
          {/* Left: Scanner */}
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>⚙️ Session Setup</h3>

              <div className="form-group">
                <label className="form-label">Select Subject *</label>
                <select
                  id="select-subject"
                  className="form-select"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={scanning}
                >
                  <option value="">— Choose a subject —</option>
                  {loadingSubjects ? (
                    <option disabled>Loading subjects...</option>
                  ) : (
                    subjects.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.code}) — Year {s.year} {s.section}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  id="attendance-date"
                  type="date"
                  className="form-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={scanning}
                />
              </div>

              {selectedSubjectInfo && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 10,
                  marginBottom: 16,
                  fontSize: 13
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent-light)', marginBottom: 4 }}>
                    {selectedSubjectInfo.name}
                  </div>
                  <div className="text-muted">
                    Code: {selectedSubjectInfo.code} &bull; Dept: {selectedSubjectInfo.department} &bull; Year {selectedSubjectInfo.year}
                  </div>
                  {selectedSubjectInfo.teacher && (
                    <div className="text-muted">Teacher: {selectedSubjectInfo.teacher.name}</div>
                  )}
                </div>
              )}

              {!scanning ? (
                <button
                  id="start-scanner-btn"
                  className="btn btn-primary w-full"
                  style={{ justifyContent: 'center' }}
                  onClick={startScanner}
                  disabled={!selectedSubject}
                >
                  <MdQrCodeScanner style={{ fontSize: 20 }} /> Start Scanning
                </button>
              ) : (
                <button
                  id="stop-scanner-btn"
                  className="btn btn-danger w-full"
                  style={{ justifyContent: 'center' }}
                  onClick={stopScanner}
                >
                  <MdStop style={{ fontSize: 20 }} /> Stop Scanner
                </button>
              )}
            </div>

            {/* QR Camera View */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000', minHeight: 260 }}>
                <div id="qr-reader" style={{ width: '100%' }} />

                {!scanning && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(10,13,20,0.95)',
                    borderRadius: 12
                  }}>
                    <div style={{ fontSize: 56, marginBottom: 12, opacity: 0.4 }}>📷</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Camera inactive</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                      Select a subject and start scanning
                    </p>
                  </div>
                )}

                {/* Scanning overlay */}
                {scanning && (
                  <div className="scanner-overlay" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    <div style={{ position: 'relative', width: 300, height: 200 }}>
                      {/* Corner frames */}
                      <div style={{ position: 'absolute', top: 0, left: 0, width: 40, height: 40,
                        borderTop: '3px solid var(--accent)', borderLeft: '3px solid var(--accent)', borderRadius: '4px 0 0 0' }} />
                      <div style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40,
                        borderTop: '3px solid var(--accent)', borderRight: '3px solid var(--accent)', borderRadius: '0 4px 0 0' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 40, height: 40,
                        borderBottom: '3px solid var(--accent)', borderLeft: '3px solid var(--accent)', borderRadius: '0 0 0 4px' }} />
                      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 40, height: 40,
                        borderBottom: '3px solid var(--accent)', borderRight: '3px solid var(--accent)', borderRadius: '0 0 4px 0' }} />
                      {/* Scan line */}
                      <div className="scan-line" />
                    </div>
                  </div>
                )}
              </div>

              {/* Status message */}
              {statusMsg && (
                <div className={`alert alert-${statusType === 'success' ? 'success' : statusType === 'warning' ? 'info' : 'error'}`}
                  style={{ marginTop: 12, marginBottom: 0, animation: 'slideUp 0.2s ease' }}>
                  {statusMsg}
                </div>
              )}
            </div>
          </div>

          {/* Right: Stats + Log */}
          <div>
            {/* Live Counter */}
            <div className="grid-2" style={{ marginBottom: 20 }}>
              <div className="stat-card green">
                <div className="stat-icon green">✅</div>
                <div>
                  <div className="stat-label">Present Today</div>
                  <div className="stat-value" style={{ fontSize: 36 }}>{presentCount}</div>
                </div>
              </div>
              <div className="stat-card blue">
                <div className="stat-icon blue">🔍</div>
                <div>
                  <div className="stat-label">Scanned This Session</div>
                  <div className="stat-value" style={{ fontSize: 36 }}>
                    {scanLog.filter(l => l.type === 'success').length}
                  </div>
                </div>
              </div>
            </div>

            {/* Scan Log */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>📋 Scan Log</h3>
                {scanLog.length > 0 && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setScanLog([])}
                  >
                    <MdDelete style={{ fontSize: 14 }} /> Clear
                  </button>
                )}
              </div>

              <div className="scan-log">
                {scanLog.length === 0 ? (
                  <div className="empty-state" style={{ padding: '30px 0' }}>
                    <div className="empty-state-icon" style={{ fontSize: 36 }}>📡</div>
                    <p className="empty-state-title">No scans yet</p>
                    <p className="empty-state-desc">Start scanning to see results here.</p>
                  </div>
                ) : (
                  scanLog.map(log => (
                    <div key={log.id} className={`scan-log-item ${log.type}`}>
                      <span style={{ fontSize: 18 }}>{log.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{log.text}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{log.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MarkAttendance;
