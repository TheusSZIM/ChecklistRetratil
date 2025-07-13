# 🚛 Dashboard Yale MR16 - Sistema de Checklist Dinâmico

Um sistema completo de monitoramento de empilhadeiras em tempo real, integrando Google Forms, Google Sheets, Google Apps Script e React.

## 🎯 Funcionalidades

- ✅ **Dashboard em tempo real** com dados atualizados automaticamente
- 📊 **Visualizações interativas** de status e métricas
- 📱 **Interface responsiva** para desktop e mobile
- 🔄 **Sincronização automática** com Google Sheets
- ⚡ **Performance otimizada** com React e Vite
- 🎨 **Design moderno** com Tailwind CSS

## 🏗️ Tecnologias

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Gráficos**: Recharts
- **Ícones**: Lucide React
- **Backend**: Google Apps Script
- **Banco de Dados**: Google Sheets
- **Hospedagem**: Vercel/Netlify (gratuita)

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+ instalado
- Conta Google (para Apps Script e Sheets)
- Formulário Google configurado

### Instalação

1. **Clone o repositório**
```bash
git clone <seu-repositorio>
cd checklist-empilhadeira
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure a API**
   - Abra `src/components/YaleMR16Dashboard.jsx`
   - Substitua `API_URL` pela URL do seu Google Apps Script

4. **Execute localmente**
```bash
npm run dev
```

5. **Build para produção**
```bash
npm run build
```

## ⚙️ Configuração

### Google Apps Script

1. Acesse sua planilha do Google Sheets
2. Vá em `Extensões` > `Apps Script`
3. Cole o código do arquivo `google-apps-script.js`
4. Implante como "App da Web" com acesso público
5. Copie a URL gerada

### Estrutura da Planilha

Certifique-se de que sua planilha tenha as seguintes colunas (adapte conforme necessário):

- `Carimbo de data/hora`
- `Operador` ou `Nome do Operador`
- `Status Geral da Empilhadeira`
- Outras colunas de verificação...

## 📊 Funcionalidades do Dashboard

### Visão Geral
- Status atual da empilhadeira
- Última verificação realizada
- Nível de bateria simulado
- Problemas ativos
- Taxa de conformidade

### Sistemas
- Monitoramento elétrico/bateria
- Status hidráulico
- Indicadores visuais

### Problemas
- Lista de problemas detectados
- Priorização por criticidade
- Ações recomendadas

### Histórico
- Verificações recentes
- Filtros por período
- Métricas de conformidade

### Checklist
- Link para formulário
- Estatísticas de tempo
- QR Code para acesso mobile

## 🔧 Personalização

### Adaptando para seus dados

1. **Modifique as funções no Apps Script**:
   - `calculateCompliance()`: Lógica de conformidade
   - `countProblems()`: Detecção de problemas
   - `formatLastCheck()`: Formatação dos dados

2. **Ajuste o Dashboard React**:
   - Campos exibidos
   - Cores e estilos
   - Métricas calculadas

### Adicionando novos campos

1. **No Apps Script**: Inclua novos campos na função `formatLastCheck()`
2. **No React**: Adicione a exibição dos novos dados no dashboard

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório GitHub à Vercel
2. Configure o projeto como React
3. Deploy automático a cada push

### Netlify

1. Faça build local: `npm run build`
2. Arraste a pasta `dist` para o Netlify
3. Ou conecte com Git para deploy automático

## 🔍 Troubleshooting

### Erro "Failed to fetch"
- Verifique se o Apps Script foi implantado corretamente
- Confirme que o acesso está como "Qualquer pessoa"
- Teste a URL da API diretamente no navegador

### Dados não aparecem
- Verifique o nome da aba no `SHEET_NAME`
- Confirme a estrutura das colunas
- Execute a função `testarScript()` no Apps Script

### Problemas de CORS
- O Google Apps Script resolve automaticamente
- Certifique-se de que a URL está correta

## 📱 Uso Mobile

O dashboard é totalmente responsivo:
- Interface adaptada para touch
- Navegação otimizada para mobile
- Pode ser "instalado" como PWA

## 🔐 Segurança

- ✅ API protegida via Google Apps Script
- ✅ Comunicação HTTPS
- ✅ Dados privados no Google Sheets
- ✅ Sem exposição de credenciais

## 📈 Roadmap

- [ ] Notificações push para problemas críticos
- [ ] Relatórios PDF automáticos
- [ ] Suporte multi-equipamentos
- [ ] Sistema de usuários e permissões
- [ ] Integração com WhatsApp Business
- [ ] Dashboard gerencial consolidado

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação completa em `GUIA_COMPLETO.md`
2. Verifique os logs do Apps Script
3. Teste a API diretamente
4. Abra uma issue no GitHub

---

**Desenvolvido com ❤️ para otimizar a gestão de empilhadeiras**

