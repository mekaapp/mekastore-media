'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search, FolderPlus, ChevronRight, Home,
  Trash2, Share2, Download, Eye, EyeOff,
  Copy, ExternalLink, Lock, Globe, MoreVertical,
  File as FileIcon, Image, Video, Music, FileText, Archive, Table,
} from 'lucide-react'
import toast from 'react-hot-toast'
import FileUploader from '@/components/FileUploader'
import ShareDialog from '@/components/ShareDialog'

const iconMap: Record<string, any> = {
  image: Image, video: Video, music: Music,
  'file-text': FileText, archive: Archive, table: Table, file: FileIcon,
}

function getMimeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'music'
  if (mimeType.includes('pdf')) return 'file-text'
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'table'
  return 'file'
}

function formatSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function FilesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <FilesContent />
    </Suspense>
  )
}

function FilesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const folderId = searchParams.get('folder')

  const [files, setFiles] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showUploader, setShowUploader] = useState(false)
  const [shareFile, setShareFile] = useState<any>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([])
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (folderId) params.set('folderId', folderId)
      if (search) params.set('search', search)
      const res = await fetch(`/api/files?${params}`)
      const data = await res.json()
      setFiles(data.files || [])
      setFolders(data.folders || [])
    } catch {
      toast.error('Failed to load files')
    } finally {
      setLoading(false)
    }
  }, [folderId, search])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this file?')) return
    try {
      await fetch(`/api/files/${id}`, { method: 'DELETE' })
      toast.success('File deleted')
      fetchFiles()
    } catch {
      toast.error('Delete failed')
    }
    setMenuOpen(null)
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName, parentId: folderId }),
      })
      setNewFolderName('')
      setShowNewFolder(false)
      toast.success('Folder created')
      fetchFiles()
    } catch {
      toast.error('Failed to create folder')
    }
  }

  const copyLink = (file: any) => {
    const url = file.isPublic
      ? `${window.location.origin}/api/public/${file.shareToken}/${encodeURIComponent(file.originalName)}`
      : `${window.location.origin}/share/${file.shareToken}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied!')
    setMenuOpen(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Files</h1>
          <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
            <button onClick={() => router.push('/files')} className="hover:text-blue-600">
              <Home className="w-4 h-4" />
            </button>
            {breadcrumbs.map((b: any) => (
              <span key={b.id} className="flex items-center gap-1">
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => router.push(`/files?folder=${b.id}`)} className="hover:text-blue-600">
                  {b.name}
                </button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewFolder(true)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </button>
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2"
          >
            Upload Files
          </button>
        </div>
      </div>

      {showNewFolder && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center gap-3">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            autoFocus
          />
          <button onClick={handleCreateFolder} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">
            Create
          </button>
          <button onClick={() => setShowNewFolder(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
        </div>
      )}

      {showUploader && (
        <div className="mb-6">
          <FileUploader
            folderId={folderId}
            onUploadComplete={() => { fetchFiles(); setShowUploader(false) }}
          />
        </div>
      )}

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {folders.length === 0 && files.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <FileIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No files yet. Upload some files to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {folders.map((folder: any) => (
                <div
                  key={folder.id}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/files?folder=${folder.id}`)}
                >
                  <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                    <FolderPlus className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{folder.name}</p>
                    <p className="text-xs text-gray-500">
                      {folder._count.files} files · {folder._count.children} folders
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              ))}

              {files.map((file: any) => {
                const IconComp = iconMap[getMimeIcon(file.mimeType)] || FileIcon
                return (
                  <div key={file.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <IconComp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.originalName}</p>
                      <p className="text-xs text-gray-500">
                        {formatSize(file.size)} · {new Date(file.createdAt).toLocaleDateString()}
                        {file.uploadedBy && ` · ${file.uploadedBy.name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.isPublic ? (
                        <span className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded-full flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Public
                        </span>
                      ) : file.password ? (
                        <span className="px-2 py-1 text-xs bg-orange-50 text-orange-700 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Protected
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded-full flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Private
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{file.downloadCount} ↓</span>

                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === file.id ? null : file.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                        {menuOpen === file.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-48 z-10">
                            <button
                              onClick={() => copyLink(file)}
                              className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Copy className="w-4 h-4" /> Copy Link
                            </button>
                            <button
                              onClick={() => { setShareFile(file); setMenuOpen(null) }}
                              className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Share2 className="w-4 h-4" /> Share Settings
                            </button>
                            <a
                              href={`/api/files/${file.id}/download`}
                              className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
                              onClick={() => setMenuOpen(null)}
                            >
                              <Download className="w-4 h-4" /> Download
                            </a>
                            {file.isPublic && (
                              <button
                                onClick={() => {
                                  window.open(`/api/public/${file.shareToken}/${encodeURIComponent(file.originalName)}`, '_blank')
                                  setMenuOpen(null)
                                }}
                                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
                              >
                                <ExternalLink className="w-4 h-4" /> Open Direct Link
                              </button>
                            )}
                            <hr className="my-1" />
                            <button
                              onClick={() => handleDelete(file.id)}
                              className="w-full px-4 py-2 text-sm text-left hover:bg-red-50 text-red-600 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {shareFile && (
        <ShareDialog
          file={shareFile}
          onClose={() => setShareFile(null)}
          onUpdate={() => { fetchFiles(); setShareFile(null) }}
        />
      )}
    </div>
  )
}
