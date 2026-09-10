import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
)

const clean = (s) => s.replace(/[^A-Za-z0-9 \-]/g, '').trim().slice(0, 50)

export async function fetchPlans({ types, from, to, query, bounds }) {
  let q = supabase.from('survey_plans')
    .select('plan_id, survey_type, town, block, survey_date, status, surveyor, file_format, lat, lon')
    .order('survey_date', { ascending: false })
    .limit(1000)
  if (types.length) q = q.in('survey_type', types)
  if (from) q = q.gte('survey_date', from)
  if (to) q = q.lte('survey_date', to)
  if (bounds) {
    q = q.gte('lat', bounds.s).lte('lat', bounds.n)
         .gte('lon', bounds.w).lte('lon', bounds.e)
  }
  const term = clean(query)
  if (term) q = q.or(`plan_id.ilike."%${term}%",block.ilike."%${term}%"`)
  const { data, error } = await q
  if (error) throw error
  return data
}
