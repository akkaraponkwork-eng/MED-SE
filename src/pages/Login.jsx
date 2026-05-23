import { useState } from 'react'
import { Eye, EyeOff, Shield, Lock, User } from 'lucide-react'

const VALID_USER = 'an18'
const VALID_PASS = '1234'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    // simulate brief loading
    await new Promise(r => setTimeout(r, 500))
    if (username === VALID_USER && password === VALID_PASS) {
      onLogin(username)
    } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🏥</div>
          <h1>ระบบบันทึกส่งป่วย</h1>
          <p>พัน.บร.กบร.ศบบ</p>
        </div>

        {error && (
          <div className="error-msg">
            <Shield size={15} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">ชื่อผู้ใช้</label>
            <div className="input-group">
              <User size={16} className="input-icon" />
              <input
                id="username"
                type="text"
                className="form-control"
                placeholder="กรอกชื่อผู้ใช้"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">รหัสผ่าน</label>
            <div className="input-group">
              <Lock size={16} className="input-icon" />
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                className="form-control"
                placeholder="กรอกรหัสผ่าน"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: '0.875rem', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: 'var(--gray-400)',
                  padding: '0.25rem', display: 'flex', alignItems: 'center'
                }}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            id="login-btn"
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading || !username || !password}
          >
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> กำลังเข้าสู่ระบบ...</>
            ) : (
              <><Shield size={18} /> เข้าสู่ระบบ</>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: '1.5rem' }}>
          ระบบนี้สำหรับเจ้าหน้าที่ที่ได้รับอนุญาตเท่านั้น
        </p>
      </div>
    </div>
  )
}
