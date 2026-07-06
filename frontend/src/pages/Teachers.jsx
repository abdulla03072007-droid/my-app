import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import { MdAdd, MdEdit, MdDelete, MdClose, MdGroup } from 'react-icons/md';

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'Administration'];
const initForm = { name: '', email: '', password: '', role: 'teacher', department: '', phone: '' };

const Teachers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/auth/users');
      setUsers(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openAdd = () => { setForm(initForm); setEditId(null); setFormError(''); setShowModal(true); };
  const openEdit = (u) => {
    setForm({ name: u.name, email: u.email, password: '', role: u.role, department: u.department || '', phone: u.phone || '' });
    setEditId(u._id);
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { setFormError('Name and email are required.'); return; }
    if (!editId && !form.password) { setFormError('Password is required for new users.'); return; }
    try {
      setSaving(true);
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      if (editId) {
        await API.put(`/auth/users/${editId}`, payload);
      } else {
        await API.post('/auth/register', payload);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/auth/users/${id}`);
      setDeleteConfirm(null);
      fetchUsers();
    } catch { /* ignore */ }
  };

  return (
    <>
      <Navbar title="Teachers & Admins" subtitle="Manage system users" />
      <div className="page-container">
        <div className="page-header">
          <div>
            <h2 className="page-title">Users</h2>
            <p className="page-subtitle">{users.length} users in the system</p>
          </div>
          <button id="add-teacher-btn" className="btn btn-primary" onClick={openAdd}>
            <MdAdd /> Add User
          </button>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="loading-full"><div className="spinner" style={{ width: 28, height: 28, borderWidth: 2 }} /> Loading...</div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><MdGroup /></div>
              <p className="empty-state-title">No users found</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u._id}>
                    <td className="text-muted text-sm">{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td className="text-secondary text-sm">{u.email}</td>
                    <td>
                      <span className={`badge badge-${u.role}`}>
                        {u.role === 'admin' ? '🛡️' : '👤'} {u.role}
                      </span>
                    </td>
                    <td>{u.department || '—'}</td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-present' : 'badge-absent'}`}>
                        {u.isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button id={`edit-user-${u._id}`} className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>
                          <MdEdit />
                        </button>
                        <button id={`delete-user-${u._id}`} className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(u)}>
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

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit User' : 'Add New User'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><MdClose /></button>
            </div>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" placeholder="e.g. Dr. Priya" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" placeholder="teacher@college.edu" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">{editId ? 'New Password (leave blank)' : 'Password *'}</label>
                  <input className="form-input" type="password" placeholder="••••••••" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}>
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" placeholder="+91 98765 43210" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving...</> : editId ? 'Update User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Delete</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}><MdClose /></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Delete user <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm.name}</strong>?
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm._id)}><MdDelete /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Teachers;
