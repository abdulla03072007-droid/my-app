import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdClose, MdPerson } from 'react-icons/md';

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML'];
const YEARS = [1, 2, 3, 4];
const SECTIONS = ['A', 'B', 'C', 'D'];

const initForm = {
  name: '', rollNumber: '', email: '', phone: '',
  department: '', year: '', section: 'A', gender: 'Male'
};

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterDept) params.department = filterDept;
      if (filterYear) params.year = filterYear;
      if (search) params.search = search;
      const res = await API.get('/students', { params });
      setStudents(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, [search, filterDept, filterYear]);

  const openAdd = () => { setForm(initForm); setEditId(null); setFormError(''); setShowModal(true); };
  const openEdit = (s) => {
    setForm({
      name: s.name, rollNumber: s.rollNumber, email: s.email || '',
      phone: s.phone || '', department: s.department,
      year: s.year, section: s.section || 'A', gender: s.gender || 'Male'
    });
    setEditId(s._id);
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.rollNumber || !form.department || !form.year) {
      setFormError('Name, roll number, department and year are required.');
      return;
    }
    try {
      setSaving(true);
      if (editId) {
        await API.put(`/students/${editId}`, form);
      } else {
        await API.post('/students', form);
      }
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save student.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/students/${id}`);
      setDeleteConfirm(null);
      fetchStudents();
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <Navbar title="Students" subtitle="Manage student records" />
      <div className="page-container">
        <div className="page-header">
          <div>
            <h2 className="page-title">Students</h2>
            <p className="page-subtitle">{students.length} student{students.length !== 1 ? 's' : ''} found</p>
          </div>
          <button id="add-student-btn" className="btn btn-primary" onClick={openAdd}>
            <MdAdd /> Add Student
          </button>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-bar" style={{ maxWidth: 280 }}>
              <MdSearch className="search-icon" />
              <input
                id="student-search"
                className="form-input"
                placeholder="Search by name or roll no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 38 }}
              />
            </div>
            <select
              id="filter-department"
              className="form-select"
              style={{ width: 160 }}
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
            <select
              id="filter-year"
              className="form-select"
              style={{ width: 120 }}
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="">All Years</option>
              {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
            {(search || filterDept || filterYear) && (
              <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setFilterDept(''); setFilterYear(''); }}>
                <MdClose /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          {loading ? (
            <div className="loading-full"><div className="spinner" style={{ width: 28, height: 28, borderWidth: 2 }} /> Loading...</div>
          ) : students.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><MdPerson /></div>
              <p className="empty-state-title">No students found</p>
              <p className="empty-state-desc">Add students to start managing attendance.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Roll Number</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th>Section</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s._id}>
                    <td className="text-muted text-sm">{i + 1}</td>
                    <td><span className="roll-number">{s.rollNumber}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      {s.phone && <div className="text-xs text-muted">{s.phone}</div>}
                    </td>
                    <td>{s.department}</td>
                    <td>
                      <span className="badge badge-admin" style={{ fontSize: 11 }}>Year {s.year}</span>
                    </td>
                    <td>{s.section || '—'}</td>
                    <td className="text-sm text-secondary">{s.email || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          id={`edit-student-${s._id}`}
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEdit(s)}
                        >
                          <MdEdit />
                        </button>
                        <button
                          id={`delete-student-${s._id}`}
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeleteConfirm(s)}
                        >
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit Student' : 'Add New Student'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><MdClose /></button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" placeholder="e.g. Ravi Kumar" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Roll Number *</label>
                  <input className="form-input" placeholder="e.g. 24CSE01" value={form.rollNumber}
                    onChange={(e) => setForm({ ...form, rollNumber: e.target.value.toUpperCase() })} />
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
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="student@college.edu" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" placeholder="+91 98765 43210" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving...</> : editId ? 'Update Student' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Delete</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}><MdClose /></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm.name}</strong>?
              This will also remove all their attendance records.
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

export default Students;
