/**
 * i18n/pt-BR.js — Portuguese (Brazil) strings
 */
export default {
  // ── Login screen ─────────────────────────────────────────────────────────
  login: {
    subtitle:        'Digite seu nome para começar',
    namePlaceholder: 'Seu nome',
    codePlaceholder: 'Código de pesquisa (opcional)',
    codeHint:        'Opcional — fornecido pela sua equipe de pesquisa',
    cta:             'Vamos lá',
    errorName:       'Por favor, digite seu nome para continuar.',
  },

  // ── Home screen ───────────────────────────────────────────────────────────
  home: {
    welcome:          'Bem-vindo(a),',
    profile:          'Perfil',
    newEntry:         'Novo Registro',
    instructionsTitle:'Instruções',
    instructionsBody: 'Clique aqui para saber mais sobre os diários de sono e informações adicionais.',
    entriesNeeded_one:   'Falta {{count}} registro',
    entriesNeeded_other: 'Faltam {{count}} registros',
  },

  // ── Entry tab ─────────────────────────────────────────────────────────────
  entry: {
    daysInStudy: 'Dias no estudo',
    statsUnlock: 'As estatísticas desbloqueiam após mais {{count}} registros matinais',
    a11y: {
      morningStart:     'Iniciar registro matinal',
      morningCompleted: 'Registro matinal concluído. Toque para editar.',
      eveningStart:     'Iniciar registro noturno',
      eveningCompleted: 'Registro noturno concluído. Toque para editar.',
      eveningLocked:    'Registro noturno bloqueado. Conclua o registro matinal primeiro.',
    },
  },

  // ── Profile modal ─────────────────────────────────────────────────────────
  profile: {
    title:           'Perfil',
    tapToSetName:    'Toque para definir seu nome',
    addResearchCode: 'Adicionar código de pesquisa',
    researchCodePlaceholder: 'Código de pesquisa',

    sectionSummary:  'Resumo',
    statMorning:     'Registros matinais',
    statEvening:     'Registros noturnos',
    statStreak:      'Sequência atual',
    statStreakUnit:  'dias',
    statSince:       'Membro desde',
    statQuestionnaires: 'Questionários',
    statMedications:    'Medicamentos',
    noEntries:       'Nenhum registro ainda',

    sectionGlossary: 'Métricas do sono explicadas',
    glossary: {
      sleepDuration: {
        title: 'Duração do Sono',
        body:  'O tempo total que você ficou dormindo. A maioria dos adultos precisa de 7 a 9 horas por noite.',
      },
      sleepEfficiency: {
        title: 'Eficiência do Sono',
        body:  'A porcentagem do tempo na cama em que você estava realmente dormindo. Uma pontuação de 85% ou mais é considerada saudável — quanto maior, melhor.',
      },
      sleepOnsetLatency: {
        title: 'Latência do Início do Sono',
        body:  'Quanto tempo você levou para adormecer depois de deitar. Adormecer em até 30 minutos é o habitual.',
      },
      waso: {
        title: 'Vigília Após o Início do Sono (WASO)',
        body:  'O tempo total que você ficou acordado(a) depois de adormecer pela primeira vez e antes de se levantar. Quanto menor, melhor.',
      },
      nightWakings: {
        title: 'Despertares Noturnos',
        body:  'O número de vezes que você acordou durante a noite. Despertares breves e ocasionais são normais, mas interrupções frequentes podem prejudicar a qualidade do sono.',
      },
      sleepQuality: {
        title: 'Qualidade do Sono',
        body:  'Sua avaliação de como você dormiu, em uma escala de 1 a 5. Captura a sensação geral da noite além do que os números sozinhos conseguem mostrar.',
      },
      restedness: {
        title: 'Sensação de Descanso',
        body:  'O quanto você se sentiu revigorado(a) ao acordar, em uma escala de 1 a 5. Reflete se o sono foi reparador, mesmo quando a duração e a eficiência parecem boas.',
      },
      earlyWaking: {
        title: 'Despertar Precoce',
        body:  'A proporção de noites em que você acordou mais cedo do que pretendia e não conseguiu voltar a dormir. Pode ser sinal de sono perturbado ou exposição à luz de manhã cedo.',
      },
    },

    sectionActions:     'Ações rápidas',
    replayInstructions: 'Rever instruções',
    website:            'circadia-lab.uk',
  },

  // ── Past entries screen ───────────────────────────────────────────────────
  pastEntries: {
    title:         'Registros Anteriores',
    morningEntry:  'Registro Matinal',
    eveningEntry:  'Registro Noturno',
    emptyTitle:    'Nenhum registro ainda',
    emptySubtitle: 'Complete seu primeiro registro matinal ou noturno para vê-lo aqui.',
    answerNone:    'Nenhum registrado',
    answerYes:     'Sim',
    answerNo:      'Não',
  },

  // ── Export / import screen ────────────────────────────────────────────────
  export: {
    title:               'Exportar Dados',
    infoText:            'Exporte todos os seus registros do diário de sono e resultados de questionários para compartilhar com um pesquisador ou importar para uma planilha.',
    csvTitle:            'Exportar como CSV',
    csvSubtitle:         'Uma linha por registro. Abre no Excel, Numbers ou qualquer aplicativo de planilha.',
    jsonTitle:           'Exportar como JSON',
    jsonSubtitle:        'Dados completos e estruturados, incluindo todas as respostas. Ideal para scripts de análise.',
    importTitle:         'Importar de JSON',
    importSubtitle:      'Restaure registros a partir de um arquivo JSON exportado anteriormente pelo Sleep Diaries.',
    note:                'Seus dados ficam sempre no seu dispositivo. A exportação os compartilha apenas com o aplicativo que você escolher.',
    noDataTitle:         'Sem dados',
    noDataBody:          'Complete pelo menos um registro antes de exportar.',
    exportFailTitle:     'Falha na exportação',
    importFailTitle:     'Falha na importação',
    existingDataTitle:   'Dados existentes encontrados',
    existingDataBody_one:   'Você já tem {{count}} registro. O que deseja fazer?',
    existingDataBody_other: 'Você já tem {{count}} registros. O que deseja fazer?',
    cancel:              'Cancelar',
    merge:               'Mesclar',
    replace:             'Substituir',
    replaceConfirmTitle: 'Substituir todos os dados?',
    replaceConfirmBody:  'Isso vai excluir permanentemente todos os seus registros existentes. Essa ação não pode ser desfeita.',
  },

  // ── Final report ──────────────────────────────────────────────────────────
  report: {
    title:               'Relatório Final',
    notEnoughTitle:      'Dados insuficientes',
    notEnoughSubtitle:   'Complete pelo menos {{count}} registros matinais para gerar seu relatório.',
    morningEntries_one:   '{{count}} registro matinal',
    morningEntries_other: '{{count}} registros matinais',
    sleepTiming:         'Horários do sono',
    sleepQuality:        'Qualidade do sono',
    nightDisruptions:    'Perturbações noturnas',
    lifestyle:           'Fatores de estilo de vida',
    avgSleepDuration:    'Duração média do sono',
    avgSleepDurationSub: 'Tempo total de sono por noite',
    sleepEfficiency:     'Eficiência do sono',
    sleepEfficiencySub:  'Tempo dormindo ÷ tempo na cama',
    efficiencyGood:      '✓ Meta atingida',
    efficiencyLow:       '↓ Abaixo da meta',
    sleepOnsetLatency:   'Latência do início do sono',
    sleepOnsetLatencySub:'Tempo médio para adormecer',
    waso:                'Vigília após o início do sono',
    wasoSub:             'Tempo médio acordado durante a noite',
    avgNightWakings:     'Despertares noturnos médios',
    avgNightWakingsSub:  'Média por noite',
    earlyWaking:         'Despertar precoce',
    earlyWakingSub:      'Acordou mais cedo do que o planejado',
    avgAlcohol:          'Consumo médio de álcool',
    avgAlcoholSub:       'Média de doses relatadas na noite anterior',
    alcoholNote:         'Codificado por cores com base nas diretrizes do NHS (UK Chief Medical Officers, 2016): verde <1 dose/noite, âmbar 1–2, vermelho >2. O NHS recomenda no máximo 14 unidades por semana para homens e mulheres, distribuídas em 3 ou mais dias. Se tiver dúvidas sobre o seu consumo de álcool, consulte um profissional de saúde.',
    nightQuality:        'Qualidade do sono',
    morningRestedness:   'Sensação de descanso ao acordar',
    ofNights:            '% das noites',
    drinksNight:         'doses/noite',
    times:               'vezes',
    disclaimer:          'Este relatório é gerado a partir de dados autorrelatados do diário e resultados de questionários pontuais. Tem a finalidade de ser um resumo de pesquisa e não um diagnóstico clínico.',
    thresholdNote:        'Os limites de referência apresentados são médias populacionais gerais e podem variar conforme idade, sexo e fatores de saúde individuais. Consulte um profissional de saúde se tiver dúvidas sobre o seu sono.',
    questionnaireOne:   'questionário',
    questionnaireOther:  'questionários',
    eveningEntries:      'registros noturnos',
    sectionQuestionnaires: 'Resultados dos questionários',
    shareHeader:         'Sleep Diaries — Relatório Final',
    shareParticipant:    'Participante:',
    sharePeriod:         'Período:',
    shareEntries:        'Registros:',
    shareAvgDuration:    'Duração média do sono:',
    shareAvgEfficiency:  'Eficiência média do sono:',
    shareAvgSOL:         'Latência média do início do sono:',
    shareAvgWASO:        'Vigília média após início do sono:',
    shareAvgWakings:     'Despertares noturnos médios:',
    shareAvgQuality:     'Qualidade média do sono:',
    shareAvgRestedness:  'Sensação média de descanso:',
    shareEarlyWaking:    'Despertar precoce:',
  },

  // ── Settings screen ───────────────────────────────────────────────────────
  settings: {
    title:                'Configurações',
    sectionAccessibility: 'Acessibilidade',
    biggerText:           'Texto maior',
    sectionLanguage:      'Idioma',
    chooseLanguage:       'Escolher idioma',
    sectionNotifications: 'Notificações',
    dailyReminders:       'Lembretes diários',
    notificationsHint:    'Lembrete matinal às 8h e lembrete noturno às 21h todos os dias.',
    permissionTitle:      'Permissão necessária',
    permissionBody:       'Por favor, ative as notificações para o Sleep Diaries nas Configurações do seu dispositivo.',
    remindersSetTitle:    'Lembretes ativados',
    remindersSetBody:     'Você vai receber um lembrete matinal às 8h e um noturno às 21h todos os dias.',
    sendTestNotif:        'Enviar notificação de teste',
    ok:                   'OK',
    sectionTTS:           'Texto para fala',
    ttsLabel:             'Texto para fala',
    ttsHint:              'Ler as perguntas em voz alta pelo alto-falante.',
    sectionData:          'Dados',
    exportData:           'Exportar dados',
    exportDataHint:       'Exporte seus registros como CSV ou JSON para uso em pesquisa.',
    sectionQuestionnaires: 'Créditos dos questionários',
    sectionThresholds:       'Limiares das métricas do sono',
    thresholdsNote:          'Os limiares de referência abaixo são utilizados para a codificação por cores das métricas no relatório final. Representam médias populacionais gerais e podem variar conforme idade, sexo e fatores de saúde individuais.',
    thresholdDuration:       'Duração do Sono',
    thresholdDurationRef:    'National Sleep Foundation: 7–9 horas recomendadas para adultos. Hirshkowitz et al. (2015). Sleep Health, 1(1), 40–43.',
    thresholdEfficiency:     'Eficiência do Sono',
    thresholdEfficiencyRef:  'Morin, C. M. (1993). Insomnia: Psychological assessment and management. Guilford Press. ≥85% considerado saudável.',
    thresholdLatency:        'Latência do Início do Sono',
    thresholdLatencyRef:     'Ohayon et al. (2017). Sleep Medicine Reviews, 34, 14–31. ≤15 min normal; >30 min clinicamente significativo.',
    thresholdWaso:           'Vigília Após o Início do Sono',
    thresholdWasoRef:        'Ohayon et al. (2017). Sleep Medicine Reviews, 34, 14–31. ≤20 min normal; >30 min clinicamente significativo.',
    thresholdAlcohol:        'Consumo de Álcool',
    thresholdAlcoholRef:     'Diretrizes de Baixo Risco para Consumo de Álcool dos Chief Medical Officers do Reino Unido (2016). No máximo 14 unidades por semana, equivalente a ≤2 doses por noite em média.',
    questionnairesNote:    'Os seguintes instrumentos validados são utilizados neste aplicativo. Certifique-se de que possui as permissões adequadas antes de usá-los em pesquisa ou prática clínica.',
    sectionAbout:         'Sobre',
    aboutDesign:          'Design',
    sectionAccount:       'Conta',
    logOut:               'Sair',
    logOutTitle:          'Sair',
    logOutBody:           'Tem certeza que quer sair?',
    cancel:               'Cancelar',
    deleteAccount:        'Excluir conta',
    deleteAccountTitle:   'Excluir conta',
    deleteAccountBody:    'Isso vai excluir permanentemente sua conta e todos os dados. Tem certeza?',
    delete:               'Excluir',
  },

  // ── Instructions slideshow ────────────────────────────────────────────────
  instructions: {
    close:      'Fechar',
    getStarted: 'Começar',
    back:       'Voltar',
    next:       'Próximo',
    slides: [
      {
        title: 'O que é um Diário de Sono?',
        body:  'Um diário de sono é desenvolvido para recolher informações sobre seus padrões diários de sono.',
      },
      {
        title: 'Com que frequência e quando devo preencher o diário de sono?',
        body:  'É necessário preencher o diário de sono todos os dias (uma vez ao acordar, uma vez antes de dormir). Se possível, o diário deve ser preenchido até uma hora após se levantar pela manhã. As perguntas noturnas podem ser respondidas antes de dormir.',
      },
      {
        title: 'O que devo fazer se não preencher o diário num dia?',
        body:  'Se esquecer de preencher o diário ou não conseguir terminá-lo, deixe-o em branco para esse dia.',
      },
      {
        title: 'E se algo incomum afetar o meu sono ou como me sinto durante o dia?',
        body:  'Se o seu sono ou funcionamento diurno for afetado por algum acontecimento incomum (como uma doença ou emergência), você pode fazer breves anotações no diário.',
      },
      {
        title: 'O que significam as palavras "cama" e "dia" no diário?',
        body:  'Este diário pode ser utilizado por pessoas que estão acordadas ou dormindo em horários incomuns. No diário de sono, "dia" é o momento em que você opta ou é obrigado a estar acordado. O termo "cama" refere-se ao lugar onde você normalmente dorme.',
      },
      {
        title: 'Responder a estas perguntas sobre o meu sono vai me manter acordado?',
        body:  'Isso geralmente não é um problema. Não se preocupe em fornecer horários exatos e não fique olhando para o relógio. Dê apenas a sua melhor estimativa.',
      },
      {
        title: 'Instale o Sleep Diaries no seu dispositivo',
        body:  'No iPhone: abra esta página no Safari, toque no botão Compartilhar ↑ e escolha Adicionar à Tela de Início.\n\nNo Android: abra no Chrome, toque no menu (⋮) e escolha Adicionar à tela inicial.\n\nApós instalar, o app funciona em tela cheia e offline — como um app nativo.',
      },
    ],
  },

  // ── Questionário diário (fluxo de registro) ─────────────────────────────
  questionnaire: {
    back:               'Voltar',
    next:               'Próximo',
    yes:                'Sim',
    no:                 'Não',
    addMedicine:        'Adicionar Medicamento',
    addNewTime:         'Adicionar Horário',
    medName:            'Nome:',
    dose:               'Dose:',
    time:               'Horário:',
    mgUnit:             'mg',
    dosePlaceholder:    'ex.: 5',
    medNamePlaceholder: 'Nome do medicamento',
    doseAndTime:        'Dose e Horário',
    collapse:           'Recolher',
    hrs:                'h',
    min:                'min',
    saveErrorTitle:     'Não foi possível salvar o registro',
    saveErrorBody:      'Ocorreu um erro ao salvar o seu registro. Por favor, tente novamente.',
  },

  // ── Perfil — seção de questionários ─────────────────────────────────
  profileQuestionnaires: {
    sectionTitle:        'Questionários',
    start:               'Iniciar',
    redo:                'Refazer',
    notYetCompleted:     'Ainda não concluído',
    resultsAfter14:      'Resultados disponíveis após 14 dias',
    completed:           'Concluído em',
    betaFootnote:        '* Estes questionários são experimentais. Os algoritmos de pontuação e interpretações são fornecidos apenas para fins informativos e podem não ser totalmente precisos. Sempre verifique os resultados em relação às fontes publicadas validadas antes de usar em pesquisa ou prática clínica.',
    redoTitle:           'Substituir resultado existente?',
    redoBody:            'Isso vai substituir permanentemente o seu resultado anterior do {{title}}. Tem certeza?',
    redoCancel:          'Cancelar',
    redoConfirm:         'Continuar',
  },

  // ── Modal de questionário ─────────────────────────────────────────────────
  questionnaireModal: {
    back:            'Voltar',
    next:            'Próximo',
    finish:          'Finalizar',
    itemOf:          'Item {{current}} de {{total}}',
    allDone:         'Tudo pronto!',
    pendingDesc:     'Suas respostas foram salvas. Os resultados do {{shortTitle}} estarão disponíveis após 14 dias de registros do diário de sono.',
    done:            'Concluír',
    betaBanner:      'Beta — pontuação e resultados são experimentais e podem não ser totalmente precisos.',
  },

  // ── Comum ────────────────────────────────────────────────────────────────────────────────
  common: {
    ok: 'OK',
  },

  // ── Tela de medicamentos ────────────────────────────────────────────────────────────────
  medications: {
    title:           'Meus Medicamentos',
    hint:            'Salve seus medicamentos regulares aqui. Eles serão preenchidos automaticamente nos registros matinais e noturnos do diário, para que você não precise digitá-los todos os dias.',
    empty:           'Nenhum medicamento salvo ainda. Toque no botão abaixo para adicionar um.',
    namePlaceholder: 'Nome do medicamento',
    add:             'Adicionar Medicamento',
  },
};
