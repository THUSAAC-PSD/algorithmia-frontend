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
│   │   ├── LanguageSwitcher.tsx # Language selector
│   │   ├── Problem/           # Problem-related components
│   │   └── Sidebar/           # Navigation sidebar
│   ├── i18n/                  # Internationalization setup
│   ├── pages/                 # Application views/pages
│   │   ├── Auth/              # Authentication pages
│   │   ├── Chat/              # Discussion feature
│   │   ├── Home/              # Dashboard
│   │   ├── LandingPage/       # Public landing page
│   │   ├── ProblemBank/       # Problem database management
│   │   ├── ProblemReview/     # Problem review functionality
│   │   ├── ProblemSetting/    # Problem creation features
│   │   ├── ProblemVerification/ # Problem verification workflow
│   │   └── SuperAdmin/        # Admin dashboard and tools
│   ├── styles/                # Global styles
│   ├── App.tsx                # Root application component
│   ├── index.css              # Global CSS
│   └── main.tsx               # Application entry point
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

- **All Users**: Problem setting, discussions
- **Verifiers**: Problem verification
- **Reviewers**: Detailed problem review
- **Admins**: Problem bank management
- **Super Admins**: System administration, competition management

### UI/UX Design

- Modern, dark-themed interface using Tailwind CSS, Flowbite styled components
- Role-specific feature visibility

### Markdown and Math Support

- Rich text editing with Milkdown editor
- Math formula rendering with KaTeX integration

## Development Workflow

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
