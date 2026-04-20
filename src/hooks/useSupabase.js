import { useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

/**
 * Generic hook for Supabase queries
 * Usage: const { data, loading, error, refetch } = useSupabase(queryFn, [deps])
 */
import { useState } from 'react'

export function useSupabaseQuery(queryFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await queryFn()
      if (mountedRef.current) {
        setData(result)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    mountedRef.current = true
    fetch()
    return () => { mountedRef.current = false }
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}

/**
 * Hook for rooms data
 */
export function useRooms() {
  const { user } = useAuth()

  return useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('user_id', user?.id)
      .order('name', { ascending: true })
    if (error) throw error
    return data || []
  }, [user?.id])
}

/**
 * Hook for settings
 */
export function useSettings() {
  const { user } = useAuth()

  return useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user?.id)
      .maybeSingle()
    if (error) throw error
    return data
  }, [user?.id])
}

/**
 * Hook for tenants (active) by room
 */
export function useActiveTenant(roomId) {
  return useSupabaseQuery(async () => {
    if (!roomId) return null
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('room_id', roomId)
      .is('end_date', null)
      .maybeSingle()
    if (error) throw error
    return data
  }, [roomId])
}

/**
 * Hook for invoices filtered by month/year
 */
export function useInvoices(month, year) {
  const { user } = useAuth()

  return useSupabaseQuery(async () => {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        rooms(
          name,
          tenants(full_name)
        )
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })

    if (month) query = query.eq('billing_month', month)
    if (year) query = query.eq('billing_year', year)

    const { data, error } = await query
    if (error) throw error
    return data || []
  }, [user?.id, month, year])
}

/**
 * Hook to get a single invoice by ID
 */
export function useInvoice(id) {
  return useSupabaseQuery(async () => {
    if (!id) return null
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        rooms(
          name, 
          default_price, 
          tenants(full_name, phone, deposit)
        )
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }, [id])
}
