import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type {
  SessionDetailsDTO,
  SessionMessageDTO,
  CreateSessionMessageCommand,
  PaginationDTO,
} from '../../types';

/**
 * Sessions Service
 *
 * Handles all session-related operations with the database.
 * Uses Supabase client with Row Level Security (RLS) for secure data access.
 */
export class SessionsService {
  /**
   * Get detailed information about a specific session
   *
   * This method fetches session data along with the associated topic title.
   * It relies on Supabase RLS policies to ensure users can only access their own sessions.
   *
   * @param supabase - Authenticated Supabase client from context.locals
   * @param sessionId - UUID of the session to retrieve
   * @returns SessionDetailsDTO if session exists and user has access, null otherwise
   * @throws Error if database operation fails
   *
   * @example
   * const session = await sessionsService.getSessionDetails(
   *   context.locals.supabase,
   *   'session-uuid-here'
   * );
   */
  async getSessionDetails(
    supabase: SupabaseClient<Database>,
    sessionId: string
  ): Promise<SessionDetailsDTO | null> {
    try {
      // Query sessions table with join to topics table
      // RLS policy automatically filters to only return sessions owned by the authenticated user
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          user_id,
          topic_id,
          started_at,
          ended_at,
          ai_summary,
          topics (
            title
          )
        `)
        .eq('id', sessionId)
        .single();

      if (error) {
        // If error code is PGRST116, it means no rows found (could be 404 or 403 due to RLS)
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching session details:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Return null if no data (should be caught by error handling above)
      if (!data) {
        return null;
      }

      // Map the response to SessionDetailsDTO format
      // Handle the case where topics might be null or an array
      const topicTitle = data.topics && !Array.isArray(data.topics)
        ? (data.topics as { title: string }).title
        : null;

      const sessionDetails: SessionDetailsDTO = {
        id: data.id,
        user_id: data.user_id,
        topic_id: data.topic_id,
        started_at: data.started_at,
        ended_at: data.ended_at,
        ai_summary: data.ai_summary,
        topic_title: topicTitle
      };

      return sessionDetails;
    } catch (error) {
      console.error('Unexpected error in getSessionDetails:', error);
      throw error;
    }
  }

  /**
   * Check session ownership using admin privileges
   *
   * This method uses the service role key to bypass RLS and check if a session exists
   * and who owns it. This allows us to distinguish between 404 (not found) and 403 (forbidden).
   *
   * SECURITY: This method should ONLY be called server-side and ONLY after verifying
   * that the requesting user is authenticated. It does NOT return sensitive session data,
   * only existence and ownership information.
   *
   * @param sessionId - UUID of the session to check
   * @returns 'not_found' if session doesn't exist, or object with user_id if it exists
   * @throws Error if service role key is not configured or database operation fails
   *
   * @example
   * const result = await sessionsService.checkSessionOwnershipWithAdmin('session-uuid');
   * if (result === 'not_found') {
   *   return ErrorResponses.notFound();
   * } else if (result.user_id !== currentUserId) {
   *   return ErrorResponses.forbidden();
   * }
   */
  async checkSessionOwnershipWithAdmin(
    sessionId: string
  ): Promise<'not_found' | { user_id: string }> {
    // Check if service role key is available
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceRoleKey) {
      throw new Error('Service role key not configured. Cannot perform admin check.');
    }

    try {
      // Create temporary admin client with service role privileges
      const adminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Query only the user_id field (no other sensitive data)
      const { data, error } = await adminClient
        .from('sessions')
        .select('user_id')
        .eq('id', sessionId)
        .single();

      if (error) {
        // PGRST116 = no rows found
        if (error.code === 'PGRST116') {
          return 'not_found';
        }
        console.error('Error in admin ownership check:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        return 'not_found';
      }

      return { user_id: data.user_id };
    } catch (error) {
      console.error('Unexpected error in checkSessionOwnershipWithAdmin:', error);
      throw error;
    }
  }

  /**
   * Get session messages with pagination
   *
   * Fetches messages for a specific session with pagination support.
   * RLS policies ensure users can only access messages from their own sessions.
   *
   * @param supabase - Authenticated Supabase client from context.locals
   * @param sessionId - UUID of the session
   * @param limit - Maximum number of messages to return (default: 50)
   * @param offset - Number of messages to skip (default: 0)
   * @param order - Sort order 'asc' or 'desc' (default: 'asc')
   * @returns Object with messages array and pagination metadata
   * @throws Error if database operation fails
   */
  async getSessionMessages(
    supabase: SupabaseClient<Database>,
    sessionId: string,
    limit: number = 50,
    offset: number = 0,
    order: 'asc' | 'desc' = 'asc'
  ): Promise<{ messages: SessionMessageDTO[]; pagination: PaginationDTO }> {
    try {
      // First, get total count of messages for this session
      const { count, error: countError } = await supabase
        .from('session_messages')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);

      if (countError) {
        console.error('Error counting session messages:', countError);
        throw new Error(`Database error: ${countError.message}`);
      }

      const total = count ?? 0;

      // Fetch messages with pagination
      const { data, error } = await supabase
        .from('session_messages')
        .select('id, session_id, sender, content, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: order === 'asc' })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching session messages:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      const messages: SessionMessageDTO[] = (data || []).map((msg) => ({
        id: msg.id,
        session_id: msg.session_id,
        sender: msg.sender as 'user' | 'ai',
        content: msg.content as Record<string, any>,
        created_at: msg.created_at,
      }));

      const pagination: PaginationDTO = {
        total,
        limit,
        offset,
        has_more: offset + messages.length < total,
      };

      return { messages, pagination };
    } catch (error) {
      console.error('Unexpected error in getSessionMessages:', error);
      throw error;
    }
  }

  /**
   * Create a new session message
   *
   * Adds a new message to a session (user or AI message).
   * RLS policies ensure users can only add messages to their own sessions.
   *
   * @param supabase - Authenticated Supabase client from context.locals
   * @param sessionId - UUID of the session
   * @param command - Message creation command with sender and content
   * @returns Created SessionMessageDTO
   * @throws Error if database operation fails or user lacks permission
   */
  async createSessionMessage(
    supabase: SupabaseClient<Database>,
    sessionId: string,
    command: CreateSessionMessageCommand
  ): Promise<SessionMessageDTO> {
    try {
      const { data, error } = await supabase
        .from('session_messages')
        .insert({
          session_id: sessionId,
          sender: command.sender,
          content: command.content as any,
        })
        .select('id, session_id, sender, content, created_at')
        .single();

      if (error) {
        console.error('Error creating session message:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned after creating message');
      }

      return {
        id: data.id,
        session_id: data.session_id,
        sender: data.sender as 'user' | 'ai',
        content: data.content as Record<string, any>,
        created_at: data.created_at,
      };
    } catch (error) {
      console.error('Unexpected error in createSessionMessage:', error);
      throw error;
    }
  }

  /**
   * End a session with AI summary
   *
   * Marks a session as ended by setting ended_at timestamp and storing AI summary.
   * RLS policies ensure users can only end their own sessions.
   *
   * @param supabase - Authenticated Supabase client from context.locals
   * @param sessionId - UUID of the session to end
   * @param aiSummary - AI-generated summary of the session
   * @returns Updated SessionDetailsDTO
   * @throws Error if database operation fails or session doesn't exist
   */
  async endSession(
    supabase: SupabaseClient<Database>,
    sessionId: string,
    aiSummary: string
  ): Promise<SessionDetailsDTO> {
    try {
      // Update session with ended_at and ai_summary
      const { data, error } = await supabase
        .from('sessions')
        .update({
          ended_at: new Date().toISOString(),
          ai_summary: aiSummary,
        })
        .eq('id', sessionId)
        .select(`
          id,
          user_id,
          topic_id,
          started_at,
          ended_at,
          ai_summary,
          topics (
            title
          )
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Session not found or access denied');
        }
        console.error('Error ending session:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned after ending session');
      }

      // Map response to SessionDetailsDTO
      const topicTitle = data.topics && !Array.isArray(data.topics)
        ? (data.topics as { title: string }).title
        : null;

      return {
        id: data.id,
        user_id: data.user_id,
        topic_id: data.topic_id,
        started_at: data.started_at,
        ended_at: data.ended_at,
        ai_summary: data.ai_summary,
        topic_title: topicTitle,
      };
    } catch (error) {
      console.error('Unexpected error in endSession:', error);
      throw error;
    }
  }
}

// Export singleton instance for use across the application
export const sessionsService = new SessionsService();
