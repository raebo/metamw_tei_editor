import React from 'react';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: any) {
    // Fehler abfangen und Zustand setzen
    return { hasError: true };
  }
  
  componentDidCatch(error: any, errorInfo: any) {
    // Hier kannst du Fehler z.B. loggen
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please try again later.</div>;
    }
    
    return this.props.children;
  }
}

export default ErrorBoundary;
