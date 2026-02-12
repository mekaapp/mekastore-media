'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Download, Lock, FileText, HardDrive, AlertCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface FileInfo {
  name: string
  mimeType: string
  size: number
  isPublic: boolean
  hasPassword: boolean
  downloadCount: number
  uploadedBy: string
  createdAt: string
}

function formatSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function SharePage() {
  const params = useParams()
  const token = params.token as string

  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [verified, setVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json()
          throw new Error(data.error || 'File not found')
        }
        return r.json()
      })
      .then((data) => {
        setFileInfo(data)
        if (!data.hasPassword) setVerified(true)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  const handleVerify = async () => {
    setVerifying(true)
    try {
      const res = await fetch(`/api/share/${token}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        toast.error('Invalid password')
        setVerifying(false)
        return
      }

      setVerified(true)
    } catch {
      toast.error('Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  const handleDownload = () => {
    const url = fileInfo?.hasPassword
      ? `/api/share/${token}/download?pwd=${encodeURIComponent(password)}`
      : `/api/share/${token}/download`
    window.location.href = url
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {error === 'Link expired' ? 'Link Expired' : 'File Not Found'}
          </h1>
          <p className="text-gray-500">
            {error === 'Link expired'
              ? 'This share link has expired.'
              : 'This file does not exist or has been removed.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <HardDrive className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">MekaStore Media</h1>
          <p className="text-sm text-gray-500 mt-1">Shared file</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-10 h-10 text-blue-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{fileInfo?.name}</p>
              <p className="text-xs text-gray-500">
                {formatSize(fileInfo?.size || 0)} · {fileInfo?.mimeType}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <span>By {fileInfo?.uploadedBy}</span>
            <span>{new Date(fileInfo?.createdAt || '').toLocaleDateString()}</span>
            <span>{fileInfo?.downloadCount} downloads</span>
          </div>
        </div>

        {!verified && fileInfo?.hasPassword ? (
          <div>
            <div className="flex items-center gap-2 mb-4 text-sm text-orange-600">
              <Lock className="w-4 h-4" />
              This file is password protected
            </div>
            <div className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
              <button
                onClick={handleVerify}
                disabled={verifying || !password}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Unlock
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleDownload}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download File
          </button>
        )}

        {fileInfo?.isPublic && verified && fileInfo.mimeType.startsWith('video/') && (
          <div className="mt-4">
            <video
              controls
              className="w-full rounded-xl"
              src={`/api/public/${token}/${encodeURIComponent(fileInfo.name)}`}
            />
          </div>
        )}

        {fileInfo?.isPublic && verified && fileInfo.mimeType.startsWith('image/') && (
          <div className="mt-4">
            <img
              src={`/api/public/${token}/${encodeURIComponent(fileInfo.name)}`}
              alt={fileInfo.name}
              className="w-full rounded-xl"
            />
          </div>
        )}
      </div>
    </div>
  )
}
