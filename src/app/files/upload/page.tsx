'use client'

import { useRouter } from 'next/navigation'
import FileUploader from '@/components/FileUploader'

export default function UploadPage() {
  const router = useRouter()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Files</h1>
      <FileUploader
        folderId={null}
        onUploadComplete={() => router.push('/files')}
      />
    </div>
  )
}
