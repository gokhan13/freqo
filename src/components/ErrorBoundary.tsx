import { Component, type ReactNode } from 'react';

type Props = {
  /** What to show in place of the part that failed. `retry` renders that part again. */
  fallback: (retry: () => void) => ReactNode;
  children: ReactNode;
};

/** Keeps one failing screen from taking the rest of the app down with it. */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  retry = () => this.setState({ failed: false });
  render() {
    return this.state.failed ? this.props.fallback(this.retry) : this.props.children;
  }
}
