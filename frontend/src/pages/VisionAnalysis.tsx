import React, { useState, useRef } from 'react'
import Layout from '../components/Layout'
import { 
  Camera, 
  Upload, 
  Eye, 
  Users, 
  FileText, 
  Play, 
  Square,
  Download,
  Loader2
} from 'lucide-react'

interface DetectedObject {
  label: string
  confidence: number
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface AnalysisResult {
  type: 'object-detection' | 'image-description' | 'face-recognition'
  objects?: DetectedObject[]
  description?: string
  faces?: Array<{ name: string; confidence: number }>
  processingTime: number
}

export default function VisionAnalysis() {
  const [selectedMode, setSelectedMode] = useState<'upload' | 'camera'>('upload')
  const [selectedAnalysis, setSelectedAnalysis] = useState<'objects' | 'description' | 'faces'>('objects')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const analysisTypes = [
    {
      id: 'objects',
      name: 'Object Detection',
      description: 'Identify and locate objects in the image',
      icon: Eye,
      color: 'bg-blue-500'
    },
    {
      id: 'description',
      name: 'Scene Description',
      description: 'Generate detailed description of the scene',
      icon: FileText,
      color: 'bg-green-500'
    },
    {
      id: 'faces',
      name: 'Face Recognition',
      description: 'Recognize registered people in the image',
      icon: Users,
      color: 'bg-purple-500'
    }
  ]

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setResult(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraActive(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
      setIsCameraActive(false)
    }
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg')
        setSelectedImage(imageData)
        setResult(null)
        stopCamera()
      }
    }
  }

  const analyzeImage = async () => {
    if (!selectedImage) return

    setIsAnalyzing(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Mock results based on analysis type
    let mockResult: AnalysisResult

    switch (selectedAnalysis) {
      case 'objects':
        mockResult = {
          type: 'object-detection',
          objects: [
            { label: 'person', confidence: 0.95, boundingBox: { x: 100, y: 50, width: 200, height: 300 } },
            { label: 'chair', confidence: 0.87, boundingBox: { x: 350, y: 200, width: 150, height: 200 } },
            { label: 'table', confidence: 0.82, boundingBox: { x: 200, y: 300, width: 250, height: 100 } }
          ],
          processingTime: 1250
        }
        break
      case 'description':
        mockResult = {
          type: 'image-description',
          description: 'The image shows a person sitting at a wooden table in what appears to be a modern office or study room. There are several chairs around the table, and natural light is coming through a window in the background. The person appears to be working on a laptop or reading documents. The room has a clean, minimalist design with neutral colors.',
          processingTime: 1800
        }
        break
      case 'faces':
        mockResult = {
          type: 'face-recognition',
          faces: [
            { name: 'John Doe', confidence: 0.94 },
            { name: 'Unknown Person', confidence: 0.76 }
          ],
          processingTime: 950
        }
        break
      default:
        mockResult = { type: 'object-detection', processingTime: 0 }
    }

    setResult(mockResult)
    setIsAnalyzing(false)
  }

  const downloadResult = () => {
    if (result) {
      const dataStr = JSON.stringify(result, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analysis-result-${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vision Analysis</h1>
          <p className="text-gray-600">
            Analyze images using AI-powered computer vision models
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Input Mode Selection */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Input Method</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedMode('upload')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border-2 transition-colors ${
                    selectedMode === 'upload'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Upload className="h-5 w-5" />
                  <span className="font-medium">Upload Image</span>
                </button>
                <button
                  onClick={() => setSelectedMode('camera')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border-2 transition-colors ${
                    selectedMode === 'camera'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Camera className="h-5 w-5" />
                  <span className="font-medium">Use Camera</span>
                </button>
              </div>
            </div>

            {/* Analysis Type Selection */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Type</h3>
              <div className="space-y-3">
                {analysisTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedAnalysis(type.id as any)}
                    className={`w-full flex items-start space-x-3 p-3 rounded-lg border-2 transition-colors text-left ${
                      selectedAnalysis === type.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`h-8 w-8 ${type.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <type.icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className={`font-medium ${
                        selectedAnalysis === type.id ? 'text-primary-700' : 'text-gray-900'
                      }`}>
                        {type.name}
                      </p>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={analyzeImage}
                disabled={!selectedImage || isAnalyzing}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>Analyze Image</span>
                  </>
                )}
              </button>

              {result && (
                <button
                  onClick={downloadResult}
                  className="btn-secondary w-full flex items-center justify-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Result</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Input Area */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              {selectedMode === 'upload' ? (
                <div>
                  {!selectedImage ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 transition-colors"
                    >
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">Upload an image</p>
                      <p className="text-gray-600">Click here or drag and drop an image file</p>
                      <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <img
                        src={selectedImage}
                        alt="Selected"
                        className="max-h-96 mx-auto rounded-lg shadow-sm"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-secondary mt-4"
                      >
                        Change Image
                      </button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div>
                  {!isCameraActive && !selectedImage ? (
                    <div className="text-center py-12">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">Camera Capture</p>
                      <p className="text-gray-600 mb-4">Use your camera to capture an image for analysis</p>
                      <button onClick={startCamera} className="btn-primary flex items-center space-x-2">
                        <Play className="h-4 w-4" />
                        <span>Start Camera</span>
                      </button>
                    </div>
                  ) : isCameraActive ? (
                    <div className="text-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="max-h-96 mx-auto rounded-lg shadow-sm"
                      />
                      <div className="flex justify-center space-x-3 mt-4">
                        <button onClick={captureImage} className="btn-primary flex items-center space-x-2">
                          <Camera className="h-4 w-4" />
                          <span>Capture</span>
                        </button>
                        <button onClick={stopCamera} className="btn-secondary flex items-center space-x-2">
                          <Square className="h-4 w-4" />
                          <span>Stop</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <img
                        src={selectedImage!}
                        alt="Captured"
                        className="max-h-96 mx-auto rounded-lg shadow-sm"
                      />
                      <button
                        onClick={startCamera}
                        className="btn-secondary mt-4"
                      >
                        Take Another Photo
                      </button>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}
            </div>

            {/* Results Area */}
            {result && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
                  <span className="text-sm text-gray-500">
                    Processed in {result.processingTime}ms
                  </span>
                </div>

                {result.type === 'object-detection' && result.objects && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Detected {result.objects.length} objects:</p>
                    {result.objects.map((obj, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900 capitalize">{obj.label}</span>
                          <span className="text-sm text-gray-600 ml-2">
                            ({(obj.confidence * 100).toFixed(1)}% confidence)
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {obj.boundingBox.width}×{obj.boundingBox.height}px
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {result.type === 'image-description' && result.description && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-800 leading-relaxed">{result.description}</p>
                  </div>
                )}

                {result.type === 'face-recognition' && result.faces && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Recognized {result.faces.length} faces:</p>
                    {result.faces.map((face, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary-600" />
                          </div>
                          <span className="font-medium text-gray-900">{face.name}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {(face.confidence * 100).toFixed(1)}% match
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}