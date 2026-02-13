# 🎨 Prompts para Geração de Telas - Sistema Minha Clínica

**Use estes prompts no Midjourney, DALL-E 3, Figma AI, ou v0.dev para gerar as interfaces**

---

## 🎨 ESTILO GERAL

**Paleta de Cores:**
- Primário: Azul #3B82F6
- Secundário: Verde #10B981
- Fundo: Cinza claro #F9FAFB
- Texto: Cinza escuro #111827
- Cards: Branco com sombra suave

**Tipografia:** Inter ou SF Pro

**Estilo:** Moderno, clean, minimalista, profissional para área da saúde

---

## TELA 1: LOGIN

```
Create a modern login screen for a healthcare clinic management system.

Layout:
- Full screen with gradient background (blue #3B82F6 to dark blue #1E40AF)
- White centered card with soft shadow (max-width 480px)
- Rounded corners on card

Header:
- Large hospital emoji or medical cross icon (🏥)
- Title "Minha Clínica" in bold blue text
- Subtitle "Bem-vindo de volta" centered

Form Elements:
- Email input with envelope icon on the left
- Password input with lock icon on the left, eye icon on the right to toggle visibility
- Both inputs have light gray background, rounded corners
- Error states shown in red below inputs

Below inputs:
- Left: Checkbox "Lembrar-me" (Remember me)
- Right: Blue link "Esqueci minha senha" (Forgot password)

Button:
- Large blue button "Entrar" (Login) full width
- Slightly darker on hover
- Loading spinner inside when active

Footer:
- Small text "Não tem conta? Cadastre-se" with blue link

Style: Clean, modern, professional, healthcare-focused UI design
```

---

## TELA 2: REGISTRO DE PACIENTE - ETAPA 1

```
Create a patient registration screen (Step 1 of 3) for a clinic management system.

Layout:
- White background
- Horizontal stepper at top showing: 1. Início (active/blue) → 2. Verificação (gray) → 3. Completar (gray)
- Progress bar below stepper (33% filled in blue)
- Centered card with form (max-width 600px)

Card Header:
- Title "Cadastro de Paciente"
- Subtitle "Passo 1: Informações Iniciais"

Form:
- Dropdown/Select "Selecione sua clínica" with chevron down icon
- Input "Nome completo" with user icon
- Input "Email" with envelope icon
- All inputs with light gray background, rounded corners

Button:
- Large blue button "Continuar" at bottom
- Arrow right icon inside

Footer:
- "Já tem conta? Faça login" with blue link

Style: Modern, clean, step-by-step wizard interface
```

---

## TELA 3: REGISTRO - ETAPA 2 (VERIFICAÇÃO EMAIL)

```
Create an email verification waiting screen (Step 2 of 3) for patient registration.

Layout:
- White centered content (max-width 500px)
- Vertical layout

Stepper:
- Step 1 completed (green checkmark)
- Step 2 active (blue)
- Step 3 inactive (gray)
- Progress bar 66% filled

Content:
- Large illustration: Email envelope with checkmark floating above it
- Icon in blue and green colors
- Title "Verifique seu email"
- Text "Enviamos um link de verificação para"
- Email address shown in bold: "usuario@email.com"
- Subtitle "Clique no link para continuar seu cadastro"

Info box:
- Light blue background
- Info icon
- Text "Não recebeu? Verifique spam ou reenvie em 60s"

Button:
- Outline blue button "Reenviar email"

Style: Waiting state, informative, friendly design with illustration
```

---

## TELA 4: REGISTRO - ETAPA 3 (COMPLETAR DADOS)

