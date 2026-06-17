import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      const message = this.props.fallbackMessage || "Something went wrong";
      return (
        <div className="max-w-md mx-auto my-16 p-8 rounded-xl border border-border bg-card text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">{message}</h2>
          <p className="text-sm text-muted-foreground mb-6">{this.state.error.message}</p>
          <button
            type="button"
            className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer border-none"
            onClick={() => {
              this.setState({ error: null });
              this.props.onRetry?.();
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
