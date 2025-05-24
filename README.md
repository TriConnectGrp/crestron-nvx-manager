# Crestron NVX Manager

A professional cross-platform desktop application for managing Crestron DM-NVX audio/video devices via their REST API. Built for AV technicians and system integrators.

## Features

- **Device Management**: Add, remove, and organize NVX devices
- **Real-time Monitoring**: Live status updates and health monitoring
- **Configuration Management**: Network, video, and audio settings
- **Bulk Operations**: Multi-device configuration and control
- **Dark/Light Theme**: Professional UI with theme support
- **Cross-platform**: Windows 10/11 and macOS support

## Technology Stack

- **Electron**: Cross-platform desktop framework
- **React**: UI framework with TypeScript
- **Tailwind CSS**: Modern styling framework
- **Zustand**: Lightweight state management
- **Axios**: HTTP client for REST API integration
- **React Router**: Client-side routing

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crestron-nvx-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run electron-dev
   ```
   This will start both the webpack dev server and Electron app.

### Development Scripts

```bash
# Start webpack dev server only
npm run dev

# Build for production
npm run build

# Start Electron (after building)
npm run electron

# Start development mode (webpack + electron)
npm run electron-dev

# Create distribution packages
npm run dist

# Create Windows distribution
npm run dist:win

# Create macOS distribution
npm run dist:mac

# Lint code
npm run lint

# Type checking
npm run type-check
```

## Project Structure

```
├── public/                 # Static assets
│   └── index.html         # HTML template
├── src/                   # Source code
│   ├── components/        # React components
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── pages/            # Page components
│   │   └── Dashboard.tsx
│   ├── App.tsx           # Main app component
│   ├── index.tsx         # Entry point
│   └── index.css         # Global styles
├── electron.js           # Electron main process
├── preload.js           # Electron preload script
├── webpack.config.js    # Webpack configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## Building for Production

### Windows

```bash
npm run dist:win
```

Creates:
- `dist/Crestron NVX Manager Setup 1.0.0.exe` - NSIS installer

### macOS

```bash
npm run dist:mac
```

Creates:
- `dist/Crestron NVX Manager-1.0.0.dmg` - DMG installer
- `dist/Crestron NVX Manager-1.0.0-arm64.dmg` - Apple Silicon
- `dist/Crestron NVX Manager-1.0.0-x64.dmg` - Intel

## API Integration

The application is designed to integrate with Crestron DM-NVX REST API:

- Device discovery and connection management
- Real-time status polling
- Configuration management
- Authentication handling
- Error handling and retry logic

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Development Guidelines

- Use TypeScript for type safety
- Follow React best practices
- Use Tailwind CSS for styling
- Implement proper error handling
- Write meaningful commit messages
- Test cross-platform compatibility

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team

---

**Crestron NVX Manager** - Professional AV device management made simple. 