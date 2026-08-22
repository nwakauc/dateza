import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="public-status">
          <h1 className="public-status__title">Something went wrong</h1>
          <p className="public-status__body">
            Refresh the page, or return home and try again.
          </p>
          <a className="public-status__home" href="/">
            Back to home
          </a>
        </main>
      );
    }

    return this.props.children;
  }
}
