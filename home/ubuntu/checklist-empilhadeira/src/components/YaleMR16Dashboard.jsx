import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, User, Calendar, Settings, RefreshCw, QrCode, Wrench, Zap, Droplets, Gauge, Shield, AlertCircle, Battery, Truck, Eye, BarChart3, FileText, Home, ChevronRight, Power, Thermometer, Volume2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// URL da API do Google Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbY0W_RTCE8TgxVxODNNZzY29zTMhP8KB-TDVHCTJecPZ2bdTOZD06Wyp7sDHd-CMYTZMA/exec';

const YaleMR16Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('hoje');
  
  // Estados para dados dinâmicos
  const [equipmentData, setEquipmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Função para buscar os dados da API
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Mapeia os dados da API para a estrutura esperada pelo dashboard
      const formattedData = {
        modelo: 'Yale MR16',
        numeroSerie: 'MR16-2024-001',
        horimetro: '2.847h',
        ultimaManutencao: '2025-06-15',
        proximaManutencao: '2025-08-15',
        status: data.ultimaVerificacao?.status === 'aprovado' ? 'operacional' : 'atencao',
        localizacao: 'Galpão A - Setor 3',
        operadorAtual: data.ultimaVerificacao?.operador || 'N/A',
        turnoAtual: 'Tarde',
        
        verificacaoAtual: {
          data: data.ultimaVerificacao?.data || new Date().toLocaleDateString('pt-BR'),
          hora: data.ultimaVerificacao?.hora || new Date().toLocaleTimeString('pt-BR'),
          operador: data.ultimaVerificacao?.operador || 'N/A',
          status: data.ultimaVerificacao?.status || 'pendente',
          tempoDecorrido: 185,
          itensVerificados: 24,
          itensConformes: Math.floor(24 * (data.ultimaVerificacao?.conformidade || 85) / 100),
          itensNaoConformes: Math.floor(24 * (100 - (data.ultimaVerificacao?.conformidade || 85)) / 100)
        },

        sistemasBateria: {
          nivelCarga: 78,
          voltagem: 24.2,
          temperatura: 32,
          tempoRestante: '4h 30min',
          ciclosCompletos: 1247,
          statusGeral: 'ok'
        },

        sistemasHidraulicos: {
          nivelOleo: 85,
          pressaoOperacao: 180,
          temperatura: 45,
          vazamentos: false,
          ultimaTroca: '2025-05-20',
          statusGeral: 'atencao'
        },

        problemasDetectados: generateProblemsFromData(data),

        historicoVerificacoes: data.historicoVerificacoes || [],

        graficoTempo: [
          { hora: '06:00', minutos: 0, bateria: 100, problemas: 0 },
          { hora: '08:00', minutos: 120, bateria: 85, problemas: 0 },
          { hora: '10:00', minutos: 240, bateria: 78, problemas: 1 },
          { hora: '12:00', minutos: 360, bateria: 65, problemas: 2 },
          { hora: '14:00', minutos: 480, bateria: 52, problemas: 3 },
          { hora: '16:00', minutos: 600, bateria: 38, problemas: 3 },
          { hora: '18:00', minutos: 720, bateria: 25, problemas: 4 }
        ],

        estatisticasGerais: {
          verificacoesHoje: data.historicoVerificacoes?.filter(v => 
            v.data === new Date().toLocaleDateString('pt-BR')
          ).length || 0,
          verificacoesSemana: data.historicoVerificacoes?.length || 0,
          tempoMedioVerificacao: '4:30',
          taxaConformidadeMedia: calculateAverageCompliance(data.historicoVerificacoes),
          horasOperacao: 2847,
          manutencoesPendentes: 2
        }
      };

      setEquipmentData(formattedData);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(`Falha ao carregar os dados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para gerar problemas baseados nos dados
  const generateProblemsFromData = (data) => {
    const problems = [];
    
    if (data.ultimaVerificacao?.conformidade < 90) {
      problems.push({
        id: 1,
        categoria: 'Hidráulico',
        item: 'Nível do óleo hidráulico',
        descricao: 'Nível abaixo do recomendado (85%)',
        prioridade: 'media',
        status: 'identificado',
        tipo: 'hidraulico',
        dataDeteccao: data.ultimaVerificacao?.data + ' ' + data.ultimaVerificacao?.hora,
        acao: 'Completar reservatório'
      });
    }

    if (data.ultimaVerificacao?.problemas > 2) {
      problems.push({
        id: 2,
        categoria: 'Elétrico',
        item: 'Luz de advertência intermitente',
        descricao: 'Sinal luminoso piscando irregularmente',
        prioridade: 'alta',
        status: 'critico',
        tipo: 'eletrico',
        dataDeteccao: data.ultimaVerificacao?.data + ' ' + data.ultimaVerificacao?.hora,
        acao: 'Verificar conexões elétricas'
      });
    }

    return problems;
  };

  // Função auxiliar para calcular conformidade média
  const calculateAverageCompliance = (historico) => {
    if (!historico || historico.length === 0) return 89;
    const total = historico.reduce((sum, item) => sum + (item.conformidade || 0), 0);
    return Math.round(total / historico.length);
  };

  useEffect(() => {
    fetchData(); // Busca os dados na primeira vez

    // Configura um intervalo para atualizar os dados a cada 30 segundos
    const intervalId = setInterval(fetchData, 30000); 

    // Limpa o intervalo quando o componente é desmontado
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'aprovado': case 'operacional': case 'ok': return 'text-green-600 bg-green-100';
      case 'reprovado': case 'critico': return 'text-red-600 bg-red-100';
      case 'pendente': case 'atencao': return 'text-yellow-600 bg-yellow-100';
      case 'manutencao': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProblemaIcon = (tipo) => {
    const baseClasses = "w-5 h-5";
    switch(tipo) {
      case 'hidraulico': return <Droplets className={`${baseClasses} text-blue-600`} />;
      case 'eletrico': return <Zap className={`${baseClasses} text-yellow-600`} />;
      case 'seguranca': return <Shield className={`${baseClasses} text-red-600`} />;
      case 'mecanico': return <Wrench className={`${baseClasses} text-gray-600`} />;
      default: return <AlertTriangle className={`${baseClasses} text-orange-600`} />;
    }
  };

  const navigationItems = [
    { id: 'overview', label: 'Visão Geral', icon: Home },
    { id: 'systems', label: 'Sistemas', icon: Settings },
    { id: 'problems', label: 'Problemas', icon: AlertTriangle },
    { id: 'history', label: 'Histórico', icon: BarChart3 },
    { id: 'checklist', label: 'Checklist', icon: FileText }
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];

  // Se estiver carregando, mostre uma mensagem
  if (loading && !equipmentData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <div className="text-lg font-semibold text-gray-900">Carregando dados...</div>
          <div className="text-sm text-gray-600">Conectando com o sistema</div>
        </div>
      </div>
    );
  }

  // Se der erro e não tiver dados, mostre a mensagem de erro
  if (error && !equipmentData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <div className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar dados</div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <button 
            onClick={fetchData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header do Equipamento */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{equipmentData.modelo}</h1>
              <p className="text-blue-100">Série: {equipmentData.numeroSerie}</p>
              <p className="text-blue-100">Localização: {equipmentData.localizacao}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-blue-100 text-sm">Horímetro</div>
            <div className="text-2xl font-bold">{equipmentData.horimetro}</div>
            <div className="text-blue-100 text-sm">Status: {equipmentData.status.toUpperCase()}</div>
          </div>
        </div>
      </div>

      {/* Cards de Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-500">Última Verificação</div>
              <div className="text-2xl font-bold text-gray-900">{equipmentData.verificacaoAtual.hora}</div>
              <div className="text-sm text-gray-600">{equipmentData.verificacaoAtual.operador}</div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-500">Nível Bateria</div>
              <div className="text-2xl font-bold text-gray-900">{equipmentData.sistemasBateria.nivelCarga}%</div>
              <div className="text-sm text-gray-600">{equipmentData.sistemasBateria.tempoRestante}</div>
            </div>
            <Battery className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-500">Problemas Ativos</div>
              <div className="text-2xl font-bold text-gray-900">{equipmentData.problemasDetectados.length}</div>
              <div className="text-sm text-gray-600">
                {equipmentData.problemasDetectados.filter(p => p.prioridade === 'alta').length} críticos
              </div>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-500">Conformidade</div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round((equipmentData.verificacaoAtual.itensConformes / equipmentData.verificacaoAtual.itensVerificados) * 100)}%
              </div>
              <div className="text-sm text-gray-600">
                {equipmentData.verificacaoAtual.itensConformes}/{equipmentData.verificacaoAtual.itensVerificados} itens
              </div>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Gráfico de Monitoramento */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monitoramento em Tempo Real</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={equipmentData.graficoTempo}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hora" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Line yAxisId="left" type="monotone" dataKey="bateria" stroke="#3b82f6" strokeWidth={2} name="Bateria (%)" />
            <Line yAxisId="right" type="monotone" dataKey="problemas" stroke="#ef4444" strokeWidth={2} name="Problemas" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderSystems = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Sistemas da Yale MR16</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sistema Elétrico/Bateria */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Battery className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Sistema Elétrico</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Nível de Carga</span>
              <span className="font-semibold text-gray-900">{equipmentData.sistemasBateria.nivelCarga}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${equipmentData.sistemasBateria.nivelCarga}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Voltagem:</span>
                <span className="font-medium ml-2">{equipmentData.sistemasBateria.voltagem}V</span>
              </div>
              <div>
                <span className="text-gray-500">Temperatura:</span>
                <span className="font-medium ml-2">{equipmentData.sistemasBateria.temperatura}°C</span>
              </div>
              <div>
                <span className="text-gray-500">Tempo Restante:</span>
                <span className="font-medium ml-2">{equipmentData.sistemasBateria.tempoRestante}</span>
              </div>
              <div>
                <span className="text-gray-500">Ciclos:</span>
                <span className="font-medium ml-2">{equipmentData.sistemasBateria.ciclosCompletos}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sistema Hidráulico */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Droplets className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Sistema Hidráulico</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Nível do Óleo</span>
              <span className="font-semibold text-gray-900">{equipmentData.sistemasHidraulicos.nivelOleo}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${equipmentData.sistemasHidraulicos.nivelOleo}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Pressão:</span>
                <span className="font-medium ml-2">{equipmentData.sistemasHidraulicos.pressaoOperacao} bar</span>
              </div>
              <div>
                <span className="text-gray-500">Temperatura:</span>
                <span className="font-medium ml-2">{equipmentData.sistemasHidraulicos.temperatura}°C</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Última Troca:</span>
                <span className="font-medium ml-2">{equipmentData.sistemasHidraulicos.ultimaTroca}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProblems = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Problemas Detectados</h2>
      
      {equipmentData.problemasDetectados.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum problema detectado</h3>
          <p className="text-gray-600">Todos os sistemas estão funcionando normalmente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {equipmentData.problemasDetectados.map((problema) => (
            <div key={problema.id} className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getProblemaIcon(problema.tipo)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{problema.item}</h3>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      problema.prioridade === 'alta' ? 'bg-red-100 text-red-800' :
                      problema.prioridade === 'media' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {problema.prioridade.toUpperCase()}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3">{problema.descricao}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Detectado em: {problema.dataDeteccao}
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      Ação: {problema.acao}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Histórico de Verificações</h2>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Verificações Recentes</h3>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="hoje">Hoje</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mês</option>
          </select>
        </div>
        
        {equipmentData.historicoVerificacoes.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma verificação encontrada</h3>
            <p className="text-gray-600">Aguardando dados do formulário.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {equipmentData.historicoVerificacoes.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">{item.data} - {item.hora}</div>
                    <div className="text-sm text-gray-600">{item.operador}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                    {item.status.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {item.conformidade}% conformidade
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderChecklist = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Checklist Yale MR16</h2>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <QrCode className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Acesso ao Formulário</h3>
              <p className="text-gray-600">Escaneie o QR Code para iniciar verificação</p>
            </div>
          </div>
          <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLSevPRYtrmmYy8nAPnOlU7QrYeYi5EaNBVCLJMnsQR8osavxXw/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Iniciar Verificação
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Itens Críticos</h4>
            <div className="space-y-2">
              {[
                'Nível de carga da bateria',
                'Sistema hidráulico',
                'Freios de serviço',
                'Luzes e sinalizações',
                'Garfos e proteção'
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Tempo Médio</h4>
            <div className="text-3xl font-bold text-blue-600">
              {equipmentData.estatisticasGerais.tempoMedioVerificacao}
            </div>
            <p className="text-gray-600">minutos por verificação</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeTab) {
      case 'overview': return renderOverview();
      case 'systems': return renderSystems();
      case 'problems': return renderProblems();
      case 'history': return renderHistory();
      case 'checklist': return renderChecklist();
      default: return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Yale MR16 Dashboard</h1>
                <p className="text-gray-600">Sistema de Monitoramento</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Atualizado:</div>
                <div className="font-semibold text-gray-900">{formatTime(currentTime)}</div>
                {lastUpdate && (
                  <div className="text-xs text-gray-400">
                    Dados: {lastUpdate.toLocaleTimeString('pt-BR')}
                  </div>
                )}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(equipmentData?.status || 'pendente')}`}>
                {(equipmentData?.status || 'PENDENTE').toUpperCase()}
              </div>
              {error && (
                <div className="text-xs text-red-500 max-w-xs truncate" title={error}>
                  ⚠️ {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex space-x-6">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-white rounded-lg shadow-sm p-4">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YaleMR16Dashboard;

