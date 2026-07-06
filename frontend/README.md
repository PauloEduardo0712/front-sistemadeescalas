# Frontend - Sistema de Escalas

Interface web do sistema de escalas da Igreja Shekinah IAD.

O frontend agora usa React, TypeScript e Vite. Parte das telas ainda roda sobre a camada legada em `src/legacy.ts`, que preserva o comportamento original enquanto a migração para componentes React acontece por etapas.

## Requisitos

- Node.js compatível com o Vite instalado.
- Backend rodando em `http://localhost:8081/api`, ou uma URL configurada por ambiente.

## Configuração

Crie um arquivo `.env` na pasta `frontend` se precisar mudar a URL da API:

```env
VITE_API_BASE_URL=http://localhost:8081/api
```

Há um exemplo em `.env.example`.

## Desenvolvimento

```powershell
npm.cmd install
npm.cmd run dev
```

Abra a URL exibida pelo Vite, normalmente:

```text
http://127.0.0.1:5173/
```

Esse é o fluxo recomendado durante desenvolvimento, porque recompila React/TypeScript automaticamente.

## Build

```powershell
npm.cmd run build
```

O build final fica em `frontend/dist`.

## Go Live

O Live Server do VS Code está configurado para servir `frontend/dist`. Antes de usar o Go Live, rode:

```powershell
npm.cmd run build
```

Se você editar arquivos em `src`, o Go Live só mostrará as mudanças depois de um novo build.

## XAMPP

Para publicar no Apache do XAMPP:

```powershell
npm.cmd run deploy:xampp
```

O script copia o build para:

```text
C:\xampp\htdocs\sistema-shekinah
```

Com o Apache atual na porta `8090`, acesse:

```text
http://localhost:8090/sistema-shekinah/
```

## Próximos passos técnicos

- Migrar `src/legacy.ts` por telas para componentes React reais.
- Remover gradualmente `innerHTML` e `onclick` em strings.
- Usar os tipos de `src/types.ts` nos módulos novos.
- Separar chamadas de API em um módulo dedicado.
