import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set')
}

// Basic public client (no auth)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client-side Supabase client with token (use with useAuth hook)
export const createSupabaseClientWithToken = (token: string | null) => {
  if (!token) {
    throw new Error('No auth token provided')
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })
}

// Server-side client with service role (for admin operations & webhooks)
export const getServerSupabase = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          owner_user_id: string
          subscription_tier: 'free' | 'starter' | 'professional' | 'enterprise'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_user_id: string
          subscription_tier?: 'free' | 'starter' | 'professional' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_user_id?: string
          subscription_tier?: 'free' | 'starter' | 'professional' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          email: string
          first_name: string | null
          last_name: string | null
          role: 'owner' | 'manager' | 'cashier'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          role: 'owner' | 'manager' | 'cashier'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          role?: 'owner' | 'manager' | 'cashier'
          created_at?: string
          updated_at?: string
        }
      }
      stores: {
        Row: {
          id: string
          tenant_id: string
          name: string
          location: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          location: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          location?: string
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          tenant_id: string
          name: string
          sku: string
          barcode: string | null
          price: number
          stock: number
          category: string
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          sku: string
          barcode?: string | null
          price: number
          stock?: number
          category: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          sku?: string
          barcode?: string | null
          price?: number
          stock?: number
          category?: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          tenant_id: string
          store_id: string
          cashier_id: string
          items: Array<{ product_id: string; quantity: number; price: number; name?: string }>
          total: number
          payment_method: 'cash' | 'card' | 'digital'
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          store_id: string
          cashier_id: string
          items: Array<{ product_id: string; quantity: number; price: number; name?: string }>
          total: number
          payment_method: 'cash' | 'card' | 'digital'
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          store_id?: string
          cashier_id?: string
          items?: Array<{ product_id: string; quantity: number; price: number; name?: string }>
          total?: number
          payment_method?: 'cash' | 'card' | 'digital'
          created_at?: string
        }
      }
      inventory_movements: {
        Row: {
          id: string
          tenant_id: string
          product_id: string
          store_id: string
          type: 'in' | 'out' | 'adjustment'
          quantity: number
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          product_id: string
          store_id: string
          type: 'in' | 'out' | 'adjustment'
          quantity: number
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          product_id?: string
          store_id?: string
          type?: 'in' | 'out' | 'adjustment'
          quantity?: number
          reason?: string | null
          created_at?: string
        }
      }
      billing_subscriptions: {
        Row: {
          id: string
          tenant_id: string
          polar_subscription_id: string
          status: 'active' | 'canceled' | 'past_due'
          current_period_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          polar_subscription_id: string
          status: 'active' | 'canceled' | 'past_due'
          current_period_end: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          polar_subscription_id?: string
          status?: 'active' | 'canceled' | 'past_due'
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
      }
      feature_flags: {
        Row: {
          id: string
          tenant_id: string
          feature: string
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          feature: string
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          feature?: string
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
          audit_logs: {
            Row: {
              id: string
              tenant_id: string
              user_id: string
              action: string
              resource: string
              details: Record<string, any> | null
              created_at: string
            }
            Insert: {
              id?: string
              tenant_id: string
              user_id: string
              action: string
              resource: string
              details?: Record<string, any> | null
              created_at?: string
            }
            Update: {
              id?: string
              tenant_id?: string
              user_id?: string
              action?: string
              resource?: string
              details?: Record<string, any> | null
              created_at?: string
            }
          }
          dashboards: {
            Row: {
              id: string
              tenant_id: string
              user_id: string
              config: any
              cached_stats: any
              last_updated: string
              created_at: string
              updated_at: string
            }
            Insert: {
              id?: string
              tenant_id: string
              user_id: string
              config?: any
              cached_stats?: any
              last_updated?: string
              created_at?: string
              updated_at?: string
            }
            Update: {
              id?: string
              tenant_id?: string
              user_id?: string
              config?: any
              cached_stats?: any
              last_updated?: string
              created_at?: string
              updated_at?: string
            }
          }
          customers: {
            Row: {
              id: number
              tenant_id: string
              first_name: string
              last_name: string
              email: string | null
              phone: string | null
              loyalty_points: number | null
              total_spent: number | null
              visit_count: number | null
              last_visit_at: string | null
              customer_segment: string | null
              notes: string | null
              created_at: string
              updated_at: string
            }
            Insert: {
              id?: number
              tenant_id: string
              first_name: string
              last_name: string
              email?: string | null
              phone?: string | null
              loyalty_points?: number | null
              total_spent?: number | null
              visit_count?: number | null
              last_visit_at?: string | null
              customer_segment?: string | null
              notes?: string | null
              created_at?: string
              updated_at?: string
            }
            Update: {
              id?: number
              tenant_id?: string
              first_name?: string
              last_name?: string
              email?: string | null
              phone?: string | null
              loyalty_points?: number | null
              total_spent?: number | null
              visit_count?: number | null
              last_visit_at?: string | null
              customer_segment?: string | null
              notes?: string | null
              created_at?: string
              updated_at?: string
            }
          }
          customer_debts: {
            Row: {
              id: string
              tenant_id: string
              customer_id: number
              sale_id: string | null
              amount_owed: number
              amount_paid: number | null
              status: string | null
              due_date: string | null
              notes: string | null
              created_at: string
              updated_at: string
            }
            Insert: {
              id?: string
              tenant_id: string
              customer_id: number
              sale_id?: string | null
              amount_owed: number
              amount_paid?: number | null
              status?: string | null
              due_date?: string | null
              notes?: string | null
              created_at?: string
              updated_at?: string
            }
            Update: {
              id?: string
              tenant_id?: string
              customer_id?: number
              sale_id?: string | null
              amount_owed?: number
              amount_paid?: number | null
              status?: string | null
              due_date?: string | null
              notes?: string | null
              created_at?: string
              updated_at?: string
            }
          }
          suppliers: {
            Row: {
              id: number
              tenant_id: string
              name: string
              contact_person: string | null
              email: string | null
              phone: string | null
              address: string | null
              payment_terms: string | null
              notes: string | null
              created_at: string
              updated_at: string
            }
            Insert: {
              id?: number
              tenant_id: string
              name: string
              contact_person?: string | null
              email?: string | null
              phone?: string | null
              address?: string | null
              payment_terms?: string | null
              notes?: string | null
              created_at?: string
              updated_at?: string
            }
            Update: {
              id?: number
              tenant_id?: string
              name?: string
              contact_person?: string | null
              email?: string | null
              phone?: string | null
              address?: string | null
              payment_terms?: string | null
              notes?: string | null
              created_at?: string
              updated_at?: string
            }
          }
          supplier_debts: {
            Row: {
              id: string
              tenant_id: string
              supplier_id: number
              purchase_order_id: number | null
              amount_owed: number
              amount_paid: number | null
              status: string | null
              due_date: string | null
              notes: string | null
              created_at: string
              updated_at: string
            }
            Insert: {
              id?: string
              tenant_id: string
              supplier_id: number
              purchase_order_id?: number | null
              amount_owed: number
              amount_paid?: number | null
              status?: string | null
              due_date?: string | null
              notes?: string | null
              created_at?: string
              updated_at?: string
            }
            Update: {
              id?: string
              tenant_id?: string
              supplier_id?: number
              purchase_order_id?: number | null
              amount_owed?: number
              amount_paid?: number | null
              status?: string | null
              due_date?: string | null
              notes?: string | null
              created_at?: string
              updated_at?: string
            }
          }
          expenses: {
            Row: {
              id: number
              business_id: string | null
              branch_id: string | null
              title: string | null
              amount: number | null
              category: string | null
              created_at: string
            }
            Insert: {
              id?: number
              business_id?: string | null
              branch_id?: string | null
              title?: string | null
              amount?: number | null
              category?: string | null
              created_at?: string
            }
            Update: {
              id?: number
              business_id?: string | null
              branch_id?: string | null
              title?: string | null
              amount?: number | null
              category?: string | null
              created_at?: string
            }
          }
          loyalty_programs: {
            Row: {
              id: number
              tenant_id: string | null
              name: string
              points_per_currency_unit: number | null
              reward_threshold: number | null
              reward_value: string
              is_active: boolean | null
              created_at: string
              updated_at: string
            }
            Insert: {
              id?: number
              tenant_id?: string | null
              name: string
              points_per_currency_unit?: number | null
              reward_threshold?: number | null
              reward_value: string
              is_active?: boolean | null
              created_at?: string
              updated_at?: string
            }
            Update: {
              id?: number
              tenant_id?: string | null
              name?: string
              points_per_currency_unit?: number | null
              reward_threshold?: number | null
              reward_value?: string
              is_active?: boolean | null
              created_at?: string
              updated_at?: string
            }
          }
          notifications: {
            Row: {
              id: number
              tenant_id: string | null
              user_id: string | null
              type: string
              title: string
              message: string
              priority: string | null
              is_read: boolean | null
              data_json: any | null
              created_at: string
            }
            Insert: {
              id?: number
              tenant_id?: string | null
              user_id?: string | null
              type: string
              title: string
              message: string
              priority?: string | null
              is_read?: boolean | null
              data_json?: any | null
              created_at?: string
            }
            Update: {
              id?: number
              tenant_id?: string | null
              user_id?: string | null
              type?: string
              title?: string
              message?: string
              priority?: string | null
              is_read?: boolean | null
              data_json?: any | null
              created_at?: string
            }
          }
        }

    }
  }