```
Create a comprehensive patient data completion screen (Step 3 of 3).

Layout:
- Full width form with tabs
- Stepper showing Step 3 active (100% progress)

Tab Navigation:
- 3 tabs horizontally: "Dados Pessoais" (active/blue) | "Endereço" | "Informações Médicas"
- Active tab has blue underline

Form Section - Dados Pessoais:
- Two columns on desktop, single column on mobile
- CPF input with mask "000.000.000-00"
- Telefone with mask "(00) 00000-0000"
- Senha with strength indicator bar below (weak/medium/strong colors)
- Confirmar senha
- Data de nascimento with calendar icon
- Gênero with 4 styled radio buttons: Masculino, Feminino, Outro, Prefiro não dizer

All inputs:
- Icons on left
- Light background
- Validation messages in red/green

Bottom:
- Full width blue button "Concluir Cadastro"
- Success checkmark icon

Style: Professional form, well-organized, clear visual hierarchy
```

---

## TELA 5: DASHBOARD ADMIN

```
Create a modern admin dashboard for a clinic management system.

Layout Structure:

LEFT SIDEBAR (fixed, dark slate #1F2937):
- Logo "🏥 Minha Clínica" at top
- Navigation menu items with icons:
  * 📊 Dashboard (active/highlighted)
  * 👥 Usuários
  * 👨‍⚕️ Profissionais
  * 🏥 Pacientes
  * 📅 Agendamentos
  * ⚙️ Configurações
- User section at bottom:
  * Avatar circle
  * Name "Dr. João Silva"
  * Role "Administrador"
  * Logout icon

TOP HEADER (white with shadow):
- Breadcrumb: Home > Dashboard
- Search bar with magnifying glass icon
- Notification bell with red badge "3"
- User avatar dropdown

MAIN CONTENT (light gray background):
- 4 Statistics Cards in grid:
  1. Total Pacientes: "1,247" with user group icon (blue)
  2. Agendamentos Hoje: "32" with calendar icon (green)
  3. Profissionais Ativos: "15" with stethoscope icon (purple)
  4. Receita do Mês: "R$ 45.890" with money icon (orange)
  
Each card: White, rounded, shadow, icon on left, number in large font, growth percentage in green/red

- Line chart showing "Agendamentos - Últimos 7 dias" (blue line)
- Table "Últimos Agendamentos" with columns: Paciente, Profissional, Data/Hora, Status (colored badges)

Style: Professional, data-rich, clean administrative interface
```

---

## TELA 6: LISTAGEM DE USUÁRIOS

```
Create a user management list screen for clinic admin.

Header Section:
- Title "Gestão de Usuários" with user icon
- Right side: Blue "+ Convidar" button with dropdown (Profissional/Recepcionista)

Filter Bar:
- Search input with magnifying glass icon (placeholder: "Buscar por nome ou email")
- Dropdown filters:
  * Role: Todos | Admin | Profissional | Recepcionista | Paciente
  * Status: Todos | Ativo | Inativo

Table:
Columns: Avatar | Nome | Email | Role (badge) | Status (badge) | Último Login | Ações

Sample rows showing:
- Circular avatar photos
- Name: "Dr. João Silva"
- Email: "joao@clinic.com"
- Role badges (colored):
  * ADMIN: Purple badge
  * PROFESSIONAL: Green badge
  * RECEPTIONIST: Blue badge
  * PATIENT: Gray badge
- Status: "Ativo" green badge or "Inativo" gray badge
- Date: "Há 2 horas"
- Actions: Three dot menu (View, Edit, Deactivate, Delete)

Pagination:
- Bottom center: Page 1 of 5, Previous/Next buttons

Empty State (if no data):
- Large icon
- "Nenhum usuário encontrado"
- "Ajuste os filtros ou convide novos usuários"

Style: Data table, professional, clear hierarchy, interactive elements
```

---

## TELA 7: PORTAL DO PACIENTE

