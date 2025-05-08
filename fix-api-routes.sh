#!/bin/bash

# Script para corregir problemas de rutas API en producción
echo "=== CORRIGIENDO RUTAS API ==="

# 1. Verificar las rutas API en el servidor
echo "Verificando rutas API en server/routes.ts y server/auth.ts..."

# Verificar si la ruta /api/auth/register existe en auth.ts
if grep -q "/api/auth/register" server/auth.ts; then
  echo "✓ La ruta /api/auth/register existe en auth.ts"
else
  echo "✕ La ruta /api/auth/register NO existe en auth.ts"
  
  # Buscar rutas alternativas que puedan estar siendo usadas
  echo "Buscando rutas alternativas de registro..."
  grep -n "/api/.*register" server/auth.ts server/routes.ts
  
  # Corregir la ruta si encontramos el código de registro
  if grep -q "app.post(\"/api/register\"" server/auth.ts; then
    echo "Encontrada ruta /api/register, corrigiendo referencias en el frontend..."
    
    # Buscar archivos del frontend que hagan referencia a /api/auth/register
    FRONTEND_FILES=$(grep -l "/api/auth/register" client/src --include="*.ts" --include="*.tsx" -r)
    
    if [ -n "$FRONTEND_FILES" ]; then
      echo "Encontrados archivos que hacen referencia a la ruta incorrecta:"
      echo "$FRONTEND_FILES"
      
      # Corregir las referencias
      for file in $FRONTEND_FILES; do
        echo "Corrigiendo $file..."
        sed -i 's|/api/auth/register|/api/register|g' "$file"
      done
      echo "Referencias corregidas"
    else
      echo "No se encontraron referencias a /api/auth/register en el frontend"
    fi
  fi
fi

# 2. Verificar otros endpoints de autenticación
echo "Verificando otras rutas de autenticación..."

# Verificar login
if grep -q "/api/auth/login" server/auth.ts; then
  echo "✓ La ruta /api/auth/login existe en auth.ts"
else
  echo "✕ La ruta /api/auth/login NO existe en auth.ts"
  
  if grep -q "app.post(\"/api/login\"" server/auth.ts; then
    echo "Encontrada ruta /api/login, corrigiendo referencias en el frontend..."
    
    # Buscar archivos del frontend que hagan referencia a /api/auth/login
    FRONTEND_FILES=$(grep -l "/api/auth/login" client/src --include="*.ts" --include="*.tsx" -r)
    
    if [ -n "$FRONTEND_FILES" ]; then
      echo "Encontrados archivos que hacen referencia a la ruta incorrecta:"
      echo "$FRONTEND_FILES"
      
      # Corregir las referencias
      for file in $FRONTEND_FILES; do
        echo "Corrigiendo $file..."
        sed -i 's|/api/auth/login|/api/login|g' "$file"
      done
      echo "Referencias corregidas"
    fi
  fi
fi

# Verificar logout
if grep -q "/api/auth/logout" server/auth.ts; then
  echo "✓ La ruta /api/auth/logout existe en auth.ts"
else
  echo "✕ La ruta /api/auth/logout NO existe en auth.ts"
  
  if grep -q "app.post(\"/api/logout\"" server/auth.ts; then
    echo "Encontrada ruta /api/logout, corrigiendo referencias en el frontend..."
    
    # Buscar archivos del frontend que hagan referencia a /api/auth/logout
    FRONTEND_FILES=$(grep -l "/api/auth/logout" client/src --include="*.ts" --include="*.tsx" -r)
    
    if [ -n "$FRONTEND_FILES" ]; then
      echo "Encontrados archivos que hacen referencia a la ruta incorrecta:"
      echo "$FRONTEND_FILES"
      
      # Corregir las referencias
      for file in $FRONTEND_FILES; do
        echo "Corrigiendo $file..."
        sed -i 's|/api/auth/logout|/api/logout|g' "$file"
      done
      echo "Referencias corregidas"
    fi
  fi
fi

# Verificar user
if grep -q "/api/auth/user" server/auth.ts; then
  echo "✓ La ruta /api/auth/user existe en auth.ts"
else
  echo "✕ La ruta /api/auth/user NO existe en auth.ts"
  
  if grep -q "app.get(\"/api/user\"" server/auth.ts; then
    echo "Encontrada ruta /api/user, corrigiendo referencias en el frontend..."
    
    # Buscar archivos del frontend que hagan referencia a /api/auth/user
    FRONTEND_FILES=$(grep -l "/api/auth/user" client/src --include="*.ts" --include="*.tsx" -r)
    
    if [ -n "$FRONTEND_FILES" ]; then
      echo "Encontrados archivos que hacen referencia a la ruta incorrecta:"
      echo "$FRONTEND_FILES"
      
      # Corregir las referencias
      for file in $FRONTEND_FILES; do
        echo "Corrigiendo $file..."
        sed -i 's|/api/auth/user|/api/user|g' "$file"
      done
      echo "Referencias corregidas"
    fi
  fi
