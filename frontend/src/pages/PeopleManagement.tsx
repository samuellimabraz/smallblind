import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User, 
  Upload,
  X,
  Save,
  Camera
} from 'lucide-react'
import axios from 'axios'

interface Person {
  id: string
  name: string
  email?: string
  phone?: string
  notes?: string
  images: string[]
  createdAt: string
  lastSeen?: string
}

export default function PeopleManagement() {
  const [people, setPeople] = useState<Person[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    images: [] as File[]
  })

  // Mock data for demonstration
  useEffect(() => {
    const mockPeople: Person[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        notes: 'Family member - Father',
        images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'],
        createdAt: '2024-01-15T10:30:00Z',
        lastSeen: '2024-01-20T14:22:00Z'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1 (555) 987-6543',
        notes: 'Colleague from work',
        images: ['https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'],
        createdAt: '2024-01-10T09:15:00Z',
        lastSeen: '2024-01-19T16:45:00Z'
      },
      {
        id: '3',
        name: 'Mike Johnson',
        email: 'mike.j@example.com',
        notes: 'Neighbor',
        images: ['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'],
        createdAt: '2024-01-08T15:20:00Z'
      }
    ]
    setPeople(mockPeople)
  }, [])

  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Here you would integrate with your facial recognition API
      // For now, we'll simulate the API call
      
      const newPerson: Person = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        notes: formData.notes,
        images: formData.images.map(file => URL.createObjectURL(file)),
        createdAt: new Date().toISOString()
      }

      if (editingPerson) {
        setPeople(prev => prev.map(p => p.id === editingPerson.id ? { ...newPerson, id: editingPerson.id } : p))
      } else {
        setPeople(prev => [...prev, newPerson])
      }

      resetForm()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error saving person:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (person: Person) => {
    setEditingPerson(person)
    setFormData({
      name: person.name,
      email: person.email || '',
      phone: person.phone || '',
      notes: person.notes || '',
      images: []
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      setPeople(prev => prev.filter(p => p.id !== id))
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      notes: '',
      images: []
    })
    setEditingPerson(null)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }))
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">People Management</h1>
            <p className="text-gray-600">Register and manage people for facial recognition</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add Person</span>
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search people..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full sm:w-96"
            />
          </div>
        </div>

        {/* People Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPeople.map((person) => (
            <div key={person.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {person.images.length > 0 ? (
                      <img
                        src={person.images[0]}
                        alt={person.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{person.name}</h3>
                      {person.email && (
                        <p className="text-sm text-gray-600">{person.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(person)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(person.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {person.phone && (
                  <p className="text-sm text-gray-600 mb-2">📞 {person.phone}</p>
                )}

                {person.notes && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{person.notes}</p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Added {formatDate(person.createdAt)}</span>
                  {person.lastSeen && (
                    <span>Last seen {formatDate(person.lastSeen)}</span>
                  )}
                </div>

                {person.images.length > 1 && (
                  <div className="mt-3 flex space-x-2">
                    {person.images.slice(1, 4).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${person.name} ${index + 2}`}
                        className="h-8 w-8 rounded object-cover"
                      />
                    ))}
                    {person.images.length > 4 && (
                      <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-600">+{person.images.length - 4}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredPeople.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No people found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first person'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary"
              >
                Add Person
              </button>
            )}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setIsModalOpen(false)} />

              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingPerson ? 'Edit Person' : 'Add New Person'}
                  </h3>
                  <button
                    onClick={() => {
                      setIsModalOpen(false)
                      resetForm()
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="input w-full"
                      placeholder="Enter person's name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="input w-full"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="input w-full"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="input w-full h-20 resize-none"
                      placeholder="Add any notes about this person"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Photos
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-600">Click to upload photos</span>
                        <span className="text-xs text-gray-500">PNG, JPG up to 10MB each</span>
                      </label>
                    </div>

                    {formData.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {formData.images.map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Upload ${index + 1}`}
                              className="h-20 w-20 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false)
                        resetForm()
                      }}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary flex-1 flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>{editingPerson ? 'Update' : 'Save'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}