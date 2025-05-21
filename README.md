# **API Hono + Supabase**

Aqui será a api com Hono + Supabase CLI.


### **Vercel**

URL publicada na vercel.

```
https://api-hono-jet.vercel.app/api/tasks
```

### **Swagger Local**

- Swagger

```
http://localhost:3000/swagger-tasks
```

- DOC

```
http://localhost:3000/doc
```

### **Tag MD**

```
https://docs.github.com/pt/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#lists
```

## **Comando Supabase CLI**

Aqui alguns comando básico do supabase CLI.

- Criando uma migration.
```
supabase migration new add-price-to-tasks
```
- Migration banco Remoto.
```
supabase db push
```
- Migration banco Local.
```
supabase start
# depois
supabase db reset  # se quiser resetar tudo
# ou
supabase db push   # se quiser aplicar incrementalmente
```
