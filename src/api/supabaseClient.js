/**
 * Backwards-compatible facade that emulates the small subset of the
 * (now removed) legacy SDK that this app actually used, on top of Supabase.
 *
 * Pages and components keep importing `supabaseClient` from `@/api/supabaseClient`,
 * which is now backed entirely by Supabase Auth + Postgres + RLS.
 */
import { supabase } from '@/lib/supabase';

// Map an entity name to its Postgres table name.
const TABLE = {
  Task: 'tasks',
  Project: 'projects',
  Habit: 'habits',
  Deadline: 'deadlines',
  FocusSession: 'focus_sessions',
};

// Sort string used by the legacy API:
//   "field"   → ascending
//   "-field"  → descending
function applySort(query, sort) {
  if (!sort || typeof sort !== 'string') return query;
  if (sort.startsWith('-')) return query.order(sort.slice(1), { ascending: false });
  return query.order(sort, { ascending: true });
}

async function getUserId() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData?.session?.user?.id) {
    return sessionData.session.user.id;
  }
  const { data } = await supabase.auth.getUser();
  return data?.user?.id ?? null;
}

function makeEntity(entityName) {
  const table = TABLE[entityName];
  if (!table) throw new Error(`[supabase client] Unknown entity: ${entityName}`);

  const baseQuery = () => supabase.from(table).select('*');

  return {
    /**
     * .list(sort?, limit?)
     * Strictly scopes results to the active user to prevent data mismatches across accounts.
     */
    async list(sort, limit) {
      const userId = await getUserId();
      let q = baseQuery();
      if (userId) {
        q = q.eq('user_id', userId);
      }
      q = applySort(q, sort);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },

    /**
     * .filter(filters, sort?, limit?)
     * Only equality filters are used in this app.
     * Enforces user_id filter so users never access other players' records.
     */
    async filter(filters = {}, sort, limit) {
      const userId = await getUserId();
      let q = baseQuery();
      if (userId && !('user_id' in filters)) {
        q = q.eq('user_id', userId);
      }
      for (const [k, v] of Object.entries(filters)) {
        q = q.eq(k, v);
      }
      q = applySort(q, sort);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },

    async create(payload) {
      const userId = await getUserId();
      if (!userId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from(table)
        .insert({ ...payload, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, patch) {
      const userId = await getUserId();
      let q = supabase.from(table).update(patch).eq('id', id);
      if (userId) {
        q = q.eq('user_id', userId);
      }
      const { data, error } = await q.select().single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const userId = await getUserId();
      let q = supabase.from(table).delete().eq('id', id);
      if (userId) {
        q = q.eq('user_id', userId);
      }
      const { error } = await q;
      if (error) throw error;
      return { id };
    },
  };
}

export const supabaseClient = {
  entities: {
    Task: makeEntity('Task'),
    Project: makeEntity('Project'),
    Habit: makeEntity('Habit'),
    Deadline: makeEntity('Deadline'),
    FocusSession: makeEntity('FocusSession'),
  },
  auth: {
    async me() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        const err = new Error('Not authenticated');
        err.status = 401;
        throw err;
      }
      return {
        id: data.user.id,
        email: data.user.email,
        ...data.user.user_metadata,
      };
    },
    async loginViaEmailPassword(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    async register(email, password) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      return data;
    },
    async loginWithProvider(provider, redirectPath = '/') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin + redirectPath },
      });
      if (error) throw error;
    },
    async logout() {
      await supabase.auth.signOut();
      window.location.href = '/';
    },
    async resetPasswordRequest(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
    },
    async resetPassword({ newPassword }) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
  },
};
