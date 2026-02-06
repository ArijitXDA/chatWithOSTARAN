"use client"

import { useState, useRef, DragEvent } from 'react'
import { X, FileText, Image as ImageIcon, FileSpreadsheet, Upload } from 'lucide-react'
import { UploadedFile } from '@/types/chat'
import { validateFile, formatFileSize, processFile, getImageDimensions, imageToBase64 } from '@/lib/utils/fileProcessing'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface FileUploadAreaProps {
  files: UploadedFile[]
  onFilesChange: (files: UploadedFile[]) => void
  maxFiles?: number
}

export function FileUploadArea({ files, onFilesChange, maxFiles = 5 }: FileUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    await handleFiles(droppedFiles)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      await handleFiles(selectedFiles)
    }
  }

  const handleFiles = async (newFiles: File[]) => {
    // Check max files limit
    if (files.length + newFiles.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} files at once`)
      return
    }

    const processedFiles: UploadedFile[] = []

    for (const file of newFiles) {
      // Validate file
      const validation = validateFile(file)
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file')
        continue
      }

      // Process file based on category
      const category = validation.category!
      let uploadedFile: UploadedFile = {
        file,
        category,
      }

      // For images, create preview, get dimensions, and extract base64
      if (category === 'image') {
        const preview = URL.createObjectURL(file)
        const dimensions = await getImageDimensions(file)
        const base64Data = await imageToBase64(file)
        uploadedFile.preview = preview
        uploadedFile.base64Data = base64Data
        if (dimensions) {
          uploadedFile.dimensions = dimensions
        }
      } else {
        // For non-image files, extract text content
        const result = await processFile(file, category)
        if (result.success && result.extractedText) {
          uploadedFile.extractedText = result.extractedText
        }
      }

      processedFiles.push(uploadedFile)
    }

    onFilesChange([...files, ...processedFiles])
    toast.success(`${processedFiles.length} file(s) uploaded successfully`)
  }

  const removeFile = (index: number) => {
    // Revoke object URL if it's an image
    if (files[index].preview) {
      URL.revokeObjectURL(files[index].preview!)
    }
    const newFiles = files.filter((_, i) => i !== index)
    onFilesChange(newFiles)
  }

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'image':
        return <ImageIcon className="w-5 h-5" />
      case 'spreadsheet':
        return <FileSpreadsheet className="w-5 h-5" />
      case 'document':
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  return (
    <div className="space-y-2">
      {/* Upload Area */}
      {files.length < maxFiles && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
            transition-colors duration-200
            ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.xlsx,.xls,.docx,.txt"
          />
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">
            <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Images, PDFs, Excel, Word docs (max {maxFiles} files)
          </p>
        </div>
      )}

      {/* File Previews */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadedFile, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
            >
              {/* File Icon or Image Preview */}
              <div className="flex-shrink-0">
                {uploadedFile.category === 'image' && uploadedFile.preview ? (
                  <img
                    src={uploadedFile.preview}
                    alt={uploadedFile.file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-white border border-gray-200 rounded">
                    {getFileIcon(uploadedFile.category)}
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadedFile.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(uploadedFile.file.size)}
                  {uploadedFile.dimensions && (
                    <span className="ml-2">
                      {uploadedFile.dimensions.width} × {uploadedFile.dimensions.height}
                    </span>
                  )}
                  {uploadedFile.extractedText && (
                    <span className="ml-2 text-green-600">
                      ✓ Content extracted
                    </span>
                  )}
                </p>
              </div>

              {/* Remove Button */}
              <Button
                onClick={() => removeFile(index)}
                variant="secondary"
                size="sm"
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
