# Overview

Gobbly Turkey is a 2D Thanksgiving-themed browser game built with React and TypeScript. It's a Flappy Bird-style game where players control a turkey character navigating through obstacles while collecting points. The game features multiple difficulty levels, audio effects, local high score tracking, and a retro pixel art aesthetic.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern component patterns
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with custom CSS variables for theming, plus shadcn/ui component library
- **Game Engine**: Custom HTML5 Canvas-based game engine with 60fps animation loop
- **State Management**: Zustand for lightweight, hook-based state management
- **Component Structure**: Modular components separating game logic, UI, and canvas rendering

## Backend Architecture
- **Server**: Express.js with TypeScript for API endpoints
- **Development**: Hot module replacement via Vite middleware integration
- **Storage Interface**: Abstracted storage layer with in-memory implementation (ready for database integration)
- **Error Handling**: Centralized error middleware with proper status codes and logging

## Game Engine Design
- **Sprites System**: Class-based entities (Turkey, Obstacle, PowerUp, Particle) with update/draw methods
- **Physics**: Simple gravity and collision detection with configurable parameters
- **Difficulty Scaling**: Progressive level system with increasing speed, gravity, and obstacle frequency
- **Audio System**: Web Audio API integration with background music, sound effects, and mute controls
- **Input Handling**: Unified keyboard and mouse/touch input for cross-platform compatibility

## State Management
- **Game State**: Phase-based state machine (ready → playing → ended) with Zustand
- **Audio State**: Centralized audio management with lazy loading and error handling
- **Local Storage**: High score persistence and user preferences
- **Performance**: Optimized re-renders with selective subscriptions

## External Dependencies

- **Database**: Drizzle ORM configured for PostgreSQL with Neon Database serverless adapter
- **UI Components**: Radix UI primitives for accessible, unstyled components
- **Fonts**: Google Fonts (Press Start 2P) for retro gaming aesthetic
- **Build Tools**: ESBuild for server bundling, PostCSS for CSS processing
- **Development**: TypeScript compiler, Vite plugins for React and error overlay