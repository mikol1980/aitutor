// ============================================================================
// ProgressOverview Component
// ============================================================================
// Example component showing how to use useUserProgress hook
// Displays user progress with filtering options

import { useState } from 'react';
import { useUserProgress } from '@/hooks/useUserProgress';
import type { UserProgressStatus } from '@/types';

/**
 * Example Progress Overview Component
 *
 * This is a reference implementation showing how to use the useUserProgress hook.
 * Customize this component according to your UI design requirements.
 */
export function ProgressOverview() {
  const { data, loading, error, setFilters, clearFilters, refetch, canRetry } =
    useUserProgress();

  const [selectedStatus, setSelectedStatus] = useState<UserProgressStatus | 'all'>('all');

  /**
   * Handle status filter change
   */
  const handleStatusChange = (status: UserProgressStatus | 'all') => {
    setSelectedStatus(status);

    if (status === 'all') {
      clearFilters();
    } else {
      setFilters({ status });
    }
  };

  /**
   * Calculate completion percentage
   */
  const completionPercentage = data?.summary
    ? Math.round((data.summary.completed / data.summary.totalTopics) * 100)
    : 0;

  // Loading state
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Ładowanie postępów...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="p-8 text-center">
        <div className="text-destructive mb-4">
          <svg
            className="mx-auto h-12 w-12 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="font-semibold text-lg mb-2">Błąd ładowania postępów</h3>
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
        </div>
        {canRetry && (
          <button
            onClick={refetch}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Spróbuj ponownie
          </button>
        )}
      </div>
    );
  }

  // No data state
  if (!data || data.progress.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Brak danych o postępach</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="bg-card rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Twoje postępy</h2>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Ukończone tematy</span>
            <span className="text-sm font-medium">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
              role="progressbar"
              aria-valuenow={completionPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-background rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-primary">
              {data.summary.totalTopics}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Wszystkie tematy</div>
          </div>
          <div className="bg-background rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {data.summary.completed}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Ukończone</div>
          </div>
          <div className="bg-background rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {data.summary.inProgress}
            </div>
            <div className="text-sm text-muted-foreground mt-1">W trakcie</div>
          </div>
          <div className="bg-background rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-gray-400">
              {data.summary.notStarted}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Do rozpoczęcia</div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleStatusChange('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedStatus === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Wszystkie ({data.summary.totalTopics})
        </button>
        <button
          onClick={() => handleStatusChange('completed')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedStatus === 'completed'
              ? 'bg-green-600 text-white'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Ukończone ({data.summary.completed})
        </button>
        <button
          onClick={() => handleStatusChange('in_progress')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedStatus === 'in_progress'
              ? 'bg-yellow-600 text-white'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          W trakcie ({data.summary.inProgress})
        </button>
        <button
          onClick={() => handleStatusChange('not_started')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedStatus === 'not_started'
              ? 'bg-gray-600 text-white'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Do rozpoczęcia ({data.summary.notStarted})
        </button>
      </div>

      {/* Progress List */}
      <div className="space-y-2">
        {loading && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Odświeżanie...
          </div>
        )}

        {data.progress.map((item) => (
          <div
            key={item.topicId}
            className="bg-card rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">
                  {item.sectionTitle}
                </div>
                <h3 className="font-semibold text-lg">{item.topicTitle}</h3>
              </div>

              <div className="flex items-center gap-3">
                {/* Score badge */}
                {item.score !== null && (
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {Math.round(item.score * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">wynik</div>
                  </div>
                )}

                {/* Status badge */}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : item.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                  }`}
                >
                  {item.status === 'completed'
                    ? 'Ukończono'
                    : item.status === 'in_progress'
                      ? 'W trakcie'
                      : 'Nie rozpoczęto'}
                </span>
              </div>
            </div>

            {/* Last updated */}
            {item.updatedAtIso && (
              <div className="text-xs text-muted-foreground mt-2">
                Ostatnia aktualizacja:{' '}
                {new Date(item.updatedAtIso).toLocaleDateString('pl-PL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
