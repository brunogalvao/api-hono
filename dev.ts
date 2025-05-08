import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { supabase } from './supabase/client'

const app = new Hono()

app.get('/', (c) => c.text('🚀 API Hono + Supabase CRUD rodando'))

app.get('/ping', async (c) => {
  const { data, error } = await supabase.from('tasks').select('*').limit(1)
  if (error) return c.json({ status: 'erro', error: error.message }, 500)
  return c.json({ status: 'ok', data })
})

// CRUD
app.get('/tasks', async (c) => {
  const { data, error } = await supabase.from('tasks').select('*').order('created_at')
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

app.post('/tasks', async (c) => {
  const body = await c.req.json()
  const { data, error } = await supabase.from('tasks').insert([body]).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0])
})

app.put('/tasks/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const { data, error } = await supabase.from('tasks').update(body).eq('id', id).select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data[0])
})

app.delete('/tasks/:id', async (c) => {
  const id = c.req.param('id')
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

serve({
  fetch: app.fetch,
  port: 3000,
})
