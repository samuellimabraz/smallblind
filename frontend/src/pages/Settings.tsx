import React, { useState } from 'react'
import Layout from '../components/Layout'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Volume2, 
  Eye,
  Save,
  Trash2
} from 'lucide-react'

export default function Settings() {
  const [settings, setSettings] = useState({
    // Profile settings
    username: 'John Doe',
    email: 'john.doe@example.com',
    
    // Vision settings
    detectionThreshold: 0.7,
    detectionModel: 'yolov8',
    enableFaceRecognition: true,
    enableObjectDetection: true,
    enableSceneDescription: true,
    
    // Audio settings
    enableAudioFeedback: true,
    speechRate: 1.0,
    voiceType: 'female',
    
    // Accessibility settings
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    
    // Notification settings
    enableNotifications: true,
    enableSoundAlerts: true,
    enableVibration: true,
    
    // Privacy settings
    saveAnalysisHistory: true,
    shareAnonymousData: false,
    
    // Theme settings
    theme: 'light'
  })

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = () => {
    // Here you would save settings to the backend
    console.log('Saving settings:', settings)
    alert('Settings saved successfully!')
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Handle account deletion
      console.log('Deleting account...')
    }
  }

  const SettingSection = ({ title, icon: Icon, children }: { 
    title: string
    icon: React.ComponentType<any>
    children: React.ReactNode 
  }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center space-x-3 mb-6">
        <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  )

  const ToggleSetting = ({ 
    label, 
    description, 
    checked, 
    onChange 
  }: { 
    label: string
    description?: string
    checked: boolean
    onChange: (checked: boolean) => void 
  }) => (
    <div className="flex items-start justify-between py-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )

  const SliderSetting = ({ 
    label, 
    value, 
    min, 
    max, 
    step, 
    onChange,
    formatValue
  }: { 
    label: string
    value: number
    min: number
    max: number
    step: number
    onChange: (value: number) => void
    formatValue?: (value: number) => string
  }) => (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <span className="text-sm text-gray-600">
          {formatValue ? formatValue(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  )

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Customize your SmallBlind experience and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <SettingSection title="Profile" icon={User}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={settings.username}
                  onChange={(e) => handleSettingChange('username', e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleSettingChange('email', e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>
          </SettingSection>

          {/* Vision Settings */}
          <SettingSection title="Vision Analysis" icon={Eye}>
            <div className="space-y-4">
              <SliderSetting
                label="Detection Confidence Threshold"
                value={settings.detectionThreshold}
                min={0.1}
                max={1.0}
                step={0.1}
                onChange={(value) => handleSettingChange('detectionThreshold', value)}
                formatValue={(value) => `${(value * 100).toFixed(0)}%`}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detection Model
                </label>
                <select
                  value={settings.detectionModel}
                  onChange={(e) => handleSettingChange('detectionModel', e.target.value)}
                  className="input w-full"
                >
                  <option value="yolov8">YOLOv8 (Recommended)</option>
                  <option value="yolov5">YOLOv5</option>
                  <option value="detr">DETR</option>
                </select>
              </div>

              <div className="space-y-2">
                <ToggleSetting
                  label="Face Recognition"
                  description="Recognize registered people in images"
                  checked={settings.enableFaceRecognition}
                  onChange={(checked) => handleSettingChange('enableFaceRecognition', checked)}
                />
                <ToggleSetting
                  label="Object Detection"
                  description="Detect and identify objects in images"
                  checked={settings.enableObjectDetection}
                  onChange={(checked) => handleSettingChange('enableObjectDetection', checked)}
                />
                <ToggleSetting
                  label="Scene Description"
                  description="Generate detailed descriptions of scenes"
                  checked={settings.enableSceneDescription}
                  onChange={(checked) => handleSettingChange('enableSceneDescription', checked)}
                />
              </div>
            </div>
          </SettingSection>

          {/* Audio Settings */}
          <SettingSection title="Audio & Speech" icon={Volume2}>
            <div className="space-y-4">
              <ToggleSetting
                label="Audio Feedback"
                description="Enable spoken descriptions and alerts"
                checked={settings.enableAudioFeedback}
                onChange={(checked) => handleSettingChange('enableAudioFeedback', checked)}
              />

              <SliderSetting
                label="Speech Rate"
                value={settings.speechRate}
                min={0.5}
                max={2.0}
                step={0.1}
                onChange={(value) => handleSettingChange('speechRate', value)}
                formatValue={(value) => `${value.toFixed(1)}x`}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voice Type
                </label>
                <select
                  value={settings.voiceType}
                  onChange={(e) => handleSettingChange('voiceType', e.target.value)}
                  className="input w-full"
                >
                  <option value="female">Female Voice</option>
                  <option value="male">Male Voice</option>
                  <option value="neutral">Neutral Voice</option>
                </select>
              </div>
            </div>
          </SettingSection>

          {/* Accessibility Settings */}
          <SettingSection title="Accessibility" icon={Eye}>
            <div className="space-y-2">
              <ToggleSetting
                label="High Contrast Mode"
                description="Increase contrast for better visibility"
                checked={settings.highContrast}
                onChange={(checked) => handleSettingChange('highContrast', checked)}
              />
              <ToggleSetting
                label="Large Text"
                description="Use larger text throughout the app"
                checked={settings.largeText}
                onChange={(checked) => handleSettingChange('largeText', checked)}
              />
              <ToggleSetting
                label="Reduce Motion"
                description="Minimize animations and transitions"
                checked={settings.reduceMotion}
                onChange={(checked) => handleSettingChange('reduceMotion', checked)}
              />
            </div>
          </SettingSection>

          {/* Notification Settings */}
          <SettingSection title="Notifications" icon={Bell}>
            <div className="space-y-2">
              <ToggleSetting
                label="Push Notifications"
                description="Receive notifications about analysis results"
                checked={settings.enableNotifications}
                onChange={(checked) => handleSettingChange('enableNotifications', checked)}
              />
              <ToggleSetting
                label="Sound Alerts"
                description="Play sounds for important notifications"
                checked={settings.enableSoundAlerts}
                onChange={(checked) => handleSettingChange('enableSoundAlerts', checked)}
              />
              <ToggleSetting
                label="Vibration"
                description="Use vibration for alerts on mobile devices"
                checked={settings.enableVibration}
                onChange={(checked) => handleSettingChange('enableVibration', checked)}
              />
            </div>
          </SettingSection>

          {/* Privacy Settings */}
          <SettingSection title="Privacy & Data" icon={Shield}>
            <div className="space-y-2">
              <ToggleSetting
                label="Save Analysis History"
                description="Keep a history of your vision analyses"
                checked={settings.saveAnalysisHistory}
                onChange={(checked) => handleSettingChange('saveAnalysisHistory', checked)}
              />
              <ToggleSetting
                label="Share Anonymous Data"
                description="Help improve the app by sharing anonymous usage data"
                checked={settings.shareAnonymousData}
                onChange={(checked) => handleSettingChange('shareAnonymousData', checked)}
              />
            </div>
          </SettingSection>

          {/* Theme Settings */}
          <SettingSection title="Appearance" icon={Palette}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
                className="input w-full"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
              </select>
            </div>
          </SettingSection>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSave}
              className="btn-primary flex items-center justify-center space-x-2 flex-1"
            >
              <Save className="h-4 w-4" />
              <span>Save Settings</span>
            </button>
            
            <button
              onClick={handleDeleteAccount}
              className="btn-secondary flex items-center justify-center space-x-2 text-red-600 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}