fi

# 3. Crear archivos de corrección para el frontend y backend

# Corregir hooks/use-auth.tsx si existe
if [ -f "client/src/hooks/use-auth.tsx" ]; then
  echo "Corrigiendo cliente/hooks/use-auth.tsx..."
  
  # Crear un backup
  cp client/src/hooks/use-auth.tsx client/src/hooks/use-auth.tsx.bak
  
  # Analizar si usa /api/auth/ en las URLs
  if grep -q "/api/auth/" client/src/hooks/use-auth.tsx; then
    echo "Encontradas referencias a /api/auth/ en use-auth.tsx, corrigiendo..."
    sed -i 's|/api/auth/register|/api/register|g' client/src/hooks/use-auth.tsx
    sed -i 's|/api/auth/login|/api/login|g' client/src/hooks/use-auth.tsx
    sed -i 's|/api/auth/logout|/api/logout|g' client/src/hooks/use-auth.tsx
    sed -i 's|/api/auth/user|/api/user|g' client/src/hooks/use-auth.tsx
    echo "Referencias corregidas en use-auth.tsx"
  else
    echo "No se encontraron referencias a /api/auth/ en use-auth.tsx"
  fi
fi

# 4. Verificar el archivo server/auth.ts para asegurarnos de que las rutas están correctamente definidas
if [ -f "server/auth.ts" ]; then
  echo "Verificando definiciones de rutas en server/auth.ts..."
  
  # Crear un backup
  cp server/auth.ts server/auth.ts.bak
  
  # Verificar si setupAuth está configurado correctamente
  if grep -q "setupAuth" server/auth.ts; then
    echo "Función setupAuth encontrada, verificando definiciones de rutas..."
    
    # Verificar si las rutas están correctamente definidas
    REGISTER_ROUTE=$(grep -n "app.post(\"/api/.*register" server/auth.ts)
    LOGIN_ROUTE=$(grep -n "app.post(\"/api/.*login" server/auth.ts)
    LOGOUT_ROUTE=$(grep -n "app.post(\"/api/.*logout" server/auth.ts)
    USER_ROUTE=$(grep -n "app.get(\"/api/.*user" server/auth.ts)
    
    echo "Rutas encontradas:"
    echo "Register: $REGISTER_ROUTE"
    echo "Login: $LOGIN_ROUTE"
    echo "Logout: $LOGOUT_ROUTE"
    echo "User: $USER_ROUTE"
  fi
fi

# 5. Crear un archivo de corrección para el servidor que asegure que las rutas estén bien definidas
cat > fix-auth-routes.ts << EOF
/**
 * Este archivo contiene las correcciones de rutas para auth.ts
 * Copia las funciones relevantes al archivo auth.ts si es necesario.
 */

export function setupAuthRoutes(app: Express) {
  // Rutas de autenticación
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "El nombre de usuario ya existe" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const userData = {
        ...req.body,
        password: hashedPassword,
        rol: "usuario",
        activo: true,
        fechaCreacion: new Date(),
      };

      const user = await storage.createUser(userData);
      const userWithoutPassword = { ...user, password: undefined };

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      res.status(500).json({ message: "Error al registrar el usuario" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    if (req.user) {
      const userWithoutPassword = { ...req.user, password: undefined };
      res.status(200).json(userWithoutPassword);
    } else {
      res.status(401).json({ message: "Credenciales inválidas" });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "No autenticado" });
    }
    const userWithoutPassword = { ...req.user, password: undefined };
    res.json(userWithoutPassword);
  });
}
EOF

echo "Archivo fix-auth-routes.ts creado con definiciones de rutas corregidas"

# 6. Resumen de cambios y acciones
echo ""
echo "=== RESUMEN DE ACCIONES ==="
echo "1. Se han verificado las rutas API en el código del servidor"
echo "2. Se han corregido las referencias en el frontend (si aplicaba)"
echo "3. Se ha creado fix-auth-routes.ts con definiciones correctas de rutas"
echo ""
echo "Para implementar estas correcciones:"
echo "1. Revisa las diferencias en los archivos modificados"
echo "2. Asegúrate de que las rutas en server/auth.ts coincidan con las utilizadas en el frontend"
echo "3. Si es necesario, integra el código de fix-auth-routes.ts en tu auth.ts"
echo "4. Recompila la aplicación utilizando build-prod.sh"
echo "5. Despliega los archivos actualizados al servidor"
echo ""
echo "Si necesitas un script para aplicar estos cambios automáticamente, indica que se cree uno."

# Hacer el script ejecutable
chmod +x fix-api-routes.sh