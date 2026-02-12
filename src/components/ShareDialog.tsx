'use client'

import { useState } from 'react'
import { X, Globe, Lock, Copy, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

interface ShareDialogProps {
  file: any
  onClose: () => void
  onUpdate: () => void
}

export default function ShareDialog({ file, onClose, onUpdate }: ShareDialogProps) {
  const [isPublic, setIsPublic] = useState(file.isPublic)
  const [password, setPassword] = useState('')
  const [setNewPassword, setSetNewPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  const shareUrl = `${window.location.origin}/share/${file.shareToken}`
  const directUrl = `${window.location.origin}/api/public/${file.shareToken}/${encodeURIComponent(file.originalName)}`

  const handleSave = async () => {
    setSaving(true)
    try {
      const body: any = { isPublic }
      if (setNewPassword) {
        body.password = password || null
      }

      await fetch(`/api/files/${file.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      toast.success('Share settings updated')
      onUpdate()
    } catch {
      toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied!')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Share Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">File</p>
            <p className="text-sm text-gray-500">{file.originalName}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Access</p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="text-blue-600"
                />
                <Lock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Private</p>
                  <p className="text-xs text-gray-500">Only accessible via share page</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="text-blue-600"
                />
                <Globe className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Public</p>
                  <p className="text-xs text-gray-500">Direct link access, playable in browser & WhatsApp</p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={setNewPassword}
                onChange={(e) => setSetNewPassword(e.target.checked)}
                className="rounded border-gray-300"
              />
              {file.password ? 'Change password' : 'Set password protection'}
            </label>
            {setNewPassword && (
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (leave empty to remove)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Share Page Link</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-600"
                />
                <button onClick={() => copyToClipboard(shareUrl)} className="p-2 hover:bg-gray-200 rounded-lg">
                  <Copy className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {isPublic && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Direct Link (public)</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={directUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-600"
                  />
                  <button onClick={() => copyToClipboard(directUrl)} className="p-2 hover:bg-gray-200 rounded-lg">
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                  <a href={directUrl} target="_blank" className="p-2 hover:bg-gray-200 rounded-lg">
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
