import React from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { 
  Eye, 
  Users, 
  Camera, 
  Mic, 
  Settings, 
  History,
  TrendingUp,
  Clock,
  ArrowRight
} from 'lucide-react'

export default function MainMenu() {
  const features = [
    {
      title: 'Vision Analysis',
      description: 'Analyze images with AI-powered object detection and scene description',
      icon: Eye,
      href: '/vision',
      color: 'bg-blue-500',
      stats: '1,234 analyses'
    },
    {
      title: 'People Management',
      description: 'Register and manage people for facial recognition',
      icon: Users,
      href: '/people',
      color: 'bg-green-500',
      stats: '45 people registered'
    },
    {
      title: 'Camera Capture',
      description: 'Real-time camera analysis and object detection',
      icon: Camera,
      href: '/vision?mode=camera',
      color: 'bg-purple-500',
      stats: 'Live detection'
    },
    {
      title: 'Voice Commands',
      description: 'Control the app with voice commands and audio feedback',
      icon: Mic,
      href: '/voice',
      color: 'bg-orange-500',
      stats: 'Coming soon'
    }
  ]

  const recentActivity = [
    {
      type: 'Object Detection',
      description: 'Detected 3 objects in kitchen scene',
      time: '2 minutes ago',
      icon: Eye
    },
    {
      type: 'Person Recognition',
      description: 'Recognized John Doe with 95% confidence',
      time: '5 minutes ago',
      icon: Users
    },
    {
      type: 'Image Description',
      description: 'Generated description for outdoor scene',
      time: '10 minutes ago',
      icon: Camera
    }
  ]

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600">
            Your AI vision assistant is ready to help you explore the world around you.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Analyses</p>
                <p className="text-2xl font-bold text-gray-900">1,234</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">+12%</span>
              <span className="text-gray-600 ml-1">from last week</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">People Registered</p>
                <p className="text-2xl font-bold text-gray-900">45</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">+3</span>
              <span className="text-gray-600 ml-1">new this week</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing Time</p>
                <p className="text-2xl font-bold text-gray-900">1.2s</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">-0.3s</span>
              <span className="text-gray-600 ml-1">faster than average</span>
            </div>
          </div>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          {features.map((feature) => (
            <Link
              key={feature.title}
              to={feature.href}
              className="group bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-gray-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`h-12 w-12 ${feature.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {feature.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {feature.stats}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <Link 
                to="/history" 
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
              >
                <span>View all</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <activity.icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.type}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  </div>
                  <div className="text-xs text-gray-500 flex-shrink-0">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}