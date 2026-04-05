import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react';
import { COLORS } from '../../../config/theme';
import logoImage from '../../../assets/logo.png';
import { Button } from '../ui/Button/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  resetKey: number;
}

/**
 * Catches render errors in the subtree (React error boundary). Does not catch event handlers, async, or errors inside the boundary's own render.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetKey: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState((s) => ({ hasError: false, resetKey: s.resetKey + 1 }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-[100dvh] flex items-center justify-center px-4 py-12"
          style={{ backgroundColor: COLORS.background }}
        >
          <div
            className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border px-6 py-10 text-center shadow-md"
            style={{
              backgroundColor: COLORS.surface,
              borderColor: COLORS.gray[200],
            }}
            role="alert"
          >
            <div className="flex h-20 w-20 shrink-0 items-center justify-center sm:h-24 sm:w-24">
              <img
                src={logoImage}
                alt="Tapa y Busca"
                className="h-full w-full object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold">
              <span style={{ color: COLORS.orange }}>Tapa </span>
              <span style={{ color: COLORS.lightTeal }}>y </span>
              <span style={{ color: COLORS.violet }}>Busca</span>
            </h2>
            <p className="text-lg font-semibold" style={{ color: COLORS.error.dark }}>
              Algo salió mal al mostrar esta pantalla.
            </p>
            <p className="text-sm" style={{ color: COLORS.gray[600] }}>
              Podés reintentar. Si el problema continúa, recargá la página.
            </p>
            <Button type="button" variant="accent" onClick={this.handleReset}>
              Reintentar
            </Button>
          </div>
        </div>
      );
    }

    return <Fragment key={this.state.resetKey}>{this.props.children}</Fragment>;
  }
}
