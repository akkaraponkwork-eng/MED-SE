import { useState, useRef } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

export default function ImageCropperModal({ imageSrc, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState()
  const imgRef = useRef(null)

  function onImageLoad(e) {
    const { width, height } = e.currentTarget
    
    // ตั้งค่าเริ่มต้นให้ครอปตรงกลางภาพ 80% ของความกว้าง และ 30% ของความสูง
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
          height: 30,
        },
        8 / 3, // อัตราส่วนเริ่มต้น (กว้าง/สูง)
        width,
        height
      ),
      width,
      height
    )
    setCrop(initialCrop)
  }

  const handleConfirm = () => {
    if (!completedCrop || !imgRef.current) return
    
    const image = imgRef.current
    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    
    canvas.width = completedCrop.width
    canvas.height = completedCrop.height
    
    const ctx = canvas.getContext('2d')
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    )
    
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas is empty')
        return
      }
      onCropComplete(blob)
    }, 'image/jpeg', 0.9)
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal" style={{ maxWidth: '600px', width: '95%', overflow: 'hidden' }}>
        <div className="modal-header">
          <h2 className="modal-title">ตีกรอบชื่อยาและจำนวนเม็ด</h2>
        </div>
        <div className="modal-body" style={{ padding: '0', textAlign: 'center', background: '#1f2937', maxHeight: '65vh', overflowY: 'auto' }}>
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              onLoad={onImageLoad}
              style={{ maxHeight: '65vh', maxWidth: '100%', objectFit: 'contain' }}
              alt="Crop me"
            />
          </ReactCrop>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', background: '#fff' }}>
          <button className="btn btn-ghost" onClick={onCancel} style={{ flex: 1 }}>
            ยกเลิก
          </button>
          <button className="btn btn-primary" onClick={handleConfirm} style={{ flex: 2 }}>
            ✂️ ตัดรูปและอ่านข้อความ
          </button>
        </div>
      </div>
    </div>
  )
}
