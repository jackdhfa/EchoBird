import { Component, type CSSProperties, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

const btnStyle: CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid #444',
  background: '#2a2a2a',
  color: '#e8e8e8',
  cursor: 'pointer',
  fontSize: 13,
};

/**
 * Top-level crash floor. An uncaught error during render makes React unmount
 * the WHOLE tree, which previously left users staring at a blank window — no
 * visible error, no way to recover, and (since JS exceptions never reach the
 * Rust `echobird.log`) nothing for us to diagnose from. This boundary catches
 * it, shows the actual error with a copy button, and offers a reload.
 *
 * Styles are deliberately self-contained (no theme CSS vars, no i18n) because
 * those subsystems may be exactly what failed to initialize.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] uncaught render error:', error, info.componentStack);
  }

  private details(): string {
    const e = this.state.error;
    if (!e) return '';
    return `${e.name}: ${e.message}\n\n${e.stack ?? '(no stack)'}`;
  }

  private handleCopy = (): void => {
    const text = this.details();
    navigator.clipboard?.writeText(text).catch(() => {
      // Fallback for older WebKit / clipboard-permission failures.
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* ignore */
      }
      ta.remove();
    });
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          background: '#1a1a1a',
          color: '#e8e8e8',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600 }}>应用出错了 / Something went wrong</div>
        <div style={{ fontSize: 13, opacity: 0.7, maxWidth: 520 }}>
          界面遇到一个未处理的错误。复制下面的错误信息发给我们,然后重新加载即可。
        </div>
        <pre
          style={{
            maxWidth: 640,
            maxHeight: 220,
            overflow: 'auto',
            textAlign: 'left',
            fontSize: 12,
            lineHeight: 1.5,
            padding: 12,
            borderRadius: 8,
            background: '#0f0f0f',
            color: '#ff9b9b',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0,
          }}
        >
          {this.details()}
        </pre>
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" onClick={this.handleCopy} style={btnStyle}>
            复制错误信息 / Copy error
          </button>
          <button type="button" onClick={() => window.location.reload()} style={btnStyle}>
            重新加载 / Reload
          </button>
        </div>
      </div>
    );
  }
}
