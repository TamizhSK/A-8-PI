import { Home } from '@/pages/Home';
import { ErrorBoundary } from '@/components';

function App() {
  return (
    <ErrorBoundary>
      <Home />
    </ErrorBoundary>
  );
}

export default App
