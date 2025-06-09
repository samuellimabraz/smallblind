# SmallBlind Frontend

A modern React frontend for the SmallBlind AI vision assistance application.

## Features

- **Modern Design**: Clean, minimalist interface with accessibility in mind
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile devices
- **Authentication**: Secure login and registration system
- **Vision Analysis**: Upload images or use camera for AI-powered analysis
- **People Management**: CRUD interface for managing registered people
- **Settings**: Comprehensive settings panel for customization
- **Real-time Camera**: Live camera integration for instant analysis

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication
- **Lucide React** for icons

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3001`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout with sidebar
│   └── LoadingSpinner.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state management
├── pages/              # Page components
│   ├── LoginPage.tsx   # Authentication page
│   ├── MainMenu.tsx    # Dashboard/home page
│   ├── PeopleManagement.tsx # CRUD for people
│   ├── VisionAnalysis.tsx   # Image analysis interface
│   └── Settings.tsx    # Settings panel
├── App.tsx            # Main app component
├── main.tsx          # Entry point
└── index.css         # Global styles
```

## Key Features

### 1. Authentication
- Login/Register toggle interface
- JWT token management
- Protected routes
- User session persistence

### 2. Vision Analysis
- Multiple input methods (upload/camera)
- Three analysis types:
  - Object Detection
  - Scene Description
  - Face Recognition
- Real-time camera capture
- Results visualization

### 3. People Management
- Add/Edit/Delete people
- Multiple photo upload
- Search functionality
- Contact information management

### 4. Settings
- Profile management
- Vision analysis preferences
- Audio/speech settings
- Accessibility options
- Privacy controls

## Design Principles

- **Accessibility First**: High contrast options, keyboard navigation, screen reader support
- **Mobile Responsive**: Touch-friendly interface that works on all screen sizes
- **Minimalist**: Clean design that doesn't overwhelm users
- **Consistent**: Unified design system with reusable components
- **Fast**: Optimized for performance with lazy loading and efficient rendering

## API Integration

The frontend is designed to work with the SmallBlind backend API. Key integration points:

- Authentication endpoints (`/api/auth/*`)
- Vision analysis endpoints (`/api/vision/*`, `/api/llama/*`)
- User management (`/api/users/*`)
- Session management (`/api/sessions/*`)

## Customization

The design system is built with Tailwind CSS and can be easily customized by modifying:

- `tailwind.config.js` - Colors, fonts, spacing
- `src/index.css` - Global styles and component classes
- Component-level styling in individual files

## Accessibility Features

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- High contrast mode option
- Large text option
- Reduced motion support
- Screen reader friendly

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style and patterns
2. Ensure all components are accessible
3. Test on multiple screen sizes
4. Add TypeScript types for new features
5. Update documentation as needed