```
Create a simple, patient-friendly portal dashboard.

Layout:
- Minimal header: Logo + Patient name "Maria Silva" + Logout
- Clean white background

Main Content (centered, max-width 900px):
- Welcome message: "Olá, Maria! 👋"
- Subtitle: "Gerencie seus agendamentos e informações"

4 Large Action Cards (2x2 grid):

1. "Meus Agendamentos" card:
   - Calendar icon (blue)
   - "2 consultas agendadas"
   - Preview of next appointment
   - "Ver todos" link

2. "Novo Agendamento" card:
   - Plus icon (green)
   - "Agendar Consulta"
   - Large call-to-action style
   - Highlighted/accented

3. "Meu Histórico" card:
   - Clock icon (purple)
   - "15 consultas realizadas"
   - "Ver histórico" link

4. "Meus Dados" card:
   - User icon (orange)
   - "Informações pessoais"
   - "Editar perfil" link

Each card:
- White background
- Large rounded corners
- Soft shadow
- Hover effect (lift slightly)
- Icon at top, colored
- Text centered

Style: Simple, friendly, large touch targets, patient-focused, calming colors (soft blues/greens)
```

---

## TELA 8: MODAL DE CONVITE (PROFISSIONAL)

```
Create a modal overlay for inviting a healthcare professional.

Layout:
- Dark overlay background (semi-transparent black)
- White centered modal (max-width 500px)
- Rounded corners, large shadow

Modal Header:
- Title "Convidar Profissional"
- X close button (top right)
- Subtitle "Enviaremos um convite por email"

Form:
- Input "Nome completo" with user icon
- Input "Email profissional" with envelope icon
- Dropdown "Tipo" with options: Médico, Dentista, Fisioterapeuta, etc.
- Light blue info box: "O profissional receberá um email para completar o cadastro"

Footer:
- Two buttons side by side:
  * Left: "Cancelar" (outline gray)
  * Right: "Enviar Convite" (solid green)

Style: Modal dialog, clear hierarchy, professional form design
```

---

## TELA 9: MOBILE - LOGIN (RESPONSIVO)

```
Create a mobile version (375px width) of the login screen.

Layout:
- Full screen gradient background (blue)
- Slightly smaller centered card
- Reduced padding

Elements stack vertically:
- Logo icon smaller
- Title and subtitle
- Inputs full width, slightly taller for touch
- Checkbox and link stack vertically (not side by side)
- Large touch-friendly login button
- Register link at bottom

Style: Mobile-optimized, touch-friendly, maintains brand identity
```

---

## TELA 10: TOAST NOTIFICATIONS

```
Create toast notification examples (top-right corner).

Show 4 variants stacked:

1. Success (green):
   - Green checkmark icon
   - "Cadastro realizado com sucesso!"
   - X close button
   - Progress bar at bottom (animating)

2. Error (red):
   - Red X icon
   - "Email ou senha incorretos"
   - Close button

3. Warning (yellow):
   - Warning triangle icon
   - "Seu token expira em 5 minutos"
   - Close button

4. Info (blue):
   - Info circle icon
   - "Email de verificação enviado"
   - Close button

Each toast:
- White background
- Rounded corners
- Shadow
- Icon colored on left
- Text in center
- Close button on right
- Smooth slide-in animation

Style: Notification system, clear visual feedback, accessible
```

---

## 🎯 INSTRUÇÕES DE USO

**Para Midjourney/DALL-E:**
Copie cada prompt individualmente e adicione ao final:
```
, modern UI design, figma style, clean interface, 4k, high quality
```

**Para Figma AI / v0.dev:**
Use os prompts CONDENSADOS abaixo (máximo 5000 caracteres)

**Para modificações:**
- Ajuste cores mencionando o código hexadecimal
- Altere proporções especificando tamanhos
- Mude layout de "centered" para "full-width" conforme necessário

---

## 📱 PROMPTS CONDENSADOS PARA FIGMA (copiar e colar direto)

