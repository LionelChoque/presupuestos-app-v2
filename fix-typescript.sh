#!/bin/bash

# Script para corregir problemas de TypeScript

# 1. Corregir la importación de vite.config.js en server/vite.ts
echo "Corrigiendo importación en server/vite.ts..."
sed -i 's/import viteConfig from "\.\.\/vite\.config\.js";/import viteConfig from "\.\.\/vite\.config\.js"; \/\/ @ts-ignore/' server/vite.ts

# 2. Corregir el error de tipo implícito 'any' en shared/utils.ts
echo "Corrigiendo parámetro de error en shared/utils.ts..."
sed -i 's/error: (error) => {/error: (error: Error) => {/' shared/utils.ts

# 3. Corregir el tipo de precio en shared/utils.ts
echo "Corrigiendo tipo de precio en shared/utils.ts..."
sed -i 's/precio: parseFloat(row.NetoItems_USD.replace(",", ".")) \* 100,/precio: String(parseFloat(row.NetoItems_USD.replace(",", ".")) \* 100),/' shared/utils.ts

echo "Correcciones de TypeScript completadas."
