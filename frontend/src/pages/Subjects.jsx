import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import { MdAdd, MdEdit, MdDelete, MdClose, MdMenuBook } from 'react-icons/md';

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML'];
const YEARS = [1, 2, 3, 4];
const SECTIONS = ['A', 'B', 'C', 'D'];

const initForm = {
  name: '', code: '', department: '', year: '', section: 'A',
  teacher: '', creditHours: 3
};

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subRes, teachRes] = await Promise.all([
        API.get('/subjects'),
        API.get('/auth/teachers')
      ]);
      setSubjects(subRes.data);
      setTeachers(teachRes.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setForm(initForm); setEditId(null); setFormError(''); setShowModal(true); };
  const openEdit = (s) => {
    setForm({
      name: s.name, code: s.code, department: s.department,
      year: s.year, section: s.section || 'A',
      teacher: s.teacher?._id || '', creditHours: s.creditHours || 3
    });
    setEditId(s._id);
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code || !form.department || !form.year || !form.teacher) {
      setFormError('All required fields must be filled.');
      return;
    }
    try {
      setSaving(true);
      if (editId) {
        await API.put(`/subjects/${editId}`, form);
      } else {
        await API.post('/subjects', form);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save subject.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/subjects/${id}`);
      setDeleteConfirm(null);
      fetchData();
    } catch { /* ignore */ }
  };

  return (
    <>
      <Navbar title="Subjects" subtitle="Manage subjects and class assignments" />
      <div className="page-container">
        <div className="page-header">
          <div>
            <h2 className="page-title">Subjects</h2>
            <p className="page-subtitle">{subjects.length} subject{subjects.length !== 1 ? 's' : ''} configured</p>
          </div>
          <button id="add-subject-btn" className="btn btn-primary" onClick={openAdd}>
            <MdAdd /> Add Subject
          </button>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="loading-full"><div className="spinner" style={{ width: 28, height: 28, borderWidth: 2 }} /> Loading...</div>
          ) : subjects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><MdMenuBook /></div>
              <p className="empty-state-title">No subjects yet</p>
              <p className="empty-state-desc">Create subjects and assign teachers to start taking attendance.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Subject</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th>Section</th>
                  <th>Teacher</th>
                  <th>Credits</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s, i) => (
                  <tr key={s._id}>
                    <td className="text-muted text-sm">{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td><span className="roll-number">{s.code}</span></td>
                    <td>{s.department}</td>
                    <td><span className="badge badge-admin" style={{ fontSize: 11 }}>Year {s.year}</span></td>
                    <td>{s.section || '—'}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{s.teacher?.name || '—'}</div>
                      {s.teacher?.email && <div className="text-xs text-muted">{s.teacher.email}</div>}
                    </td>
                    <td className="text-secondary">{s.creditHours}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button id={`edit-subject-${s._id}`} className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>
                          <MdEdit />
                        </button>
                        <button id={`delete-subject-${s._id}`} className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(s)}>
                          <MdDelete />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit Subject' : 'Add New Subject'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><MdClose /></button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Subject Name *</label>
                  <input className="form-input" placeholder="e.g. Data Structures" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject Code *</label>
                  <input className="form-input" placeholder="e.g. CS301" value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select className="form-select" value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}>
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year *</label>
                  <select className="form-select" value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}>
                    <option value="">Select Year</option>
                    {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <select className="form-select" value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}>
                    {SECTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Credit Hours</label>
                  <input className="form-input" type="number" min="1" max="5" value={form.creditHours}
                    onChange={(e) => setForm({ ...form, creditHours: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Teacher *</label>
                <select className="form-select" value={form.teacher}
                  onChange={(e) => setForm({ ...form, teacher: e.target.value })}>
                  <option value="">Select Teacher</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.name} ({t.department || t.email})</option>
                  ))}
                </select>
                {teachers.length === 0 && (
                  <p className="text-xs text-muted" style={{ marginTop: 4 }}>
                    No teachers found. Add teachers from the Teachers page first.
                  </p>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving...</> : editId ? 'Update Subject' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Delete</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}><MdClose /></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Delete subject <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm.name}</strong>?
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm._id)}>
                <MdDelete /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Subjects;
