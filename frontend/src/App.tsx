import { AppErrorBoundary } from './shared/components/AppErrorBoundary';
import { AppRouter } from './routes/AppRouter';

function App() {
  return (
    <AppErrorBoundary>
      <AppRouter />
    </AppErrorBoundary>
  );
}

export default App;