**TELA 1: LOGIN**
Login clinic system. Gradient blue bg (#3B82F6-#1E40AF). White card 480px center, rounded, shadow. 🏥 icon, "Minha Clínica" blue title, "Bem-vindo de volta" subtitle. Email input envelope icon, Password input lock+eye toggle, gray bg rounded. "Lembrar-me" checkbox, "Esqueci senha" blue link. Blue "Entrar" button full width spinner. "Não tem conta? Cadastre-se" link. Professional healthcare UI.

**TELA 2: REGISTRO ETAPA 1**
Registration 1/3. White bg. Stepper: 1.Início(blue)→2.Verificação(gray)→3.Completar(gray), 33% progress blue. Card 600px: "Cadastro Paciente" title. Form: "Selecione clínica" dropdown, "Nome" user icon, "Email" envelope icon, gray bg rounded. Blue "Continuar" button arrow. "Já tem conta? Login" link. Wizard interface.

**TELA 3: VERIFICAÇÃO EMAIL**
Verification 2/3. White 500px center. Stepper: 1 green✓, 2 blue, 3 gray, 66%. Email envelope illustration blue/green+checkmark. "Verifique email" title, "Enviamos link usuario@email.com" bold. Light blue box: info icon "Não recebeu? Spam/reenvie 60s". Blue "Reenviar" outline button. Friendly design.

**TELA 4: COMPLETAR DADOS**
Registration 3/3. Tabs: Dados Pessoais(blue)|Endereço|Info Médicas, 100%. Form 2col desktop 1col mobile: CPF 000.000.000-00, Tel (00)00000-0000, Senha+strength bar colors, Confirmar, Data calendar, Gênero 4 radios. Icons left, gray bg, validation red/green. Blue "Concluir" button checkmark. Professional form.

**TELA 5: DASHBOARD**
Admin dash. SIDEBAR #1F2937: 🏥logo, 📊Dashboard(active)|👥Usuários|👨‍⚕️Prof|🏥Pac|📅Agend|⚙️Config, avatar "Dr.João" "Admin" logout. HEADER white: breadcrumb, search, bell"3", avatar. MAIN gray: 4 cards "1,247 Pac"blue|"32 Agend"green|"15 Prof"purple|"R$45k"orange. Chart "Agend 7d" blue line. Table "Últimos" cols: Pac|Prof|Data|Status badges. Professional.

**TELA 6: USUÁRIOS**
User mgmt. Header: "Gestão Usuários", blue "+ Convidar" dropdown Prof/Recep. Filters: search "Buscar", Role(Todos|Admin|Prof|Recep|Pac), Status(Ativo|Inativo). Table: Avatar|Nome|Email|Role badge(ADMIN purple|PROF green|RECEP blue|PAC gray)|Status(Ativo green|Inativo gray)|Login|Ações⋮. Pagination 1/5. Empty: "Nenhum usuário". Professional table.

**TELA 7: PORTAL PACIENTE**
Patient portal. Header: Logo+"Maria Silva"+Logout. White bg. Center 900px: "Olá Maria!👋", "Gerencie agendamentos". 4 cards 2x2: 1)Agendamentos calendar blue "2 consultas" link, 2)Novo plus green "Agendar" CTA, 3)Histórico clock purple "15 consultas", 4)Dados user orange "Info pessoais". White rounded shadow hover. Friendly soft blues/greens.

**TELA 8: MODAL CONVITE**
Invite modal. Dark overlay. White modal 500px rounded shadow. "Convidar Profissional" X close. Form: Nome user icon, Email envelope, Tipo dropdown Médico|Dentista|Fisio. Blue box "Receberá email". Buttons: "Cancelar" gray outline, "Enviar" green. Professional.

**TELA 9: MOBILE LOGIN**
Mobile 375px. Gradient blue bg. Small card padding. Vertical: logo, title, inputs full width tall, checkbox+link stacked, "Entrar" button, register link. Touch-friendly.

**TELA 10: TOASTS**
Toasts top-right. 4 types: 1)Success green✓ "Cadastro sucesso!" X progress bar, 2)Error red✗ "Email incorreto", 3)Warning yellow⚠ "Token expira 5min", 4)Info blue🛈 "Email enviado". White rounded shadow icon left, close right, slide-in. Accessible.

---

**Gerado para o projeto Minha Clínica API**  
**Data: 9 de fevereiro de 2026**
