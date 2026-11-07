'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Search, X, Building2, User, Users, Check, Clock } from 'lucide-react'
import { usePatients } from '@/hooks/useRecords'
import { DEFAULT_PATIENTS } from '@/data/defaultPatients'

const PLATOONS = ['ทั้งหมด', 'หมวด 1', 'หมวด 2', 'หมวด 3', 'หมวด 4', 'หมวด 5']
const STATIC_PATIENTS = DEFAULT_PATIENTS

// รายการอาการที่พบบ่อย (แตะเพื่อใส่/เอาออกได้ทันที ไม่ต้องพิมพ์บนมือถือ)
const QUICK_SYMPTOMS = [
  'ไข้ ไอ เจ็บคอ',
  'ปวดศีรษะ ตัวร้อน',
  'มีไข้ หนาวสั่น',
  'ผื่นคัน / ผิวหนังอักเสบ',
  'ปวดท้อง แน่นท้อง',
  'ท้องเสีย ถ่ายเหลว',
  'กล้ามเนื้ออักเสบ ปวดหลัง',
  'แผลถลอก / ฟกช้ำ',
  'ตาแดง / เคืองตา',
  'ทำแผล / ล้างแผล'
]

// เวลานัดหมายที่พบบ่อย (แตะเลือกได้ทันที)
const QUICK_TIMES = ['08:30', '09:00', '10:00', '13:30']

