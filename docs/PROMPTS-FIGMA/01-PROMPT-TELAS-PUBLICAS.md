# Prompt para IA do Figma - Telas Públicas (Não Autenticadas)

## 📋 Contexto do Sistema

**Nome:** Minha Clínica  
**Tipo:** Sistema SaaS para gestão de clínicas de saúde  
**Modelo:** Multi-tenant (cada clínica é um tenant isolado)  
**Público-alvo:** Clínicas médicas, odontológicas, estéticas e fisioterapia

---

## 🎨 Diretrizes de Design

### Identidade Visual
- **Estilo:** Moderno, limpo, profissional
- **Paleta de cores:** 
  - Primária: Azul médico (#3B82F6 - Blue 500)
  - Secundária: Azul escuro (#1E40AF - Blue 800)
  - Sucesso: Verde (#10B981)
  - Erro: Vermelho (#EF4444)
  - Neutros: Escala de cinza (#F3F4F6 a #111827)
- **Tipografia:** 
  - Títulos: Inter/SF Pro Display (Bold/Semibold)
  - Corpo: Inter/SF Pro Text (Regular/Medium)
- **Contraste:** Mínimo WCAG AA (4.5:1 para texto)
- **Responsividade:** Mobile-first (320px → 1920px)

### Componentes UI
- **Botões:** Arredondados (8px), altura mínima 44px (touch-friendly)
- **Inputs:** Bordas sutis, feedback visual claro em foco/erro
- **Cards:** Sombra leve, padding generoso
- **Ícones:** Outline style (Heroicons, Lucide ou similar)
- **Espaçamento:** Múltiplos de 8px (8, 16, 24, 32, 48, 64px)

---

## 📱 Telas a Serem Criadas

### 1. Landing Page Institucional da Clínica

#### Objetivo
Página pública que apresenta a clínica e permite que visitantes criem conta ou façam login.

#### Elementos Necessários

**Header/Navbar:**
- Logo da clínica (upload personalizado por cada clínica)
- Menu de navegação:
  - Início
  - Sobre Nós
  - Especialidades
  - Profissionais
  - Contato
- Botões de ação:
  - "Entrar" (botão secundário)
  - "Criar Conta" (botão primário - destaque)

**Hero Section (Primeira dobra):**
- Título impactante: "Sua saúde em boas mãos"
- Subtítulo: "Agende consultas online de forma rápida e prática"
- Imagem/ilustração: Profissional de saúde ou ambiente de clínica
- Call-to-action principal: "Agendar Consulta" (botão grande)
- Call-to-action secundário: "Criar Conta"

**Seção: Benefícios**
- Grid 3 colunas (mobile: 1 coluna)
- Cards com ícone + título + descrição curta:
  1. "Agendamento Online 24/7"
  2. "Lembretes Automáticos"
  3. "Histórico Completo de Consultas"

**Seção: Especialidades**
- Grid 2-4 colunas (responsivo)
- Cards de especialidades com:
  - Ícone representativo
  - Nome da especialidade
  - Breve descrição
  - Botão "Ver Profissionais"

**Seção: Nossos Profissionais**
- Carrossel ou grid de cards
- Cada card contém:
  - Foto do profissional (circular)
  - Nome completo
  - Especialidade(s)
  - Registro profissional (CRM, CRO, etc.)
  - Estrelas de avaliação (opcional - futuro)
  - Botão "Agendar"

**Seção: Como Funciona**
- Timeline ou processo em 4 etapas:
  1. "Crie sua conta gratuitamente"
  2. "Escolha profissional e horário"
  3. "Receba confirmação instantânea"
  4. "Compareça à consulta"

**Seção: Informações de Contato**
- Mapa de localização (integração Google Maps)
- Endereço completo
- Telefones de contato
- E-mail institucional
- Horário de funcionamento
- Links redes sociais (Instagram, Facebook, WhatsApp)

**Footer:**
- Logo da clínica (menor)
- Links rápidos (Início, Sobre, Contato, Termos de Uso, Política de Privacidade)
- Informações de copyright
- Selo "Protegido pela LGPD"

#### Comportamento Interativo
- Scroll suave entre seções
- Menu sticky no topo ao rolar a página
- Hover effects em cards e botões
- Lazy loading de imagens

---

### 2. Tela de Login

#### Objetivo
Autenticação de usuários (pacientes, profissionais, recepcionistas e admins).

#### Elementos Necessários

**Layout:**
- Design split-screen (desktop):
  - Esquerda: Formulário de login
  - Direita: Imagem/ilustração temática de saúde
- Mobile: Formulário full-screen com logo no topo

**Formulário de Login:**
- Logo da clínica centralizado no topo
- Título: "Bem-vindo de volta"
- Subtítulo: "Entre com suas credenciais"

**Campos:**
1. **E-mail:**
   - Label: "E-mail"
   - Input type="email"
   - Placeholder: "seu@email.com"
   - Ícone de envelope
   - Validação em tempo real (formato de e-mail)
   - Mensagem de erro: "Digite um e-mail válido"

2. **Senha:**
   - Label: "Senha"
   - Input type="password"
   - Placeholder: "********"
   - Ícone de cadeado
   - Botão de mostrar/ocultar senha (ícone de olho)
   - Validação: Mínimo 8 caracteres
   - Mensagem de erro: "Senha incorreta" (após submit)

3. **Lembrar-me:**
   - Checkbox: "Manter-me conectado"
   - Explicação em tooltip: "Sua sessão permanecerá ativa por 30 dias"

**Ações:**
- Botão primário: "Entrar" (full-width, destaque)
- Link: "Esqueci minha senha" (alinhado à direita, abaixo do botão)
- Separador: "ou"
- Link de cadastro: "Não tem conta? Criar conta" (centralizado)

**Estados do Formulário:**
- Estado normal (campos vazios)
- Estado de foco (input ativo)
- Estado de erro (campo com borda vermelha + mensagem)
- Estado de sucesso (campo com borda verde)
- Estado de loading (botão com spinner)
- Estado de erro geral (banner vermelho no topo: "E-mail ou senha incorretos")
- Estado de bloqueio: "Conta bloqueada após múltiplas tentativas. Tente novamente em 15 minutos."

**Alerts/Notificações:**
- Banner de sucesso após verificação de e-mail: "E-mail verificado com sucesso! Faça login."
- Banner de alerta: "Sua senha temporária expira em X dias. Por favor, altere sua senha."

---

### 3. Tela de Cadastro de Paciente (Público)

#### Objetivo
Permitir que novos pacientes criem conta no sistema de forma autônoma.

#### Elementos Necessários

**Layout:**
- Formulário em etapas (multi-step form)
- Indicador de progresso no topo: 3 etapas
  - Etapa 1: Dados Pessoais
  - Etapa 2: Contato
  - Etapa 3: Segurança

**Etapa 1: Dados Pessoais**

Campos obrigatórios:
1. **Nome Completo:**
   - Input type="text"
   - Placeholder: "João da Silva"
   - Validação: Mínimo 3 caracteres, nome e sobrenome
   - Erro: "Digite seu nome completo"

2. **CPF:**
   - Input type="text" com máscara (000.000.000-00)
   - Placeholder: "000.000.000-00"
   - Validação: CPF válido (algoritmo)
   - Verificação: CPF já cadastrado
   - Erro: "CPF inválido" ou "CPF já cadastrado"

3. **Data de Nascimento:**
   - Input type="date" ou date picker
   - Validação: Maior de 18 anos ou menor com responsável
   - Erro: "Data inválida"

4. **Sexo:**
   - Radio buttons ou Select:
     - Masculino
     - Feminino
     - Outro
     - Prefiro não informar

**Etapa 2: Contato**

Campos obrigatórios:
1. **E-mail:**
   - Input type="email"
   - Placeholder: "seu@email.com"
   - Validação: Formato válido + verificações de domínio
   - Verificação: E-mail já cadastrado
   - Erro: "E-mail já cadastrado ou inválido"

2. **Telefone Celular:**
   - Input type="tel" com máscara (11) 99999-9999
   - Placeholder: "(11) 99999-9999"
   - Validação: DDD válido + 9 dígitos
   - Erro: "Telefone inválido"

Campos opcionais:
3. **Telefone Fixo:**
   - Input type="tel" com máscara
   - Placeholder: "(11) 3333-3333"

**Etapa 3: Segurança**

Campos obrigatórios:
1. **Senha:**
   - Input type="password"
   - Placeholder: "Mínimo 8 caracteres"
   - Indicador de força da senha (fraco, médio, forte)
   - Requisitos visíveis:
     - ✅ Mínimo 8 caracteres
     - ✅ Pelo menos 1 letra maiúscula
     - ✅ Pelo menos 1 letra minúscula
     - ✅ Pelo menos 1 número
     - ⚠️ Recomendado: Caractere especial

2. **Confirmar Senha:**
   - Input type="password"
   - Validação: Deve ser igual ao campo senha
   - Erro: "As senhas não coincidem"

**Termos e Condições:**
- Checkbox obrigatório: "Aceito os Termos de Uso e Política de Privacidade"
- Links: "Termos de Uso" e "Política de Privacidade" (abrem em modal ou nova aba)
- Checkbox opcional: "Desejo receber lembretes e novidades por e-mail/SMS"

**Ações:**
- Botão "Voltar" (etapas 2 e 3)
- Botão "Próximo" (etapas 1 e 2)
- Botão "Criar Conta" (etapa 3 - destaque)
- Link: "Já tem conta? Fazer login"

**Estados:**
- Campos desabilitados até preenchimento correto da etapa anterior
- Botão "Próximo" desabilitado até validação completa
- Loading durante criação da conta
- Tela de sucesso: "Conta criada! Verifique seu e-mail para ativar sua conta."

---

### 4. Tela de Verificação de E-mail

#### Objetivo
Confirmar e-mail do usuário após cadastro ou alteração de e-mail.

#### Elementos Necessários

**Layout Centralizado:**

**Tela de Aguardando Verificação:**
- Ícone grande de e-mail (animado)
- Título: "Verifique seu e-mail"
- Mensagem: "Enviamos um link de verificação para [email@usuario.com]"
- Instruções:
  - "1. Abra seu e-mail"
  - "2. Clique no link de verificação"
  - "3. Volte aqui para fazer login"
- Botão: "Reenviar e-mail de verificação" (secondary)
- Timer: "Você pode reenviar o e-mail em 00:59" (countdown)
- Link: "Alterar e-mail"
- Link: "Voltar para login"

**Tela de Sucesso (após clicar no link):**
- Ícone de sucesso (check verde, animado)
- Título: "E-mail verificado com sucesso!"
- Mensagem: "Sua conta foi ativada. Agora você pode fazer login."
- Botão: "Ir para Login" (primário)

**Tela de Erro (link expirado/inválido):**
- Ícone de erro (X vermelho)
- Título: "Link de verificação inválido"
- Mensagem: "Este link expirou ou já foi utilizado."
- Botão: "Reenviar e-mail de verificação"
- Link: "Voltar para login"

---

### 5. Tela de Recuperação de Senha

#### Objetivo
Permitir que usuários resetem suas senhas caso esqueçam.

#### Elementos Necessários

**Etapa 1: Solicitar Reset**

Layout:
- Logo da clínica no topo
- Ícone de cadeado com interrogação
- Título: "Esqueceu sua senha?"
- Subtítulo: "Digite seu e-mail para receber instruções de recuperação"

Campos:
1. **E-mail:**
   - Input type="email"
   - Placeholder: "seu@email.com"
   - Validação: Formato válido
   - Erro: "E-mail não encontrado no sistema"

Ações:
- Botão: "Enviar link de recuperação" (primário)
- Link: "Voltar para login"

Estados:
- Success message: "E-mail enviado! Verifique sua caixa de entrada."
- Informação: "O link expira em 2 horas"
- Timer para reenvio: "Reenviar em 00:59"

**Etapa 2: Aguardando (após envio)**

Layout:
- Ícone de e-mail enviado
- Título: "E-mail enviado!"
- Mensagem: "Enviamos instruções para [email@usuario.com]"
- Instruções:
  - "1. Procure por e-mail de [nome da clínica]"
  - "2. Clique no link de recuperação"
  - "3. Defina sua nova senha"
- Alerta: "Verifique também sua caixa de spam"
- Botão: "Reenviar e-mail" (após countdown)
- Link: "Voltar para login"

**Etapa 3: Definir Nova Senha (após clicar no link)**

Layout:
- Logo da clínica
- Título: "Definir nova senha"
- Subtítulo: "Crie uma senha segura para sua conta"

Campos:
1. **Nova Senha:**
   - Input type="password"
   - Indicador de força
   - Requisitos de senha visíveis (checklist)
   - Botão mostrar/ocultar

2. **Confirmar Nova Senha:**
   - Input type="password"
   - Validação: Igual ao campo anterior
   - Erro: "As senhas não coincidem"

Ações:
- Botão: "Redefinir senha" (primário)
- Link: "Voltar para login"

Estados:
- Loading durante processamento
- Success: Redireciona para login com mensagem "Senha alterada com sucesso!"
- Erro: "Link expirado. Solicite nova recuperação."

---

### 6. Tela de Completar Cadastro (após convite)

#### Objetivo
Profissionais e recepcionistas convidados pelo admin completam seu cadastro através de um link com token temporário.

#### Elementos Necessários

**Layout:**
- Banner informativo no topo: "Você foi convidado para fazer parte da equipe de [Nome da Clínica]"
- Ícone de convite/envelope aberto

**Informações Pré-preenchidas (readonly):**
- Nome completo
- E-mail
- Tipo de usuário: "Profissional de Saúde" ou "Recepcionista"
- Nome da clínica

**Campos a Preencher:**

Para Profissionais:
1. **CPF:**
   - Input com máscara
   - Validação: CPF válido

2. **Telefone:**
   - Input com máscara

3. **Conselho Profissional:**
   - Select: CRM, CRO, CREFITO, CRP, etc.

4. **Número de Registro:**
   - Input type="text"
   - Placeholder: "12345"

5. **UF do Registro:**
   - Select com estados brasileiros

6. **Especialidade(s):**
   - Select múltiplo ou checkboxes
   - Lista de especialidades da clínica

Para Recepcionistas:
1. **CPF:**
   - Input com máscara

2. **Telefone:**
   - Input com máscara
a
3. **Data de Nascimento:**
   - Date picker

**Criar Senha:**
1. **Senha:**
   - Input type="password"
   - Indicador de força
   - Requisitos visíveis

2. **Confirmar Senha:**
   - Input type="password"

**Termos:**
- Checkbox: "Aceito os Termos de Uso e Política de Privacidade"
- Checkbox: "Consinto com o tratamento dos meus dados conforme LGPD"

**Ações:**
- Botão: "Completar Cadastro e Acessar" (primário)

**Estados:**
- Loading durante processamento
- Success: Redireciona para dashboard apropriado
- Erro: "Link de convite expirado ou inválido. Entre em contato com o administrador."

---

## 🎯 Especificações Técnicas para o Desenvolvedor

### Rotas e Endpoints Relacionados

```typescript
// Públicas (não requerem autenticação)
POST   /api/clinics/create                    // Criar nova clínica (onboarding)
GET    /api/clinics/:id                       // Dados públicos da clínica
POST   /api/patients/register                 // Cadastro público de paciente
POST   /api/patients/complete                 // Completar cadastro após verificação
POST   /api/professionals/complete            // Completar cadastro após convite
POST   /api/staff/complete                    // Completar cadastro após convite (recepcionista)
POST   /api/auth/login                        // Login
GET    /api/auth/verify-email/:token          // Verificar e-mail
POST   /api/auth/forgot-password              // Solicitar reset de senha
POST   /api/auth/reset-password/:token        // Resetar senha com token
GET    /api/auth/validate-token/:token        // Validar token de convite/reset
```

### Campos e Validações

#### Cadastro de Paciente
```typescript
{
  clinicId: string (uuid),           // Obrigatório
  name: string (min: 3, max: 100),   // Obrigatório
  cpf: string (11 dígitos),          // Obrigatório, único por clínica
  email: string (email válido),      // Obrigatório, único por clínica
  phone: string (11 dígitos),        // Obrigatório
  password: string (min: 8 chars),   // Obrigatório
  dateOfBirth: Date,                 // Obrigatório
  gender: enum (MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY), // Obrigatório
  alternativePhone?: string,         // Opcional
  termsAccepted: boolean,            // Obrigatório (true)
  privacyAccepted: boolean,          // Obrigatório (true)
  marketingConsent?: boolean         // Opcional
}
```

#### Login
```typescript
{
  email: string,
  password: string,
  rememberMe?: boolean
}
```

Response:
```typescript
{
  token: string (JWT),
  user: {
    id: string,
    name: string,
    email: string,
    role: enum (ADMIN, RECEPTIONIST, PROFESSIONAL, PATIENT),
    mustChangePassword: boolean,
    clinic: {
      id: string,
      name: string,
      logo: string
    }
  }
}
```

#### Completar Cadastro Profissional
```typescript
{
  token: string (no URL),            // Token temporário do convite
  cpf: string,
  phone: string,
  professionalCouncil: string,       // Ex: "CRM", "CRO"
  registrationNumber: string,
  registrationState: string (2 chars), // UF
  specialties: string[] (array de IDs),
  password: string,
  confirmPassword: string,
  termsAccepted: boolean
}
```

### Status dos Usuários
```typescript
enum UserStatus {
  ACTIVE,                 // Usuário ativo e pode fazer login
  INACTIVE,               // Desativado pelo admin
  BLOCKED,                // Bloqueado por tentativas de login
  PENDING_ACTIVATION      // Aguardando verificação de e-mail
}
```

### Fluxo de Autenticação

1. **Login bem-sucedido:**
   - Retorna JWT token (validade: 8 horas)
   - Armazena token no localStorage/sessionStorage
   - Header Authorization: `Bearer ${token}`
   - Redireciona baseado na role:
     - PATIENT → `/portal`
     - PROFESSIONAL → `/professional`
     - RECEPTIONIST → `/reception`
     - ADMIN → `/admin`

2. **Primeiro acesso (mustChangePassword = true):**
   - Redireciona para tela de alterar senha obrigatória
   - Não permite acesso ao sistema até alterar

3. **Tentativas de login falhadas:**
   - Após 5 tentativas: conta bloqueada por 15 minutos
   - Status: BLOCKED

---

## 🌐 Comportamentos e Interações

### Responsividade

**Breakpoints:**
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

**Adaptações Mobile:**
- Menu hamburger no header
- Formulários em coluna única
- Botões full-width
- Carrosséis com swipe
- Modais ocupam 100% da tela

### Acessibilidade

- Labels em todos os inputs
- Atributos ARIA apropriados
- Navegação por teclado (Tab, Enter, Esc)
- Contraste WCAG AA
- Focus visível em elementos interativos
- Mensagens de erro associadas aos campos (aria-describedby)

### Performance

- Lazy loading de imagens
- Minificação de assets
- Cache de recursos estáticos
- Otimização de fontes (woff2)

### Feedback Visual

**Loading States:**
- Spinners em botões durante requisições
- Skeleton screens em carregamento de conteúdo
- Progress bars em uploads

**Toasts/Notificações:**
- Sucesso: Verde, 3 segundos, auto-dismiss
- Erro: Vermelho, 5 segundos, dismissible
- Info: Azul, 3 segundos, auto-dismiss
- Warning: Amarelo, 4 segundos, dismissible

---

## 📝 Notas Finais para a IA

- Todos os textos devem estar em **português brasileiro**
- Use **placeholders realistas** e contextualizados
- Inclua **estados vazios** (empty states) quando aplicável
- Considere **dark mode** como feature futura (estruture para isso)
- Mantenha **consistência visual** entre todas as telas
- Priorize **usabilidade mobile** (touch targets mínimo 44x44px)
- Adicione **microinterações** sutis (hover, focus, transitions)

