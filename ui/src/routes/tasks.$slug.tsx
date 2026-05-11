import { createFileRoute } from '@tanstack/react-router';

// Stub route registered in Task 14 so <Link to="/tasks/$slug"> typechecks.
// Task 15 replaces this with the real TaskDetailPage.
export const Route = createFileRoute('/tasks/$slug')({
  component: () => <div />,
});
