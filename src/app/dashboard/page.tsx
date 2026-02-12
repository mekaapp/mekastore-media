'use client'

import { useEffect, useState } from 'react'
import { Files, HardDrive, Download, FolderOpen } from 'lucide-react'

interface Stats {
  totalFiles: number
  totalSize: number
  totalDownloads: number
  totalFolders: number
  recentFiles: any[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const cards = [
    { label: 'Total Files', value: stats?.totalFiles || 0, icon: Files, color: 'blue' },
    { label: 'Storage Used', value: formatSize(stats?.totalSize || 0), icon: HardDrive, color: 'purple' },
    { label: 'Total Downloads', value: stats?.totalDownloads || 0, icon: Download, color: 'green' },
    { label: 'Folders', value: stats?.totalFolders || 0, icon: FolderOpen, color: 'orange' },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[card.color]}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {stats?.recentFiles && stats.recentFiles.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Files</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentFiles.map((file: any) => (
              <div key={file.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.originalName}</p>
                  <p className="text-xs text-gray-500">
                    {formatSize(file.size)} · {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {file.isPublic && (
                    <span className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded-full">Public</span>
                  )}
                  <span className="text-xs text-gray-400">{file.downloadCount} downloads</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
