# Algorithmia Frontend

The frontend of Algorithmia, a platform for problem proposal and collection.

## Project Structure

```
algorithmia-frontend/
├── public/                    # Static assets
│   ├── locales/               # Translation files
│   │   ├── en/                # English translations
│   │   └── zh/                # Chinese translations
├── src/
│   ├── assets/                # Project assets (images, icons)
│   ├── components/            # Reusable UI components
│   │   ├── Editor.tsx         # Markdown editor component
│   │   ├── Layout/            # Layout components
│   │   ├── Problem/           # Problem-related components
│   │   ├── animations/        # Animation components
│   │   │   └── SuccessCheck.tsx
│   │   └── ui/                # UI system components
│   │       ├── color-mode.tsx # Color mode management
│   │       ├── provider.tsx   # Chakra UI provider setup
│   │       ├── toaster.tsx    # Toast notifications
│   │       └── tooltip.tsx    # Tooltip component
│   ├── i18n/                  # Internationalization setup
│   ├── pages/                 # Application views/pages
│   │   ├── Auth/              # Authentication pages
│   │   │   ├── EmailVerification.tsx
│   │   │   ├── SignIn.tsx
│   │   │   ├── SignOut.tsx
│   │   │   └── SignUp.tsx
│   │   ├── Chat/              # Discussion feature
│   │   ├── Home/              # Dashboard
│   │   ├── LandingPage/       # Public landing page
│   │   ├── ProblemBank/       # Problem database management
│   │   ├── ProblemReview/     # Problem review functionality
│   │   ├── ProblemReviewDetail/ # Detailed problem review
│   │   ├── ProblemSetting/    # Problem creation features
│   │   │   ├── ProblemDetail.tsx
│   │   │   ├── ProblemList.tsx
│   │   │   └── types.ts
│   │   ├── ProblemVerification/ # Problem verification workflow
│   │   ├── ProblemVerificationDetail/ # Detailed verification
│   │   └── SuperAdmin/        # Admin dashboard and tools
│   │       ├── CompetitionDetail/
│   │       ├── Competitions/
│   │       └── Personnel/
│   ├── services/              # API and service layer
│   │   └── chatWebSocket.ts   # WebSocket chat service
│   ├── styles/                # Global styles
│   │   └── custom-milkdown.css # Custom Milkdown editor styles
│   ├── App.tsx                # Root application component
│   ├── config.ts              # Application configuration
│   ├── index.css              # Global CSS
│   ├── main.tsx               # Application entry point
│   └── vite-env.d.ts          # Vite environment types
```

## Architecture

### Role-Based Access Control

The application implements a comprehensive role-based access control system with
the following user roles:

- **Super Admin**: Full system access, including admin dashboard and competition
  management
- **Admin**: Administrative privileges for problem bank management
- **Verifier**: Access to problem verification tools
- **Reviewer**: Access to detailed problem review features
- **User**: Base level access to core features

### Features by User Role

- **All Users**: Problem setting, discussions, problem bank access
- **Verifiers**: Problem verification workflow
- **Reviewers**: Detailed problem review and evaluation
- **Admins**: Problem bank management and oversight
- **Super Admins**: System administration, competition management, personnel
  management

### UI/UX Design

- **Modern Design System**: Built with Chakra UI v3 for consistent, accessible
  components
- **Responsive Layout**: Tailwind CSS v4 for mobile-first responsive design
- **Dark/Light Mode**: Comprehensive color mode support with next-themes
  integration
- **Accessible Components**: ARIA-compliant UI components with proper keyboard
  navigation
- **Toast Notifications**: Integrated toast system for user feedback
- **Role-Based UI**: Dynamic interface adaptation based on user permissions

### Rich Text Editing & Math Support

- **Markdown Editor**: Milkdown editor with CommonMark preset for rich text
  editing
- **Math Rendering**: KaTeX integration for LaTeX math formula rendering
- **Custom Styling**: Tailored editor appearance with custom CSS
- **Real-time Preview**: Live preview of markdown content with math formulas

### Real-time Features

- **WebSocket Chat**: Real-time discussion system for collaborative problem
  solving
- **Live Updates**: Instant notifications and updates across the platform

### Internationalization

- **Multi-language Support**: Complete i18next integration with English and
  Chinese translations
- **Browser Language Detection**: Automatic language detection and switching
- **Dynamic Loading**: Efficient translation resource loading

## Development Workflow

### Prerequisites

- **Node.js**: Version 23.x (managed via Volta)
- **pnpm**: Version 10.7.0 or later
- **Git**: For version control with Husky hooks

### Installation

```sh
# Install dependencies
pnpm install
```

### Development

```sh
# Start development server
pnpm dev
```