export default function PatientForm({ date, onSave, onClose, editData }) {
  const { patients: apiPatients } = usePatients()
  const allPatients = apiPatients.length > 0 ? apiPatients : STATIC_PATIENTS

  const [step, setStep] = useState(editData ? 'form' : 'select')
  const [search, setSearch] = useState('')
  const [selectedPlatoon, setSelectedPlatoon] = useState('ทั้งหมด')
  const [selected, setSelected] = useState(editData?.patient || null)

  // ปิด Modal เมื่อกด Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const [apptType, setApptType] = useState(() => {
    if (!editData) return 'none'
    if (editData.noAppointment) return 'none'
    if (editData.patient?.appointmentText || editData.appointmentText) return 'text'
    if (!editData.appointmentDate) return 'none'
    const d = editData.appointmentDate
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) return 'date'
    return 'text'
  })

  // form fields
  const [form, setForm] = useState({
    destination: editData?.destination || 'ตร.ศบบ.',
    symptoms: editData?.symptoms || '',
    examResult: editData?.examResult || '',
    treatment: editData?.treatment || '',
    appointmentDate: editData?.appointmentDate || date || '',
    appointmentTime: editData?.appointmentTime || '',
    notes: editData?.notes || '',
    noAppointment: editData ? editData.noAppointment : true,
    appointmentText: editData?.patient?.appointmentText || editData?.appointmentText || '',
    isEveryday: editData?.patient?.isEveryday || false,
  })

  // กรองรายชื่อทหารทั้งจากคำค้นหาและหมวด
  const filtered = useMemo(() => {
    return allPatients.filter(p => {
      if (selectedPlatoon !== 'ทั้งหมด') {
        const pl = String(p.platoon || '')
        if (!pl.includes(selectedPlatoon.replace('หมวด ', ''))) return false
      }

      if (!search.trim()) return true
      const q = search.toLowerCase()
      const full = `${p.code || ''} ${p.rank} ${p.firstName} ${p.lastName} ${p.platoon} ${p.number} ${p.disease || ''} ${p.citizenId || ''}`.toLowerCase()
      return full.includes(q)
    })
  }, [allPatients, selectedPlatoon, search])

  const handleSelect = (p) => {
    setSelected(p)
    setStep('form')
    setSearch('')
  }

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  // ฟังก์ชันแตะเพื่อใส่/ถอดอาการที่พบบ่อย
  const handleToggleSymptom = (chip) => {
    setForm(f => {
      const cur = (f.symptoms || '').trim()
      if (!cur) return { ...f, symptoms: chip }
      if (cur.includes(chip)) {
        // ถอดออกถ้าแตะซ้ำ
        const updated = cur
          .split(/,\s*/)
          .filter(s => s.trim() !== chip)
          .join(', ')
        return { ...f, symptoms: updated }
      }
      // เพิ่มต่อท้าย
      return { ...f, symptoms: `${cur}, ${chip}` }
    })
  }

  const handleSave = () => {
    if (!selected) return
    const record = {
      ...editData,
      id: editData?.id,
      date,
      ...form,
      patient: {
        ...selected,
        appointmentText: apptType === 'text' ? form.appointmentText : '',
        isEveryday: apptType === 'text' && form.isEveryday
      },
      appointmentDate: apptType === 'none' ? '' : form.appointmentDate,
      appointmentTime: apptType === 'none' ? '' : form.appointmentTime,
      noAppointment: apptType === 'none'
    }
    delete record.appointmentText
    delete record.isEveryday
    onSave(record)
  }

  const fullName = selected ? `${selected.rank} ${selected.firstName} ${selected.lastName}` : ''
  const metaInfo = selected ? `${selected.platoon} เลขที่ ${selected.number}` : ''

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        
        {/* Modal Header */}
        <div className="modal-header">
          <Building2 size={20} style={{ color: 'var(--green-600)' }} />
          <h2 className="modal-title">{editData ? 'แก้ไขผู้ป่วย' : 'เพิ่มผู้ป่วย'}</h2>
          <button 
            className="btn btn-ghost btn-icon btn-sm" 
            onClick={onClose} 
            id="close-modal-btn"
            aria-label="ปิดหน้าต่าง"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Step 1: Select Patient */}
          {step === 'select' && (
            <div className="fade-in">
              <div className="section-divider" style={{ marginTop: 0 }}><span>เลือกรายชื่อผู้ป่วย</span></div>

              {/* Platoon Filter Pills (แตะเลือกหมวดได้ด้วยนิ้วโป้ง) */}
              <div style={{
                display: 'flex',
                gap: '0.35rem',
                overflowX: 'auto',
                paddingBottom: '0.5rem',
                marginBottom: '0.5rem',
                scrollbarWidth: 'none',
              }}>
                {PLATOONS.map(pl => {
                  const active = selectedPlatoon === pl
                  return (
                    <button
                      key={pl}
                      type="button"
                      onClick={() => setSelectedPlatoon(pl)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        border: active ? '1.5px solid var(--green-600)' : '1px solid var(--gray-200)',
                        background: active ? 'var(--green-50)' : 'white',
                        color: active ? 'var(--green-700)' : 'var(--gray-600)',
                        fontSize: '0.8rem',
                        fontWeight: active ? 700 : 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        minHeight: '34px',
                      }}
                    >
                      {pl}
                    </button>
                  )
                })}
              </div>

              {/* Search Box */}
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <div className="input-group">
                  <Search size={16} className="input-icon" />
                  <input
                    id="patient-search"
                    type="text"
                    inputMode="search"
                    className="form-control"
                    placeholder="พิมพ์ชื่อ, นามสกุล, เลขที่, หรือรหัส ANA..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    autoFocus
                  />
                  {search && (
                    <button
                      type="button"
                      aria-label="ล้างคำค้นหา"
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: '0.3rem' }}
                      onClick={() => setSearch('')}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Search Results List */}
                <div className="search-results">
                  {filtered.length === 0 ? (
                    <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                      ไม่พบรายชื่อในระบบ
                    </div>
                  ) : filtered.map(p => (
                    <div
                      key={p.id}
                      className="search-result-item"
                      onClick={() => handleSelect(p)}
                      id={`patient-${p.id}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.95rem' }}>{p.rank} {p.firstName} {p.lastName}</strong>
                        {p.code && (
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--green-700)', background: 'var(--green-50)', border: '1px solid var(--green-200)', padding: '0.05rem 0.35rem', borderRadius: '4px' }}>
                            {p.code}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 600 }}>{p.platoon} เลขที่ {p.number}</span>
                        {p.disease && p.disease !== '-' && (
                          <span style={{ fontSize: '0.72rem', color: '#b91c1c', background: '#fee2e2', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                            โรค: {p.disease}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual Entry Option */}
              <div className="section-divider"><span>หรือกรอกเอง</span></div>
              <button
                className="btn btn-secondary btn-full"
                onClick={() => {
                  setSelected({ id: 'manual', rank: 'พลฯ', firstName: '', lastName: '', platoon: 'หมวด 1', number: '' })
                  setStep('manual')
                }}
                style={{ minHeight: '44px' }}
              >
                กรอกรายชื่อด้วยตนเอง
              </button>

              <div style={{ marginTop: '0.85rem', textAlign: 'center' }}>
                <Link
                  href="/patients"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.82rem',
                    color: 'var(--green-700)',
                    textDecoration: 'none',
                    fontWeight: 600,
                    padding: '0.4rem 0.75rem',
                    background: 'var(--green-50)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--green-200)',
                  }}
                >
                  <Users size={14} />
                  <span>จัดการรายชื่อทหาร / นำเข้าผลัดใหม่</span>
                </Link>
              </div>
            </div>
          )}

          {/* Step 1.5: Manual entry */}
          {step === 'manual' && (
            <div className="fade-in">
              <div className="section-divider" style={{ marginTop: 0 }}><span>กรอกรายชื่อด้วยตนเอง</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 2fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">ยศ</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selected?.rank || ''}
                    onChange={e => setSelected(s => ({ ...s, rank: e.target.value }))}
                    placeholder="ยศ"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">ชื่อ *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selected?.firstName || ''}
                    onChange={e => setSelected(s => ({ ...s, firstName: e.target.value }))}
                    placeholder="ชื่อ"
                    autoFocus
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">นามสกุล</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selected?.lastName || ''}
                    onChange={e => setSelected(s => ({ ...s, lastName: e.target.value }))}
                    placeholder="นามสกุล"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">หมวด</label>
                  <select
                    className="form-control"
                    value={selected?.platoon || ''}
                    onChange={e => setSelected(s => ({ ...s, platoon: e.target.value }))}
                  >
                    {PLATOONS.slice(1).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">เลขที่</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="form-control"
                    value={selected?.number || ''}
                    onChange={e => setSelected(s => ({ ...s, number: e.target.value }))}
                    placeholder="เลขที่"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button className="btn btn-ghost" onClick={() => setStep('select')} style={{ flex: 1 }}>
                  ยกเลิก
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!selected?.firstName}
                  onClick={() => setStep('form')}
                  style={{ flex: 2 }}
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Fill Form */}
          {step === 'form' && (
            <div className="fade-in">
              {/* Selected Patient Display */}
              <div className="selected-patient">
                <User size={24} style={{ color: 'var(--green-600)', flexShrink: 0 }} />
                <div className="selected-patient-info" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <strong>{fullName}</strong>
                    {selected?.code && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--green-700)', background: 'var(--green-50)', border: '1px solid var(--green-200)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                        {selected.code}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginTop: '0.15rem' }}>
                    <span>{metaInfo}</span>
                    {selected?.unit && <span style={{ marginLeft: '0.4rem', color: 'var(--gray-400)' }}>• {selected.unit}</span>}
                  </div>
                  {selected?.disease && selected.disease !== '-' && (
                    <div style={{ marginTop: '0.35rem', padding: '0.25rem 0.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#b91c1c', fontSize: '0.78rem', fontWeight: 600 }}>
                      โรคประจำตัว: {selected.disease}
                    </div>
                  )}
                </div>
                <button className="btn-change" onClick={() => setStep('select')}>เปลี่ยน</button>
              </div>

              {/* Destination Selector (ปุ่มใหญ่แตะง่าย) */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">ส่งป่วยที่</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {['ตร.ศบบ.', 'รพ. อปร.ฯ'].map(dest => {
                    const isSelected = form.destination === dest
                    return (
                      <button
                        key={dest}
                        type="button"
                        id={`dest-${dest}`}
                        onClick={() => handleChange('destination', dest)}
                        style={{
                          minHeight: '48px',
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '2px solid var(--green-500)' : '1.5px solid var(--gray-200)',
                          background: isSelected ? 'var(--green-50)' : 'white',
                          color: isSelected ? 'var(--green-800)' : 'var(--gray-700)',
                          fontFamily: 'var(--font-th)',
                          fontSize: '0.95rem',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isSelected && <Check size={16} style={{ color: 'var(--green-600)' }} />}
                        <span>{dest}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Symptoms Input + Quick Chips */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>อาการ</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>แตะตัวเลือกด่วนด้านล่างได้</span>
                </div>

                {/* Quick Symptom Chips */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.35rem',
                  marginBottom: '0.6rem',
                }}>
                  {QUICK_SYMPTOMS.map(chip => {
                    const isActive = (form.symptoms || '').includes(chip)
                    return (
                      <button
                        key={chip}
                        type="button"
                        className={`quick-chip ${isActive ? 'active' : ''}`}
                        onClick={() => handleToggleSymptom(chip)}
                      >
                        {isActive && <Check size={12} />}
                        <span>{chip}</span>
                      </button>
                    )
                  })}
                </div>

                <textarea
                  id="symptoms-input"
                  className="form-control"
                  placeholder="พิมพ์อาการ หรือแตะตัวเลือกด่วนด้านบน..."
                  value={form.symptoms}
                  onChange={e => handleChange('symptoms', e.target.value)}
                  rows={2}
                />
              </div>

              {/* Appointment */}
              <div style={{
                background: 'var(--gray-50)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--gray-200)',
                marginBottom: '1rem'
              }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.5rem', fontWeight: 700 }}>
                    การนัดหมายครั้งถัดไป
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {[
                      { type: 'none', label: 'ไม่มีนัด' },
                      { type: 'date', label: 'ระบุวันที่' },
                      { type: 'text', label: 'ระบุข้อความ' },
                    ].map(item => {
                      const active = apptType === item.type
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => setApptType(item.type)}
                          style={{
                            flex: 1,
                            minHeight: '38px',
                            borderRadius: 'var(--radius-sm)',
                            border: active ? '1.5px solid var(--green-600)' : '1px solid var(--gray-200)',
                            background: active ? 'var(--green-50)' : 'white',
                            color: active ? 'var(--green-800)' : 'var(--gray-600)',
                            fontSize: '0.82rem',
                            fontWeight: active ? 700 : 500,
                            cursor: 'pointer',
                          }}
                        >
                          {item.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {apptType !== 'none' && (
                  <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                        วันที่นัด:
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.appointmentDate}
                        onChange={e => handleChange('appointmentDate', e.target.value)}
                      />
                    </div>

                    {apptType === 'text' && (
                      <div>
                        <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                          ข้อความนัด:
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="เช่น นัดล้างแผล, นัดตรวจซ้ำ"
                          value={form.appointmentText}
                          onChange={e => handleChange('appointmentText', e.target.value)}
                        />
                        <label className="checkbox-label" style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={form.isEveryday}
                            onChange={e => handleChange('isEveryday', e.target.checked)}
                          />
                          <span>นัดต่อเนื่องทุกวัน</span>
                        </label>
                      </div>
                    )}

                    {/* Quick Appointment Times */}
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                        เวลานัด:
                      </label>
                      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                        {QUICK_TIMES.map(t => {
                          const active = form.appointmentTime === t
                          return (
                            <button
                              key={t}
                              type="button"
                              className={`quick-chip ${active ? 'active' : ''}`}
                              onClick={() => handleChange('appointmentTime', t)}
                              style={{ minHeight: '34px', fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}
                            >
                              <Clock size={12} />
                              <span>{t} น.</span>
                            </button>
                          )
                        })}
                      </div>
                      <input
                        type="time"
                        className="form-control"
                        value={form.appointmentTime}
                        onChange={e => handleChange('appointmentTime', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer (ตรึงอยู่ด้านล่างหน้าจอโทรศัพท์เสมอ) */}
        {step === 'form' && (
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1, minHeight: '44px' }}>
              ยกเลิก
            </button>
            <button
              id="save-patient-btn"
              className="btn btn-primary"
              onClick={handleSave}
              style={{ flex: 2, minHeight: '44px', fontWeight: 700 }}
            >
              บันทึกข้อมูล
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
