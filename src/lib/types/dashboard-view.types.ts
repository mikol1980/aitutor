// ============================================================================
// Dashboard View Types
// ============================================================================
// View models and types specific to the dashboard view frontend

import type { SectionDTO, UserProgressWithDetailsDTO, SessionDetailsDTO } from "@/types";

/**
 * Progress statistics for a section
 */
export interface SectionProgressVM {
  completed: number;
  inProgress: number;
  notStarted: number;
  percentCompleted: number;
}

/**
 * Dashboard section view model
 * Combines section data with aggregated progress
 */
export interface DashboardSectionVM {
  id: string; // UUID
  title: string;
  description: string | null;
  progress: SectionProgressVM;
}

/**
 * Last session view model
 * Represents the user's most recent learning session
 */
export interface LastSessionVM {
  id: string; // UUID
  topicTitle: string | null;
  endedAt: string | null;
  isActive: boolean; // Derived: endedAt === null
}

/**
 * Recommended topic view model
 * Suggests the next topic for the user to study
 */
export interface RecommendedTopicVM {
  sectionId: string; // UUID
  sectionTitle: string;
  topicId: string; // UUID
  topicTitle: string;
}

/**
 * Complete dashboard data view model
 * Aggregates all data needed for the dashboard view
 */
export interface DashboardDataVM {
  sections: DashboardSectionVM[];
  lastSession?: LastSessionVM;
  recommended?: RecommendedTopicVM;
}

/**
 * Dashboard state for useDashboardData hook
 */
export interface DashboardState {
  data?: DashboardDataVM;
  loading: boolean;
  error?: { code?: string; message: string };
  isEmpty: boolean; // True when no sections available
}

// ============================================================================
// Mapper Functions
// ============================================================================

/**
 * Maps SectionDTO and user progress data to DashboardSectionVM
 * Aggregates progress by section_id
 */
export function mapSectionsAndProgressToDashboardVM(
  sections: SectionDTO[],
  progressData: UserProgressWithDetailsDTO[]
): DashboardSectionVM[] {
  return sections.map((section) => {
    // Filter progress for this section
    const sectionProgress = progressData.filter((p) => p.section_id === section.id);

    // Count by status
    const completed = sectionProgress.filter((p) => p.status === "completed").length;
    const inProgress = sectionProgress.filter((p) => p.status === "in_progress").length;
    const notStarted = sectionProgress.filter((p) => p.status === "not_started").length;

    const totalTopics = sectionProgress.length;
    const percentCompleted = totalTopics > 0 ? Math.round((completed / totalTopics) * 100) : 0;

    return {
      id: section.id,
      title: section.title,
      description: section.description,
      progress: {
        completed,
        inProgress,
        notStarted,
        percentCompleted,
      },
    };
  });
}

/**
 * Maps SessionDetailsDTO to LastSessionVM
 */
export function mapSessionToLastSessionVM(session: SessionDetailsDTO): LastSessionVM {
  return {
    id: session.id,
    topicTitle: session.topic_title,
    endedAt: session.ended_at,
    isActive: session.ended_at === null,
  };
}

/**
 * Finds recommended topic based on user progress
 * Heuristic: First not_started topic in section with highest percentage of incomplete topics
 */
export function findRecommendedTopic(progressData: UserProgressWithDetailsDTO[]): RecommendedTopicVM | undefined {
  if (progressData.length === 0) return undefined;

  // Group by section_id
  const sectionGroups = progressData.reduce(
    (acc, item) => {
      if (!acc[item.section_id]) {
        acc[item.section_id] = {
          sectionId: item.section_id,
          sectionTitle: item.section_title,
          topics: [],
        };
      }
      acc[item.section_id].topics.push(item);
      return acc;
    },
    {} as Record<string, { sectionId: string; sectionTitle: string; topics: UserProgressWithDetailsDTO[] }>
  );

  // Calculate incomplete percentage for each section
  const sectionsWithScore = Object.values(sectionGroups).map((group) => {
    const incomplete = group.topics.filter((t) => t.status === "not_started" || t.status === "in_progress").length;
    const total = group.topics.length;
    const incompletePercent = total > 0 ? incomplete / total : 0;

    return {
      ...group,
      incompletePercent,
    };
  });

  // Sort by incomplete percentage (descending)
  sectionsWithScore.sort((a, b) => b.incompletePercent - a.incompletePercent);

  // Find first not_started topic in the section with most incomplete topics
  for (const section of sectionsWithScore) {
    const notStartedTopic = section.topics.find((t) => t.status === "not_started");
    if (notStartedTopic) {
      return {
        sectionId: notStartedTopic.section_id,
        sectionTitle: notStartedTopic.section_title,
        topicId: notStartedTopic.topic_id,
        topicTitle: notStartedTopic.topic_title,
      };
    }
  }

  // Fallback: find any in_progress topic
  for (const section of sectionsWithScore) {
    const inProgressTopic = section.topics.find((t) => t.status === "in_progress");
    if (inProgressTopic) {
      return {
        sectionId: inProgressTopic.section_id,
        sectionTitle: inProgressTopic.section_title,
        topicId: inProgressTopic.topic_id,
        topicTitle: inProgressTopic.topic_title,
      };
    }
  }

  return undefined;
}
